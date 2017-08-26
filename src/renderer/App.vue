<template>
  <div id='app' class="layout">
    <div class="nav">
      <router-link :to="{name:'commands'}">指令状态</router-link>
      <router-link :to="{name:'iview'}">测试iview</router-link>
      <router-link :to="{name:'userv'}">UDP监听</router-link>
      <router-link :to="{name:'remoteChrome'}">远程Chrome操作</router-link>
    </div>
    <div class="layout-header">
      <div class="layout-logo">{{ $router.history.current.fullPath }}</div>
    </div>
    <router-view class="main"></router-view>
    <div class="layout-copy">
      2011-2016 &copy; TalkingData
    </div>
  </div>
</template>

<script>
export default {
  name: 'dashboard-commands',
  created() {
    // console.info(this.$router)
  }
}
</script>

<style>
html,
body,
#app {
  /* border-radius: 10px; */
}

.layout {
  background: #f5f7f9;
  position: relative;
  overflow: hidden;
  /* display: flex; */
  /* flex-flow: column; */
}

.layout .main {
  /* flex: 1; */
}

.layout-logo {
  min-width: 100px;
  min-height: 30px;
  background: #5b6270;
  color: snow;
  border-radius: 3px;
  float: left;
  position: relative;
  top: 15px;
  left: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.layout-header {
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 1px rgba(0, 0, 0, .1);
}

.layout-copy {
  text-align: center;
  padding: 10px 0 20px;
  color: #9ea7b4;
}

.nav {
  -webkit-app-region: drag;
  background: #464c5b;
  display: flex;
}

.nav a {
  padding-left: 1em;
  padding-right: 1em;
  min-height: 3em;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #f2f2f2;
}

.nav a:hover,
.nav a.router-link-active {
  background: #23bdfa;
}
</style>
