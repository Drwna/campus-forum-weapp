<template>
  <view class="container">
    <!-- 标签切换 -->
    <view class="tabs">
      <view
        :class="['tab', { active: currentType === 'followers' }]"
        @tap="switchType('followers')"
      >
        <text>粉丝</text>
      </view>
      <view
        :class="['tab', { active: currentType === 'following' }]"
        @tap="switchType('following')"
      >
        <text>关注</text>
      </view>
    </view>

    <!-- 列表 -->
    <scroll-view
      scroll-y
      class="list-area"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-for="user in list" :key="user.userId" class="user-card" @tap="goUser(user.userId)">
        <image class="user-avatar" :src="resolveImageUrl(user.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
        </view>
        <view class="arrow">›</view>
      </view>

      <view v-if="loading" class="loading-state">
        <view class="loading-dots">
          <view class="dot" /><view class="dot" /><view class="dot" />
        </view>
      </view>
      <view v-if="!loading && !list.length" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">{{ currentType === 'followers' ? '暂无粉丝' : '暂无关注' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * 关注/粉丝列表页面
 *
 * 核心功能：
 * 1. 顶部标签切换（粉丝/关注）
 * 2. 用户列表（头像 + 昵称，点击跳转用户主页）
 * 3. 支持无限滚动加载 + 下拉刷新
 *
 * 页面参数：
 * - ?type=followers 或 ?type=following（初始显示哪个标签）
 * - ?userId=xxx（查看哪个用户的关系列表）
 *
 * 动态路由：根据 currentType 切换不同的 API 端点
 */
import { ref, onMounted } from "vue";
import { get, resolveImageUrl } from "../../utils/http.js";

export default {
  setup() {
    const list = ref([]);
    const page = ref(1);
    const hasMore = ref(true);
    const loading = ref(false);
    const refreshing = ref(false);
    const currentType = ref("followers"); // "followers" 或 "following"
    let userId = "";

    async function loadList(isRefresh = false) {
      if (loading.value) return;
      if (isRefresh) {
        page.value = 1;
        hasMore.value = true;
      }
      if (!hasMore.value) return;

      loading.value = true;
      try {
        // 根据当前标签类型选择不同的 API 端点
        const endpoint = currentType.value === "followers"
          ? `/users/${userId}/followers`
          : `/users/${userId}/following`;
        const res = await get(endpoint, { page: page.value, size: 20 });
        const result = res.data;

        if (isRefresh) {
          list.value = result.list;
        } else {
          list.value = [...list.value, ...result.list];
        }

        hasMore.value = result.hasMore;
        page.value++;
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    }

    /** 切换粉丝/关注标签，重新加载列表 */
    function switchType(type) {
      currentType.value = type;
      loadList(true);
    }

    function loadMore() {
      loadList();
    }

    function onRefresh() {
      refreshing.value = true;
      loadList(true);
    }

    function goUser(id) {
      uni.navigateTo({ url: `/pages/user/user?id=${id}` });
    }

    onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      currentType.value = currentPage.options?.type || "followers";
      userId = currentPage.options?.userId || "";
      if (userId) {
        loadList(true);
      }
    });

    return {
      list, loading, refreshing, currentType,
      switchType, loadMore, onRefresh, goUser, resolveImageUrl,
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

/* ── 标签 ── */
.tabs {
  display: flex;
  background: #FFF;
  border-bottom: 1rpx solid #F0F0F0;
  box-sizing: border-box;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: #999;
  position: relative;
}

.tab.active {
  color: #FF6B6B;
  font-weight: 600;
}

.tab.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #FF6B6B;
}

/* ── 列表 ── */
.list-area {
  height: calc(100vh - 100rpx);
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.user-card {
  display: flex;
  align-items: center;
  background: #FFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  overflow: hidden;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 2rpx solid #F0F0F0;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #2D3436;
}

.arrow {
  font-size: 32rpx;
  color: #CCC;
}

/* ── 状态 ── */
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
  font-size: 30rpx;
  color: #999;
}
</style>
