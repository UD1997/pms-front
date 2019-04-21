import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
import {loadCurrMenu} from '@/api/user'
import {getUserInfo} from '~utils/sessionStorage';

Vue.use(Router)

const router =new Router({
  mode: 'history', //后端支持可开
  routes: [
  {
      path:'/',
      name: '首页',
      component: resolve => require(['@/views/layout/Layout'], resolve),
      children:[]
    },
  {
      path: '/login',
      name: '登录',
      component: resolve => require(['@/views/Login'],resolve)
    }
  //   {
  //     path: '*', //当路由不匹配时跳转
  //     redirect: '/404'
  // }
  ]
})

   // 在渲染该组件的对应路由被 confirm 前调用
router.beforeEach((to,from,next) =>{
  let username=getUserInfo();
  if(to.path==="/login"){
      if(username){
        next({path: '/'});
      }else{
        next();
      }
  }else{
    if(username){
         //动态去后台加载路由
          addDynamicMenuAndRoutes(next, to);
    }else{
        next({
          path: '/login',
          query: {redirect: to.fullpath}
        })
    }
  }
})

function addDynamicMenuAndRoutes (next, to){
  if(store.state.app.loadMenus){
      next();
  }else{
      loadCurrMenu().then(res => {
        const asyncRouter = filterAsyncRouter(res.data)
        store.dispatch('GenerateRoutes', asyncRouter).then(() => { // 存储路由
          store.commit('setLoadMenus', true);
          // 动态添加可访问路由表
          router.addRoutes(asyncRouter);
          next({ ...to, replace: true });// hack方法 确保addRoutes已完成
        })
    })
    }
}

function filterAsyncRouter(routers){
  const accessedRouters = routers.filter(router => {
    if (router.component) {
       // Layout组件特殊处理
      if (router.component === 'Layout') {
        router.component = resolve => require(['@/views/layout/Layout'], resolve);
      } else {
        let component=router.component;
        router.component =resolve => require([`@/views/${ component}`], resolve);
      }
    }
    if (router.children && router.children.length) {
      router.children = filterAsyncRouter(router.children);
    }
    return true;
  })
  return accessedRouters;
}

export default router;

