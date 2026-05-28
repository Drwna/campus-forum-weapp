<template>
  <view class="container">
    <!-- 未登录提示 -->
    <view v-if="!isLoggedIn" class="login-prompt">
      <text class="prompt-icon">🔐</text>
      <text class="prompt-text">登录后查看消息</text>
      <button class="prompt-btn" @tap="goLogin">去登录</button>
    </view>

    <view v-else>
      <!-- 未读消息提示 -->
      <view v-if="unreadCount > 0" class="unread-banner">
        <view class="unread-dot" />
        <text class="unread-text">{{ unreadCount }} 条未读消息</text>
        <text class="read-all-btn" @tap="handleMarkAllRead">全部已读</text>
      </view>

      <!-- 消息列表 -->
      <scroll-view
        scroll-y
        class="msg-list"
        @scrolltolower="loadMore"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
      >
        <view
          v-for="(msg, idx) in messages"
          :key="msg.messageId"
          class="msg-card"
          :class="{ unread: !msg.isRead }"
          :style="{ animationDelay: idx * 0.03 + 's' }"
          @tap="handleRead(msg)"
        >
          <view class="msg-icon-wrapper" :class="typeClass(msg.type)">
            <text class="msg-icon">{{ typeIcon(msg.type) }}</text>
          </view>
          <view class="msg-body">
            <view class="msg-header">
              <text class="msg-sender">{{ msg.fromUser?.nickname || "系统" }}</text>
              <view v-if="!msg.isRead" class="unread-badge" />
            </view>
            <text class="msg-content">{{ msg.content || typeDesc(msg.type) }}</text>
            <text class="msg-time">{{ formatTime(msg.createTime) }}</text>
          </view>
        </view>

        <view v-if="loading" class="loading-state">
          <view class="loading-dots">
            <view class="dot" /><view class="dot" /><view class="dot" />
          </view>
        </view>
        <view v-if="!loading && !messages.length" class="empty-state">
          <text class="empty-icon">🔔</text>
          <text class="empty-text">暂无消息</text>
          <text class="empty-hint">有新消息会在这里通知你</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
/**
 * 消息页 - TabBar 页面之一
 *
 * 核心功能：
 * 1. 未登录时显示登录引导
 * 2. 未读消息横幅 + 一键全部已读
 * 3. 消息列表（支持无限滚动 + 下拉刷新）
 * 4. 消息类型图标/颜色区分（评论、回复、点赞、关注、系统通知）
 * 5. 点击消息自动标记已读
 *
 * 消息类型映射：1=评论, 2=回复, 3=点赞, 4=关注, 5=系统通知
 */
import { ref, computed, onMounted } from "vue";
import { getMessages, getUnreadCount, markRead, markAllRead } from "../../api/message.js";
import { useAuthStore } from "../../stores/auth.js";

export default {
  setup() {
    const authStore = useAuthStore();
    const isLoggedIn = computed(() => authStore.isLoggedIn);
    const messages = ref([]);
    const unreadCount = ref(0);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);

    async function loadMessages(isRefresh = false) {
      if (!isLoggedIn.value) return;
      if (loading.value) return;
      if (isRefresh) { page.value = 1; hasMore.value = true; }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        const res = await getMessages({ page: page.value, size: 20 });
        const result = res.data;
        if (isRefresh) {
          messages.value = result.list;
        } else {
          messages.value = [...messages.value, ...result.list];
        }
        hasMore.value = result.hasMore;
        page.value++;
      } finally {
        loading.value = false;
      }
    }

    async function loadUnreadCount() {
      if (!isLoggedIn.value) return;
      try {
        const res = await getUnreadCount();
        unreadCount.value = res.data.count;
      } catch { /* ignore */ }
    }

    /** 点击单条消息时标记为已读，同时本地更新未读计数 */
    async function handleRead(msg) {
      if (!msg.isRead) {
        await markRead(msg.messageId);
        msg.isRead = true;
        // 乐观更新：本地减少未读计数，无需重新请求
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    }

    /** 一键全部已读，批量标记所有消息为已读 */
    async function handleMarkAllRead() {
      await markAllRead();
      messages.value.forEach((m) => (m.isRead = true));
      unreadCount.value = 0;
      uni.showToast({ title: "已全部标为已读", icon: "success" });
    }

    async function onRefresh() {
      refreshing.value = true;
      await loadMessages(true);
      await loadUnreadCount();
      refreshing.value = false;
    }

    function loadMore() { loadMessages(); }
    function goLogin() { uni.navigateTo({ url: "/pages/login/login" }); }

    /** 根据消息类型返回对应的图标 emoji */
    function typeIcon(type) {
      return { 1: "💬", 2: "↩️", 3: "❤️", 4: "👤", 5: "📢" }[type] ?? "📩";
    }

    /** 根据消息类型返回默认描述文本（当消息内容为空时使用） */
    function typeDesc(type) {
      return { 1: "评论了你的帖子", 2: "回复了你的评论", 3: "赞了你的帖子", 4: "关注了你", 5: "系统通知" }[type] ?? "";
    }

    /** 根据消息类型返回对应的 CSS 类名，用于设置不同的背景色 */
    function typeClass(type) {
      return { 1: "type-comment", 2: "type-reply", 3: "type-like", 4: "type-follow", 5: "type-system" }[type] ?? "type-system";
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

    onMounted(() => {
      loadMessages(true);
      loadUnreadCount();
    });

    return {
      isLoggedIn, messages, unreadCount, loading, refreshing,
      loadMore, onRefresh, handleRead, handleMarkAllRead, goLogin,
      typeIcon, typeDesc, typeClass, formatTime,
    };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FAFAFA;
  box-sizing: border-box;
}

/* ── 登录提示 ── */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.prompt-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.prompt-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.prompt-btn {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  color: #FFF;
  border-radius: 40rpx;
  padding: 0 48rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}

/* ── 未读横幅 ── */
.unread-banner {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-bottom: 1rpx solid #FFE0B2;
  box-sizing: border-box;
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF9800;
  margin-right: 12rpx;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.unread-text {
  flex: 1;
  font-size: 26rpx;
  color: #E65100;
  font-weight: 500;
}

.read-all-btn {
  font-size: 26rpx;
  color: #FF6B6B;
  font-weight: 600;
}

/* ── 消息列表 ── */
.msg-list {
  padding: 16rpx 24rpx;
  height: calc(100vh - 100rpx);
  box-sizing: border-box;
}

.msg-card {
  display: flex;
  background: #FFF;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
  animation: fadeInUp 0.3s ease-out both;
  overflow: hidden;
}

.msg-card.unread {
  background: #FFFBF0;
  border-left: 6rpx solid #FF9800;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── 消息图标 ── */
.msg-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.type-comment { background: #E3F2FD; }
.type-reply { background: #F3E5F5; }
.type-like { background: #FCE4EC; }
.type-follow { background: #E8F5E9; }
.type-system { background: #FFF3E0; }

.msg-icon {
  font-size: 32rpx;
}

/* ── 消息内容 ── */
.msg-body {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.msg-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.msg-sender {
  font-size: 28rpx;
  font-weight: 600;
  color: #2D3436;
  flex: 1;
}

.unread-badge {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF6B6B;
}

.msg-content {
  font-size: 26rpx;
  color: #636E72;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.msg-time {
  font-size: 22rpx;
  color: #999;
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

.empty-state {
  text-align: center;
  padding: 100rpx 60rpx;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #636E72;
  display: block;
  margin-bottom: 8rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}
</style>
