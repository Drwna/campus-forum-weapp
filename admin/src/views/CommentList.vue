<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>评论管理</span>
        <el-button :icon="Refresh" @click="fetchData" />
      </div>
    </template>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="author.nickname" label="作者" width="120" />
      <el-table-column prop="postId" label="帖子ID" width="120" />
      <el-table-column prop="createTime" label="时间" width="180" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row.commentId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :total="total"
      :page-size="20"
      layout="total, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="fetchData"
    />
  </el-card>
</template>

<script setup lang="ts">
/**
 * 评论管理页面
 * 功能：查看所有评论、按页浏览、删除违规评论
 * API 来源：复用 post.ts 中的 getAdminComments / deleteAdminComment
 */
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getAdminComments, deleteAdminComment } from "../api/post.js";

interface CommentItem {
  commentId: string;
  content: string;
  author: { nickname: string };
  postId: string;
  createTime: string;
}

const list = ref<CommentItem[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getAdminComments({ page: page.value, size: 20 });
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

// 删除评论前需二次确认
async function handleDelete(id: string) {
  await ElMessageBox.confirm("确定删除该评论吗？", "提示", { type: "warning" });
  await deleteAdminComment(id);
  ElMessage.success("已删除");
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
