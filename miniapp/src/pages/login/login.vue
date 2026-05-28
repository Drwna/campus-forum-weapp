<template>
  <view class="container">
    <view class="login-card">
      <text class="title">CampusHub</text>
      <text class="subtitle">校园论坛</text>

      <!-- #ifdef MP-WEIXIN -->
      <!-- 微信小程序环境：使用 open-type="chooseAvatar" 获取用户头像（微信隐私接口） -->
      <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image class="avatar-img" :src="avatarTempPath || '/static/images/avatar-default.svg'" mode="aspectFill" />
        <text class="avatar-text">{{ avatarTempPath ? '更换头像' : '选择头像' }}</text>
      </button>
      <input
        class="nickname-input"
        placeholder="请输入昵称"
        :value="nickname"
        @input="onNicknameInput"
        maxlength="20"
      />
      <button class="wechat-btn" :loading="loading" @tap="handleLogin">
        微信一键登录
      </button>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <!-- 非微信环境（H5/App）：不显示头像选择，直接登录 -->
      <button class="wechat-btn" :loading="loading" @tap="handleLogin">
        微信一键登录
      </button>
      <!-- #endif -->

      <text class="tip">登录后即可发帖、评论、点赞</text>
    </view>
  </view>
</template>

<script>
/**
 * 登录页
 *
 * 登录流程：
 * 1. 用户选择头像（可选）和输入昵称
 * 2. 调用 uni.login 获取微信临时 code
 * 3. 将 code 发送到后端，后端用 code 换取 openid 并创建/查找用户
 * 4. 后端返回 JWT token，前端保存到 Pinia store + 本地存储
 * 5. 如果用户选择了头像，上传到服务器并更新用户资料
 *
 * 条件编译说明：
 * - #ifdef MP-WEIXIN: 仅在微信小程序环境中编译
 * - #ifndef MP-WEIXIN: 在非微信小程序环境（H5、App 等）中编译
 * 这是 uni-app 的条件编译语法，用于处理跨平台差异
 */
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { uploadFile } from "../../api/file.js";
import { updateMe } from "../../api/user.js";

export default {
  setup() {
    const authStore = useAuthStore();
    const loading = ref(false);
    const nickname = ref("");
    const avatarTempPath = ref(""); // 用户选择的头像临时路径

    /** 微信头像选择回调，获取头像临时 URL */
    function onChooseAvatar(e) {
      avatarTempPath.value = e.detail.avatarUrl;
    }

    function onNicknameInput(e) {
      nickname.value = e.detail.value;
    }

    async function handleLogin() {
      if (loading.value) return;

      // 默认昵称为"微信用户"，用户未输入时使用
      const finalNickname = nickname.value.trim() || "微信用户";
      loading.value = true;

      try {
        let code = "";

        // #ifdef MP-WEIXIN
        // 微信小程序环境：调用 uni.login 获取微信临时登录凭证 code
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({ provider: "weixin", success: resolve, fail: reject });
        });
        code = loginRes.code;
        // #endif

        // #ifndef MP-WEIXIN
        // 非微信环境（H5/App 开发调试）：生成模拟 code
        code = "dev_" + Date.now();
        // #endif

        // 第一步：先不带头像登录，获取 token
        await authStore.login(code, finalNickname, "");

        // 第二步：如果有选择头像，上传并更新用户资料
        if (avatarTempPath.value) {
          try {
            const uploadRes = await uploadFile(avatarTempPath.value);
            // 第三步：用上传后的 URL 更新用户头像
            await updateMe({ avatar: uploadRes.url });
          } catch (uploadErr) {
            // 头像上传失败不影响登录流程
            console.error("Avatar upload failed:", uploadErr);
          }
        }

        uni.showToast({ title: "登录成功", icon: "success" });
        // 延迟返回上一页，让用户看到成功提示
        setTimeout(() => uni.navigateBack(), 1500);
      } catch (err) {
        console.error("Login failed:", err);
        uni.showToast({ title: "登录失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    }

    return { loading, nickname, avatarTempPath, handleLogin, onChooseAvatar, onNicknameInput };
  },
};
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
}

.login-card {
  width: 600rpx;
  padding: 60rpx 40rpx;
  background: #FFF;
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  color: #2D3436;
  display: block;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 40rpx;
}

.avatar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 24rpx;
  padding: 0;
  border-radius: 50%;
  background: #FAFAFA;
  border: 2rpx dashed #F0F0F0;
  line-height: normal;
}

.avatar-btn::after {
  border: none;
}

.avatar-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.avatar-text {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
}

.nickname-input {
  width: 100%;
  height: 88rpx;
  background: #FAFAFA;
  border-radius: 12rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: #2D3436;
  text-align: center;
}

.wechat-btn {
  background: #07c160;
  color: #FFF;
  border-radius: 16rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.tip {
  font-size: 24rpx;
  color: #999;
}
</style>
