import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登录页：不需要鉴权，已登录用户访问会自动跳转到 Dashboard
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/Login.vue"),
      meta: { requiresAuth: false },
    },
    // 后台主布局：所有需要鉴权的页面都作为子路由，共享 AdminLayout 的侧边栏和顶栏
    {
      path: "/",
      component: () => import("../layouts/AdminLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "Dashboard",
          component: () => import("../views/Dashboard.vue"),
        },
        {
          path: "posts",
          name: "PostList",
          component: () => import("../views/PostList.vue"),
        },
        {
          path: "users",
          name: "UserList",
          component: () => import("../views/UserList.vue"),
        },
        {
          path: "categories",
          name: "CategoryList",
          component: () => import("../views/CategoryList.vue"),
        },
        {
          path: "comments",
          name: "CommentList",
          component: () => import("../views/CommentList.vue"),
        },
        {
          path: "reports",
          name: "ReportList",
          component: () => import("../views/ReportList.vue"),
        },
        {
          path: "notices",
          name: "NoticeList",
          component: () => import("../views/NoticeList.vue"),
        },
        {
          path: "profile-reviews",
          name: "ProfileReview",
          component: () => import("../views/ProfileReview.vue"),
        },
        {
          path: "configs",
          name: "ConfigList",
          component: () => import("../views/ConfigList.vue"),
        },
        {
          path: "sensitive-words",
          name: "SensitiveWordList",
          component: () => import("../views/SensitiveWordList.vue"),
        },
      ],
    },
  ],
});

// 全局前置守卫：统一处理登录鉴权
// 1. 未登录用户访问需鉴权页面 → 重定向到登录页
// 2. 已登录用户访问登录页 → 重定向到首页（避免重复登录）
router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    return { name: "Login" };
  }
  if (to.name === "Login" && authStore.isLoggedIn) {
    return { name: "Dashboard" };
  }
});

export default router;
