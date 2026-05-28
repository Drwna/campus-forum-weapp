<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>举报管理</span>
        <el-button :icon="Refresh" @click="fetchData" />
      </div>
    </template>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="举报类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.targetType === 1 ? 'primary' : 'warning'" size="small">
            {{ targetTypeText(row.targetType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="被举报内容" min-width="300">
        <template #default="{ row }">
          <div class="content-cell">
            <div class="content-author" v-if="row.targetAuthor">
              <el-tag size="small" type="info">{{ row.targetAuthor }}</el-tag>
            </div>
            <div class="content-text" v-if="row.targetContent">
              {{ row.targetContent }}
            </div>
            <div class="content-empty" v-else>
              <el-text type="info">内容已删除</el-text>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="举报人" width="100">
        <template #default="{ row }">
          {{ row.reporterName }}
        </template>
      </el-table-column>
      <el-table-column label="举报原因" width="150">
        <template #default="{ row }">
          <el-tag size="small">{{ row.reasonText || reasonTypeText(row.reasonType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-space v-if="row.status === 0">
            <el-button type="success" size="small" @click="handleResolve(row.reportId)">解决</el-button>
            <el-button type="info" size="small" @click="handleReject(row.reportId)">驳回</el-button>
          </el-space>
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
 * 举报管理页面
 * 功能：查看用户举报、处理举报（解决/驳回）
 * 举报目标类型 targetType: 1=帖子, 2=评论
 * 处理状态 status: 0=待处理, 1=处理中, 2=已解决, 3=已驳回
 */
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getAdminReports, updateReportStatus } from "../api/post.js";

interface ReportItem {
  reportId: string;
  targetType: number;
  targetId: string;
  targetContent: string | null;
  targetAuthor: string | null;
  reporterName: string;
  reasonType: number;
  reasonText: string | null;
  status: number;
  createTime: string;
}

const list = ref<ReportItem[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);

function targetTypeText(t: number) {
  return ({ 1: "帖子", 2: "评论" } as Record<number, string>)[t] ?? "未知";
}

function reasonTypeText(t: number) {
  return ({ 1: "色情低俗", 2: "暴力血腥", 3: "广告营销", 4: "政治敏感", 5: "侮辱谩骂", 6: "其他" } as Record<number, string>)[t] ?? "未知";
}

function statusText(s: number) {
  return ({ 0: "待处理", 1: "处理中", 2: "已解决", 3: "已驳回" } as Record<number, string>)[s] ?? "未知";
}

function statusTag(s: number) {
  return ({ 0: "warning", 1: "primary", 2: "success", 3: "info" } as Record<number, string>)[s] ?? "info";
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getAdminReports({ page: page.value, size: 20 });
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

// 解决举报：标记为已处理（status=2），附带默认处理结果
async function handleResolve(id: string) {
  await updateReportStatus(id, 2, "已处理");
  ElMessage.success("已解决");
  fetchData();
}

// 驳回举报：举报不成立（status=3）
async function handleReject(id: string) {
  await updateReportStatus(id, 3, "举报不成立");
  ElMessage.success("已驳回");
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

.content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-author {
  font-size: 12px;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.content-empty {
  font-size: 12px;
  color: #999;
}
</style>
