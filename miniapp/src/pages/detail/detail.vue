<template>
  <view class="container">
    <view v-if="post" class="detail">
      <!-- 作者 -->
      <view class="author-bar" @tap="goUser(post.author.userId)">
        <image class="avatar" :src="resolveImageUrl(post.author.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="author-info">
          <text class="nickname">{{ post.author.nickname }}</text>
          <text class="time">{{ formatTime(post.createTime) }}</text>
        </view>
        <view class="category-tag">{{ post.category.categoryName }}</view>
        <view class="report-btn" @tap.stop="reportPost">
          <text class="report-icon">⚠️</text>
        </view>
      </view>

      <!-- 内容 -->
      <view class="content-section">
        <text class="title">{{ post.title }}</text>
        <text class="content">{{ post.content }}</text>
        <view v-if="post.imageUrls.length" class="images">
          <image
            v-for="(img, idx) in post.imageUrls"
            :key="idx"
            :src="resolveImageUrl(img)"
            mode="widthFix"
            class="content-img"
            @tap="previewImage(idx)"
          />
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="actions">
        <view class="action-item" @tap="toggleLike">
          <text :class="['action-icon', { active: liked }]">♥</text>
          <text class="action-text">{{ likeCount }}</text>
        </view>
        <view class="action-item">
          <text class="action-icon">💬</text>
          <text class="action-text">{{ post.commentCount }}</text>
        </view>
      </view>

      <!-- 评论 -->
      <view class="comment-section">
        <text class="section-title">评论 ({{ comments.length }})</text>
        <view v-for="c in comments" :key="c.commentId" class="comment-item">
          <image class="comment-avatar" :src="resolveImageUrl(c.author.avatar) || '/static/default-avatar.png'" mode="aspectFill" />
          <view class="comment-body">
            <text class="comment-name">{{ c.author.nickname }}</text>
            <text class="comment-content">{{ c.content }}</text>
            <view class="comment-footer">
              <text class="comment-time">{{ formatTime(c.createTime) }}</text>
              <text class="comment-report" @tap="reportComment(c.commentId)">举报</text>
            </view>
          </view>
        </view>
        <view v-if="!comments.length" class="empty">
          <text>暂无评论</text>
        </view>
      </view>
    </view>

      <!-- 底部固定评论输入框：position: fixed 始终在屏幕底部 -->
      <!-- confirm-type="send" 在键盘上显示"发送"按钮 -->
      <view class="comment-input-bar">
      <input
        v-model="commentText"
        class="comment-input"
        placeholder="写评论..."
        :confirm-type="'send'"
        @confirm="submitComment"
      />
      <view class="send-btn" @tap="submitComment">
        <text>发送</text>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 帖子详情页
 *
 * 核心功能：
 * 1. 展示帖子完整内容（标题、正文、图片）
 * 2. 点赞/取消点赞（乐观更新 UI）
 * 3. 评论列表（一次性加载最多 50 条）
 * 4. 底部固定评论输入框
 * 5. 图片预览（点击图片调用 uni.previewImage）
 *
 * 页面参数：通过 URL query 传递 ?id=xxx（即帖子 ID）
 * 使用 getCurrentPages() 获取页面参数，这是 uni-app 的标准做法
 */
import { ref, onMounted } from "vue";
import { getPostDetail } from "../../api/post.js";
import { getComments, createComment } from "../../api/comment.js";
import { likePost, unlikePost } from "../../api/interaction.js";
import { createReport } from "../../api/report.js";
import { resolveImageUrl } from "../../utils/http.js";

export default {
  setup() {
    const post = ref(null);
    const comments = ref([]);
    const liked = ref(false);
    const likeCount = ref(0);
    const commentText = ref("");
    let postId = "";

    async function loadPost() {
      const res = await getPostDetail(postId);
      post.value = res.data;
      likeCount.value = res.data.likeCount;
    }

    async function loadComments() {
      const res = await getComments(postId, { page: 1, size: 50 });
      comments.value = res.data.list;
    }

    /**
     * 点赞/取消点赞
     * 后端使用 Redis INCR/DECR 实时更新计数，返回最新的 isLiked 和 likeCount
     * 前端直接用返回值更新 UI（乐观更新），无需重新请求帖子详情
     */
    async function toggleLike() {
      if (liked.value) {
        const res = await unlikePost(postId);
        liked.value = res.data.isLiked;
        likeCount.value = res.data.likeCount;
      } else {
        const res = await likePost(postId);
        liked.value = res.data.isLiked;
        likeCount.value = res.data.likeCount;
      }
    }

    /** 提交评论，提交前检查登录状态 */
    async function submitComment() {
      if (!commentText.value.trim()) return;
      const token = uni.getStorageSync("token");
      if (!token) {
        uni.navigateTo({ url: "/pages/login/login" });
        return;
      }
      await createComment(postId, { content: commentText.value });
      commentText.value = "";
      uni.showToast({ title: "评论成功", icon: "success" });
      loadComments(); // 重新加载评论列表
      post.value.commentCount++; // 本地更新评论计数
    }

    function goUser(userId) {
      uni.navigateTo({ url: `/pages/user/user?id=${userId}` });
    }

    /** 调用系统图片预览，支持左右滑动查看所有帖子图片 */
    function previewImage(idx) {
      const urls = post.value.imageUrls.map((url) => resolveImageUrl(url));
      uni.previewImage({ urls, current: idx });
    }

    /** 举报帖子 */
    function reportPost() {
      const token = uni.getStorageSync("token");
      if (!token) {
        uni.navigateTo({ url: "/pages/login/login" });
        return;
      }

      uni.showActionSheet({
        itemList: ["色情低俗", "暴力血腥", "广告营销", "政治敏感", "侮辱谩骂", "其他"],
        success: async (res) => {
          const reasonTypes = [1, 2, 3, 4, 5, 6];
          const reasonType = reasonTypes[res.tapIndex];
          const reasonTexts = ["色情低俗", "暴力血腥", "广告营销", "政治敏感", "侮辱谩骂", "其他"];

          try {
            await createReport(1, postId, reasonType, reasonTexts[res.tapIndex]);
            uni.showToast({ title: "举报成功", icon: "success" });
          } catch (err) {
            uni.showToast({ title: err.message || "举报失败", icon: "none" });
          }
        },
      });
    }

    /** 举报评论 */
    function reportComment(commentId) {
      const token = uni.getStorageSync("token");
      if (!token) {
        uni.navigateTo({ url: "/pages/login/login" });
        return;
      }

      uni.showActionSheet({
        itemList: ["色情低俗", "暴力血腥", "广告营销", "政治敏感", "侮辱谩骂", "其他"],
        success: async (res) => {
          const reasonTypes = [1, 2, 3, 4, 5, 6];
          const reasonType = reasonTypes[res.tapIndex];
          const reasonTexts = ["色情低俗", "暴力血腥", "广告营销", "政治敏感", "侮辱谩骂", "其他"];

          try {
            await createReport(2, commentId, reasonType, reasonTexts[res.tapIndex]);
            uni.showToast({ title: "举报成功", icon: "success" });
          } catch (err) {
            uni.showToast({ title: err.message || "举报失败", icon: "none" });
          }
        },
      });
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
      // 获取页面参数（URL query），getCurrentPages() 是 uni-app 全局 API
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      postId = currentPage.options?.id ?? "";
      if (postId) {
        loadPost();
        loadComments();
      }
    });

    return {
      post, comments, liked, likeCount, commentText,
      toggleLike, submitComment, goUser, previewImage, reportPost, reportComment, formatTime, resolveImageUrl,
    };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.detail {
  background: #FFF;
  padding: 24rpx;
}

.author-bar {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.author-info {
  flex: 1;
}

.nickname {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
  color: #2D3436;
}

.time {
  font-size: 22rpx;
  color: #999;
}

.category-tag {
  font-size: 22rpx;
  color: #FF6B6B;
  background: #FFF0F0;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.report-btn {
  margin-left: 16rpx;
  padding: 8rpx;
}

.report-icon {
  font-size: 28rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 16rpx;
  color: #2D3436;
  word-break: break-all;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
}

.content {
  font-size: 30rpx;
  line-height: 1.8;
  color: #2D3436;
  display: block;
  margin-bottom: 24rpx;
}

.images {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.content-img {
  width: 100%;
  border-radius: 12rpx;
}

.actions {
  display: flex;
  gap: 48rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #F0F0F0;
  border-bottom: 1rpx solid #F0F0F0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon {
  font-size: 36rpx;
  color: #999;
}

.action-icon.active {
  color: #FF6B6B;
}

.action-text {
  font-size: 26rpx;
  color: #636E72;
}

.comment-section {
  padding-top: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
  color: #2D3436;
}

.comment-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.comment-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.comment-body {
  flex: 1;
}

.comment-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #2D3436;
  display: block;
}

.comment-content {
  font-size: 28rpx;
  color: #2D3436;
  display: block;
  margin: 4rpx 0;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 8rpx;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-report {
  font-size: 22rpx;
  color: #999;
}

.comment-report:active {
  color: #FF6B6B;
}

.empty {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 26rpx;
}

.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #FFF;
  border-top: 1rpx solid #F0F0F0;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #2D3436;
}

.send-btn {
  margin-left: 16rpx;
  padding: 0 24rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  border-radius: 36rpx;
}

.send-btn text {
  color: #FFF;
  font-size: 28rpx;
}
</style>
