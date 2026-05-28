<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-space>
          <el-select v-model="query.status" placeholder="审核状态" clearable style="width: 140px" @change="fetchData">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button :icon="Refresh" @click="fetchData" />
        </el-space>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="用户" width="150">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-avatar :src="row.user.avatar" :size="32" />
            <span>{{ row.user.nickname }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="变更内容" min-width="300">
        <template #default="{ row }">
          <el-space wrap>
            <el-tag v-if="row.nickname" type="info" size="small">昵称: {{ row.nickname }}</el-tag>
            <el-tag v-if="row.avatar" type="info" size="small">头像: 已上传</el-tag>
            <el-tag v-if="row.bio" type="info" size="small">介绍: {{ row.bio.slice(0, 20) }}{{ row.bio.length > 20 ? '...' : '' }}</el-tag>
            <el-tag v-if="row.gender !== null" type="info" size="small">性别: {{ genderText(row.gender) }}</el-tag>
            <el-tag v-if="row.age !== null" type="info" size="small">年龄: {{ row.age }}</el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核人" width="120">
        <template #default="{ row }">
          {{ row.handler?.nickname ?? "-" }}
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.rejectReason ?? "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-space v-if="row.status === 0">
            <el-button type="success" size="small" @click="handleApprove(row.reviewId)">通过</el-button>
            <el-button type="warning" size="small" @click="openRejectDialog(row.reviewId)">驳回</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.size"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="fetchData"
      @size-change="fetchData"
    />

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回资料变更" width="400px">
      <el-form label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
/**
 * 资料审核页面
 * 业务逻辑：用户在小程序端修改个人资料（昵称/头像/简介/性别/年龄）后，
 * 变更不会立即生效，而是创建一条审核记录。管理员在此页面审核通过或驳回。
 * 通过后变更写入用户表，驳回后用户可重新提交。
 */
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getProfileReviews, approveProfileReview, rejectProfileReview } from "../api/profile.js";

interface ReviewItem {
  reviewId: string;
  userId: string;
  user: { userId: string; nickname: string; avatar: string | null };
  nickname: string | null;
  avatar: string | null;
  gender: number | null;
  age: number | null;
  status: number;
  rejectReason: string | null;
  handler: { userId: string; nickname: string } | null;
  handleTime: string | null;
  createTime: string;
}

const list = ref<ReviewItem[]>([]);
const total = ref(0);
const loading = ref(false);
const rejectDialogVisible = ref(false);
const rejectLoading = ref(false);
const rejectTargetId = ref("");
const rejectReason = ref("");

// 默认筛选待审核状态（status=0），方便管理员直接处理待办
const query = reactive({ page: 1, size: 20, status: 0 as number | undefined });

function statusText(s: number) {
  return ({ 0: "待审核", 1: "已通过", 2: "已驳回" } as Record<number, string>)[s] ?? "未知";
}

function statusTag(s: number) {
  return ({ 0: "warning", 1: "success", 2: "danger" } as Record<number, string>)[s] ?? "info";
}

function genderText(g: number) {
  return ({ 0: "未知", 1: "男", 2: "女" } as Record<number, string>)[g] ?? "未知";
}

async function fetchData() {
  loading.value = true;
  try {
    // 手动构建 params，避免将 undefined 的 status 传给后端
    const params: { page: number; size: number; status?: number } = { page: query.page, size: query.size };
    if (query.status !== undefined) params.status = query.status;
    const { data } = await getProfileReviews(params);
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

async function handleApprove(id: string) {
  await approveProfileReview(id);
  ElMessage.success("已通过");
  fetchData();
}

function openRejectDialog(id: string) {
  rejectTargetId.value = id;
  rejectReason.value = "";
  rejectDialogVisible.value = true;
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning("请输入驳回原因");
    return;
  }
  rejectLoading.value = true;
  try {
    await rejectProfileReview(rejectTargetId.value, rejectReason.value);
    ElMessage.success("已驳回");
    rejectDialogVisible.value = false;
    fetchData();
  } finally {
    rejectLoading.value = false;
  }
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
