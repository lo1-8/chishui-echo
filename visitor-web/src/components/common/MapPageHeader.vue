<script setup>
import {
  ArrowLeft,
  Expand,
  Map,
  RotateCcw,
  X,
  Menu
} from 'lucide-vue-next'

defineProps({
  isFullscreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'reset-map',
  'toggle-fullscreen'
])

function handleResetMap() {
  emit('reset-map')
}

function handleFullscreen() {
  emit('toggle-fullscreen')
}
</script>

<template>
  <header class="map-page-header">
    <!-- 左侧品牌与返回首页 -->
    <div class="header-left">
      <RouterLink
        to="/"
        class="brand"
        aria-label="返回赤水回声首页"
      >
        <span class="brand-mark">
          <span class="brand-wave wave-one"></span>
          <span class="brand-wave wave-two"></span>
        </span>

        <span class="brand-text">
          <strong>赤水回声</strong>
          <small>CHISHUI ECHOES</small>
        </span>
      </RouterLink>

      <RouterLink
        to="/"
        class="back-home"
      >
        <ArrowLeft :size="15" :stroke-width="1.7" />
        <span>返回首页</span>
      </RouterLink>
    </div>

    <!-- 中间导航 -->
    <nav class="desktop-nav">
      <RouterLink to="/map" class="nav-link active">
        声音地图
      </RouterLink>

      <RouterLink to="/journey" class="nav-link">
        我的旅程
      </RouterLink>

      <RouterLink to="/about" class="nav-link">
        关于项目
      </RouterLink>
    </nav>

    <!-- 右侧地图控制 -->
    <div class="header-actions">
      <button
        type="button"
        class="header-control"
        title="重置地图视图"
        @click="handleResetMap"
      >
        <RotateCcw :size="16" :stroke-width="1.7" />
        <span>重置视图</span>
      </button>

      <button
        type="button"
        class="header-map-button"
        :title="isFullscreen ? '退出全屏' : '全屏浏览地图'"
        @click="handleFullscreen"
      >
        <X
          v-if="isFullscreen"
          :size="16"
          :stroke-width="1.7"
        />

        <Expand
          v-else
          :size="16"
          :stroke-width="1.7"
        />

        <span>
          {{ isFullscreen ? '退出全屏' : '全屏浏览' }}
        </span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.map-page-header {
  position: relative;
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(300px, 1fr) auto minmax(300px, 1fr);
  align-items: center;
  width: min(calc(100% - 80px), 1560px);
  min-height: 86px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  justify-self: start;
  gap: 22px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #344139;
  transition: opacity 0.25s ease;
}

.brand:hover {
  opacity: 0.72;
}

.brand-mark {
  position: relative;
  width: 31px;
  height: 31px;
  overflow: hidden;
  border: 1px solid rgba(69, 91, 79, 0.5);
  border-radius: 50%;
}

.brand-wave {
  position: absolute;
  left: 5px;
  width: 20px;
  height: 8px;
  border-top: 1.4px solid #9e4d47;
  border-radius: 50%;
  transform: rotate(-7deg);
}

.wave-one {
  bottom: 6px;
}

.wave-two {
  bottom: 11px;
  left: 8px;
  width: 15px;
  opacity: 0.58;
  border-color: #5b8a84;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1;
}

.brand-text strong {
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.brand-text small {
  color: rgba(52, 65, 57, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.back-home {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(62, 78, 68, 0.62);
  font-size: 12px;
  letter-spacing: 0.04em;
  transition:
    color 0.24s ease,
    transform 0.24s ease;
}

.back-home:hover {
  color: #9d4c47;
  transform: translateX(-2px);
}

.desktop-nav {
  display: flex;
  align-items: center;
  justify-self: center;
  gap: clamp(24px, 2.2vw, 42px);
}

.nav-link {
  position: relative;
  padding: 8px 0;
  color: rgba(50, 63, 55, 0.64);
  font-size: 13px;
  letter-spacing: 0.05em;
  transition: color 0.25s ease;
}

.nav-link::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: #9d4c47;
  content: "";
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.28s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #334139;
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 10px;
}

.header-control,
.header-map-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;
}

.header-control {
  color: rgba(52, 68, 58, 0.8);
  background: rgba(250, 249, 240, 0.45);
  border: 1px solid rgba(73, 94, 81, 0.18);
  backdrop-filter: blur(10px);
}

.header-control:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.78);
  transform: translateY(-2px);
}

.header-map-button {
  color: #fffaf0;
  background:
    linear-gradient(
      135deg,
      rgba(117, 80, 72, 0.95),
      rgba(100, 69, 63, 0.95)
    );
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: 0 10px 26px rgba(93, 66, 59, 0.14);
}

.header-map-button:hover {
  background:
    linear-gradient(
      135deg,
      rgba(150, 68, 63, 0.96),
      rgba(112, 67, 61, 0.96)
    );
  box-shadow: 0 14px 30px rgba(104, 61, 55, 0.22);
  transform: translateY(-2px);
}

@media (max-width: 900px) {
  .map-page-header {
    display: flex;
    justify-content: space-between;
    width: calc(100% - 36px);
    min-height: 72px;
  }

  .desktop-nav {
    display: none;
  }

  .back-home span,
  .header-control span,
  .header-map-button span {
    display: none;
  }

  .header-left {
    gap: 12px;
  }

  .header-control,
  .header-map-button {
    width: 40px;
    min-height: 40px;
    padding: 0;
  }

  .brand-text small {
    display: none;
  }

  .brand-text strong {
    font-size: 14px;
  }
}
</style>