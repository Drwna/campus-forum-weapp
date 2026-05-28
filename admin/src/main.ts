import { createApp } from "vue";
import { createPinia } from "pinia"; // Pinia 状态管理，替代 Vuex
import ElementPlus from "element-plus"; // Element Plus UI 组件库
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router/index.js";

const app = createApp(App);

// 注册顺序：状态管理 → 路由 → UI 框架
app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount("#app");
