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
          <el-input v-model="query.keyword" placeholder="搜索标题" clearable style="width: 200px" @keyup.enter="fetchData" />
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button :icon="Refresh" @click="fetchData" />
        </el-space>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="author.nickname" label="作者" width="120" />
      <el-table-column prop="category.categoryName" label="分类" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button v-if="row.status === 0" type="success" size="small" @click="handleApprove(row.postId)">通过</el-button>
            <el-button v-if="row.status === 0" type="warning" size="small" @click="openRejectDialog(row.postId)">驳回</el-button>
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status !== 3" type="danger" size="small" @click="handleDelete(row.postId)">删除</el-button>
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

    <!-- 帖子详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="帖子详情" width="600px">
      <div v-if="currentPost">
        <h3>{{ currentPost.title }}</h3>
        <p class="post-meta">作者：{{ currentPost.author.nickname }} | 分类：{{ currentPost.category.categoryName }}</p>
        <div class="post-content">{{ currentPost.content }}</div>
      </div>
    </el-dialog>

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回帖子" width="500px">
      <el-form label-width="80px">
        <el-form-item label="驳回原因">
          <el-radio-group v-model="rejectForm.selected" style="display: flex; flex-direction: column; gap: 8px;">
            <el-radio
              v-for="reason in presetReasons"
              :key="reason"
              :value="reason"
            >
              {{ reason }}
            </el-radio>
            <el-radio value="custom">自定义原因</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="rejectForm.selected === 'custom'" label="自定义">
          <el-input
            v-model="rejectForm.customReason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
            maxlength="200"
            show-word-limit
          />
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
 * 帖子审核页面
 * 核心功能：查看/搜索帖子、审核通过/驳回、查看帖子详情、删除帖子
 * 支持从 Dashboard 的"待审核帖子"卡片带 status=0 参数跳转，自动筛选待审核状态
 * 驳回时提供预设原因 + 自定义原因两种模式，提升审核效率
 */
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getAdminPosts, updatePostStatus, deleteAdminPost } from "../api/post.js";
import { formatTime } from "../utils/format.js";

const route = useRoute();

interface PostItem {
  postId: string;
  title: string;
  content: string;
  author: { nickname: string };
  category: { categoryName: string };
  status: number;
  createTime: string;
}

// 预设驳回原因列表，管理员可快速选择，也可自定义输入
const presetReasons = [
  "内容包含敏感或违规信息",
  "标题或内容不符合社区规范",
  "包含广告或垃圾信息",
  "内容重复发布",
  "与本分类主题不符",
  "包含不实或误导性信息",
];

const list = ref<PostItem[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const currentPost = ref<PostItem | null>(null);

// 驳回弹窗相关状态
const rejectDialogVisible = ref(false);
const rejectLoading = ref(false);
const rejectTargetId = ref("");
const rejectForm = reactive({
  selected: "内容包含敏感或违规信息",
  customReason: "",
});

// 查询参数，从 URL query 中读取初始 status 值（支持从 Dashboard 跳转带参）
const query = reactive({
  page: 1,
  size: 20,
  status: route.query.status !== undefined ? Number(route.query.status) : (undefined as number | undefined),
  keyword: "",
});

// 帖子状态码映射：0=待审核, 1=已通过, 2=已驳回, 3=已删除
function statusText(s: number) {
  return ({ 0: "待审核", 1: "已通过", 2: "已驳回", 3: "已删除" } as Record<number, string>)[s] ?? "未知";
}

function statusTag(s: number) {
  return ({ 0: "warning", 1: "success", 2: "danger", 3: "info" } as Record<number, string>)[s] ?? "info";
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getAdminPosts(query);
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

async function handleApprove(id: string) {
  await updatePostStatus(id, 1);
  ElMessage.success("已通过");
  fetchData();
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm("确定要删除该帖子吗？删除后不可恢复。", "删除确认", {
    type: "error",
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
  });
  await deleteAdminPost(id);
  ElMessage.success("已删除");
  fetchData();
}

function openRejectDialog(id: string) {
  rejectTargetId.value = id;
  rejectForm.selected = "内容包含敏感或违规信息";
  rejectForm.customReason = "";
  rejectDialogVisible.value = true;
}

// 确认驳回：如果选择了"自定义原因"则使用自定义输入，否则使用预设原因
async function confirmReject() {
  const reason = rejectForm.selected === "custom" ? rejectForm.customReason.trim() : rejectForm.selected;
  if (!reason) {
    ElMessage.warning("请选择或输入驳回原因");
    return;
  }

  rejectLoading.value = true;
  try {
    await updatePostStatus(rejectTargetId.value, 2, reason);
    ElMessage.success("已驳回");
    rejectDialogVisible.value = false;
    fetchData();
  } finally {
    rejectLoading.value = false;
  }
}

function handleView(row: PostItem) {
  currentPost.value = row;
  dialogVisible.value = true;
}

onMounted(fetchData);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
}
.post-meta {
  color: #999;
  font-size: 13px;
}
.post-content {
  margin-top: 16px;
  white-space: pre-wrap;
  line-height: 1.8;
}
</style>
