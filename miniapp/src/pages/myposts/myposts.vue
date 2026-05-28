<template>
  <view class="container">
    <!-- 状态标签 -->
    <view class="status-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentStatus === tab.value }]"
        @tap="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 帖子列表 -->
    <scroll-view
      scroll-y
      class="post-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-for="post in posts" :key="post.postId" class="post-card">
        <view class="post-header">
          <text class="post-title">{{ post.title }}</text>
          <view :class="['status-tag', statusClass(post.status)]">
            {{ statusText(post.status) }}
          </view>
        </view>

        <text class="post-excerpt">{{ post.excerpt }}</text>

        <!-- 驳回状态（status===2）显示驳回原因，橙色警示框 -->
        <view v-if="post.status === 2" class="reject-box">
          <text class="reject-label">驳回原因：</text>
          <text class="reject-reason">{{ post.rejectReason || "未说明原因" }}</text>
        </view>

        <view class="post-footer">
          <text class="post-time">{{ formatTime(post.createTime) }}</text>
          <view class="post-stats">
            <text class="stat">{{ post.likeCount }} 赞</text>
            <text class="stat">{{ post.commentCount }} 评论</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="!loading && !posts.length" class="empty">
        <text>暂无帖子</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * 我的帖子页面
 *
 * 核心功能：
 * 1. 按审核状态筛选（全部/待审核/已通过/已驳回）
 * 2. 帖子列表（无限滚动 + 下拉刷新）
 * 3. 驳回帖子显示驳回原因
 *
 * 审核状态：0=待审核, 1=已通过, 2=已驳回, 3=已删除
 * 帖子发布后先经过 DFA 敏感词过滤，通过后进入待审核状态
 * 管理员审核通过后才会在首页显示
 */
import { ref, onMounted } from "vue";
import { getMyPosts } from "../../api/post.js";

export default {
  setup() {
    const tabs = [
      { label: "全部", value: undefined },
      { label: "待审核", value: 0 },
      { label: "已通过", value: 1 },
      { label: "已驳回", value: 2 },
    ];

    const posts = ref([]);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);
    const currentStatus = ref(undefined);

    async function loadPosts(isRefresh = false) {
      if (loading.value) return;
      if (isRefresh) { page.value = 1; hasMore.value = true; }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        const params = { page: page.value, size: 20 };
        if (currentStatus.value !== undefined) params.status = currentStatus.value;
        const res = await getMyPosts(params);
        const result = res.data;
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

    function switchTab(status) {
      currentStatus.value = status;
      loadPosts(true);
    }

    function loadMore() { loadPosts(); }
    function onRefresh() { refreshing.value = true; loadPosts(true); }

    function statusText(s) {
      return ({ 0: "待审核", 1: "已通过", 2: "已驳回", 3: "已删除" }[s]) ?? "未知";
    }

    function statusClass(s) {
      return ({ 0: "status-pending", 1: "status-approved", 2: "status-rejected", 3: "status-deleted" }[s]) ?? "";
    }

    function formatTime(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return "刚刚";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    onMounted(() => { loadPosts(true); });

    return {
      tabs, posts, loading, refreshing, currentStatus,
      switchTab, loadMore, onRefresh, statusText, statusClass, formatTime,
    };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
}

.status-tabs {
  display: flex;
  background: #FFF;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 28rpx;
  color: #636E72;
  border-radius: 8rpx;
}

.tab-item.active {
  color: #FF6B6B;
  background: #FFF0F0;
  font-weight: 600;
}

.post-list {
  padding: 16rpx;
  height: calc(100vh - 100rpx);
}

.post-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.post-title {
  font-size: 32rpx;
  font-weight: 600;
  flex: 1;
  margin-right: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2D3436;
}

.status-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  white-space: nowrap;
}

.status-pending { color: #FF9800; background: #FFF3E0; }
.status-approved { color: #4CAF50; background: #E8F5E9; }
.status-rejected { color: #F44336; background: #FFEBEE; }
.status-deleted { color: #999; background: #F5F5F5; }

.post-excerpt {
  font-size: 26rpx;
  color: #636E72;
  display: block;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reject-box {
  background: #FFF3E0;
  border-left: 6rpx solid #FF9800;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.reject-label {
  font-size: 24rpx;
  color: #FF9800;
  font-weight: 600;
  display: block;
  margin-bottom: 4rpx;
}

.reject-reason {
  font-size: 26rpx;
  color: #E65100;
  display: block;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

.post-stats {
  display: flex;
  gap: 24rpx;
}

.stat {
  font-size: 24rpx;
  color: #999;
}

.loading, .empty {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
