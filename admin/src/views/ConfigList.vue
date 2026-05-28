<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>系统配置</span>
        <el-button :icon="Refresh" @click="fetchData" />
      </div>
    </template>

    <el-table :data="configs" v-loading="loading" stripe>
      <el-table-column prop="configKey" label="配置项" width="250" />
      <el-table-column prop="description" label="说明" min-width="250" show-overflow-tooltip />
      <el-table-column label="当前值" width="200">
        <template #default="{ row }">
          <!-- 布尔类型显示开关 -->
          <el-switch
            v-if="row.valueType === 'boolean'"
            :model-value="row.configValue === 'true'"
            @change="(val: boolean) => handleToggle(row.configKey, val)"
          />
          <!-- 其他类型显示输入框 -->
          <el-input
            v-else
            v-model="row.configValue"
            size="small"
            @blur="handleUpdate(row.configKey, row.configValue)"
          />
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ row.valueType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="公开" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isPublic ? 'success' : 'info'" size="small">
            {{ row.isPublic ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
/**
 * 系统配置管理页面
 * 功能：查看和修改系统配置项
 * - 布尔类型配置显示为开关
 * - 其他类型配置显示为输入框
 */
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { getConfigs, updateConfig, type ConfigItem } from "../api/config.js";

const configs = ref<ConfigItem[]>([]);
const loading = ref(false);

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await getConfigs();
    configs.value = data.data;
  } finally {
    loading.value = false;
  }
}

async function handleToggle(key: string, value: boolean) {
  const strValue = value ? "true" : "false";
  await updateConfig(key, strValue);
  ElMessage.success("配置已更新");
  fetchData();
}

async function handleUpdate(key: string, value: string) {
  await updateConfig(key, value);
  ElMessage.success("配置已更新");
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
