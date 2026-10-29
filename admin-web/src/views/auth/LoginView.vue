<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { adminLogin } from '../../api/admin'
import { useAdminStore } from '../../stores/admin'

const router = useRouter()
const route = useRoute()
const adminStore = useAdminStore()

const loginFormRef = ref(null)
const isSubmitting = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123456'
})

const rules = {
  username: [
    {
      required: true,
      message: '请输入管理员账号。',
      trigger: 'blur'
    }
  ],
  password: [
    {
      required: true,
      message: '请输入管理员密码。',
      trigger: 'blur'
    }
  ]
}

async function handleLogin() {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate()

  isSubmitting.value = true

  try {
    const result = await adminLogin(form)

    if (result.code !== 0) {
      throw new Error(result.message || '登录失败。')
    }

    adminStore.setLogin(
      result.data.token,
      result.data.admin
    )

    ElMessage.success('登录成功，欢迎回来。')

    router.replace(
      route.query.redirect || '/dashboard'
    )
  } catch (error) {
    ElMessage.error(
      error?.response?.data?.message ||
      error?.message ||
      '登录失败，请检查账号和密码。'
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <div class="background-orbit orbit-one"></div>
    <div class="background-orbit orbit-two"></div>

    <section class="login-card">
      <div class="login-brand">
        <div class="brand-mark">
          <span class="wave wave-one"></span>
          <span class="wave wave-two"></span>
        </div>

        <div>
          <h1>赤水回声</h1>
          <p>CHISHUI ECHOES ADMIN</p>
        </div>
      </div>

      <div class="login-title">
        <p>CONTENT MANAGEMENT</p>
        <h2>数字声音地图管理后台</h2>
        <span>
          管理点位、声音、问答、服务设施与调研反馈数据。
        </span>
      </div>

      <el-form
        ref="loginFormRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="管理员账号"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="管理员密码"
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-button"
          :loading="isSubmitting"
          @click="handleLogin"
        >
          {{ isSubmitting ? '正在登录…' : '进入管理后台' }}
        </el-button>
      </el-form>

      <p class="login-note">
        请妥善保管后台账号，不向无关人员泄露管理权限。
      </p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;

  display: grid;
  min-height: 100vh;
  overflow: hidden;
  place-items: center;

  background:
    radial-gradient(
      circle at 76% 18%,
      rgba(244, 229, 187, 0.46),
      transparent 25%
    ),
    radial-gradient(
      circle at 15% 82%,
      rgba(148, 182, 165, 0.28),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #f5f4ec,
      #e9efe7 52%,
      #d7e3d8
    );
}

.background-orbit {
  position: absolute;
  border: 1px solid rgba(93, 136, 136, 0.18);
  border-radius: 50%;
}

.orbit-one {
  width: 620px;
  height: 620px;
  top: -260px;
  right: -180px;
}

.orbit-two {
  width: 740px;
  height: 440px;
  bottom: -260px;
  left: -170px;
  transform: rotate(-28deg);
}

.login-card {
  position: relative;
  z-index: 2;

  width: 420px;
  padding: 38px;

  background: rgba(250, 249, 240, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  box-shadow: 0 24px 70px rgba(58, 78, 66, 0.14);
  backdrop-filter: blur(18px);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  position: relative;

  width: 38px;
  height: 38px;
  overflow: hidden;

  border: 1px solid rgba(78, 102, 89, 0.48);
  border-radius: 50%;
}

.wave {
  position: absolute;
  left: 6px;

  width: 24px;
  height: 9px;

  border-top: 1.5px solid #9d4c47;
  border-radius: 50%;
  transform: rotate(-7deg);
}

.wave-one {
  bottom: 7px;
}

.wave-two {
  bottom: 13px;
  left: 10px;

  width: 17px;

  border-color: #5d8888;
  opacity: 0.58;
}

.login-brand h1 {
  margin: 0;

  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.login-brand p {
  margin: 4px 0 0;

  color: rgba(74, 92, 81, 0.55);
  font-family: "Cormorant Garamond", serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.login-title {
  margin-top: 36px;
}

.login-title p {
  margin: 0;

  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.login-title h2 {
  margin: 10px 0 8px;

  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 25px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.login-title span {
  color: rgba(79, 96, 85, 0.62);
  font-size: 12px;
  line-height: 1.8;
}

.login-form {
  margin-top: 28px;
}

.login-button {
  width: 100%;
  margin-top: 8px;

  --el-color-primary: #9d4c47;
  --el-color-primary-light-3: #ba756f;
  --el-color-primary-dark-2: #7f423f;
}

.login-note {
  margin: 20px 0 0;

  color: rgba(91, 106, 96, 0.48);
  font-size: 10px;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 560px) {
  .login-card {
    width: calc(100% - 36px);
    padding: 28px 23px;
  }
}
</style>