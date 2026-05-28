<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">CampusHub</h1>
      <p class="login-subtitle">管理后台</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">
        <el-form-item prop="account">
          <el-input v-model="form.account" placeholder="账号" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面
 * 仅支持管理员账号密码登录（非微信登录）
 * 表单校验：账号必填，密码至少6位
 * 登录成功后由 authStore 跳转到首页
 */
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useAuthStore } from "../stores/auth.js";

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  account: "",
  password: "",
});

// Element Plus 表单校验规则
const rules: FormRules = {
  account: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
};

async function handleLogin() {
  // validate() 返回 Promise，校验失败时 reject，catch 转为 false
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await authStore.login(form.account, form.password);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.login-subtitle {
  text-align: center;
  color: #999;
  margin: 0 0 32px;
}
</style>
