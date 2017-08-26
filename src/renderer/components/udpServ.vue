<template>
  <div>
    <Input v-model='kaptcha' placeholder="waiting..." style="width: 300px"></Input>
  </div>
</template>

<script>
export default {
  name: 'udpServer',
  data() {
    return {
      msg: 'test udp server',
      kaptcha: 'asdsa',
      serv: null
    }
  },
  methods: {
    createServer() {
      const dgram = require('dgram');
      const server = dgram.createSocket('udp4');
      server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
      });
      server.on('message', (res, rinfo) => {
        let msg = res.toString()
        if (msg.indexOf('Kaptcha:') === 0) {
          let kaptch = msg.replace('Kaptcha:', '')
          console.info('验证码\n', kaptch)
          this.kaptcha = kaptch
        } else {
          console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
        }
      });
      server.on('listening', () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
      });
      server.bind(41234);
      return server
    }
  },
  created() {
    this.serv = this.createServer()
  },
  beforeDestroy() {
    this.serv.close()
  }
}
</script>

