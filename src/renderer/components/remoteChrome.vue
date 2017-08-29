<template>
  <div class="remoteChrome">
    <Row style="padding:20px">
      <Col :xs="{ span: 22, offset: 1 }" :lg="{ span: 11 }">
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
        <!-- <br>
        <Row>
          <Button type="primary" @click="whoami">[spwan] whoami</Button>
          <Button type="primary" @click="loadENV">[spwan] ENV</Button>
        </Row>
        <br>
        <Row>
          <Button type="primary" @click="CRIList">[spwan]chrome-remote-interface list</Button>
        </Row>
        <br>
        <Row>
          <Button type="primary" @click="getTabJson">[axios] [target]:[port]/json</Button>
        </Row>-->
        <br>
        <Row>
          <Button type="primary" @click="CDPList">[CDP] 显示标签列表</Button>
          <Button type="primary" @click="CDPActivateTarget">[CDP] 激活目标标签</Button>
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
          <Card v-for="(chrometab,idx) in inspectTabs" :key='chrometab.id' style='margin:1em 0' :class="{red:selectedTabIds.indexOf(chrometab.id) !== -1}" shadow>
            <p slot="title">{{ chrometab.title }}</p>
            <img v-if="!!chrometab.faviconUrl" :src="chrometab.faviconUrl | fixURL " alt="">
            <p>{{ chrometab.devtoolsFrontendUrl}}</p>
            <p>{{ chrometab.url | fixURL}}</p>
          </Card>
        </Row>
      </Card>
      </Col>
      <Col :xs='{span:22,offset:1}' :lg='{span:11,offset:2}'>
      <Card shadow>
        <p slot="title">连接 chrome-remote-interface</p>
        <p>
          <Button @click="fCDP()">CDP()</Button>
        </p>
        <p>卡片内容</p>
        <p>卡片内容</p>
      </Card>
      </Col>
    </Row>
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
    whoami() {
      let process = spawn('whoami')
      process.stdout.on('data', data => {
        console.info(data)
        this.$Message.info('I am ' + data)
      })
    },
    source() {
      let process = spawn('source', ['~/.zshrc'])
      process.stdout.on('data', data => {
        console.info(data)
        this.$Message.info('sourced ' + data)
      })
    },
    loadENV() {
      console.info('process.env', process.env)
      let Process = spawn('env')
      Process.stdout.on('data', data => {
        console.info(data)
        this.$Message.info('I am ' + data)
        this.msgPool.card1 = data ? data.toString() : ''
      })
    },
    CDPList(cb) {
      let options = Object.assign({}, this.address)
      CDP.List(options, (err, targets) => {
        console.info('targets\n', targets)
        this.inspectTabs.splice(0, this.inspectTabs.length, ...targets)
        this.selectedTabIds = ([].concat(selectedTabs(targets))).map(_ => _.id)
      })
    },
    CDPActivateTarget() {
      let options = Object.assign({}, this.address)
      CDP.List(options, (err, targets) => {
        // console.info('targets\n', targets)
        // this.inspectTabs.splice(0, this.inspectTabs.length, ...targets)
        this.selectedTabIds = ([].concat(selectedTabs(targets))).map(_ => _.id)
        this.selectedTabIds.forEach(id => {
          CDP.Activate(Object.assign({}, options, { id }))
        })
      })
    },
    CRIList() {
      let process = spawn('/usr/local/bin/chrome-remote-interface', [
        'list',
        '-t',
        this.address.host || '127.0.0.1',
        '-p',
        this.address.port || 9222
      ], {
          env: {
            PATH: '/usr/local/bin:/usr/local/sbin:/Users/larry/.yarn/bin:/usr/bin:/bin:/usr/sbin:/sbin'
          }
        })
      let dataPool = []
      let i = 0
      this.$Message.info('执行后台进程')
      process.stdout.on('data', data => {
        dataPool.push(data)
        console.info('data collected')
        this.$Message.info('接收到 chunk 数据' + (++i))
      })
      process.stderr.on('data', data => {
        console.error(data)
        this.$Message.error('接收到 error 数据' + (data))
      })
      process.stdout.on('end', data => {

        i = 0

        this.msgPool.card1 = new TextDecoder().decode(
          concatTypedArray(dataPool)
        )
        this.inspectTabs = JSON.parse(this.msgPool.card1)

      })
      process.on('exit', code => {
        console.info('进程已退出' + code)
        // this.$Message.info('进程已退出', 'exited with code ', code)
      })
    },
    getTabJson() {
      this.$Message.info('axios 请求' + window.location.href)
      console.info(window.location.href)
      axios.get(`http://${this.address.host}:${this.address.port}/json`).then(response => {
        console.info(response)
        this.$Message.info('axios 请求 response ' + JSON.stringify(response))
      }).catch(err => {
        console.error('err', err)
        this.$Message.info('axios 请求 error ' + JSON.stringify(err))
      })
    },
    getViaHIframw() {
      // 通过iframe获取跨域信息？
    },
    fCDP() {
      console.info(CDP)
      let options = Object.assign({}, this.address)
      CDP.List(options, (err, targets) => {
        console.info('targets\n', targets)
      })
      CDP(options, client => {
        console.info(client)
      })
    }
  },
  filters: {
    fixURL(value) {
      return value.replace('localhost', 'lhyh.songlairui.cn')
    }
  },
  created() {
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

<style>
.red {
  color: red;
  border-color: red;
}

button {
  margin: .2em;
}
</style>
