<template>
  <view class="container">
    <!-- 个人信息 -->
    <view class="section">
      <view class="section-title">个人信息</view>
      <view class="menu-item" @tap="goEditProfile">
        <text class="menu-text">编辑资料</text>
        <text class="menu-value">昵称、头像、性别、年龄、介绍</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 关于 -->
    <view class="section">
      <view class="section-title">关于</view>
      <view class="menu-item">
        <text class="menu-text">版本</text>
        <text class="menu-value">v0.1.0</text>
      </view>
      <view class="menu-item">
        <text class="menu-text">开发者</text>
        <text class="menu-value">CampusHub Team</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="btn-area">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
/**
 * 设置页面
 *
 * 功能：
 * 1. 编辑资料入口（跳转到 editprofile 页面）
 * 2. 应用信息展示（版本号、开发者）
 * 3. 退出登录（调用 auth store 的 logoutAction，然后跳转到首页）
 *
 * 退出登录使用 reLaunch 而非 navigateBack，
 * 因为需要清空页面栈，防止用户按返回键回到需要登录的页面
 */
import { useAuthStore } from "../../stores/auth.js";

export default {
  setup() {
    const authStore = useAuthStore();

    function goEditProfile() {
      uni.navigateTo({ url: "/pages/editprofile/editprofile" });
    }

    async function handleLogout() {
      uni.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: async (res) => {
          if (res.confirm) {
            await authStore.logoutAction();
            uni.showToast({ title: "已退出", icon: "success" });
            // reLaunch 会关闭所有页面并跳转到首页，清空页面栈
            setTimeout(() => {
              uni.reLaunch({ url: "/pages/index/index" });
            }, 1500);
          }
        },
      });
    }

    return { goEditProfile, handleLogout };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FAFAFA;
}

.section {
  background: #fff;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 24rpx;
  color: #999;
  padding: 24rpx 32rpx 12rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 30rpx;
  color: #333;
  flex: 1;
}

.menu-value {
  font-size: 26rpx;
  color: #999;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.btn-area {
  padding: 60rpx 32rpx;
}

.logout-btn {
  background: #fff;
  color: #FF6B6B;
  border: 2rpx solid #FF6B6B;
  border-radius: 12rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
}

.logout-btn:active {
  background: #FFF5F5;
}
</style>
