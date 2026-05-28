<template>
  <view class="container">
    <!-- 头像（只读）：头像在登录时通过微信接口设置，此处仅展示不支持修改 -->
    <view class="section">
      <view class="form-item">
        <text class="label">头像</text>
        <view class="avatar-row">
          <image class="avatar-preview" :src="form.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        </view>
      </view>
      <view class="tip-bar">
        <text class="tip-text">头像使用微信登录时的头像，不支持修改</text>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="section">
      <view class="section-title">基本信息</view>
      <view class="form-item">
        <text class="label">昵称</text>
        <input v-model="form.nickname" class="input" placeholder="请输入昵称" maxlength="64" />
      </view>
      <view class="form-item">
        <text class="label">性别</text>
        <picker :range="genderOptions" :range-key="'label'" @change="onGenderChange">
          <view class="picker-value">{{ genderLabel }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">年龄</text>
        <input v-model="form.age" class="input" type="number" placeholder="请输入年龄" maxlength="3" />
      </view>
      <view class="form-item bio-item">
        <text class="label">个人介绍</text>
        <textarea
          v-model="form.bio"
          class="bio-input"
          placeholder="介绍一下自己吧..."
          maxlength="200"
          :auto-height="true"
        />
      </view>
      <view class="bio-counter">
        <text :class="{ 'counter-warn': form.bio.length > 180 }">{{ form.bio.length }}/200</text>
      </view>
    </view>

    <!-- 隐私设置：使用 switch 组件，直接调用 PUT 接口即时生效，无需审核 -->
    <view class="section">
      <view class="section-title">隐私设置</view>
      <view class="form-item">
        <text class="label">公开性别</text>
        <switch :checked="form.showGender === 1" color="#FF6B6B" @change="onShowGenderChange" />
      </view>
      <view class="form-item">
        <text class="label">公开年龄</text>
        <switch :checked="form.showAge === 1" color="#FF6B6B" @change="onShowAgeChange" />
      </view>
    </view>

    <!-- 当前审核状态 -->
    <view v-if="pendingReview" class="review-status pending">
      <view class="review-header">
        <text class="review-icon">⏳</text>
        <text class="review-text">资料变更审核中</text>
      </view>
      <text class="review-time">提交时间：{{ formatTime(pendingReview.createTime) }}</text>
    </view>

    <view v-if="rejectedReview" class="review-status rejected">
      <view class="review-header">
        <text class="review-icon">❌</text>
        <text class="review-text">上次变更被驳回</text>
      </view>
      <text class="review-reason">原因：{{ rejectedReview.rejectReason || "未说明" }}</text>
      <text class="review-time">{{ formatTime(rejectedReview.createTime) }}</text>
    </view>

    <!-- 提交按钮 -->
    <view class="btn-area">
      <button class="submit-btn" :loading="submitting" :disabled="!!pendingReview" @tap="submit">
        {{ pendingReview ? "审核中..." : "提交审核" }}
      </button>
    </view>
  </view>
</template>

<script>
/**
 * 编辑资料页面
 *
 * 核心功能：
 * 1. 编辑个人信息（昵称、性别、年龄、个人介绍）
 * 2. 隐私设置（是否公开性别、年龄）- 直接生效，无需审核
 * 3. 资料变更审核机制 - 提交后需管理员审核
 * 4. 审核状态展示（待审核/已驳回）
 *
 * 设计决策：
 * - 头像不支持在此页面修改（在登录时设置），避免频繁上传
 * - 基本信息修改需要审核（防滥用），隐私设置即时生效
 * - 使用 reactive 管理表单状态，便于双向绑定
 * - 审核状态通过 /profile/mine 接口查询
 */
import { ref, reactive, computed, onMounted } from "vue";
import { get, put, post } from "../../utils/http.js";

export default {
  setup() {
    const genderOptions = [
      { label: "未设置", value: 0 },
      { label: "男", value: 1 },
      { label: "女", value: 2 },
    ];

    // 使用 reactive 管理表单数据，支持双向绑定
    const form = reactive({
      nickname: "",
      avatar: "",
      bio: "",
      gender: 0,
      age: "",
      showGender: 1, // 1=公开, 0=隐藏
      showAge: 1,
    });

    const pendingReview = ref(null);  // 待审核的资料变更
    const rejectedReview = ref(null); // 被驳回的资料变更
    const submitting = ref(false);

    // 计算属性：将性别数值转为显示文本
    const genderLabel = computed(() => {
      const opt = genderOptions.find((g) => g.value === form.gender);
      return opt ? opt.label : "未设置";
    });

    /** 加载当前用户资料到表单 */
    async function loadProfile() {
      const res = await get("/users/me");
      const user = res.data;
      form.nickname = user.nickname;
      form.avatar = user.avatar || "";
      form.bio = user.bio || "";
      form.gender = user.gender;
      form.age = user.age ? String(user.age) : "";
      form.showGender = user.showGender;
      form.showAge = user.showAge;
    }

    /** 查询资料变更的审核状态 */
    async function loadReviewStatus() {
      try {
        const res = await get("/profile/mine");
        if (res.data) {
          if (res.data.status === 0) {
            pendingReview.value = res.data;   // 待审核
            rejectedReview.value = null;
          } else if (res.data.status === 2) {
            rejectedReview.value = res.data;  // 已驳回
            pendingReview.value = null;
          } else {
            pendingReview.value = null;
            rejectedReview.value = null;
          }
        }
      } catch { /* 首次提交时可能无数据，忽略错误 */ }
    }

    function onGenderChange(e) {
      form.gender = genderOptions[e.detail.value].value;
    }

    function onShowGenderChange(e) {
      form.showGender = e.detail.value ? 1 : 0;
    }

    function onShowAgeChange(e) {
      form.showAge = e.detail.value ? 1 : 0;
    }

    /**
     * 提交资料变更
     * 基本信息（昵称、性别等）走审核流程
     * 隐私设置（showGender、showAge）直接调用 PUT 接口即时生效
     */
    async function submit() {
      if (!form.nickname.trim()) {
        uni.showToast({ title: "请输入昵称", icon: "none" });
        return;
      }

      submitting.value = true;
      try {
        // 构建需要审核的资料数据
        const reviewData = {};
        if (form.nickname.trim()) reviewData.nickname = form.nickname.trim();
        if (form.bio) reviewData.bio = form.bio;
        if (form.gender !== undefined) reviewData.gender = form.gender;
        if (form.age) reviewData.age = Number(form.age);

        // 提交到审核接口
        await post("/profile/submit", reviewData);

        // 隐私设置直接更新（不需要审核）
        await put("/users/me", {
          showGender: form.showGender,
          showAge: form.showAge,
        });

        uni.showToast({ title: "已提交审核", icon: "success" });
        loadReviewStatus(); // 刷新审核状态
      } finally {
        submitting.value = false;
      }
    }

    function formatTime(iso) {
      const d = new Date(iso);
      return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    onMounted(() => {
      loadProfile();
      loadReviewStatus();
    });

    return {
      genderOptions, form, pendingReview, rejectedReview,
      submitting, genderLabel,
      onGenderChange, onShowGenderChange, onShowAgeChange,
      submit, formatTime,
    };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FAFAFA;
}

.section {
  background: #FFF;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 24rpx;
  color: #999;
  padding: 28rpx 32rpx 12rpx;
  font-weight: 500;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.form-item:last-child {
  border-bottom: none;
}

.bio-item {
  flex-direction: column;
  align-items: flex-start;
}

.label {
  font-size: 30rpx;
  color: #2D3436;
  min-width: 120rpx;
  font-weight: 500;
}

.input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #2D3436;
}

.input::placeholder {
  color: #CCC;
}

.picker-value {
  font-size: 28rpx;
  color: #636E72;
}

.avatar-row {
  display: flex;
  align-items: center;
}

.avatar-preview {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid #F0F0F0;
}

.tip-bar {
  padding: 12rpx 32rpx 20rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
}

/* ── 个人介绍 ── */
.bio-input {
  width: 100%;
  min-height: 120rpx;
  font-size: 28rpx;
  color: #2D3436;
  line-height: 1.6;
  padding: 16rpx 20rpx;
  background: #F8F8F8;
  border-radius: 12rpx;
  margin-top: 16rpx;
  box-sizing: border-box;
}

.bio-input::placeholder {
  color: #CCC;
}

.bio-counter {
  text-align: right;
  padding: 8rpx 32rpx 20rpx;
  font-size: 24rpx;
  color: #999;
}

.counter-warn {
  color: #FF6B6B;
}

/* ── 审核状态 ── */
.review-status {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  border-left: 8rpx solid;
}

.review-status.pending {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-left-color: #FF9800;
}

.review-status.rejected {
  background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
  border-left-color: #F44336;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.review-icon {
  font-size: 28rpx;
  margin-right: 10rpx;
}

.review-text {
  font-size: 28rpx;
  font-weight: 600;
}

.review-status.pending .review-text {
  color: #E65100;
}

.review-status.rejected .review-text {
  color: #C62828;
}

.review-reason {
  font-size: 26rpx;
  color: #C62828;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.review-time {
  font-size: 24rpx;
  color: #999;
}

/* ── 提交按钮 ── */
.btn-area {
  padding: 40rpx 32rpx;
}

.submit-btn {
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

.submit-btn:active {
  opacity: 0.9;
}

.submit-btn[disabled] {
  background: linear-gradient(135deg, #CCC, #DDD);
  box-shadow: none;
  color: #FFF;
}
</style>
