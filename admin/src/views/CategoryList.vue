<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>分类管理</span>
        <el-space>
          <el-button :icon="Refresh" @click="fetchData" />
          <el-button type="primary" @click="handleAdd">新增分类</el-button>
        </el-space>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="categoryName" label="分类名称" width="200" />
      <el-table-column prop="categoryDesc" label="描述" min-width="200" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="用户可发帖" width="110">
        <template #default="{ row }">
          <el-tag :type="row.allowUserPost === 1 ? 'success' : 'danger'">
            {{ row.allowUserPost === 1 ? "允许" : "仅管理员" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? "启用" : "隐藏" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.categoryName" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.categoryDesc" type="textarea" maxlength="200" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="允许用户发帖">
          <el-switch v-model="form.allowUserPost" :active-value="1" :inactive-value="0" />
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
 * 分类管理页面
 * 功能：新增/编辑/删除帖子分类
 * 关键字段说明：
 *   - sortOrder: 排序权重，数值越小越靠前
 *   - allowUserPost: 控制普通用户是否能在该分类下发帖（1=允许, 0=仅管理员）
 *   - status: 分类状态（0=启用, 1=隐藏），隐藏后用户端不可见
 */
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/category.js";

interface CategoryItem {
  categoryId: string;
  categoryName: string;
  categoryDesc: string | null;
  sortOrder: number;
  status: number;
  allowUserPost: number;
}

const list = ref<CategoryItem[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const editingId = ref(""); // 非空时表示编辑模式

const form = reactive({
  categoryName: "",
  categoryDesc: "",
  sortOrder: 0,
  allowUserPost: 1 as number,
});

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getCategories();
    list.value = data.data;
  } finally {
    loading.value = false;
  }
}

// 新增模式：清空表单，editingId 置空
function handleAdd() {
  editingId.value = "";
  form.categoryName = "";
  form.categoryDesc = "";
  form.sortOrder = 0;
  form.allowUserPost = 1;
  dialogVisible.value = true;
}

// 编辑模式：用现有数据填充表单
function handleEdit(row: CategoryItem) {
  editingId.value = row.categoryId;
  form.categoryName = row.categoryName;
  form.categoryDesc = row.categoryDesc ?? "";
  form.sortOrder = row.sortOrder;
  form.allowUserPost = row.allowUserPost;
  dialogVisible.value = true;
}

// 提交：根据 editingId 是否为空判断新增/编辑
async function handleSubmit() {
  if (!form.categoryName.trim()) {
    ElMessage.warning("分类名称不能为空");
    return;
  }
  submitting.value = true;
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, {
        categoryName: form.categoryName,
        categoryDesc: form.categoryDesc,
        sortOrder: form.sortOrder,
        allowUserPost: form.allowUserPost,
      });
    } else {
      await createCategory({
        categoryName: form.categoryName,
        categoryDesc: form.categoryDesc,
        sortOrder: form.sortOrder,
        allowUserPost: form.allowUserPost,
      });
    }
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: CategoryItem) {
  await ElMessageBox.confirm(`确定删除分类 "${row.categoryName}" 吗？`, "提示", { type: "warning" });
  await deleteCategory(row.categoryId);
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
