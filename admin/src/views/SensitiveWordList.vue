<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>敏感词管理</span>
        <div>
          <el-input v-model="keyword" placeholder="搜索敏感词" style="width: 200px; margin-right: 10px" @keyup.enter="fetchData" />
          <el-button type="primary" @click="showAdd">添加敏感词</el-button>
          <el-button :icon="Refresh" @click="fetchData" />
        </div>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="word" label="敏感词" min-width="200" />
      <el-table-column label="级别" width="100">
        <template #default="{ row }">
          <el-tag :type="row.level === 1 ? 'danger' : 'warning'" size="small">
            {{ row.level === 1 ? '高' : '中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'" size="small">
            {{ row.status === 0 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row.wordId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :total="total"
      :page-size="50"
      layout="total, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="fetchData"
    />

    <!-- 添加敏感词对话框 -->
    <el-dialog v-model="dialogVisible" title="添加敏感词" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="敏感词" required>
          <el-input v-model="form.word" placeholder="请输入敏感词" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="form.level" style="width: 100%">
            <el-option :value="1" label="高（直接拒绝）" />
            <el-option :value="2" label="中（需要审核）" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="可选，如：色情、暴力、广告" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="adding">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
/**
 * 敏感词管理页面
 * 功能：查看、添加、删除敏感词
 * 敏感词用于评论内容过滤（可通过系统配置页面开关控制是否启用）
 */
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import http from "../api/http.js";

interface SensitiveWord {
  wordId: string;
  word: string;
  level: number;
  category: string | null;
  status: number;
  createTime: string;
}

const list = ref<SensitiveWord[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const keyword = ref("");

const dialogVisible = ref(false);
const adding = ref(false);
const form = ref({
  word: "",
  level: 1,
  category: "",
});

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { page: page.value, size: 50 };
    if (keyword.value) params.keyword = keyword.value;
    const { data } = await http.get("/admin/sensitive-words", { params });
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

function showAdd() {
  form.value = { word: "", level: 1, category: "" };
  dialogVisible.value = true;
}

async function handleAdd() {
  if (!form.value.word.trim()) {
    ElMessage.warning("请输入敏感词");
    return;
  }
  adding.value = true;
  try {
    await http.post("/admin/sensitive-words", form.value);
    ElMessage.success("添加成功");
    dialogVisible.value = false;
    fetchData();
  } finally {
    adding.value = false;
  }
}

async function handleDelete(wordId: string) {
  await ElMessageBox.confirm("确定删除该敏感词？", "确认", { type: "warning" });
  await http.delete(`/admin/sensitive-words/${wordId}`);
  ElMessage.success("删除成功");
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
