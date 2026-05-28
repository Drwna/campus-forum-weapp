<template>
  <view class="container">
    <scroll-view
      scroll-y
      class="comment-list"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-for="comment in comments" :key="comment.commentId" class="comment-card">
        <view class="comment-header">
          <text class="comment-time">{{ formatTime(comment.createTime) }}</text>
          <view class="delete-btn" @tap="handleDelete(comment.commentId)">
            <text>删除</text>
          </view>
        </view>
        <text class="comment-content">{{ comment.content }}</text>
        <view v-if="comment.post" class="post-info" @tap="goPost(comment.post.postId)">
          <text class="post-label">回复帖子：</text>
          <text class="post-title">{{ comment.post.title }}</text>
        </view>
      </view>

      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-if="!loading && !comments.length" class="empty">
        <text>暂无评论</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * 我的评论页面
 *
 * 核心功能：
 * 1. 展示当前用户发表过的所有评论（分页加载）
 * 2. 每条评论显示所属帖子标题，点击可跳转到帖子详情
 * 3. 支持删除自己的评论（需二次确认）
 * 4. 支持下拉刷新 + 无限滚动加载
 */
import { ref, onMounted } from "vue";
import { getMyComments, deleteComment } from "../../api/comment.js";

export default {
  setup() {
    const comments = ref([]);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);

    async function loadComments(isRefresh = false) {
      if (loading.value) return;
      if (isRefresh) { page.value = 1; hasMore.value = true; }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        const res = await getMyComments({ page: page.value, size: 20 });
        const result = res.data;
        if (isRefresh) {
          comments.value = result.list;
        } else {
          comments.value = [...comments.value, ...result.list];
        }
        hasMore.value = result.hasMore;
        page.value++;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    }

    function loadMore() { loadComments(); }
    function onRefresh() { refreshing.value = true; loadComments(true); }

    async function handleDelete(commentId) {
      uni.showModal({
        title: "确认删除",
        content: "确定要删除这条评论吗？",
        success: async (res) => {
          if (res.confirm) {
            await deleteComment(commentId);
            uni.showToast({ title: "已删除", icon: "success" });
            loadComments(true);
          }
        },
      });
    }

    function goPost(postId) {
      uni.navigateTo({ url: `/pages/detail/detail?id=${postId}` });
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

    onMounted(() => { loadComments(true); });

    return {
      comments, loading, refreshing,
      loadMore, onRefresh, handleDelete, goPost, formatTime,
    };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
}

.comment-list {
  padding: 16rpx;
  height: 100vh;
}

.comment-card {
  background: #FFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #999;
}

.delete-btn {
  font-size: 24rpx;
  color: #FF6B6B;
  padding: 4rpx 16rpx;
}

.comment-content {
  font-size: 28rpx;
  color: #2D3436;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.6;
}

.post-info {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
}

.post-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.post-title {
  font-size: 24rpx;
  color: #FF6B6B;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading, .empty {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
