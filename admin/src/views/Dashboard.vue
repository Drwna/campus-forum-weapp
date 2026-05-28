<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h2 class="welcome-title">👋 欢迎回来，{{ authStore.nickname }}</h2>
        <p class="welcome-desc">今天是 {{ today }}，祝您工作愉快</p>
      </div>
      <div class="welcome-decoration" />
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <span class="stat-icon">📝</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayPosts }}</span>
          <span class="stat-label">今日发帖</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalUsers }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <span class="stat-icon">💬</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayComments }}</span>
          <span class="stat-label">今日评论</span>
        </div>
      </div>
      <div class="stat-card highlight" @click="$router.push('/posts')">
        <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #FF6B6B, #FF8E8E)">
          <span class="stat-icon">⚠️</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingTotal }}</span>
          <span class="stat-label">待处理</span>
        </div>
      </div>
    </div>

    <!-- 待处理详情 -->
    <div class="pending-section">
      <h3 class="section-title">待处理事项</h3>
      <div class="pending-grid">
        <div class="pending-card" @click="$router.push({ path: '/posts', query: { status: 0 } })">
          <div class="pending-number">{{ stats.pendingPosts }}</div>
          <div class="pending-label">待审核帖子</div>
          <div class="pending-action">去处理 →</div>
        </div>
        <div class="pending-card" @click="$router.push('/profile-reviews')">
          <div class="pending-number">{{ stats.pendingProfileReviews }}</div>
          <div class="pending-label">待审核资料</div>
          <div class="pending-action">去处理 →</div>
        </div>
        <div class="pending-card" @click="$router.push('/reports')">
          <div class="pending-number">{{ stats.pendingReports }}</div>
          <div class="pending-label">待处理举报</div>
          <div class="pending-action">去处理 →</div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3 class="section-title">快速操作</h3>
      <div class="actions-grid">
        <div class="action-card" @click="$router.push('/posts')">
          <span class="action-icon">📝</span>
          <span class="action-text">审核帖子</span>
        </div>
        <div class="action-card" @click="$router.push('/users')">
          <span class="action-icon">👥</span>
          <span class="action-text">管理用户</span>
        </div>
        <div class="action-card" @click="$router.push('/categories')">
          <span class="action-icon">📁</span>
          <span class="action-text">管理分类</span>
        </div>
        <div class="action-card" @click="$router.push('/notices')">
          <span class="action-icon">📢</span>
          <span class="action-text">发布公告</span>
        </div>
        <div class="action-card" @click="$router.push('/profile-reviews')">
          <span class="action-icon">✅</span>
          <span class="action-text">资料审核</span>
        </div>
        <div class="action-card" @click="$router.push('/reports')">
          <span class="action-icon">⚠️</span>
          <span class="action-text">处理举报</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘页面
 * 功能：展示平台运营概览数据 + 待处理事项入口 + 快速操作面板
 * 数据来源：GET /admin/stats 接口，包含今日发帖/用户数/评论数/待审核数等
 */
import { reactive, onMounted } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { getDashboardStats } from "../api/stats.js";

const authStore = useAuthStore();

// 格式化当前日期为中文格式（如：2026年5月28日 星期四）
const today = new Date().toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

// 使用 reactive 一次性管理所有统计数据，通过 Object.assign 批量更新
const stats = reactive({
  todayPosts: 0,
  totalUsers: 0,
  todayComments: 0,
  pendingPosts: 0,
  pendingProfileReviews: 0,
  pendingReports: 0,
  pendingTotal: 0,
});

async function loadStats() {
  try {
    const { data } = await getDashboardStats();
    Object.assign(stats, data.data);
  } catch {
    // ignore
  }
}

onMounted(loadStats);
</script>

<style scoped>
.dashboard {
  width: 100%;
}

/* ── 欢迎横幅 ── */
.welcome-banner {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.welcome-decoration {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 142, 142, 0.1));
}

/* ── 数据统计 ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-card.highlight {
  cursor: pointer;
  border: 2px solid #FF6B6B;
}

.stat-card.highlight:hover {
  border-color: #FF8E8E;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

/* ── 待处理事项 ── */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 16px;
}

.pending-section {
  margin-bottom: 32px;
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.pending-card {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border-left: 4px solid #FF6B6B;
}

.pending-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.pending-number {
  font-size: 36px;
  font-weight: 800;
  color: #FF6B6B;
  margin-bottom: 4px;
}

.pending-label {
  font-size: 14px;
  color: #636E72;
  margin-bottom: 12px;
}

.pending-action {
  font-size: 13px;
  color: #FF6B6B;
  font-weight: 600;
}

/* ── 快速操作 ── */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-card {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
}

.action-card:hover .action-text {
  color: #fff;
}

.action-icon {
  font-size: 36px;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  transition: color 0.2s;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .pending-grid, .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .pending-grid, .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
