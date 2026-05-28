<script>
/**
 * App.vue 是 uni-app 的根组件，等同于 Vue 应用的 App.vue
 * 这里使用 Options API 而非 <script setup>，因为 uni-app 要求根组件导出对象
 *
 * uni-app 特有的应用级生命周期：
 * - onLaunch: 应用首次启动时触发（全局只执行一次），适合做初始化操作
 * - onShow: 应用从后台切换到前台时触发，适合刷新数据
 * - onHide: 应用从前台切换到后台时触发，适合暂停耗时操作
 */
export default {
  onLaunch() {
    console.log("App Launch");
  },
  onShow() {
    console.log("App Show");
  },
  onHide() {
    console.log("App Hide");
  },
};
</script>

<style>
/**
 * 全局样式 - App.vue 中不加 scoped 的 <style> 会作用于整个应用
 * page 是 uni-app 的页面根元素（相当于小程序的 page 标签）
 * 设置全局字体、背景色、文字颜色，统一全应用的视觉风格
 */
page {
  background-color: #FAFAFA;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
  color: #2D3436;
  -webkit-font-smoothing: antialiased;
}

/**
 * 色彩变量（通过 class 应用）
 * 小程序不支持 CSS 变量（var(--xxx)），所以这里用注释记录，各组件通过 class 引用
 */
/* 主色: #FF6B6B (珊瑚红) */
/* 主色渐变: linear-gradient(135deg, #FF6B6B, #FF8E8E) */
/* 背景: #FAFAFA */
/* 卡片: #FFF */
/* 文字主色: #2D3436 */
/* 文字次色: #636E72 */
/* 文字辅助: #999 */
/* 边框: #F0F0F0 */
/* 警告: #FF9800 */
/* 成功: #4CAF50 */
/* 错误: #F44336 */

/* 全局滚动条隐藏 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}

/* 全局过渡效果 */
view, text, image {
  transition: color 0.2s, background-color 0.2s, opacity 0.2s;
}

/**
 * 安全区域适配 - 适配 iPhone 底部小黑条（Home Indicator）
 * env(safe-area-inset-bottom) 是 CSS 环境变量，获取设备安全区域的底部距离
 * 在有 tab-bar 的页面或固定在底部的元素上使用此类
 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
