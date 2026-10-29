<script setup>
import { useRouter } from 'vue-router'
import {
  ChatDotRound,
  DataAnalysis,
  Headset,
  Location,
  MapLocation,
  QuestionFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

import { useAdminStore } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

async function handleLogout() {
  try {
    await ElMessageBox.confirm(
      '确定要退出管理后台吗？',
      '退出确认',
      {
        confirmButtonText: '退出登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    adminStore.logout()

    router.replace('/login')
  } catch (error) {
    /*
      用户取消时无需处理。
    */
  }
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside width="232px" class="admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">
          <span class="wave wave-one"></span>
          <span class="wave wave-two"></span>
        </div>

        <div>
          <strong>赤水回声</strong>
          <span>数字声音地图后台</span>
        </div>
      </div>

      <el-menu
        router
        :default-active="$route.path"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>

        <el-menu-item index="/spots">
          <el-icon><MapLocation /></el-icon>
          <span>点位管理</span>
        </el-menu-item>

        <el-menu-item index="/audios">
          <el-icon><Headset /></el-icon>
          <span>音频管理</span>
        </el-menu-item>

        <el-menu-item index="/questions">
          <el-icon><QuestionFilled /></el-icon>
          <span>研学问答</span>
        </el-menu-item>

        <el-menu-item index="/services">
          <el-icon><Location /></el-icon>
          <span>服务设施</span>
        </el-menu-item>

        <el-menu-item index="/feedback">
          <el-icon><ChatDotRound /></el-icon>
          <span>体验反馈</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="admin-info">
          <span class="admin-avatar">
            {{
              adminStore.adminInfo?.display_name?.slice(0, 1) ||
              '管'
            }}
          </span>

          <div>
            <strong>
              {{
                adminStore.adminInfo?.display_name ||
                '管理员'
              }}
            </strong>

            <small>
              {{
                adminStore.adminInfo?.username ||
                'admin'
              }}
            </small>
          </div>
        </div>

        <button
          type="button"
          class="logout-button"
          @click="handleLogout"
        >
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </button>
      </div>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div>
          <p>CHISHUI ECHOES ADMIN</p>
          <h1>{{ $route.meta.title || '管理后台' }}</h1>
        </div>

        <span class="header-note">
          四川省古蔺县太平古镇数字声音导览地图
        </span>
      </el-header>

      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
  background: #f4f6f0;
}

.admin-sidebar {
  position: relative;

  display: flex;
  flex-direction: column;

  min-height: 100vh;

  background:
    linear-gradient(
      180deg,
      #26362e,
      #1d2a24
    );
  box-shadow: 5px 0 22px rgba(33, 48, 40, 0.08);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;

  padding: 28px 22px 26px;

  color: #fffdf3;
}

.brand-mark {
  position: relative;

  width: 35px;
  height: 35px;
  overflow: hidden;

  border: 1px solid rgba(235, 240, 224, 0.45);
  border-radius: 50%;
}

.wave {
  position: absolute;
  left: 6px;

  width: 22px;
  height: 9px;

  border-top: 1.5px solid #d6a59f;
  border-radius: 50%;
  transform: rotate(-7deg);
}

.wave-one {
  bottom: 7px;
}

.wave-two {
  bottom: 13px;
  left: 10px;

  width: 16px;

  border-color: #9cc2bb;
  opacity: 0.7;
}

.sidebar-brand strong {
  display: block;

  font-family: "Noto Serif SC", serif;
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.sidebar-brand span {
  display: block;
  margin-top: 4px;

  color: rgba(235, 240, 224, 0.58);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.sidebar-menu {
  flex: 1;

  padding: 0 12px;

  background: transparent;
  border-right: 0;

  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(233, 239, 225, 0.7);
  --el-menu-active-color: #fffdf3;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.08);
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  margin: 5px 0;
  border-radius: 10px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(157, 76, 71, 0.85);
}

.sidebar-footer {
  padding: 16px 18px 20px;
  border-top: 1px solid rgba(233, 239, 225, 0.12);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;

  color: #fffdf3;
}

.admin-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;

  color: #fffdf3;
  background: rgba(184, 163, 106, 0.75);
  border-radius: 50%;

  font-family: "Noto Serif SC", serif;
  font-size: 14px;
}

.admin-info strong {
  display: block;
  font-size: 12px;
  font-weight: 500;
}

.admin-info small {
  display: block;
  margin-top: 3px;

  color: rgba(233, 239, 225, 0.52);
  font-size: 10px;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 6px;

  width: 100%;
  margin-top: 15px;
  padding: 8px 0;

  color: rgba(233, 239, 225, 0.62);
  background: transparent;
  border: 0;

  font-size: 11px;

  transition: color 0.2s ease;
}

.logout-button:hover {
  color: #f0b3ab;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 80px;

  background: rgba(252, 251, 245, 0.9);
  border-bottom: 1px solid rgba(111, 136, 124, 0.12);
}

.admin-header p {
  margin: 0;

  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.17em;
}

.admin-header h1 {
  margin: 5px 0 0;

  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 500;
}

.header-note {
  color: rgba(79, 96, 85, 0.54);
  font-size: 11px;
  letter-spacing: 0.03em;
}

.admin-main {
  min-height: calc(100vh - 80px);
  padding: 26px;
  background:
    radial-gradient(
      circle at 92% 4%,
      rgba(246, 233, 193, 0.28),
      transparent 22%
    ),
    #f4f6f0;
}
</style>