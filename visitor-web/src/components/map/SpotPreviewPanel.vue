<script setup>
import { computed } from 'vue'
import {
  ArrowUpRight,
  ChevronLeft,
  Headphones,
  MapPin,
  Navigation,
  Play,
  X
} from 'lucide-vue-next'

import { getAssetUrl } from '../../utils/asset'

const props = defineProps({
  /*
    当前选中的点位详情。
    当它为空时，父组件不会渲染本组件。
  */
  spot: {
    type: Object,
    default: null
  },

  /*
    点击点位后请求详情时的加载状态。
  */
  isLoading: {
    type: Boolean,
    default: false
  },

  /*
    是否收起右侧详情卡。
    true：仅显示一个圆形图钉按钮。
    false：显示完整毛玻璃详情卡。
  */
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'close',
  'enter-spot',
  'navigate',
  'toggle-collapse'
])

const coverImageUrl = computed(() => {
  if (!props.spot?.cover_image) {
    return ''
  }

  return getAssetUrl(props.spot.cover_image)
})

const firstAudio = computed(() => {
  if (!props.spot?.audios?.length) {
    return null
  }

  return props.spot.audios[0]
})

function handleClose() {
  emit('close')
}

function handleToggleCollapse() {
  emit('toggle-collapse')
}

function handleEnterSpot() {
  if (!props.spot) return

  emit('enter-spot', props.spot)
}

function handleNavigate() {
  if (!props.spot) return

  emit('navigate', props.spot)
}
</script>

<template>
  <!-- =================================================
       收起状态：右下角仅显示一个点位图钉按钮
       ================================================= -->
  <transition name="panel-fade">
    <button
      v-if="isCollapsed && spot"
      type="button"
      class="collapsed-spot-button"
      :title="`展开：${spot.name}`"
      @click="handleToggleCollapse"
    >
      <MapPin :size="20" :stroke-width="1.7" />

      <span class="collapsed-spot-number">
        {{ String(spot.route_order).padStart(2, '0') }}
      </span>
    </button>
  </transition>

  <!-- =================================================
       展开状态：完整右下角毛玻璃详情卡
       ================================================= -->
  <transition name="panel-fade">
    <aside
      v-if="!isCollapsed"
      class="spot-preview-panel"
    >
      <!-- 加载中 -->
      <div
        v-if="isLoading"
        class="panel-loading"
      >
        <span class="loading-ring"></span>
        <span>正在唤起这段历史记忆…</span>
      </div>

      <!-- 已加载点位详情 -->
      <template v-else-if="spot">
        <!-- 右上角：收起和关闭 -->
        <div class="panel-top-actions">
          <button
            type="button"
            class="panel-icon-button"
            title="收起点位详情"
            @click="handleToggleCollapse"
          >
            <ChevronLeft :size="18" :stroke-width="1.8" />
          </button>

          <button
            type="button"
            class="panel-icon-button close-button"
            title="关闭点位详情"
            @click="handleClose"
          >
            <X :size="17" :stroke-width="1.8" />
          </button>
        </div>

        <!-- 点位图片 -->
        <div class="spot-image-wrap">
          <img
            v-if="coverImageUrl"
            :src="coverImageUrl"
            :alt="spot.name"
            class="spot-cover-image"
          />

          <div
            v-else
            class="spot-image-placeholder"
          >
            <span>赤水回声</span>
          </div>

          <div class="spot-image-overlay"></div>

          <div class="spot-type-badge">
            <span>
              {{ String(spot.route_order).padStart(2, '0') }}
            </span>

            <i></i>

            <span>{{ spot.type }}</span>
          </div>
        </div>

        <!-- 详情正文 -->
        <div class="panel-content">
          <p class="spot-eyebrow">
            TAIPING ANCIENT TOWN
          </p>

          <h2 class="spot-title">
            {{ spot.name }}
          </h2>

          <p class="spot-subtitle">
            {{ spot.subtitle }}
          </p>

          <!-- 音频预览 -->
          <div
            v-if="firstAudio"
            class="audio-preview"
          >
            <span class="audio-preview-icon">
              <Play :size="15" :stroke-width="1.8" />
            </span>

            <span class="audio-preview-text">
              <strong>{{ firstAudio.title }}</strong>

              <small>
                {{ firstAudio.audio_type || '声音导览' }}
                ·
                {{ firstAudio.duration || 0 }} 秒
              </small>
            </span>

            <Headphones
              :size="17"
              :stroke-width="1.55"
            />
          </div>

          <!-- 故事摘要 -->
          <div class="story-preview">
            <span class="section-label">红色故事</span>

            <p>
              {{
                spot.short_intro ||
                spot.story_content ||
                '该点位的声音故事将在这里呈现。'
              }}
            </p>
          </div>

          <!-- 行动按钮 -->
          <div class="panel-actions">
            <button
              type="button"
              class="enter-spot-button"
              @click="handleEnterSpot"
            >
              <span>进入此站</span>
              <ArrowUpRight :size="17" :stroke-width="1.7" />
            </button>

            <button
              type="button"
              class="navigation-button"
              @click="handleNavigate"
            >
              <Navigation :size="17" :stroke-width="1.7" />
              <span>外部导航</span>
            </button>
          </div>
        </div>
      </template>
    </aside>
  </transition>
</template>

<style scoped lang="scss">
/* =====================================================
   右下完整详情面板
   ===================================================== */

.spot-preview-panel {
  position: absolute;
  z-index: 30;
  right: 24px;
  bottom: 24px;

  width: 370px;
  max-height: min(730px, calc(100% - 48px));
  overflow: hidden auto;

  background: rgba(250, 249, 240, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(49, 71, 60, 0.14);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* 滚动条尽量弱化 */
.spot-preview-panel::-webkit-scrollbar {
  width: 5px;
}

.spot-preview-panel::-webkit-scrollbar-track {
  background: transparent;
}

.spot-preview-panel::-webkit-scrollbar-thumb {
  background: rgba(111, 136, 124, 0.25);
  border-radius: 999px;
}

/* =====================================================
   加载状态
   ===================================================== */

.panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-height: 300px;
  gap: 16px;

  color: rgba(70, 91, 79, 0.66);
  font-size: 13px;
}

.loading-ring {
  width: 36px;
  height: 36px;
  border: 2px solid rgba(125, 151, 139, 0.22);
  border-top-color: #9d4c47;
  border-radius: 50%;
  animation: loadingRotate 0.9s linear infinite;
}

@keyframes loadingRotate {
  to {
    transform: rotate(360deg);
  }
}

/* =====================================================
   顶部控制按钮
   ===================================================== */

.panel-top-actions {
  position: absolute;
  z-index: 10;
  top: 14px;
  right: 14px;

  display: flex;
  gap: 8px;
}

.panel-icon-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;

  color: #fffdf5;
  background: rgba(46, 56, 50, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 50%;
  backdrop-filter: blur(6px);

  transition:
    background 0.22s ease,
    transform 0.22s ease;
}

.panel-icon-button:hover {
  background: rgba(87, 107, 95, 0.88);
  transform: translateY(-2px);
}

.panel-icon-button.close-button:hover {
  background: rgba(127, 66, 63, 0.9);
  transform: rotate(90deg);
}

/* =====================================================
   点位图片区域
   ===================================================== */

.spot-image-wrap {
  position: relative;
  height: 176px;
  overflow: hidden;

  background:
    linear-gradient(
      135deg,
      #b9cec4,
      #8fa99b
    );
}

.spot-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;

  transition: transform 0.7s ease;
}

.spot-preview-panel:hover .spot-cover-image {
  transform: scale(1.04);
}

.spot-image-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;

  color: rgba(255, 252, 239, 0.86);
  background:
    radial-gradient(
      circle at 72% 22%,
      rgba(244, 232, 196, 0.58),
      transparent 24%
    ),
    linear-gradient(
      135deg,
      #9ab7ac,
      #5f8077
    );

  font-family:
    "Noto Serif SC",
    serif;
  font-size: 24px;
  letter-spacing: 0.16em;
}

.spot-image-overlay {
  position: absolute;
  inset: 0;

  background:
    linear-gradient(
      to bottom,
      rgba(27, 42, 36, 0.05),
      rgba(27, 42, 36, 0.44)
    );
}

.spot-type-badge {
  position: absolute;
  bottom: 14px;
  left: 20px;

  display: flex;
  align-items: center;
  gap: 8px;

  color: #fffdf5;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.spot-type-badge > span:first-child {
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 20px;
  font-weight: 600;
}

.spot-type-badge i {
  display: block;
  width: 18px;
  height: 1px;
  background: rgba(255, 253, 245, 0.72);
}

/* =====================================================
   内容区域
   ===================================================== */

.panel-content {
  padding: 21px 24px 24px;
}

.spot-eyebrow {
  margin: 0;

  color: rgba(97, 111, 100, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.spot-title {
  margin: 7px 0 7px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: 0.035em;
  line-height: 1.35;
}

.spot-subtitle {
  margin: 0;

  color: rgba(87, 104, 92, 0.72);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.05em;
  line-height: 1.75;
}

/* =====================================================
   音频预览
   ===================================================== */

.audio-preview {
  display: flex;
  align-items: center;
  gap: 10px;

  margin-top: 19px;
  padding: 10px 12px;

  color: #5d8888;
  background: rgba(232, 240, 233, 0.58);
  border: 1px solid rgba(127, 154, 141, 0.16);
  border-radius: 14px;
}

.audio-preview-icon {
  display: grid;
  width: 31px;
  height: 31px;
  flex: none;
  place-items: center;

  color: #fffcef;
  background: #9d4c47;
  border-radius: 50%;
}

.audio-preview-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.audio-preview-text strong {
  overflow: hidden;

  color: #45594d;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-preview-text small {
  color: rgba(90, 111, 98, 0.62);
  font-size: 10px;
  letter-spacing: 0.025em;
}

/* =====================================================
   红色故事摘要
   ===================================================== */

.story-preview {
  margin-top: 19px;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  color: #9d4c47;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.section-label::before {
  width: 18px;
  height: 1px;
  background: #9d4c47;
  content: "";
}

.story-preview p {
  display: -webkit-box;
  margin: 9px 0 0;
  overflow: hidden;

  color: rgba(67, 85, 74, 0.74);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.03em;
  line-height: 1.85;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

/* =====================================================
   底部按钮
   ===================================================== */

.panel-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;

  margin-top: 21px;
}

.enter-spot-button,
.navigation-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  min-height: 42px;

  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;

  transition:
    transform 0.24s ease,
    background 0.24s ease,
    color 0.24s ease,
    box-shadow 0.24s ease;
}

.enter-spot-button {
  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 20px rgba(127, 66, 63, 0.18);
}

.enter-spot-button:hover {
  box-shadow: 0 12px 26px rgba(127, 66, 63, 0.27);
  transform: translateY(-2px);
}

.navigation-button {
  padding: 0 14px;

  color: #526b60;
  background: rgba(244, 246, 239, 0.6);
  border: 1px solid rgba(95, 120, 107, 0.18);
}

.navigation-button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.94);
  transform: translateY(-2px);
}

/* =====================================================
   收起后的右下角圆形按钮
   ===================================================== */

.collapsed-spot-button {
  position: absolute;
  z-index: 32;
  right: 24px;
  bottom: 24px;

  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;

  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  box-shadow: 0 12px 28px rgba(127, 66, 63, 0.24);

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.collapsed-spot-button:hover {
  box-shadow: 0 17px 34px rgba(127, 66, 63, 0.34);
  transform: translateY(-3px) scale(1.05);
}

.collapsed-spot-number {
  position: absolute;
  right: -4px;
  bottom: -4px;

  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;

  color: #9d4c47;
  background: #fffcef;
  border: 1px solid rgba(157, 76, 71, 0.22);
  border-radius: 50%;

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 700;
}

/* =====================================================
   进入/退出动画
   ===================================================== */

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

/* =====================================================
   移动端
   ===================================================== */

@media (max-width: 900px) {
  .spot-preview-panel {
    right: 14px;
    bottom: 14px;
    left: 14px;

    width: auto;
    max-height: 58vh;
  }

  .collapsed-spot-button {
    right: 16px;
    bottom: 16px;
  }

  .spot-image-wrap {
    height: 145px;
  }

  .panel-content {
    padding: 18px;
  }

  .spot-title {
    font-size: 22px;
  }
}
</style>