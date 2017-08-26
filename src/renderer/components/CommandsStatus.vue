
<template>
  <div class="commands-status">
    <Table width="auto" border :columns="columns2" :data="cmds"></Table>
    <div class="result">
      {{ result }}
    </div>
  </div>
</template>


<script>
import commands from './commands.store'

import { spawn } from 'child_process'

// console.info('commands,spawn', commands, spawn)

export default {
  data() {
    return {
      msg: 'test msg',
      cmds: commands,
      columns2: [
        {
          title: '指令',
          key: 'name',
          width: 100,
          fixed: 'left'
        },
        {
          title: '参数',
          key: 'cmd',
          width: 200
        },
        {
          title: '进程号',
          key: 'pid',
          width: 80
        },
        {
          title: '状态',
          key: 'pending',
          width: 80,
          render: (h, params) => {
            // console.info('pending status')
            return h('span', params.row.pending ? "启用" : '停用')
          }
        },
        {
          title: '最后一次开始执行时间',
          key: 'lastExecStamp',
          width: 100
        },
        {
          title: '最后一次执行完成时间',
          key: 'lastExitStamp',
          width: 100
        },
        {
          title: '操作',
          key: 'action',
          fixed: 'right',
          width: 200,
          render: (h, params) => {

            return h('div', [
              h('Button', {
                props: {
                  type: params.row.pending ? 'text' : 'info',
                  size: 'small'
                },
                on: {
                  click: () => this.run(params.row)
                }
              }, '运行'),
              h('Button', {
                props: {
                  type: params.row.pending ? 'error' : 'text',
                  size: 'small'
                },
                on: {
                  click: () => this.stop(params.row)
                }
              }, '停止'),
              h('Button', {
                props: {
                  type: 'text',
                  size: 'small'
                },
                on: {
                  click: () => this.check(params.row)
                }
              }, '检查状态')
            ]);
          }
        }
      ],
      result: ''
    }
  },

  methods: {
    run(cmd) {
      if (cmd.pending) {
        console.info('command is pending')
        this.$Message.warning('指令Pending')
        return
      }
      // console.info('to exec', cmd)
      let process = spawn.apply(undefined, cmd.cmd)
      this.$Message.success('指令已执行')
      if (cmd.process) {
        return
      }
      // console.info('to note process')
      if (!cmd.process) cmd.process = process
      cmd.pid = process.pid
      cmd.pending = true
      cmd.output = []
      cmd.lastExecStamp = + new Date()
      // console.info(process)
      process.stdout.on('data', data => {
        cmd.output.push(data)
        this.result = new TextDecoder().decode(data)
        // console.info('4567890', this.result)
      })
      process.on('exit', code => {
        cmd.pid = undefined
        cmd.pending = false
        cmd.process = null
        cmd.lastExitStamp = + new Date()
        console.info('exit', code)
        code !== null && this.$Message.info('指令已退出:', code)
      })
    },
    stop(cmd) {

      if (cmd.process) {
        cmd.process.stdin.end()
        cmd.process.kill()
        console.info('killed', cmd.process.killed)
        cmd.process.killed && this.$Message.error('指令已杀死')
      }
    },
    check(cmd) {
      this.$Message.info('检查指令');
      console.info('检查指令', cmd)
    }
  }
}
</script>


<style>
.result {
  white-space: pre-wrap;
}
</style>
