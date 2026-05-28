<template>
  <view class="container">
    <view class="form">
      <!-- picker 组件：uni-app 内置选择器，@change 返回选中项的索引 -->
      <view class="form-item">
        <text class="label">分类</text>
        <picker :range="categoryNames" @change="onCategoryChange">
          <view class="picker-value">{{ selectedCategoryName || "请选择分类" }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">标题</text>
        <input v-model="title" class="input" placeholder="请输入标题" maxlength="100" />
      </view>

      <view class="form-item">
        <text class="label">内容</text>
        <textarea v-model="content" class="textarea" placeholder="请输入内容" maxlength="5000" />
      </view>

      <view class="form-item">
        <text class="label">图片 (最多9张)</text>
        <view class="image-grid">
          <view v-for="(img, idx) in images" :key="idx" class="img-item">
            <image :src="img" mode="aspectFill" class="preview-img" />
            <view class="remove-btn" @tap="removeImage(idx)">×</view>
          </view>
          <view v-if="images.length < 9" class="img-item add-btn" @tap="chooseImage">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" :loading="submitting" @tap="submit">发布</button>
    </view>
  </view>
</template>

<script>
/**
 * 发帖页面
 *
 * 发帖流程：
 * 1. 选择分类（只显示允许用户发帖的分类，通过 allowUserPost 字段过滤）
 * 2. 填写标题和内容
 * 3. 选择图片（最多 9 张，从相册或拍照）
 * 4. 提交时先上传所有图片到服务器，获取 URL 列表
 * 5. 再将帖子数据（含图片 URL）发送到后端创建帖子
 *
 * 后端会对帖子内容进行 DFA 敏感词过滤 + 微信内容安全检测
 * 审核通过后帖子才会在首页显示
 */
import { ref, onMounted } from "vue";
import { getCategories } from "../../api/category.js";
import { createPost } from "../../api/post.js";
import { uploadFile } from "../../api/file.js";

export default {
  setup() {
    const categories = ref([]);
    const categoryNames = ref([]); // picker 组件需要纯字符串数组
    const selectedCategory = ref("");
    const selectedCategoryName = ref("");
    const title = ref("");
    const content = ref("");
    const images = ref([]); // 本地临时文件路径列表
    const submitting = ref(false);

    /** 加载分类列表，过滤掉不允许用户发帖的分类 */
    async function loadCategories() {
      const res = await getCategories();
      const userCategories = res.data.filter((c) => c.allowUserPost !== 0);
      categories.value = userCategories;
      categoryNames.value = userCategories.map((c) => c.categoryName);
    }

    /** picker 选择器回调，通过索引获取对应的分类 ID */
    function onCategoryChange(e) {
      const idx = e.detail.value;
      selectedCategory.value = categories.value[idx].categoryId;
      selectedCategoryName.value = categories.value[idx].categoryName;
    }

    /** 选择图片，count 为还能选择的数量（最多 9 张） */
    function chooseImage() {
      uni.chooseImage({
        count: 9 - images.value.length,
        sizeType: ["compressed"], // 压缩图，减少上传流量
        sourceType: ["album", "camera"], // 支持相册和拍照
        success(res) {
          images.value = [...images.value, ...res.tempFilePaths];
        },
      });
    }

    function removeImage(idx) {
      images.value = images.value.filter((_, i) => i !== idx);
    }

    /**
     * 提交发帖
     * 先上传所有图片获取 URL，再创建帖子
     * 图片上传是串行的（逐张上传），避免并发过多导致超时
     */
    async function submit() {
      const token = uni.getStorageSync("token");
      if (!token) {
        uni.navigateTo({ url: "/pages/login/login" });
        return;
      }

      // 表单验证
      if (!selectedCategory.value) {
        uni.showToast({ title: "请选择分类", icon: "none" });
        return;
      }
      if (!title.value.trim()) {
        uni.showToast({ title: "请输入标题", icon: "none" });
        return;
      }
      if (!content.value.trim()) {
        uni.showToast({ title: "请输入内容", icon: "none" });
        return;
      }

      submitting.value = true;
      try {
        // 逐张上传图片，收集服务器返回的 URL
        const imageUrls = [];
        for (const img of images.value) {
          const result = await uploadFile(img);
          imageUrls.push(result.url);
        }

        // 创建帖子（后端会进行内容审核）
        await createPost({
          categoryId: selectedCategory.value,
          title: title.value,
          content: content.value,
          imageUrls,
        });

        uni.showToast({ title: "发布成功", icon: "success" });
        // 延迟返回，让用户看到成功提示
        setTimeout(() => uni.navigateBack(), 1500);
      } finally {
        submitting.value = false;
      }
    }

    onMounted(loadCategories);

    return {
      categories, categoryNames, selectedCategory, selectedCategoryName,
      title, content, images, submitting,
      onCategoryChange, chooseImage, removeImage, submit,
    };
  },
};
</script>

<style scoped>
.container {
  background: #FAFAFA;
  min-height: 100vh;
}

.form {
  background: #FFF;
  padding: 24rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 12rpx;
  color: #2D3436;
}

.input {
  height: 80rpx;
  border: 1rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #2D3436;
}

.textarea {
  height: 300rpx;
  border: 1rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  color: #2D3436;
}

.picker-value {
  height: 80rpx;
  line-height: 80rpx;
  border: 1rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #636E72;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.img-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.remove-btn {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #FFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.add-btn {
  border: 2rpx dashed #CCC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 60rpx;
  color: #CCC;
}

.submit-btn {
  margin-top: 40rpx;
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
</style>
