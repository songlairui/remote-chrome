<template>
  <div class="remoteChrome">

    <Card shadow>
      <p slot="title">检查chrome-remote-debugging port</p>
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
      <Row>
        <Button type="primary" @click="CDPList">[CDP] 显示标签列表</Button>
        <Button type="primary" @click="CDPActivateTarget">[CDP] 激活目标标签</Button>
        <br>
        <Button type="primary" @click='grubClient'>建立连接</Button>
        <span>{{ connected? "已连接" : "未连接" }}</span>
        <br>
        <Button type="primary" @click="execJS">执行JS</Button>
        <Button type="primary" @click="releaseClient">断开连接</Button>
        <Button type="primary" @click="selectDOM()">选择DOM</Button>
        <Button type="primary" @click="changeColor()">改变颜色</Button>
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
      }
    }
  },
  methods: {
    CDPList(cb) {
      let options = Object.assign({}, this.address)
      CDP.listTabs(options, (err, targets) => {
        // console.info('targets\n', targets)
        this.inspectTabs.splice(0, this.inspectTabs.length, ...targets)
        this.selectedTabIds = ([].concat(selectedTabs(targets))).map(_ => _.id)
      })
    },
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

      this.releaseClient()

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
    execJSraw() {
      let options = Object.assign({}, this.address, { target: this.selectedTabIds[0] })
      // let options = Object.assign({}, this.address)
      CDP(options).then(client => {
        // console.info(clients)
        this.selectedClient = client

      }).then(() => {
        this.selectedClient.Runtime.evaluate({
          expression: `document.body.appendChild(document.createTextNode('asdasd'))`
        })
      }).then(() => {
        this.selectedClient.close()
      }).catch(e => {
        console.error('E', e)
      })
    },
    async grubClient() {
      let client = await this.getTarget()

    },
    grubClientPromise() {
      let options = Object.assign({}, this.address)
      CDP.listTabs(options, (err, targets) => {
        let target = ([].concat(selectedTabs(targets))).map(_ => _.id)[0]
        if (!target) return
        CDP(Object.assign({}, options, { target })).then(client => {

          this.selectedClient = client
          client.on('event', (...msg) => {
            console.info(msg)
          })
          client.on('disconnect', function () {
            console.info('断开连接了')
            // this.selectedClient = null
          })
        })
      })

    },
    async releaseClient() {
      let target = this.chromeClient
      // console.info(target)
      target && target.close(() => {
        console.info('closed')
        this.chromeClient = null
        this.connected = false
      })
    },
    execJS() {
      let client = this.chromeClient
      if (client) {
        client.Runtime.evaluate({
          expression: `alert(12121)`
        })
      } else {
        this.$Message.info('no Connections')
      }
    },
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
    async changeColor() {
      let result = this.selectedDOMs
      let client = this.chromeClient
      if (client && result) {
        result.nodeIds.forEach(async nodeId => {
          // client.DOM.setNodeValue({
          //   nodeId,
          //   value: 'tttt'
          // })
          // console.info('nodeId:', nodeId)
          await client.DOM.setAttributeValue({
            nodeId,
            name: 'style',
            value: `border:1px solid #${(~~(Math.random() * (1 << 24))).toString(16)}`
          })
          // let tmp = await client.DOM.requestChildNodes({ nodeId })
          // console.info(tmp)
        })
      }
    }
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

function concatTypedArray(array) {
  let concatTwo = (u1, u2) => {
    if (!u1) u1 = new Uint8Array(0)
    if (!u2) u2 = new Uint8Array(0)
    let newArr = new Uint8Array(u1.length + u2.length)
    newArr.set(u1)
    newArr.set(u2, u1.length)
    return newArr
  }
  let tmpArr = array.reduce((result, current) => concatTwo(result, current))
  return tmpArr
}

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
