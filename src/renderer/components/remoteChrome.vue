<template>
  <div class="remoteChrome">

    <Card shadow>
      <p slot="title">urlPath : {{ urlPath }}</p>
      <Row>
        <Col span="11">
        <Input v-model="address.host">
        <span slot="prepend">host:</span>
        </Input>
        </Col>
        <Col span="11" offset='1'>
        <Input v-model="address.port">
        <span slot="prepend">port:</span>
        </Input>
        </Col>
      </Row>
      <br>
      <Row type="flex" justify="start">
        <Col>
        <Alert show-icon :type="connected ? 'success' : 'error'">{{ connected? "已连接" : "未连接" }}</Alert>
        </Col>
        <Col>
        <Button type="primary" @click='grubClient'>建立连接</Button>
        <Button type="primary" @click="releaseClient">断开连接</Button>
        </Col>
      </Row>
      <Row>
        <Button type="primary" @click="CDPList">[CDP] 显示标签列表</Button>
        <Button type="primary" @click="CDPActivateTarget">[CDP] 激活目标标签</Button>
      </Row>

      <Row>
        <h4>执行JS</h4>
        <Input v-model="targetFn" type="textarea" :autosize="true" placeholder="请输入..."></Input>
      </Row>
      <Row>
        <Button type="primary" @click="execJS()">执行JS</Button>
        <Button type="primary" @click="alertAccepted()">alert确定</Button>
      </Row>
      <Row>
        <Button type="primary" @click="selectDOM()">选择DOM</Button>
        <Button type="primary" @click="changeColor()">改变颜色</Button>
        <Button type="primary" @click="execJS(`login()`)">点击登录</Button>
        <Button type="primary" @click="execJS(`document.querySelectorAll('.top .f_right')[0].click()`)">点击注册按钮</Button>
      </Row>
      <Row>
        <Button type="primary" @click="selectInputs()">选择INPUT</Button>
      </Row>
      <br>
      <Row>
        <Collapse v-model="value1" :bordered="false">
          <Panel name="1">
            RESULT
            <pre slot="content">{{msgPool['card1']}}</pre>
          </Panel>
        </Collapse>
      </Row>
      <Row>
        <Card v-for="(chrometab,idx) in inspectTabs" :key='chrometab.id' class='chrometab' :class="{red:selectedTabIds.indexOf(chrometab.id) !== -1}" shadow>
          <p slot="title"><img v-if="!!chrometab.faviconUrl" :src="chrometab.faviconUrl | fixURL " alt="">{{ chrometab.title }}</p>
          <p class="Oneline">
            <span>{{ chrometab.devtoolsFrontendUrl}}</span>
          </p>
          <p class="Oneline">
            <span>{{ chrometab.url | fixURL}}</span>
          </p>
        </Card>
      </Row>
    </Card>
  </div>
</template>

<script>

import CDP from 'chrome-remote-interface'
import axios from 'axios'
const url = require('url')

const { spawn } = require('child_process')


export default {
  name: 'remote-chrome',
  data() {
    return {
      urlPath: '',
      msg: 'test',
      value1: [1, 2, 3],
      inspectTabs: [],
      selectedTabIds: [],
      track: null,
      connected: null,
      address: {
        host: 'lhyh.songlairui.cn',
        port: '9221'
      },
      msgPool: {
        default: '-',
        card1: ''
      },
      targetFn: ''
    }
  },
  methods: {
    /**
     * 获取标签页列表
     */
    CDPList(cb) {
      let options = Object.assign({}, this.address)
      CDP.listTabs(options, (err, targets) => {
        // console.info('targets\n', targets)
        this.inspectTabs.splice(0, this.inspectTabs.length, ...targets)
        this.selectedTabIds = ([].concat(selectedTabs(targets))).map(_ => _.id)
      })
    },
    /**
     * 建立连接
     */
    async getTarget() {
      if (this.chromeClient) return this.chromeClient
      let client
      let options = Object.assign({}, this.address)
      let target_id = await new Promise(resolve => {
        CDP.listTabs(options, (err, targets) => {
          resolve(([].concat(selectedTabs(targets))).map(_ => _.id)[0])
        })
      }).catch(error => console.error(error))
      target_id = target_id || "34567890"
//      this.releaseClient()
      try {
        client = await CDP(Object.assign({}, options, { target: target_id }))
      } catch (error) {
        console.info('Error', error)
        return
      }

      client.on('disconnect', () => {
        console.info('断开连接了')
        this.chromeClient = null
        this.connected = false
      })
      // handle popup opening
      client.Page.javascriptDialogOpening(async ({ message, type }) => {
        console.info('handle opening:', message, type)
      })
      client.Page.loadEventFired(async (...x) => {
        console.info('loadEventFired: ', x)
        const { result } = await client.Runtime.evaluate({ expression: `window.location.pathname` })
        console.info('pathname', result.value)
        this.urlPath = result.value
      })

      this.chromeClient = client
      this.connected = true
      // this.track = chromeClient
      return client
    },
    CDPActivateTarget() {
      let options = Object.assign({}, this.address)
      CDP.listTabs(options, (err, targets) => {
        this.selectedTabIds = ([].concat(selectedTabs(targets))).map(_ => _.id)
        this.selectedTabIds.forEach(id => {
          CDP.Activate(Object.assign({}, options, { id }))
        })
      })
    },
    
    /**
     * 建立连接
     */
    async grubClient() {
      let client = await this.getTarget()

    },
    /**
     * 断开连接
     */
    async releaseClient() {
      let target = this.chromeClient
      // console.info(target)
      target && target.close(() => {
        console.info('closed')
        this.chromeClient = null
        this.connected = false
      })
    },
    /**
     * 执行JS代码
     */
    async execJS(fn) {
      fn = fn || this.targetFn
      if (typeof fn === 'string') {
        fn = `()=>{
  ${fn}
}`
      }
      let client = this.chromeClient
      if (client) {
        const { Runtime, Page } = client
        let args = [...arguments].slice(1).map(_ => JSON.stringify(_))
        let evaluationStr = `(()=>{
          let fn = ${String(fn)}
          fn.apply(null,[${args}])
        })()`
        // trigger an alert message
        try {
          await Page.enable();
          console.info('expression:', evaluationStr)
          await Runtime.evaluate({
            expression: evaluationStr
          })
        } catch (err) {
          console.error(err);
        }
      } else {
        this.$Message.info('no Connections')
      }
    },
    /**
     * 关闭alert弹窗，如果有
     */
    async alertAccepted() {
      let client = this.chromeClient
      if (!client) return
      try {
        await client.Page.handleJavaScriptDialog({ accept: true });
        console.log(`xxx -> accepted!`);
      } catch (err) {
        console.info(err);
      }
    },
    /**
     * 选择DOM，并将nodeId存储
     */
    async selectDOM(selector) {
      selector = selector || 'input'
      let client = this.chromeClient
      if (client) {
        let root = await client.DOM.getDocument()
        // console.info(root.root.nodeId)
        let result = await client.DOM.querySelectorAll({ nodeId: root.root.nodeId, selector: 'input' })
        // console.info(result)
        this.selectedDOMs = result
      } else {
        this.$Message.info('no Connections')
        this.selectedDOMs = []
      }
    },
    /**
     * 随机更改边框颜色
     */
    async changeColor() {
      let result = this.selectedDOMs
      let client = this.chromeClient
      if (client && result) {
        result.nodeIds.forEach(async nodeId => {
          await client.DOM.setAttributeValue({
            nodeId,
            name: 'style',
            value: `border:1px solid #${(~~(Math.random() * (1 << 24))).toString(16)}`
          })
        })
      }
    },
    /**
     * 选择 Input 元素
     */
    async selectInputs(selector) {
      selector = selector || 'input'
      let client = this.chromeClient
      let execJS = this.execJS
      if (client) {
        let root = await client.DOM.getDocument()
        let result = await client.DOM.querySelectorAll({ nodeId: root.root.nodeId, selector: 'input' })
        result.nodeIds.forEach(async nodeId => {
          let attributes = parseAttrs((await client.DOM.getAttributes({ nodeId })).attributes)
          // console.info()
          console.info(attributes.type)
          if ('text' === attributes.type) {
            await execJS(`document.querySelector('#${attributes.id}').value='test'`)
          }
          // return []
        })
      } else {
        this.$Message.info('no Connections')
        // this.selectedDOMs = []
      }
    },
  },
  filters: {
    fixURL(value) {
      return value.replace('localhost', 'lhyh.songlairui.cn')
    }
  },
  created() {
    this.chromeClient = null // should not be reactive, otherwise will occur error
    this.grubClient()
  },
  beforeDestroy() {
    this.releaseClient()
  }
}

/**
 * 正则筛选当前需要激活的页面
 */
function selectedTabs(targets) {
  let validHostName = ['127.0.0.1', 'localhost', 'lhyh.songlairui.cn', '10.0.2.15']
  let validSubDir = ['ol', 'OL', 'LHOL']
  return targets.filter(target => {
    let urldata = url.parse(target.url)
    let hostname = urldata.hostname
    let subDir = urldata.pathname.match(/^\/?(.*?)\//)[1] // 非贪婪匹配
    return validHostName.indexOf(hostname) !== -1 && validSubDir.indexOf(subDir) !== -1
  })
}

/**
 * 将DOM.getAttributes取得的数组转化为键值
 */
function parseAttrs(attributes) {
  // let keys,values
  // keys = attributes.filter((_,i)=> !i % 2)
  // values = attributes.filter((_,i)=> i % 2)
  let result = {}
  let length = attributes.length
  // console.info(attributes)
  for (let i = 0; i < length; i += 2) {
    result[attributes[i]] = attributes[i + 1]
  }
  return result
}
</script>

<style scoped>
.red {
  color: red;
  border-color: red;
}

button {
  margin: .2em;
}

.chrometab {
  margin: 1em 0;
}

.chrometab .Oneline {
  height: 1.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
