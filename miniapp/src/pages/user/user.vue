<template>
  <view class="container">
    <view v-if="user" class="profile">
      <!-- 用户头部 -->
      <view class="user-header">
        <image class="avatar" :src="resolveImageUrl(user.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="user-info">
          <text class="nickname">{{ user.nickname }}</text>
          <text class="bio">{{ user.bio || "这个人很懒，什么都没写" }}</text>
        </view>
        <view v-if="!isSelf" class="follow-btn" @tap="toggleFollow">
          <text>{{ isFollowing ? "已关注" : "关注" }}</text>
        </view>
      </view>

      <!-- 数据统计 -->
      <view class="stats">
        <view class="stat-item">
          <text class="stat-value">{{ user.postCount }}</text>
          <text class="stat-label">帖子</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ user.followerCount }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ user.followingCount }}</text>
          <text class="stat-label">关注</text>
        </view>
      </view>

      <!-- 用户帖子 -->
      <view class="section">
        <text class="section-title">Ta 的帖子</text>
        <view v-for="post in posts" :key="post.postId" class="post-item" @tap="goDetail(post.postId)">
          <text class="post-title">{{ post.title }}</text>
          <text class="post-time">{{ formatTime(post.createTime) }}</text>
        </view>
        <view v-if="!posts.length" class="empty">
          <text>暂无帖子</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 用户主页 - 查看其他用户的资料和帖子
 *
 * 核心功能：
 * 1. 展示用户信息（头像、昵称、签名、统计数据）
 * 2. 关注/取消关注（需要登录）
 * 3. 展示该用户发布的帖子列表
 * 4. 判断是否是自己（是则隐藏关注按钮）
 *
 * 页面参数：?id=xxx（目标用户 ID）
 *
 * 注意：帖子列表是通过获取全局帖子再按 authorId 过滤实现的
 * 如果帖子量大，更好的做法是后端提供 /users/:id/posts 接口
 */
import { ref, onMounted } from "vue";
import { getUserById } from "../../api/user.js";
import { getPostList } from "../../api/post.js";
import { followUser, unfollowUser } from "../../api/interaction.js";
import { resolveImageUrl } from "../../utils/http.js";

export default {
  setup() {
    const user = ref(null);
    const posts = ref([]);
    const isFollowing = ref(false);
    const isSelf = ref(false);
    let userId = "";

    async function loadUser() {
      const res = await getUserById(userId);
      user.value = res.data;
    }

    async function loadPosts() {
      const res = await getPostList({ page: 1, size: 20, sort: "latest" });
      // 客户端过滤：只保留该用户发布的帖子
      posts.value = res.data.list.filter((p) => p.author.userId === userId);
    }

    /** 关注/取消关注，操作前检查登录状态 */
    async function toggleFollow() {
      const token = uni.getStorageSync("token");
      if (!token) {
        uni.navigateTo({ url: "/pages/login/login" });
        return;
      }
      if (isFollowing.value) {
        await unfollowUser(userId);
        isFollowing.value = false;
        user.value.followerCount--; // 乐观更新粉丝计数
      } else {
        await followUser(userId);
        isFollowing.value = true;
        user.value.followerCount++;
      }
    }

    function goDetail(postId) {
      uni.navigateTo({ url: `/pages/detail/detail?id=${postId}` });
    }

    function formatTime(iso) {
      const d = new Date(iso);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      userId = currentPage.options?.id ?? "";
      const myId = uni.getStorageSync("userId");
      isSelf.value = userId === myId;
      if (userId) {
        loadUser();
        loadPosts();
      }
    });

    return { user, posts, isFollowing, isSelf, toggleFollow, goDetail, formatTime, resolveImageUrl };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #FFF;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  color: #2D3436;
}

.bio {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.follow-btn {
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
}

.follow-btn text {
  color: #FFF;
  font-size: 26rpx;
}

.stats {
  display: flex;
  background: #FFF;
  padding: 24rpx 0;
  margin-bottom: 16rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  color: #2D3436;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.section {
  background: #FFF;
  padding: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
  color: #2D3436;
}

.post-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.post-title {
  font-size: 28rpx;
  color: #2D3436;
  display: block;
}

.post-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.empty {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
