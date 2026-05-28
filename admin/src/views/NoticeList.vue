<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>公告管理</span>
        <el-space>
          <el-button :icon="Refresh" @click="fetchData" />
          <el-button type="primary" @click="handleAdd">发布公告</el-button>
        </el-space>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.noticeId)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="100" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
/**
 * 公告管理页面
 * 功能：发布/编辑/删除系统公告
 * 公告状态：0=草稿, 1=已发布, 2=已归档
 * 支持置顶功能，置顶公告在用户端会优先展示
 */
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getAdminNotices, createNotice, updateNotice, deleteNotice } from "../api/notice.js";

interface NoticeItem {
  noticeId: string;
  title: string;
  content: string;
  status: number;
  isTop: boolean;
  createTime: string;
}

const list = ref<NoticeItem[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const editingId = ref(""); // 非空时表示编辑模式
const page = ref(1);

const form = reactive({ title: "", content: "", isTop: false });

function statusText(s: number) {
  return ({ 0: "草稿", 1: "已发布", 2: "已归档" } as Record<number, string>)[s] ?? "未知";
}

function statusTag(s: number) {
  return ({ 0: "info", 1: "success", 2: "warning" } as Record<number, string>)[s] ?? "info";
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getAdminNotices({ page: page.value, size: 20 });
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

// 新增模式：清空表单
function handleAdd() {
  editingId.value = "";
  form.title = "";
  form.content = "";
  form.isTop = false;
  dialogVisible.value = true;
}

// 编辑模式：用现有数据填充表单
function handleEdit(row: NoticeItem) {
  editingId.value = row.noticeId;
  form.title = row.title;
  form.content = row.content;
  form.isTop = row.isTop;
  dialogVisible.value = true;
}

// 提交：根据 editingId 判断新增/编辑
async function handleSubmit() {
  if (!form.title.trim() || !form.content.trim()) {
    ElMessage.warning("标题和内容不能为空");
    return;
  }
  submitting.value = true;
  try {
    if (editingId.value) {
      await updateNotice(editingId.value, { title: form.title, content: form.content, isTop: form.isTop });
    } else {
      await createNotice({ title: form.title, content: form.content, isTop: form.isTop });
    }
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm("确定删除该公告吗？", "提示", { type: "warning" });
  await deleteNotice(id);
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
