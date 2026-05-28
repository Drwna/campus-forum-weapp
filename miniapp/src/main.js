import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

/**
 * uni-app 入口文件
 * 必须导出 createApp 函数，uni-app 框架会调用它来创建 Vue 应用实例
 * createSSRApp 支持服务端渲染（SSR），但在小程序中主要用于兼容 uni-app 的启动机制
 */
export function createApp() {
  const app = createSSRApp(App);
  // 注册 Pinia 状态管理库，供全局 stores 使用（如 auth store）
  app.use(createPinia());
  return {
    app,
  };
}
