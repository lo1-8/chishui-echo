<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  Expand,
  LoaderCircle,
  MapPinned,
  Minus,
  Plus,
  RotateCcw,
  Route,
  SlidersHorizontal
} from 'lucide-vue-next'

import MapPageHeader from '../components/common/MapPageHeader.vue'
import MapMarker from '../components/map/MapMarker.vue'
import ServiceMarker from '../components/map/ServiceMarker.vue'
import SpotPreviewPanel from '../components/map/SpotPreviewPanel.vue'

import {
  getMainRoute,
  getPublicSpots,
  getServicePoints,
  getSpotDetail,
  recordUserEvent
} from '../api/map'

import { useJourneyStore } from '../stores/journey'
import { getVisitorId } from '../utils/visitor'
import { openBaiduNavigation } from '../utils/navigation'

import mapBaseUrl from '../assets/maps/taiping-map-base.svg?url'

const router = useRouter()
const journeyStore = useJourneyStore()

/* =====================================================
   一、地图数据状态
   ===================================================== */

const spots = ref([])
const services = ref([])

const selectedSpot = ref(null)
const selectedSpotDetail = ref(null)

const isPageLoading = ref(true)
const isPanelLoading = ref(false)
const errorMessage = ref('')

/* =====================================================
   二、地图缩放、拖拽、全屏状态
   ===================================================== */

const mapViewportRef = ref(null)
const mapFullscreenRef = ref(null)

const mapScale = ref(1)

const mapPan = ref({
  x: 0,
  y: 0
})

const minScale = 0.78
const maxScale = 2.8
const zoomStep = 0.18

const isDragging = ref(false)
const hasMovedWhileDragging = ref(false)

const dragStart = ref({
  pointerX: 0,
  pointerY: 0,
  panX: 0,
  panY: 0
})

const isFullscreen = ref(false)

/* =====================================================
   三、服务设施筛选状态
   ===================================================== */

const serviceFilters = ref({
  北门: true,
  停车场: true,
  厕所: true
})

const isFilterOpen = ref(false)

/* =====================================================
   四、左侧与右侧面板状态
   ===================================================== */

/*
  左侧地图信息卡：

  false：完整展开；
  true：收起为左上角圆形按钮。
*/
const isInfoPanelCollapsed = ref(false)

/*
  右侧点位详情卡：

  false：完整显示详情卡；
  true：收起为右下角图钉按钮。

  注意：
  selectedSpot 为空时，右侧卡片完全不渲染。
*/
const isSpotPanelCollapsed = ref(false)

/* =====================================================
   五、派生数据
   ===================================================== */

const sortedSpots = computed(() => {
  return [...spots.value].sort(
    (a, b) => a.route_order - b.route_order
  )
})

const visibleServices = computed(() => {
  return services.value.filter(
    (service) => serviceFilters.value[service.type]
  )
})

const checkedInSpotCount = computed(() => {
  return journeyStore.checkedInSpotIds.length
})

const routeProgress = computed(() => {
  const total = sortedSpots.value.length

  if (!total) {
    return 0
  }

  return Math.round(
    (checkedInSpotCount.value / total) * 100
  )
})

const mapTransformStyle = computed(() => ({
  transform: `translate(${mapPan.value.x}px, ${mapPan.value.y}px) scale(${mapScale.value})`
}))

const routePolylinePoints = computed(() => {
  return sortedSpots.value
    .map((spot) => {
      const x = (Number(spot.map_x) / 100) * 1600
      const y = (Number(spot.map_y) / 100) * 1100

      return `${x},${y}`
    })
    .join(' ')
})

const nextRecommendedSpot = computed(() => {
  return sortedSpots.value.find(
    (spot) => !journeyStore.isCheckedIn(spot.id)
  ) || null
})

/* =====================================================
   六、地图数据加载
   ===================================================== */

async function loadMapData() {
  isPageLoading.value = true
  errorMessage.value = ''

  try {
    const [spotsResult, servicesResult] = await Promise.all([
      getPublicSpots(),
      getServicePoints()
    ])

    spots.value = spotsResult.data || []
    services.value = servicesResult.data || []

    /*
      主路线目前主要根据 route_order 展示。
      此处请求接口，是为后续路线扩展预留。
    */
    try {
      await getMainRoute()
    } catch (error) {
      console.warn(
        '主路线接口暂未加载成功，将使用点位 route_order。',
        error
      )
    }

    recordEvent('map_view')
  } catch (error) {
    console.error('加载声音地图失败：', error)

    errorMessage.value =
      '地图数据加载失败，请确认后端服务是否已启动，或检查浏览器控制台。'
  } finally {
    isPageLoading.value = false
  }
}

/* =====================================================
   七、匿名行为统计
   ===================================================== */

function recordEvent(eventType, spotId = null, eventValue = null) {
  recordUserEvent({
    visitor_id: getVisitorId(),
    event_type: eventType,
    spot_id: spotId,
    event_value: eventValue
  }).catch((error) => {
    /*
      行为统计失败不应影响用户继续使用地图。
    */
    console.warn('行为统计记录失败：', error)
  })
}

/* =====================================================
   八、点位选择、详情卡与导航
   ===================================================== */

async function selectSpot(spot) {
  if (!spot?.id) return

  /*
    选择新点位后：
    - 右侧完整详情卡自动展开；
    - 清空旧详情；
    - 请求新点位详情。
  */
  selectedSpot.value = spot
  isSpotPanelCollapsed.value = false
  selectedSpotDetail.value = null
  isPanelLoading.value = true

  recordEvent('spot_view', spot.id, {
    source: 'map'
  })

  try {
    const result = await getSpotDetail(spot.id)

    selectedSpotDetail.value = result.data
  } catch (error) {
    console.error('加载点位详情失败：', error)

    /*
      即使详情接口失败，
      也回退显示点位基础信息。
    */
    selectedSpotDetail.value = {
      ...spot,
      audios: [],
      quiz_questions: []
    }
  } finally {
    isPanelLoading.value = false
  }
}

function closeSpotPanel() {
  /*
    完全关闭：
    - 清空当前点位；
    - 清空详情；
    - 右侧详情组件会因 v-if 条件不满足而销毁。
  */
  selectedSpot.value = null
  selectedSpotDetail.value = null
  isSpotPanelCollapsed.value = false
}

function toggleSpotPanel() {
  /*
    收起/展开：
    当前点位仍存在，只改变展示形态。
  */
  isSpotPanelCollapsed.value =
    !isSpotPanelCollapsed.value
}

function enterSpotDetail(spot) {
  if (!spot?.id) return

  router.push({
    name: 'spot-detail',
    params: {
      id: spot.id
    }
  })
}

function navigateToSpot(spot) {
  if (!spot) return

  recordEvent('navigation_click', spot.id, {
    source: 'map_preview_panel'
  })

  openBaiduNavigation(spot)
}

function selectService(service) {
  if (!service) return

  recordEvent('navigation_click', null, {
    source: 'service_marker',
    service_name: service.name,
    service_type: service.type
  })

  openBaiduNavigation(service)
}

/* =====================================================
   九、点位状态判断
   ===================================================== */

function isSpotCheckedIn(spotId) {
  return journeyStore.isCheckedIn(spotId)
}

function isSpotRecommended(spot) {
  return nextRecommendedSpot.value?.id === spot.id
}

function isSpotActive(spot) {
  return selectedSpot.value?.id === spot.id
}

/* =====================================================
   十、左侧信息卡与服务筛选
   ===================================================== */

function toggleInfoPanel() {
  isInfoPanelCollapsed.value =
    !isInfoPanelCollapsed.value
}

function toggleFilterPanel() {
  isFilterOpen.value = !isFilterOpen.value
}

/* =====================================================
   十一、地图缩放
   ===================================================== */

function clampScale(value) {
  return Math.min(
    Math.max(value, minScale),
    maxScale
  )
}

function zoomIn() {
  mapScale.value = clampScale(
    Number((mapScale.value + zoomStep).toFixed(2))
  )
}

function zoomOut() {
  mapScale.value = clampScale(
    Number((mapScale.value - zoomStep).toFixed(2))
  )
}

/*
  鼠标滚轮缩放。

  关键逻辑：
  鼠标当前位置在缩放前后保持相对稳定，
  使体验更接近真实地图。
*/
function handleWheel(event) {
  event.preventDefault()

  if (!mapViewportRef.value) return

  const viewportRect =
    mapViewportRef.value.getBoundingClientRect()

  const pointerX = event.clientX - viewportRect.left
  const pointerY = event.clientY - viewportRect.top

  const scaleBefore = mapScale.value

  const zoomDelta = event.deltaY < 0
    ? zoomStep
    : -zoomStep

  const scaleAfter = clampScale(
    Number((scaleBefore + zoomDelta).toFixed(2))
  )

  if (scaleAfter === scaleBefore) return

  const worldX = (
    pointerX - mapPan.value.x
  ) / scaleBefore

  const worldY = (
    pointerY - mapPan.value.y
  ) / scaleBefore

  mapPan.value = {
    x: pointerX - worldX * scaleAfter,
    y: pointerY - worldY * scaleAfter
  }

  mapScale.value = scaleAfter
}

/* =====================================================
   十二、地图拖拽
   ===================================================== */

function handlePointerDown(event) {
  if (
    event.button !== undefined &&
    event.button !== 0
  ) {
    return
  }

  /*
    点击按钮、链接、Marker、筛选器时，
    不应进入拖拽模式。
  */
  const interactiveElement = event.target.closest(
    'button, a, input, textarea, select'
  )

  if (interactiveElement) {
    return
  }

  isDragging.value = true
  hasMovedWhileDragging.value = false

  dragStart.value = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    panX: mapPan.value.x,
    panY: mapPan.value.y
  }

  mapViewportRef.value?.setPointerCapture?.(
    event.pointerId
  )
}

function handlePointerMove(event) {
  if (!isDragging.value) return

  const deltaX = event.clientX - dragStart.value.pointerX
  const deltaY = event.clientY - dragStart.value.pointerY

  if (
    Math.abs(deltaX) > 3 ||
    Math.abs(deltaY) > 3
  ) {
    hasMovedWhileDragging.value = true
  }

  mapPan.value = {
    x: dragStart.value.panX + deltaX,
    y: dragStart.value.panY + deltaY
  }
}

function handlePointerUp(event) {
  if (!isDragging.value) return

  isDragging.value = false

  try {
    mapViewportRef.value?.releasePointerCapture?.(
      event.pointerId
    )
  } catch (error) {
    /*
      部分浏览器可能自动释放 Pointer Capture，
      因此这里无需处理异常。
    */
  }
}

function handleMapBackgroundClick() {
  /*
    拖拽结束时不关闭详情卡。
    只有真正点击地图空白区域时，才关闭详情卡。
  */
  if (hasMovedWhileDragging.value) {
    return
  }

  closeSpotPanel()
}

/* =====================================================
   十三、重置视图
   ===================================================== */

function resetMapView() {
  if (!mapViewportRef.value) {
    return
  }

  const viewportRect =
    mapViewportRef.value.getBoundingClientRect()

  const mapRatio = 1600 / 1100

  let stageHeight = viewportRect.height * 0.92
  let stageWidth = stageHeight * mapRatio

  if (stageWidth > viewportRect.width * 0.96) {
    stageWidth = viewportRect.width * 0.96
    stageHeight = stageWidth / mapRatio
  }

  mapScale.value = 1

  mapPan.value = {
    x: -stageWidth / 2,
    y: -stageHeight / 2
  }

  closeSpotPanel()
}

/* =====================================================
   十四、全屏模式
   ===================================================== */

async function toggleFullscreen() {
  const element = mapFullscreenRef.value

  if (!element) return

  try {
    if (!document.fullscreenElement) {
      await element.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.warn('全屏模式切换失败：', error)

    window.alert(
      '当前浏览器不支持或未允许全屏模式。你仍可正常使用地图。'
    )
  }
}

function handleFullscreenChange() {
  isFullscreen.value = Boolean(
    document.fullscreenElement
  )

  /*
    全屏切换后，容器尺寸变化。
    等浏览器重新布局后重置地图，让它保持居中。
  */
  window.setTimeout(() => {
    resetMapView()
  }, 120)
}

/* =====================================================
   十五、辅助功能
   ===================================================== */

function getScalePercentage() {
  return `${Math.round(mapScale.value * 100)}%`
}

function goToJourney() {
  router.push('/journey')
}

/* =====================================================
   十六、生命周期
   ===================================================== */

onMounted(async () => {
  await loadMapData()

  await nextTick()

  resetMapView()

  document.addEventListener(
    'fullscreenchange',
    handleFullscreenChange
  )

  window.addEventListener(
    'resize',
    resetMapView
  )
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'fullscreenchange',
    handleFullscreenChange
  )

  window.removeEventListener(
    'resize',
    resetMapView
  )
})
</script>

<template>
  <main
    ref="mapFullscreenRef"
    class="map-page"
    :class="{
      'is-fullscreen': isFullscreen
    }"
  >
    <MapPageHeader
      :is-fullscreen="isFullscreen"
      @reset-map="resetMapView"
      @toggle-fullscreen="toggleFullscreen"
    />

    <section class="map-page-content">
      <!-- 页面加载状态 -->
      <div
        v-if="isPageLoading"
        class="page-loading"
      >
        <LoaderCircle
          :size="30"
          :stroke-width="1.5"
          class="page-loading-icon"
        />

        <p>正在铺展太平古镇的山河地图…</p>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="errorMessage"
        class="page-error"
      >
        <AlertCircle
          :size="30"
          :stroke-width="1.5"
        />

        <h2>地图暂时无法加载</h2>

        <p>{{ errorMessage }}</p>

        <button
          type="button"
          @click="loadMapData"
        >
          重新加载
        </button>
      </div>

      <!-- 地图主体 -->
      <template v-else>
        <div
          ref="mapViewportRef"
          class="map-viewport"
          :class="{
            'is-dragging': isDragging
          }"
          @wheel.prevent="handleWheel"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointercancel="handlePointerUp"
          @click="handleMapBackgroundClick"
        >
          <!-- 可缩放、拖拽的地图舞台 -->
          <div
            class="map-stage"
            :style="mapTransformStyle"
          >
            <!-- SVG 地图底图 -->
            <img
              :src="mapBaseUrl"
              alt="太平古镇艺术声音导览地图"
              class="map-base-image"
              draggable="false"
            />

            <!-- 推荐路线 -->
            <svg
              v-if="sortedSpots.length > 1"
              class="route-overlay"
              viewBox="0 0 1600 1100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                :points="routePolylinePoints"
                class="route-line-shadow"
              />
              <polyline
                :points="routePolylinePoints"
                class="route-line"
              />
            </svg>

            <!-- 服务设施点 -->
            <ServiceMarker
              v-for="service in visibleServices"
              :key="service.id"
              :service="service"
              @select="selectService"
            />

            <!-- 核心声音点位 -->
            <MapMarker
              v-for="spot in sortedSpots"
              :key="spot.id"
              :spot="spot"
              :is-active="isSpotActive(spot)"
              :is-checked-in="isSpotCheckedIn(spot.id)"
              :is-recommended="isSpotRecommended(spot)"
              @select="selectSpot"
            />
          </div>

          <!-- =================================================
               左侧地图信息浮层
               可收起/展开
               ================================================= -->

          <aside
            class="map-info-panel"
            :class="{
              'is-collapsed': isInfoPanelCollapsed
            }"
          >
            <!-- 收起后：仅显示圆形地图按钮 -->
            <button
              v-if="isInfoPanelCollapsed"
              type="button"
              class="collapsed-info-button"
              title="展开地图说明"
              @click="toggleInfoPanel"
            >
              <MapPinned
                :size="20"
                :stroke-width="1.7"
              />
            </button>

            <!-- 展开后：完整信息卡 -->
            <template v-else>
              <div class="map-info-panel-top">
                <div>
                  <p class="map-info-kicker">
                    CHISHUI ECHOES
                  </p>

                  <h1>太平古镇<br />声音地图</h1>
                </div>

                <button
                  type="button"
                  class="collapse-info-button"
                  title="收起地图说明"
                  @click="toggleInfoPanel"
                >
                  <ChevronLeft
                    :size="17"
                    :stroke-width="1.8"
                  />
                </button>
              </div>

              <p class="map-info-description">
                
                在山河之间, <br />我们重新抵达历史现场。
              </p>

              <div class="route-progress-block">
                <div class="route-progress-top">
                  <span>声音旅程进度</span>

                  <strong>
                    {{ checkedInSpotCount }} / {{ sortedSpots.length }}
                  </strong>
                </div>

                <div class="progress-track">
                  <span
                    class="progress-value"
                    :style="{
                      width: `${routeProgress}%`
                    }"
                  ></span>
                </div>

                <p>
                  已完成 {{ routeProgress }}%

                  <span v-if="nextRecommendedSpot">
                    · 下一站推荐：
                    {{ nextRecommendedSpot.name }}
                  </span>

                  <span v-else>
                    · 你已完成全部声音点位
                  </span>
                </p>
              </div>

              <div class="map-legend">
                <span class="legend-title">
                  地图图例
                </span>

                <div class="legend-item">
                  <i class="legend-core"></i>
                  <span>核心红色点位</span>
                </div>

                <div class="legend-item">
                  <i class="legend-completed"></i>
                  <span>已打卡点位</span>
                </div>

                <div class="legend-item">
                  <i class="legend-water"></i>
                  <span>赤水河与声音水纹</span>
                </div>

                <div class="legend-item">
                  <i class="legend-route"></i>
                  <span>推荐探索路线</span>
                </div>
              </div>

              <div class="service-filter-block">
                <button
                  type="button"
                  class="filter-toggle"
                  @click="toggleFilterPanel"
                >
                  <SlidersHorizontal
                    :size="15"
                    :stroke-width="1.7"
                  />

                  <span>服务设施</span>

                  <ChevronDown
                    :size="14"
                    :stroke-width="1.7"
                    :class="{
                      'is-open': isFilterOpen
                    }"
                  />
                </button>

                <transition name="filter-slide">
                  <div
                    v-if="isFilterOpen"
                    class="filter-options"
                  >
                    <label>
                      <input
                        v-model="serviceFilters.北门"
                        type="checkbox"
                      />

                      <span class="checkbox-ui"></span>
                      北门
                    </label>

                    <label>
                      <input
                        v-model="serviceFilters.停车场"
                        type="checkbox"
                      />

                      <span class="checkbox-ui"></span>
                      停车场
                    </label>

                    <label>
                      <input
                        v-model="serviceFilters.厕所"
                        type="checkbox"
                      />

                      <span class="checkbox-ui"></span>
                      公共厕所
                    </label>
                  </div>
                </transition>
              </div>

              <button
                type="button"
                class="journey-link"
                @click="goToJourney"
              >
                <Route
                  :size="15"
                  :stroke-width="1.7"
                />
                <span>查看我的声音旅程</span>
              </button>
            </template>
          </aside>

          <!-- =================================================
               右侧点位详情浮层

               默认不显示。
               只有用户点击点位后才渲染。
               ================================================= -->

          <SpotPreviewPanel
            v-if="selectedSpot || isPanelLoading"
            :spot="selectedSpotDetail || selectedSpot"
            :is-loading="isPanelLoading"
            :is-collapsed="isSpotPanelCollapsed"
            @close="closeSpotPanel"
            @toggle-collapse="toggleSpotPanel"
            @enter-spot="enterSpotDetail"
            @navigate="navigateToSpot"
          />

          <!-- 左下缩放与全屏控制 -->
          <div class="map-controls">
            <button
              type="button"
              title="放大地图"
              @click="zoomIn"
            >
              <Plus
                :size="18"
                :stroke-width="1.7"
              />
            </button>

            <button
              type="button"
              title="缩小地图"
              @click="zoomOut"
            >
              <Minus
                :size="18"
                :stroke-width="1.7"
              />
            </button>

            <button
              type="button"
              title="重置地图视图"
              @click="resetMapView"
            >
              <RotateCcw
                :size="17"
                :stroke-width="1.7"
              />
            </button>

            <button
              type="button"
              title="全屏浏览"
              @click="toggleFullscreen"
            >
              <Expand
                :size="17"
                :stroke-width="1.7"
              />
            </button>
          </div>

          <!-- 当前缩放百分比 -->
          <div class="zoom-status">
            <MapPinned
              :size="14"
              :stroke-width="1.6"
            />
            <span>{{ getScalePercentage() }}</span>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped lang="scss">
/* =====================================================
   页面整体
   ===================================================== */

.map-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  background:
    radial-gradient(
      circle at 78% 12%,
      rgba(255, 248, 224, 0.72),
      transparent 28%
    ),
    radial-gradient(
      circle at 12% 88%,
      rgba(174, 199, 184, 0.32),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      #f7f6ef 0%,
      #edf1e9 50%,
      #dce6da 100%
    );
}

.map-page::before {
  position: absolute;
  z-index: 0;
  inset: 0;

  pointer-events: none;

  opacity: 0.16;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(76, 92, 78, 0.03) 0,
      rgba(76, 92, 78, 0.03) 1px,
      transparent 1px,
      transparent 6px
    );

  content: "";
}

.map-page.is-fullscreen {
  width: 100%;
  height: 100%;
  overflow: hidden;

  background: #eff2eb;
}

.map-page.is-fullscreen .map-page-header {
  width: min(calc(100% - 56px), 1680px);
}

.map-page-content {
  position: relative;
  z-index: 1;

  width: min(calc(100% - 80px), 1560px);
  height: calc(100vh - 112px);
  min-height: 650px;

  margin: 0 auto 26px;
}

.is-fullscreen .map-page-content {
  width: calc(100% - 56px);
  height: calc(100vh - 98px);
  min-height: 0;

  margin-bottom: 0;
}

/* =====================================================
   加载与错误状态
   ===================================================== */

.page-loading,
.page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 100%;
  min-height: 620px;

  color: rgba(68, 88, 76, 0.72);
  background: rgba(250, 249, 241, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 24px;
  box-shadow: 0 18px 55px rgba(60, 79, 68, 0.08);

  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
}

.page-loading p {
  margin-top: 16px;

  font-size: 15px;
  letter-spacing: 0.06em;
}

.page-loading-icon {
  color: #9d4c47;
  animation: loadingSpin 1.2s linear infinite;
}

@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}

.page-error {
  padding: 32px;
  text-align: center;
}

.page-error h2 {
  margin: 18px 0 8px;

  color: #344139;
  font-size: 23px;
  font-weight: 500;
}

.page-error p {
  max-width: 460px;
  margin: 0;

  color: rgba(73, 93, 80, 0.68);
  font-size: 14px;
  line-height: 1.8;
}

.page-error button {
  margin-top: 24px;
  padding: 11px 18px;

  color: #fffcef;
  background: #9d4c47;
  border: 0;
  border-radius: 999px;
}

/* =====================================================
   地图视口与可拖拽舞台
   ===================================================== */

.map-viewport {
  position: relative;

  width: 100%;
  height: 100%;
  overflow: hidden;

  background:
    linear-gradient(
      135deg,
      rgba(247, 246, 238, 0.96),
      rgba(229, 237, 228, 0.86)
    );
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(59, 79, 68, 0.1);

  cursor: grab;
  touch-action: none;
}

.map-viewport.is-dragging {
  cursor: grabbing;
}

.map-stage {
  position: absolute;
  top: 50%;
  left: 50%;

  width: min(100%, calc((100vh - 125px) * 1.4545));
  min-width: 840px;

  aspect-ratio: 1600 / 1100;

  transform-origin: 0 0;

  transition: transform 0.08s linear;
  will-change: transform;
}

.map-stage::after {
  position: absolute;
  inset: 0;

  pointer-events: none;

  background:
    radial-gradient(
      circle at 70% 18%,
      rgba(255, 246, 218, 0.2),
      transparent 24%
    ),
    linear-gradient(
      110deg,
      rgba(255, 255, 255, 0.04),
      transparent 32%
    );

  content: "";
}

.map-base-image {
  display: block;

  width: 100%;
  height: 100%;

  pointer-events: none;
  user-select: none;
}

.route-overlay {
  position: absolute;
  z-index: 6;
  inset: 0;

  width: 100%;
  height: 100%;
  overflow: visible;

  pointer-events: none;
}

.route-line-shadow {
  fill: none;

  stroke: rgba(255, 252, 240, 0.74);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 12;
}

.route-line {
  fill: none;

  stroke: rgba(157, 76, 71, 0.58);
  stroke-dasharray: 8 10;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
}

/* =====================================================
   左侧地图信息面板
   默认较小、位于左上角、支持收起
   ===================================================== */

.map-info-panel {
  position: absolute;
  z-index: 25;
  top: 18px;
  left: 18px;

  width: 218px;
  min-height: 0;
  padding: 17px 18px;

  color: #45594d;
  background: rgba(250, 249, 240, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(61, 82, 69, 0.07);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  transition:
    width 0.28s ease,
    height 0.28s ease,
    padding 0.28s ease,
    background 0.28s ease;
}

.map-info-panel.is-collapsed {
  display: grid;

  width: 46px;
  height: 46px;
  min-height: 46px;
  padding: 0;

  place-items: center;

  background: rgba(250, 249, 240, 0.72);
  border-radius: 50%;
}

.map-info-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.map-info-kicker {
  margin: 0;

  color: rgba(99, 114, 102, 0.55);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.map-info-panel h1 {
  margin: 7px 0 8px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 23px;
  font-weight: 500;
  letter-spacing: 0.045em;
  line-height: 1.32;
}

.collapse-info-button,
.collapsed-info-button {
  display: grid;
  flex: none;

  width: 28px;
  height: 28px;

  place-items: center;

  color: rgba(72, 94, 81, 0.66);
  background: rgba(244, 247, 240, 0.42);
  border: 1px solid rgba(96, 119, 104, 0.15);
  border-radius: 50%;

  transition:
    color 0.22s ease,
    background 0.22s ease,
    transform 0.22s ease;
}

.collapse-info-button:hover,
.collapsed-info-button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.9);
  transform: scale(1.08);
}

.collapsed-info-button {
  width: 46px;
  height: 46px;

  color: #5d8888;
  background: transparent;
  border: 0;
}

.map-info-description {
  margin: 0;

  color: rgba(69, 88, 76, 0.67);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 11px;
  letter-spacing: 0.03em;
  line-height: 1.82;
}

/* =====================================================
   左侧卡中的路线进度
   ===================================================== */

.route-progress-block {
  margin-top: 14px;
  padding-top: 13px;

  border-top: 1px solid rgba(102, 124, 108, 0.13);
}

.route-progress-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: rgba(79, 98, 86, 0.69);
  font-size: 10px;
}

.route-progress-top strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 17px;
  font-weight: 600;
}

.progress-track {
  height: 3px;
  margin-top: 7px;
  overflow: hidden;

  background: rgba(126, 148, 134, 0.16);
  border-radius: 999px;
}

.progress-value {
  display: block;
  height: 100%;

  background:
    linear-gradient(
      90deg,
      #b8a36a,
      #9d4c47
    );
  border-radius: inherit;

  transition: width 0.35s ease;
}

.route-progress-block p {
  margin: 7px 0 0;

  color: rgba(92, 109, 98, 0.58);
  font-size: 9px;
  letter-spacing: 0.015em;
  line-height: 1.55;
}

/* =====================================================
   地图图例
   ===================================================== */

.map-legend {
  display: grid;
  gap: 7px;

  margin-top: 14px;
  padding-top: 13px;

  border-top: 1px solid rgba(102, 124, 108, 0.13);
}

.legend-title {
  margin-bottom: 1px;

  color: #9d4c47;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.09em;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;

  color: rgba(72, 91, 79, 0.66);
  font-size: 9px;
}

.legend-item i {
  display: inline-block;
  flex: none;
}

.legend-core {
  width: 10px;
  height: 10px;

  background: #fffcef;
  border: 1.5px solid #9d4c47;
  border-radius: 50%;
}

.legend-completed {
  width: 10px;
  height: 10px;

  background: #b8a36a;
  border-radius: 50%;
}

.legend-water {
  width: 17px;
  height: 7px;

  border-top: 1.5px solid #5d8888;
  border-radius: 50%;
}

.legend-route {
  width: 17px;
  height: 0;

  border-top: 2px dashed #9d4c47;
}

/* =====================================================
   服务设施筛选
   ===================================================== */

.service-filter-block {
  position: relative;

  margin-top: 14px;
  padding-top: 13px;

  border-top: 1px solid rgba(102, 124, 108, 0.13);
}

.filter-toggle {
  display: flex;
  align-items: center;

  width: 100%;
  gap: 7px;
  padding: 0;

  color: rgba(68, 89, 76, 0.78);
  background: transparent;
  border: 0;

  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.055em;
}

.filter-toggle svg:last-child {
  margin-left: auto;

  transition: transform 0.25s ease;
}

.filter-toggle svg.is-open {
  transform: rotate(180deg);
}

.filter-options {
  display: grid;
  gap: 8px;

  margin-top: 11px;
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 7px;

  color: rgba(72, 91, 79, 0.65);
  font-size: 10px;
  cursor: pointer;
}

.filter-options input {
  position: absolute;

  opacity: 0;
  pointer-events: none;
}

.checkbox-ui {
  position: relative;

  display: inline-block;

  width: 13px;
  height: 13px;

  background: rgba(255, 253, 245, 0.7);
  border: 1px solid rgba(111, 136, 124, 0.48);
  border-radius: 4px;
}

.filter-options input:checked + .checkbox-ui {
  background: #6f887c;
  border-color: #6f887c;
}

.filter-options input:checked + .checkbox-ui::after {
  position: absolute;
  top: 2px;
  left: 4px;

  width: 4px;
  height: 7px;

  border: solid #fffcef;
  border-width: 0 1.5px 1.5px 0;

  content: "";
  transform: rotate(45deg);
}

.filter-slide-enter-active,
.filter-slide-leave-active {
  overflow: hidden;

  transition:
    opacity 0.22s ease,
    max-height 0.22s ease;
}

.filter-slide-enter-from,
.filter-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.filter-slide-enter-to,
.filter-slide-leave-from {
  max-height: 120px;
  opacity: 1;
}

.journey-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  margin-top: 14px;
  padding: 0;

  color: #9d4c47;
  background: transparent;
  border: 0;

  font-size: 10px;
  letter-spacing: 0.035em;

  transition:
    transform 0.22s ease,
    color 0.22s ease;
}

.journey-link:hover {
  color: #7f423f;
  transform: translateX(2px);
}

/* =====================================================
   左下地图控制
   ===================================================== */

.map-controls {
  position: absolute;
  z-index: 28;
  bottom: 24px;
  left: 24px;

  display: grid;
  overflow: hidden;

  background: rgba(250, 249, 240, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 13px;
  box-shadow: 0 10px 28px rgba(57, 78, 65, 0.1);
  backdrop-filter: blur(12px);
}

.map-controls button {
  display: grid;

  width: 42px;
  height: 42px;

  place-items: center;

  color: #526b60;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(93, 112, 99, 0.12);

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.map-controls button:last-child {
  border-bottom: 0;
}

.map-controls button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.8);
}

.zoom-status {
  position: absolute;
  z-index: 28;
  bottom: 24px;
  left: 78px;

  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 8px 10px;

  color: rgba(73, 94, 81, 0.68);
  background: rgba(250, 249, 240, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  backdrop-filter: blur(10px);

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  font-weight: 600;
}

/* =====================================================
   中等桌面屏幕适配
   ===================================================== */

@media (max-width: 1100px) {
  .map-page-content {
    width: calc(100% - 48px);
  }

  .map-stage {
    min-width: 760px;
  }
}

/* =====================================================
   手机端适配
   ===================================================== */

@media (max-width: 900px) {
  .map-page-content {
    width: calc(100% - 28px);
    height: calc(100svh - 88px);
    min-height: 620px;

    margin-bottom: 14px;
  }

  .map-viewport {
    border-radius: 20px;
  }

  .map-stage {
    top: 54%;
    left: 50%;

    width: 860px;
    min-width: 860px;
  }

  .map-info-panel {
    top: 14px;
    left: 14px;

    width: 200px;
    padding: 14px;
  }

  .map-info-panel.is-collapsed {
    width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
  }

  .collapsed-info-button {
    width: 44px;
    height: 44px;
  }

  .map-info-panel h1 {
    font-size: 20px;
  }

  .map-info-description,
  .map-legend,
  .journey-link {
    display: none;
  }

  .route-progress-block {
    margin-top: 11px;
    padding-top: 10px;
  }

  .service-filter-block {
    margin-top: 10px;
    padding-top: 10px;
  }

  .map-controls {
    bottom: 16px;
    left: 16px;
  }

  .map-controls button {
    width: 38px;
    height: 38px;
  }

  .zoom-status {
    bottom: 16px;
    left: 66px;
  }
}
</style>