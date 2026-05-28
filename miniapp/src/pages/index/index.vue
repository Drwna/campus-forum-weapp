<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left">
        <text class="logo-text">Campus</text>
        <text class="logo-accent">Hub</text>
      </view>
      <view class="nav-right" @tap="goNotices">
        <text class="nav-icon">📢</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-bar" :show-scrollbar="false">
      <view
        v-for="cat in categories"
        :key="cat.categoryId"
        :class="['cat-chip', { active: currentCategory === cat.categoryId }]"
        @tap="switchCategory(cat.categoryId)"
      >
        <text>{{ cat.categoryName }}</text>
      </view>
    </scroll-view>

    <!-- 公告横幅 -->
    <view v-if="latestNotice" class="notice-banner" @tap="goNotices">
      <view class="notice-pulse" />
      <text class="notice-text">{{ latestNotice.title }}</text>
      <text class="notice-arrow">→</text>
    </view>

    <!-- 帖子列表：scroll-y 纵向滚动，@scrolltolower 触底加载更多，refresher-enabled 下拉刷新 -->
    <scroll-view
      scroll-y
      class="post-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 帖子卡片，animationDelay 实现逐条淡入动画效果 -->
      <view v-for="(post, idx) in posts" :key="post.postId" class="post-card" :style="{ animationDelay: idx * 0.05 + 's' }" @tap="goDetail(post.postId)">
        <!-- 帖子头部 -->
        <view class="post-header">
          <view class="author-info">
            <image class="author-avatar" :src="resolveImageUrl(post.author.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
            <view class="author-meta">
              <text class="author-name">{{ post.author.nickname }}</text>
              <text class="post-time">{{ formatTime(post.createTime) }}</text>
            </view>
          </view>
          <view class="category-badge">
            <text>{{ post.category.categoryName }}</text>
          </view>
        </view>

        <!-- 帖子内容 -->
        <view class="post-body">
          <text class="post-title">{{ post.title }}</text>
          <text class="post-excerpt">{{ post.excerpt }}</text>
          <!-- 图片网格：最多显示 3 张，grid-N 类控制不同数量下的布局 -->
          <view v-if="post.imageUrls.length" class="image-grid" :class="'grid-' + Math.min(post.imageUrls.length, 3)">
            <image
              v-for="(img, imgIdx) in post.imageUrls.slice(0, 3)"
              :key="imgIdx"
              :src="resolveImageUrl(img)"
              mode="aspectFill"
              class="grid-img"
            />
          </view>
        </view>

        <!-- 帖子底部 -->
        <view class="post-footer">
          <view class="footer-action">
            <text class="action-icon">❤️</text>
            <text class="action-count">{{ post.likeCount }}</text>
          </view>
          <view class="footer-action">
            <text class="action-icon">💬</text>
            <text class="action-count">{{ post.commentCount }}</text>
          </view>

        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <view class="loading-dots">
          <view class="dot" /><view class="dot" /><view class="dot" />
        </view>
      </view>
      <view v-if="!hasMore && posts.length" class="end-state">
        <text>— 到底啦 —</text>
      </view>
      <view v-if="!loading && !posts.length" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">还没有帖子</text>
        <text class="empty-hint">快来发布第一条吧</text>
      </view>
    </scroll-view>

    <!-- 发帖按钮 -->
    <view class="fab" @tap="goPublish">
      <text class="fab-icon">✏️</text>
    </view>
  </view>
</template>

<script>
/**
 * 首页 - 帖子信息流
 *
 * 核心功能：
 * 1. 顶部分类标签切换（全部/各版块）
 * 2. 公告横幅（显示最新一条公告）
 * 3. 帖子列表（无限滚动加载 + 下拉刷新）
 * 4. 右下角 FAB 发帖按钮
 *
 * 分页模式：使用 page + hasMore 实现无限滚动
 * 刷新模式：refresher-enabled 开启原生下拉刷新
 */
import { ref, onMounted } from "vue";
import { getCategories } from "../../api/category.js";
import { getPostList } from "../../api/post.js";
import { get, resolveImageUrl } from "../../utils/http.js";

export default {
  setup() {
    const categories = ref([]);
    const posts = ref([]);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);
    const currentCategory = ref(""); // 当前选中的分类 ID，空字符串表示"全部"
    const latestNotice = ref(null);

    /** 加载分类列表，在"全部"前插入一个默认选项 */
    async function loadCategories() {
      const res = await getCategories();
      categories.value = [{ categoryId: "", categoryName: "全部" }, ...res.data];
    }

    /**
     * 加载帖子列表
     * @param {boolean} isRefresh - true 时重置分页并刷新，false 时追加加载更多
     */
    async function loadPosts(isRefresh = false) {
      if (loading.value) return; // 防止重复请求
      if (isRefresh) {
        page.value = 1;
        hasMore.value = true;
      }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        const params = { page: page.value, size: 20, sort: "latest" };
        if (currentCategory.value) params.categoryId = currentCategory.value;

        const res = await getPostList(params);
        const result = res.data;

        // 刷新时替换列表，加载更多时追加到尾部
        if (isRefresh) {
          posts.value = result.list;
        } else {
          posts.value = [...posts.value, ...result.list];
        }

        hasMore.value = result.hasMore;
        page.value++;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    }

    /** 加载最新一条公告，显示在分类标签下方的横幅中 */
    async function loadLatestNotice() {
      try {
        const res = await get("/notices", { page: 1, size: 1 });
        if (res.data.list.length > 0) {
          latestNotice.value = res.data.list[0];
        }
      } catch { /* 公告加载失败不影响主流程 */ }
    }

    /** 切换分类标签，重新加载帖子列表 */
    function switchCategory(id) {
      currentCategory.value = id;
      loadPosts(true);
    }

    function loadMore() { loadPosts(); }
    function onRefresh() { refreshing.value = true; loadPosts(true); }

    function goDetail(postId) { uni.navigateTo({ url: `/pages/detail/detail?id=${postId}` }); }
    function goPublish() { uni.navigateTo({ url: "/pages/publish/publish" }); }
    function goNotices() { uni.navigateTo({ url: "/pages/notices/notices" }); }

    /** 将 ISO 时间字符串转为相对时间（如"刚刚"、"5分钟前"） */
    function formatTime(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return "刚刚";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    onMounted(() => {
      loadCategories();
      loadPosts(true);
      loadLatestNotice();
    });

    return {
      categories, posts, loading, refreshing, hasMore,
      currentCategory, latestNotice,
      switchCategory, loadMore, onRefresh,
      goDetail, goPublish, goNotices, formatTime, resolveImageUrl,
    };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FAFAFA;
}

/* ── 导航栏 ── */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  padding-top: 80rpx;
}

.logo-text {
  font-size: 40rpx;
  font-weight: 800;
  color: #FFF;
  letter-spacing: -1rpx;
}

.logo-accent {
  font-size: 40rpx;
  font-weight: 800;
  color: #FFEAA7;
  letter-spacing: -1rpx;
}

.nav-icon {
  font-size: 36rpx;
}

/* ── 分类标签 ── */
.category-bar {
  white-space: nowrap;
  background: #FFF;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.cat-chip {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #666;
  background: #F5F5F5;
  transition: all 0.2s;
}

.cat-chip.active {
  color: #FFF;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.3);
}

/* ── 公告横幅 ── */
.notice-banner {
  display: flex;
  align-items: center;
  margin: 20rpx 24rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-radius: 16rpx;
  border-left: 8rpx solid #FF9800;
}

.notice-pulse {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF9800;
  margin-right: 16rpx;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.notice-text {
  flex: 1;
  font-size: 26rpx;
  color: #E65100;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-arrow {
  font-size: 28rpx;
  color: #FF9800;
  font-weight: 600;
}

/* ── 帖子列表 ── */
.post-list {
  flex: 1;
  padding: 16rpx 24rpx;
  height: calc(100vh - 300rpx);
  box-sizing: border-box;
}

.post-card {
  background: #FFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  animation: fadeInUp 0.3s ease-out both;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── 帖子头部 ── */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  min-width: 0;
}

.author-info {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  border: 4rpx solid #FFF;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.author-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.author-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #2D3436;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.category-badge {
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 20rpx;
  flex-shrink: 0;
}

.category-badge text {
  font-size: 22rpx;
  color: #2E7D32;
  font-weight: 500;
}

/* ── 帖子内容 ── */
.post-body {
  margin-bottom: 20rpx;
  overflow: hidden;
}

.post-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2D3436;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-excerpt {
  font-size: 26rpx;
  color: #636E72;
  display: block;
  line-height: 1.6;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── 图片网格 ── */
.image-grid {
  display: flex;
  gap: 8rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.grid-1 .grid-img {
  width: 100%;
  height: 360rpx;
}

.grid-2 .grid-img {
  width: calc(50% - 4rpx);
  height: 240rpx;
}

.grid-3 .grid-img {
  width: calc(33.33% - 6rpx);
  height: 200rpx;
}

.grid-img {
  border-radius: 8rpx;
}

/* ── 帖子底部 ── */
.post-footer {
  display: flex;
  gap: 48rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
  overflow: hidden;
}

.footer-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon {
  font-size: 24rpx;
}

.action-count {
  font-size: 24rpx;
  color: #999;
  font-weight: 500;
}

/* ── 加载状态 ── */
.loading-state {
  padding: 40rpx;
  display: flex;
  justify-content: center;
}

.loading-dots {
  display: flex;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF6B6B;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.end-state, .empty-state {
  text-align: center;
  padding: 60rpx;
  color: #999;
  font-size: 26rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #636E72;
  display: block;
  margin-bottom: 8rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

/* ── FAB 按钮 ── */
.fab {
  position: fixed;
  right: 40rpx;
  bottom: 180rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 107, 107, 0.4);
  transition: transform 0.2s;
}

.fab:active {
  transform: scale(0.9);
}

.fab-icon {
  font-size: 40rpx;
}
</style>
