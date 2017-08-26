import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage')
    },
    {
      path:'/commands',
      name: 'commands',
      component:require('@/components/CommandsStatus')
    },
    {
      path:'/iview',
      name: 'iview',
      component:require('@/components/testiView')
    },
    {
      path:'/udpServ',
      name: 'userv',
      component:require('@/components/udpServ')
    },

    {
      path:'/remoteChrome',
      name: 'remoteChrome',
      component:require('@/components/remoteChrome')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
