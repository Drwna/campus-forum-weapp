<template>
  <view class="container">
    <scroll-view
      scroll-y
      class="scroll-area"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 用户卡片：负 margin 实现统计卡片与用户卡片的重叠效果（视觉设计） -->
      <!-- 用户卡片 -->
      <view class="user-card">
        <view class="card-bg" />
        <view class="card-content">
          <view class="avatar-section">
            <image class="user-avatar" :src="resolveImageUrl(userInfo.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
      <!-- 绿色圆点表示在线状态（仅已登录时显示） -->
            <view v-if="isLoggedIn" class="online-dot" />
          </view>
          <view class="user-details">
            <view class="name-row">
              <text class="user-nickname">{{ userInfo.nickname || "未登录" }}</text>
              <text v-if="userInfo.gender === 1" class="gender-badge male">♂</text>
              <text v-else-if="userInfo.gender === 2" class="gender-badge female">♀</text>
              <text v-if="userInfo.age" class="age-tag">{{ userInfo.age }}岁</text>
            </view>
            <text class="user-bio">{{ userInfo.bio || "这个人很懒，什么都没写" }}</text>
          </view>
        </view>
      </view>

      <!-- 数据统计 -->
      <view v-if="isLoggedIn" class="stats-card">
        <view class="stat-item" @tap="goMyPosts">
          <text class="stat-number">{{ userInfo.postCount ?? 0 }}</text>
          <text class="stat-label">帖子</text>
        </view>
        <view class="stat-divider" @tap="goFollowers" />
        <view class="stat-item" @tap="goFollowers">
          <text class="stat-number">{{ userInfo.followerCount ?? 0 }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-divider" @tap="goFollowing" />
        <view class="stat-item" @tap="goFollowing">
          <text class="stat-number">{{ userInfo.followingCount ?? 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-card">
        <view class="menu-group">
          <view class="menu-item" @tap="goMyPosts">
            <view class="menu-icon-wrapper" style="background: #E3F2FD">
              <text class="menu-icon">📋</text>
            </view>
            <text class="menu-text">我的帖子</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @tap="goMyComments">
            <view class="menu-icon-wrapper" style="background: #F3E5F5">
              <text class="menu-icon">💬</text>
            </view>
            <text class="menu-text">我的评论</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @tap="goNotices">
            <view class="menu-icon-wrapper" style="background: #FFF3E0">
              <text class="menu-icon">📢</text>
            </view>
            <text class="menu-text">公告通知</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <view class="menu-group">
          <view class="menu-item" @tap="goSettings">
            <view class="menu-icon-wrapper" style="background: #ECEFF1">
              <text class="menu-icon">⚙️</text>
            </view>
            <text class="menu-text">设置</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 登录/退出按钮 -->
      <view class="btn-area">
        <button v-if="!isLoggedIn" class="login-btn" @tap="goLogin">
          <text>微信一键登录</text>
        </button>
        <button v-else class="logout-btn" @tap="handleLogout">
          <text>退出登录</text>
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * "我的"页面 - TabBar 页面之一
 *
 * 核心功能：
 * 1. 用户信息卡片（头像、昵称、性别、年龄、个性签名）
 * 2. 数据统计（帖子数、粉丝数、关注数）
 * 3. 功能菜单入口（我的帖子、我的评论、公告通知、设置）
 * 4. 登录/退出按钮
 *
 * 未登录时显示默认信息 + 登录按钮
 * 已登录时显示真实用户数据 + 退出按钮
 * 支持下拉刷新用户数据
 */
import { ref, computed, onMounted } from "vue";
import { getMe } from "../../api/user.js";
import { useAuthStore } from "../../stores/auth.js";
import { resolveImageUrl } from "../../utils/http.js";

export default {
  setup() {
    const authStore = useAuthStore();
    const isLoggedIn = computed(() => authStore.isLoggedIn);
    const userInfo = ref({});
    const refreshing = ref(false);

    async function loadUserInfo() {
      if (!isLoggedIn.value) return;
      try {
        const res = await getMe();
        userInfo.value = res.data;
      } catch { /* ignore */ }
    }

    async function onRefresh() {
      refreshing.value = true;
      await loadUserInfo();
      refreshing.value = false;
    }

    function goLogin() { uni.navigateTo({ url: "/pages/login/login" }); }
    function goMyPosts() { uni.navigateTo({ url: "/pages/myposts/myposts" }); }
    function goMyComments() { uni.navigateTo({ url: "/pages/mycomments/mycomments" }); }
    function goNotices() { uni.navigateTo({ url: "/pages/notices/notices" }); }
    function goSettings() { uni.navigateTo({ url: "/pages/settings/settings" }); }
    function goFollowers() { uni.navigateTo({ url: `/pages/followlist/followlist?type=followers&userId=${userInfo.value.userId}` }); }
    function goFollowing() { uni.navigateTo({ url: `/pages/followlist/followlist?type=following&userId=${userInfo.value.userId}` }); }

    /** 退出登录，弹出确认对话框防误触 */
    async function handleLogout() {
      uni.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: async (res) => {
          if (res.confirm) {
            await authStore.logoutAction();
            userInfo.value = {}; // 清空本地用户数据
            uni.showToast({ title: "已退出", icon: "success" });
          }
        },
      });
    }

    onMounted(loadUserInfo);

    return {
      isLoggedIn, userInfo, refreshing,
      onRefresh, goLogin, goMyPosts, goMyComments, goNotices, goSettings,
      goFollowers, goFollowing, handleLogout, resolveImageUrl,
    };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FAFAFA;
}

.scroll-area {
  height: 100vh;
}

/* ── 用户卡片 ── */
.user-card {
  position: relative;
  overflow: hidden;
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E, #FFB8B8);
}

.card-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 80rpx 32rpx 48rpx;
}

.avatar-section {
  position: relative;
  margin-right: 24rpx;
}

.user-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.online-dot {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #4CAF50;
  border: 4rpx solid #FFF;
}

.user-details {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.user-nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFF;
}

.gender-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  color: #FFF;
  font-weight: 600;
}

.gender-badge.male { background: rgba(79, 195, 247, 0.8); }
.gender-badge.female { background: rgba(244, 143, 177, 0.8); }

.age-tag {
  font-size: 22rpx;
  color: #FFF;
  background: rgba(255, 255, 255, 0.3);
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.user-bio {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

/* ── 数据统计 ── */
.stats-card {
  display: flex;
  align-items: center;
  background: #FFF;
  margin: -24rpx 24rpx 20rpx;
  border-radius: 20rpx;
  padding: 28rpx 0;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 800;
  color: #2D3436;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #F0F0F0;
}

/* ── 功能菜单 ── */
.menu-card {
  margin: 0 24rpx 20rpx;
}

.menu-group {
  background: #FFF;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #F8F8F8;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.menu-icon {
  font-size: 28rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #2D3436;
  font-weight: 500;
}

.menu-arrow {
  font-size: 32rpx;
  color: #CCC;
}

/* ── 按钮区域 ── */
.btn-area {
  padding: 40rpx 24rpx;
}

.login-btn {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  color: #FFF;
  border-radius: 20rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(255, 107, 107, 0.3);
}

.login-btn:active {
  transform: scale(0.98);
}

.logout-btn {
  background: #FFF;
  color: #FF6B6B;
  border: 2rpx solid #FF6B6B;
  border-radius: 20rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.logout-btn:active {
  background: #FFF5F5;
}
</style>
