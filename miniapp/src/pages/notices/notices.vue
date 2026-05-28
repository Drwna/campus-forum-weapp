<template>
  <view class="container">
    <scroll-view
      scroll-y
      class="notice-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-for="notice in notices" :key="notice.noticeId" class="notice-card" @tap="goDetail(notice)">
        <view class="notice-header">
          <view v-if="notice.isTop" class="top-tag">置顶</view>
          <text class="notice-title">{{ notice.title }}</text>
        </view>
        <text class="notice-preview">{{ notice.content.slice(0, 100) }}{{ notice.content.length > 100 ? '...' : '' }}</text>
        <text class="notice-time">{{ formatTime(notice.createTime) }}</text>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="!loading && !notices.length" class="empty">
        <text>暂无公告</text>
      </view>
    </scroll-view>

    <!-- 详情弹窗 -->
    <view v-if="currentNotice" class="detail-mask" @tap="currentNotice = null">
      <view class="detail-card" @tap.stop>
        <view class="detail-header">
          <text class="detail-title">{{ currentNotice.title }}</text>
          <text class="detail-close" @tap="currentNotice = null">×</text>
        </view>
        <scroll-view scroll-y class="detail-body">
          <text class="detail-content">{{ currentNotice.content }}</text>
        </scroll-view>
        <text class="detail-time">{{ formatTime(currentNotice.createTime) }}</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 公告通知页面
 *
 * 核心功能：
 * 1. 公告列表（支持置顶标签、无限滚动 + 下拉刷新）
 * 2. 点击公告弹出详情弹窗（模态展示）
 * 3. 弹窗内可查看完整公告内容和发布时间
 *
 * 公告由管理员在后台发布，用于通知用户重要信息
 */
import { ref, onMounted } from "vue";
import { get } from "../../utils/http.js";

export default {
  setup() {
    const notices = ref([]);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);
    const currentNotice = ref(null); // 当前查看的公告，非 null 时显示详情弹窗

    async function loadNotices(isRefresh = false) {
      if (loading.value) return;
      if (isRefresh) { page.value = 1; hasMore.value = true; }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        const res = await get("/notices", { page: page.value, size: 20 });
        const result = res.data;
        if (isRefresh) {
          notices.value = result.list;
        } else {
          notices.value = [...notices.value, ...result.list];
        }
        hasMore.value = result.hasMore;
        page.value++;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    }

    function loadMore() { loadNotices(); }
    function onRefresh() { refreshing.value = true; loadNotices(true); }
    function goDetail(notice) { currentNotice.value = notice; }

    function formatTime(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return "刚刚";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    onMounted(() => { loadNotices(true); });

    return {
      notices, loading, refreshing, currentNotice,
      loadMore, onRefresh, goDetail, formatTime,
    };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
}

.notice-list {
  padding: 16rpx;
  height: 100vh;
}

.notice-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.notice-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.top-tag {
  font-size: 20rpx;
  color: #FFF;
  background: #FF6B6B;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  margin-right: 12rpx;
}

.notice-title {
  font-size: 32rpx;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2D3436;
}

.notice-preview {
  font-size: 26rpx;
  color: #636E72;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.5;
}

.notice-time {
  font-size: 24rpx;
  color: #999;
}

.loading, .empty {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 26rpx;
}

.detail-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.detail-card {
  width: 85%;
  max-height: 70vh;
  background: #FFF;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.detail-title {
  font-size: 36rpx;
  font-weight: 700;
  flex: 1;
  color: #2D3436;
}

.detail-close {
  font-size: 48rpx;
  color: #999;
  padding: 0 16rpx;
}

.detail-body {
  flex: 1;
  max-height: 50vh;
}

.detail-content {
  font-size: 30rpx;
  color: #2D3436;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 24rpx;
  text-align: right;
}
</style>
