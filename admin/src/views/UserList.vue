<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-space>
          <el-input v-model="query.keyword" placeholder="搜索昵称" clearable style="width: 200px" @keyup.enter="fetchData" />
          <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px" @change="fetchData">
            <el-option label="正常" :value="0" />
            <el-option label="已禁用" :value="1" />
          </el-select>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button :icon="Refresh" @click="fetchData" />
        </el-space>
      </div>
    </template>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="nickname" label="昵称" min-width="150" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 2 ? 'danger' : row.role === 1 ? 'warning' : 'info'">
            {{ roleText(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'">
            {{ row.status === 0 ? "正常" : "已禁用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="postCount" label="帖子数" width="80" />
      <el-table-column prop="commentCount" label="评论数" width="80" />
      <el-table-column label="注册时间" width="140">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="最后登录" width="140">
        <template #default="{ row }">
          {{ formatTime(row.lastLoginAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            :type="row.status === 0 ? 'danger' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 0 ? "禁用" : "解封" }}
          </el-button>
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
  </el-card>
</template>

<script setup lang="ts">
/**
 * 用户管理页面
 * 功能：查看用户列表、按昵称/状态搜索、禁用/解封用户
 * 角色枚举：0=学生, 1=审核员, 2=管理员
 * 注意：禁用操作会同时使该用户的 JWT Token 失效（后端加入 Redis 黑名单）
 */
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getAdminUsers, updateUserStatus } from "../api/user.js";
import { formatTime } from "../utils/format.js";

interface UserItem {
  userId: string;
  nickname: string;
  role: number;
  status: number;
  postCount: number;
  commentCount: number;
  createTime: string;
  lastLoginAt: string | null;
}

const list = ref<UserItem[]>([]);
const total = ref(0);
const loading = ref(false);

const query = reactive({ page: 1, size: 20, keyword: "", status: undefined as number | undefined });

function roleText(r: number) {
  return ({ 0: "学生", 1: "审核员", 2: "管理员" } as Record<number, string>)[r] ?? "未知";
}

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getAdminUsers(query);
    list.value = data.data.list;
    total.value = data.data.total;
  } finally {
    loading.value = false;
  }
}

// 切换用户状态（正常 ⇄ 禁用），操作前需二次确认
async function handleToggleStatus(row: UserItem) {
  const newStatus = row.status === 0 ? 1 : 0;
  const action = newStatus === 1 ? "禁用" : "解封";
  await ElMessageBox.confirm(`确定要${action}用户 "${row.nickname}" 吗？`, "提示", { type: "warning" });
  await updateUserStatus(row.userId, newStatus);
  ElMessage.success(`已${action}`);
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
}
</style>
