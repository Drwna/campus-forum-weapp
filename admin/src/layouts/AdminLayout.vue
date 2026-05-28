<template>
  <el-container class="admin-layout">
    <el-aside width="240px" class="admin-aside">
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-icon">CH</div>
        <div class="logo-text">
          <span class="logo-main">CampusHub</span>
          <span class="logo-sub">管理后台</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="route.path"
        router
        background-color="transparent"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#fff"
        class="nav-menu"
      >
        <el-menu-item index="/" class="menu-item">
          <el-icon class="menu-icon"><HomeFilled /></el-icon>
          <span>数据概览</span>
        </el-menu-item>

        <div class="menu-group-title">内容管理</div>
        <el-menu-item index="/posts" class="menu-item">
          <el-icon class="menu-icon"><Document /></el-icon>
          <span>帖子审核</span>
        </el-menu-item>
        <el-menu-item index="/comments" class="menu-item">
          <el-icon class="menu-icon"><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        <el-menu-item index="/reports" class="menu-item">
          <el-icon class="menu-icon"><Warning /></el-icon>
          <span>举报处理</span>
        </el-menu-item>

        <div class="menu-group-title">用户管理</div>
        <el-menu-item index="/users" class="menu-item">
          <el-icon class="menu-icon"><User /></el-icon>
          <span>用户列表</span>
        </el-menu-item>
        <el-menu-item index="/profile-reviews" class="menu-item">
          <el-icon class="menu-icon"><EditPen /></el-icon>
          <span>资料审核</span>
        </el-menu-item>

        <div class="menu-group-title">系统设置</div>
        <el-menu-item index="/categories" class="menu-item">
          <el-icon class="menu-icon"><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/notices" class="menu-item">
          <el-icon class="menu-icon"><Bell /></el-icon>
          <span>公告管理</span>
        </el-menu-item>
        <el-menu-item index="/sensitive-words" class="menu-item">
          <el-icon class="menu-icon"><Warning /></el-icon>
          <span>敏感词管理</span>
        </el-menu-item>
        <el-menu-item index="/configs" class="menu-item">
          <el-icon class="menu-icon"><Setting /></el-icon>
          <span>系统配置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <h2 class="page-title">{{ routeTitle }}</h2>
        </div>
        <div class="header-right">
          <div class="admin-info">
            <div class="admin-avatar">{{ authStore.nickname?.charAt(0) || 'A' }}</div>
            <span class="admin-name">{{ authStore.nickname }}</span>
          </div>
          <el-button type="danger" text class="logout-btn" @click="authStore.logout()">
            退出登录
          </el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
/**
 * 管理后台主布局组件
 * 结构：左侧边栏（导航菜单） + 右侧内容区（顶栏 + router-view）
 * 路由变化时自动高亮对应菜单项，顶栏标题根据路径映射
 */
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  HomeFilled,
  Document,
  ChatDotRound,
  User,
  Folder,
  Warning,
  Bell,
  EditPen,
  Setting,
} from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth.js";

const route = useRoute();
const authStore = useAuthStore();

// 根据当前路由路径映射页面标题，与菜单项一一对应
const routeTitle = computed(() => {
  const titles: Record<string, string> = {
    "/": "数据概览",
    "/posts": "帖子审核",
    "/comments": "评论管理",
    "/users": "用户列表",
    "/categories": "分类管理",
    "/reports": "举报处理",
    "/notices": "公告管理",
    "/profile-reviews": "资料审核",
    "/sensitive-words": "敏感词管理",
    "/configs": "系统配置",
  };
  return titles[route.path] ?? "";
});
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

/* ── 侧边栏 ── */
.admin-aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow-y: auto;
  border-right: none;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

.admin-aside::-webkit-scrollbar {
  width: 0;
}

/* Logo */
.logo-section {
  display: flex;
  align-items: center;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  margin-right: 12px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-main {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.logo-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

/* 菜单分组标题 */
.menu-group-title {
  padding: 16px 24px 8px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 菜单项 */
.nav-menu {
  border-right: none;
  padding: 0 12px;
}

.menu-item {
  height: 46px;
  line-height: 46px;
  margin-bottom: 4px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 142, 142, 0.15)) !important;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.menu-icon {
  font-size: 18px;
  margin-right: 10px;
}

/* ── 顶栏 ── */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 32px;
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.admin-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.logout-btn {
  font-size: 13px;
}

/* ── 主内容区 ── */
.admin-main {
  background: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}
</style>
