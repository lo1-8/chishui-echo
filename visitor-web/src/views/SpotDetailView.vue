<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  Compass,
  ExternalLink,
  Heart,
  LoaderCircle,
  Map,
  MapPin,
  Share2,
  Sparkles
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import AudioPlayer from '../components/audio/AudioPlayer.vue'
import QuizCard from '../components/spot/QuizCard.vue'
import ServiceHintList from '../components/spot/ServiceHintList.vue'

import {
  getServicePoints,
  getSpotDetail,
  recordUserEvent
} from '../api/map'

import { useJourneyStore } from '../stores/journey'
import { getAssetUrl } from '../utils/asset'
import { openBaiduNavigation } from '../utils/navigation'
import { getVisitorId } from '../utils/visitor'

const route = useRoute()
const router = useRouter()
const journeyStore = useJourneyStore()

const spot = ref(null)
const services = ref([])

const isLoading = ref(true)
const errorMessage = ref('')

const selectedAudioIndex = ref(0)

const isStoryExpanded = ref(false)
const showTranscript = ref(false)
const isCheckInSuccess = ref(false)

/* =====================================================
   一、路由与数据
   ===================================================== */

const currentSpotId = computed(() => {
  return Number(route.params.id)
})

const selectedAudio = computed(() => {
  if (!spot.value?.audios?.length) {
    return null
  }

  return spot.value.audios[selectedAudioIndex.value] ||
    spot.value.audios[0]
})

const coverImageUrl = computed(() => {
  if (!spot.value?.cover_image) {
    return ''
  }

  return getAssetUrl(spot.value.cover_image)
})

const isCheckedIn = computed(() => {
  if (!spot.value?.id) {
    return false
  }

  return journeyStore.isCheckedIn(spot.value.id)
})

const isFavorite = computed(() => {
  if (!spot.value?.id) {
    return false
  }

  return journeyStore.isFavorite(spot.value.id)
})

const isListened = computed(() => {
  if (!spot.value?.id) {
    return false
  }

  return journeyStore.isListened(spot.value.id)
})

const isQuizCompleted = computed(() => {
  if (!spot.value?.id) {
    return false
  }

  return journeyStore.isQuizCompleted(spot.value.id)
})

const firstQuizQuestion = computed(() => {
  if (!spot.value?.quiz_questions?.length) {
    return null
  }

  return spot.value.quiz_questions[0]
})

const nearbyServices = computed(() => {
  if (!spot.value || !services.value.length) {
    return []
  }

  /*
    当前 MVP 没有真实道路距离数据，
    使用 SVG map_x / map_y 的相对距离进行简单排序。
    后续接入地图 API 后可替换为真实步行距离。
  */
  return [...services.value]
    .map((service) => {
      const distance = Math.sqrt(
        Math.pow(
          Number(service.map_x) - Number(spot.value.map_x),
          2
        ) +
        Math.pow(
          Number(service.map_y) - Number(spot.value.map_y),
          2
        )
      )

      return {
        ...service,
        virtual_distance: distance
      }
    })
    .sort((a, b) => {
      return a.virtual_distance - b.virtual_distance
    })
    .slice(0, 3)
})

const nextSpot = computed(() => {
  return spot.value?.next_spot || null
})

const storyPreview = computed(() => {
  const content = spot.value?.story_content || ''

  if (isStoryExpanded.value) {
    return content
  }

  if (content.length <= 180) {
    return content
  }

  return `${content.slice(0, 180)}……`
})

/* =====================================================
   二、数据加载
   ===================================================== */

async function loadSpotData() {
  isLoading.value = true
  errorMessage.value = ''
  spot.value = null
  selectedAudioIndex.value = 0
  isStoryExpanded.value = false
  showTranscript.value = false
  isCheckInSuccess.value = false

  try {
    const [spotResult, servicesResult] = await Promise.all([
      getSpotDetail(currentSpotId.value),
      getServicePoints()
    ])

    spot.value = spotResult.data
    services.value = servicesResult.data || []

    recordEvent('spot_view', {
      source: 'spot_detail_page'
    })
  } catch (error) {
    console.error('加载点位详情失败：', error)

    errorMessage.value =
      '当前点位详情加载失败，请确认后端服务与点位数据是否正常。'
  } finally {
    isLoading.value = false
  }
}

/* =====================================================
   三、匿名行为记录
   ===================================================== */

function recordEvent(eventType, eventValue = null) {
  if (!spot.value?.id) return

  recordUserEvent({
    visitor_id: getVisitorId(),
    event_type: eventType,
    spot_id: spot.value.id,
    event_value: eventValue
  }).catch((error) => {
    console.warn('行为统计记录失败：', error)
  })
}

/* =====================================================
   四、音频相关事件
   ===================================================== */

function handleAudioPlay(audio) {
  recordEvent('audio_play', {
    audio_id: audio?.id || null,
    audio_title: audio?.title || ''
  })
}

function handleAudioPause(audio) {
  recordEvent('audio_pause', {
    audio_id: audio?.id || null
  })
}

function handleAudioEnded(audio) {
  if (!spot.value?.id) return

  journeyStore.markListened(spot.value.id)

  recordEvent('audio_complete', {
    audio_id: audio?.id || null,
    audio_title: audio?.title || ''
  })
}

function handleAudioError() {
  window.alert(
    '当前音频暂时无法播放。请检查后端 uploads/audios 目录中的文件是否存在，以及数据库中的 audio_url 是否正确。'
  )
}

function selectAudio(index) {
  selectedAudioIndex.value = index
}

/* =====================================================
   五、打卡、收藏与问答
   ===================================================== */

function handleCheckIn() {
  if (!spot.value?.id) return

  if (!journeyStore.isCheckedIn(spot.value.id)) {
    journeyStore.checkInSpot(spot.value.id)

    recordEvent('spot_checkin', {
      source: 'spot_detail_page'
    })
  }

  isCheckInSuccess.value = true

  window.setTimeout(() => {
    isCheckInSuccess.value = false
  }, 2400)
}

function handleFavorite() {
  if (!spot.value?.id) return

  const wasFavorite = journeyStore.isFavorite(spot.value.id)

  journeyStore.toggleFavorite(spot.value.id)

  recordEvent(
    wasFavorite
      ? 'spot_uncollect'
      : 'spot_collect',
    {
      source: 'spot_detail_page'
    }
  )
}

function handleQuizComplete(payload) {
  if (!spot.value?.id) return

  journeyStore.completeQuiz(spot.value.id)

  recordEvent('quiz_complete', {
    question_id: payload.questionId,
    is_correct: payload.isCorrect,
    selected_answer: payload.selectedAnswer
  })
}

/* =====================================================
   六、导航、分享、下一站
   ===================================================== */

function goBackToMap() {
  router.push('/map')
}

function navigateToSpot() {
  if (!spot.value) return

  recordEvent('navigation_click', {
    source: 'spot_detail_page'
  })

  openBaiduNavigation(spot.value)
}

function navigateToService(service) {
  recordEvent('navigation_click', {
    source: 'spot_detail_service',
    service_id: service.id,
    service_name: service.name
  })

  openBaiduNavigation(service)
}

function goToNextSpot() {
  if (!nextSpot.value?.id) return

  router.push({
    name: 'spot-detail',
    params: {
      id: nextSpot.value.id
    }
  })
}

async function shareSpot() {
  if (!spot.value) return

  const shareTitle = `${spot.value.name}｜赤水回声`
  const shareText = spot.value.short_intro ||
    '在太平古镇，聆听一段仍在山河之间回响的长征记忆。'

  const shareUrl = window.location.href

  recordEvent('share_generate', {
    source: 'spot_detail_page'
  })

  try {
    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      })

      return
    }

    await navigator.clipboard.writeText(shareUrl)

    window.alert(
      '当前点位链接已复制。你可以粘贴到微信、朋友圈或其他社交平台中分享。'
    )
  } catch (error) {
    console.warn('分享操作未完成：', error)
  }
}

/* =====================================================
   七、页面滚动
   ===================================================== */

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId)

  if (!target) return

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

/* =====================================================
   八、生命周期与路由切换
   ===================================================== */

watch(
  () => route.params.id,
  () => {
    loadSpotData()

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
)

onMounted(() => {
  loadSpotData()
})

onBeforeUnmount(() => {
  /*
    目前没有需要主动销毁的全局事件。
    预留生命周期位置，后续可用于停止全局音频等。
  */
})
</script>

<template>
  <main class="spot-detail-page">
    <!-- =================================================
         顶部导航
         ================================================= -->

    <header class="spot-header">
      <div class="spot-header-inner">
        <button
          type="button"
          class="back-map-button"
          @click="goBackToMap"
        >
          <ArrowLeft
            :size="17"
            :stroke-width="1.7"
          />

          <span>返回声音地图</span>
        </button>

        <RouterLink
          to="/"
          class="spot-brand"
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

        <button
          type="button"
          class="share-button"
          title="分享当前点位"
          @click="shareSpot"
        >
          <Share2
            :size="17"
            :stroke-width="1.7"
          />

          <span>分享此站</span>
        </button>
      </div>
    </header>

    <!-- =================================================
         加载状态
         ================================================= -->

    <section
      v-if="isLoading"
      class="detail-loading"
    >
      <LoaderCircle
        :size="34"
        :stroke-width="1.4"
        class="loading-icon"
      />

      <p>正在打开这段历史声音…</p>
    </section>

    <!-- =================================================
         错误状态
         ================================================= -->

    <section
      v-else-if="errorMessage"
      class="detail-error"
    >
      <MapPin
        :size="34"
        :stroke-width="1.4"
      />

      <h1>暂时无法打开该点位</h1>

      <p>{{ errorMessage }}</p>

      <button
        type="button"
        @click="goBackToMap"
      >
        返回声音地图
      </button>
    </section>

    <!-- =================================================
         详情主体
         ================================================= -->

    <template v-else-if="spot">
      <!-- Hero 区域 -->
      <section class="spot-hero">
        <div
          class="spot-hero-image"
          :style="{
            backgroundImage: coverImageUrl
              ? `url(${coverImageUrl})`
              : ''
          }"
        >
          <div class="spot-hero-image-overlay"></div>

          <div class="hero-watermark">
            <span>CHISHUI</span>
            <span>ECHOES</span>
          </div>
        </div>

        <div class="spot-hero-content">
          <div class="spot-number-row">
            <span class="spot-number">
              {{ String(spot.route_order).padStart(2, '0') }}
            </span>

            <span class="spot-type-line"></span>

            <span class="spot-type">
              {{ spot.type }}
            </span>
          </div>

          <p class="spot-location">
            四川 · 古蔺 · 太平古镇
          </p>

          <h1>{{ spot.name }}</h1>

          <p class="hero-subtitle">
            {{ spot.subtitle }}
          </p>

          <p class="hero-intro">
            {{ spot.short_intro }}
          </p>

          <div class="hero-actions">
            <button
              type="button"
              class="check-in-button"
              :class="{
                'is-checked-in': isCheckedIn
              }"
              @click="handleCheckIn"
            >
              <CircleCheck
                v-if="isCheckedIn"
                :size="18"
                :stroke-width="1.8"
              />

              <MapPin
                v-else
                :size="18"
                :stroke-width="1.8"
              />

              <span>
                {{
                  isCheckedIn
                    ? '已留下赤水足迹'
                    : '在此打卡'
                }}
              </span>
            </button>

            <button
              type="button"
              class="favorite-button"
              :class="{
                'is-favorite': isFavorite
              }"
              @click="handleFavorite"
            >
              <Heart
                :size="18"
                :stroke-width="1.7"
                :fill="isFavorite ? 'currentColor' : 'none'"
              />

              <span>
                {{
                  isFavorite
                    ? '已收藏'
                    : '收藏此站'
                }}
              </span>
            </button>

            <button
              type="button"
              class="hero-navigation-button"
              @click="navigateToSpot"
            >
              <Compass
                :size="18"
                :stroke-width="1.7"
              />

              <span>外部导航</span>
            </button>
          </div>

          <transition name="checkin-tip">
            <div
              v-if="isCheckInSuccess"
              class="checkin-success-tip"
            >
              <Check
                :size="15"
                :stroke-width="2"
              />

              已记录你的赤水足迹
            </div>
          </transition>
        </div>

        <!-- Hero 右下角快速导航 -->
        <div class="hero-section-nav">
          <button
            type="button"
            @click="scrollToSection('audio-section')"
          >
            聆听声音
          </button>

          <button
            type="button"
            @click="scrollToSection('story-section')"
          >
            阅读故事
          </button>

          <button
            v-if="firstQuizQuestion"
            type="button"
            @click="scrollToSection('quiz-section')"
          >
            研学问答
          </button>
        </div>
      </section>

      <!-- 页面主体内容 -->
      <section class="spot-content-layout">
        <!-- 左侧主内容 -->
        <div class="spot-main-column">
          <!-- 音频导览 -->
          <section
            id="audio-section"
            class="content-section audio-section"
          >
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  LISTEN TO HISTORY
                </p>

                <h2>聆听此地</h2>
              </div>

              <span
                v-if="isListened"
                class="listened-badge"
              >
                <Check
                  :size="13"
                  :stroke-width="2"
                />

                已聆听
              </span>
            </div>

            <p class="section-description">
              建议佩戴耳机，让环境声、讲述声与历史空间在你的耳边缓慢展开。
            </p>

            <div
              v-if="spot.audios?.length"
              class="audio-tabs"
            >
              <button
                v-for="(audio, index) in spot.audios"
                :key="audio.id || index"
                type="button"
                class="audio-tab"
                :class="{
                  'is-active': selectedAudioIndex === index
                }"
                @click="selectAudio(index)"
              >
                <span>
                  {{ String(index + 1).padStart(2, '0') }}
                </span>

                {{ audio.title }}
              </button>
            </div>

            <AudioPlayer
              v-if="selectedAudio"
              :audio="selectedAudio"
              @play="handleAudioPlay"
              @pause="handleAudioPause"
              @ended="handleAudioEnded"
              @error="handleAudioError"
            />

            <button
              v-if="selectedAudio?.transcript"
              type="button"
              class="transcript-toggle"
              @click="showTranscript = !showTranscript"
            >
              <span>
                {{
                  showTranscript
                    ? '收起声音逐字稿'
                    : '查看声音逐字稿'
                }}
              </span>

              <ChevronRight
                :size="15"
                :stroke-width="1.7"
                :class="{
                  'is-open': showTranscript
                }"
              />
            </button>

            <transition name="transcript-slide">
              <article
                v-if="showTranscript && selectedAudio?.transcript"
                class="transcript-card"
              >
                <span class="transcript-label">
                  音频逐字稿
                </span>

                <p>
                  {{ selectedAudio.transcript }}
                </p>
              </article>
            </transition>
          </section>

          <!-- 红色故事 -->
          <section
            id="story-section"
            class="content-section story-section"
          >
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  STORY OF THIS PLACE
                </p>

                <h2>红色故事</h2>
              </div>

              <Sparkles
                :size="20"
                :stroke-width="1.45"
                class="section-decoration-icon"
              />
            </div>

            <article class="story-card">
              <p>
                {{ storyPreview }}
              </p>

              <button
                v-if="spot.story_content?.length > 180"
                type="button"
                class="story-expand-button"
                @click="isStoryExpanded = !isStoryExpanded"
              >
                {{
                  isStoryExpanded
                    ? '收起故事'
                    : '展开阅读全文'
                }}

                <ChevronRight
                  :size="15"
                  :stroke-width="1.7"
                  :class="{
                    'is-open': isStoryExpanded
                  }"
                />
              </button>

            </article>
          </section>

          <!-- 趣味问答 -->
          <section
            v-if="firstQuizQuestion"
            id="quiz-section"
            class="content-section quiz-section"
          >
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  THINK WITH HISTORY
                </p>

                <h2>趣味问答</h2>
              </div>

              <span
                v-if="isQuizCompleted"
                class="listened-badge"
              >
                <Check
                  :size="13"
                  :stroke-width="2"
                />

                已完成
              </span>
            </div>

            <QuizCard
              :question="firstQuizQuestion"
              :is-completed="isQuizCompleted"
              @complete="handleQuizComplete"
            />
          </section>
        </div>

        <!-- 右侧辅助内容 -->
        <aside class="spot-side-column">
          <!-- 位置摘要 -->
          <section class="location-card">
            <div class="location-card-icon">
              <MapPin
                :size="19"
                :stroke-width="1.65"
              />
            </div>

            <div>
              <p>地图位置</p>

              <strong>
                太平古镇 · 第
                {{ String(spot.route_order).padStart(2, '0') }}
                站
              </strong>
            </div>

            <button
              type="button"
              title="在百度地图中查看"
              @click="navigateToSpot"
            >
              <ExternalLink
                :size="16"
                :stroke-width="1.7"
              />
            </button>
          </section>

          <!-- 附近服务 -->
          <ServiceHintList
            :services="nearbyServices"
            @navigate="navigateToService"
          />

          <!-- 下一站 -->
          <section
            v-if="nextSpot"
            class="next-spot-card"
          >
            <p class="next-spot-kicker">
              NEXT STOP
            </p>

            <span class="next-number">
              {{ String(nextSpot.route_order).padStart(2, '0') }}
            </span>

            <h3>
              {{ nextSpot.name }}
            </h3>

            <p>
              沿着古镇的街巷与历史线索，
              继续前往下一段声音记忆。
            </p>

            <button
              type="button"
              @click="goToNextSpot"
            >
              前往下一站

              <ArrowRight
                :size="16"
                :stroke-width="1.8"
              />
            </button>
          </section>

          <!-- 路线结束 -->
          <section
            v-else
            class="route-end-card"
          >
            <CircleCheck
              :size="25"
              :stroke-width="1.5"
            />

            <h3>你已抵达渡口</h3>

            <p>
              赤水河仍在流淌，
              而这段声音旅程也将在你的记忆中继续回响。
            </p>

            <button
              type="button"
              @click="router.push('/journey')"
            >
              查看我的旅程
            </button>
          </section>
        </aside>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
/* =====================================================
   页面整体
   ===================================================== */

.spot-detail-page {
  min-height: 100vh;
  overflow-x: hidden;

  color: #45594d;
  background:
    radial-gradient(
      circle at 85% 12%,
      rgba(255, 245, 215, 0.52),
      transparent 27%
    ),
    radial-gradient(
      circle at 10% 78%,
      rgba(185, 208, 194, 0.28),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #f8f7ef,
      #edf1e9 54%,
      #dfe9df
    );
}

.spot-detail-page::before {
  position: fixed;
  z-index: 0;
  inset: 0;

  pointer-events: none;

  opacity: 0.13;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(68, 89, 75, 0.025) 0,
      rgba(68, 89, 75, 0.025) 1px,
      transparent 1px,
      transparent 6px
    );

  content: "";
}

/* =====================================================
   顶部导航
   ===================================================== */

.spot-header {
  position: relative;
  z-index: 5;

  width: 100%;
}

.spot-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(calc(100% - 88px), 1480px);
  min-height: 82px;
  margin: 0 auto;
}

.back-map-button,
.share-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: rgba(66, 84, 72, 0.7);
  background: transparent;
  border: 0;

  font-size: 12px;
  letter-spacing: 0.04em;

  transition:
    color 0.22s ease,
    transform 0.22s ease;
}

.back-map-button:hover {
  color: #9d4c47;
  transform: translateX(-2px);
}

.share-button:hover {
  color: #9d4c47;
  transform: translateY(-2px);
}

.spot-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: #344139;

  transition: opacity 0.22s ease;
}

.spot-brand:hover {
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

/* =====================================================
   加载与错误状态
   ===================================================== */

.detail-loading,
.detail-error {
  position: relative;
  z-index: 2;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-height: calc(100vh - 82px);
  padding: 30px;

  text-align: center;
}

.detail-loading {
  color: rgba(78, 97, 85, 0.7);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
}

.loading-icon {
  color: #9d4c47;
  animation: loadingSpin 1.1s linear infinite;
}

.detail-loading p {
  margin-top: 16px;
  font-size: 15px;
  letter-spacing: 0.06em;
}

@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}

.detail-error {
  color: #45594d;
}

.detail-error h1 {
  margin: 17px 0 8px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    serif;
  font-size: 27px;
  font-weight: 500;
}

.detail-error p {
  max-width: 460px;
  margin: 0;

  color: rgba(75, 92, 80, 0.66);
  font-size: 14px;
  line-height: 1.8;
}

.detail-error button {
  margin-top: 24px;
  padding: 11px 18px;

  color: #fffcef;
  background: #9d4c47;
  border: 0;
  border-radius: 999px;
}

/* =====================================================
   Hero 区域
   ===================================================== */

.spot-hero {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);

  width: min(calc(100% - 88px), 1480px);
  min-height: 500px;
  overflow: hidden;

  margin: 10px auto 0;

  background: rgba(246, 246, 237, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 26px;
  box-shadow: 0 20px 60px rgba(61, 80, 68, 0.1);
}

.spot-hero-image {
  position: relative;

  min-height: 500px;

  background-color: #9db8ad;
  background-position: center;
  background-size: cover;
}

.spot-hero-image::before {
  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      circle at 70% 20%,
      rgba(248, 235, 197, 0.3),
      transparent 25%
    ),
    linear-gradient(
      135deg,
      rgba(93, 136, 136, 0.36),
      rgba(62, 90, 78, 0.72)
    );

  content: "";
}

.spot-hero-image-overlay {
  position: absolute;
  inset: 0;

  background:
    linear-gradient(
      90deg,
      rgba(25, 44, 36, 0.2),
      rgba(25, 44, 36, 0.04)
    );
}

.hero-watermark {
  position: absolute;
  bottom: 28px;
  left: 30px;

  display: flex;
  flex-direction: column;

  color: rgba(255, 253, 244, 0.7);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: clamp(34px, 4vw, 72px);
  font-weight: 600;
  letter-spacing: 0.13em;
  line-height: 0.82;
}

.spot-hero-content {
  position: relative;

  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: clamp(42px, 5vw, 78px);
}

.spot-number-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spot-number {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.spot-type-line {
  width: 24px;
  height: 1px;
  background: rgba(157, 76, 71, 0.65);
}

.spot-type {
  color: rgba(89, 106, 94, 0.72);
  font-size: 11px;
  letter-spacing: 0.09em;
}

.spot-location {
  margin: 28px 0 8px;

  color: rgba(91, 109, 97, 0.59);
  font-size: 11px;
  letter-spacing: 0.15em;
}

.spot-hero-content h1 {
  margin: 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(36px, 4.1vw, 62px);
  font-weight: 500;
  letter-spacing: 0.07em;
  line-height: 1.22;
}

.hero-subtitle {
  margin: 15px 0 0;

  color: #7f423f;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 17px;
  letter-spacing: 0.07em;
  line-height: 1.8;
}

.hero-intro {
  max-width: 450px;
  margin: 17px 0 0;

  color: rgba(67, 86, 74, 0.7);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 14px;
  letter-spacing: 0.04em;
  line-height: 2;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  margin-top: 30px;
}

.check-in-button,
.favorite-button,
.hero-navigation-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  min-height: 42px;
  padding: 0 15px;

  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;

  transition:
    transform 0.22s ease,
    color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.check-in-button {
  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 9px 22px rgba(127, 66, 63, 0.18);
}

.check-in-button:hover {
  box-shadow: 0 13px 28px rgba(127, 66, 63, 0.28);
  transform: translateY(-2px);
}

.check-in-button.is-checked-in {
  background:
    linear-gradient(
      135deg,
      #b8a36a,
      #9b8453
    );
}

.favorite-button,
.hero-navigation-button {
  color: #526b60;
  background: rgba(255, 253, 245, 0.52);
  border: 1px solid rgba(95, 120, 107, 0.2);
}

.favorite-button:hover,
.hero-navigation-button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.88);
  transform: translateY(-2px);
}

.favorite-button.is-favorite {
  color: #9d4c47;
  background: rgba(234, 212, 206, 0.48);
  border-color: rgba(157, 76, 71, 0.38);
}

.checkin-success-tip {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  width: fit-content;
  margin-top: 14px;
  padding: 8px 11px;

  color: #4d8c66;
  background: rgba(220, 237, 221, 0.68);
  border-radius: 999px;

  font-size: 11px;
  letter-spacing: 0.04em;
}

.checkin-tip-enter-active,
.checkin-tip-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.checkin-tip-enter-from,
.checkin-tip-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hero-section-nav {
  position: absolute;
  right: 26px;
  bottom: 22px;

  display: flex;
  gap: 8px;
}

.hero-section-nav button {
  padding: 6px 9px;

  color: rgba(73, 91, 80, 0.62);
  background: rgba(255, 253, 245, 0.46);
  border: 1px solid rgba(112, 135, 121, 0.16);
  border-radius: 999px;

  font-size: 10px;
  letter-spacing: 0.035em;
  backdrop-filter: blur(8px);

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.hero-section-nav button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.8);
}

/* =====================================================
   页面正文布局
   ===================================================== */

.spot-content-layout {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 32px;

  width: min(calc(100% - 180px), 1300px);
  margin: 48px auto 90px;
}

.spot-main-column {
  display: grid;
  gap: 42px;
}

.spot-side-column {
  display: grid;
  align-content: start;
  gap: 18px;
}

.content-section {
  scroll-margin-top: 28px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;

  margin-bottom: 15px;
}

.section-kicker {
  margin: 0;

  color: rgba(102, 117, 106, 0.56);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.section-heading h2 {
  margin: 7px 0 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 29px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.section-description {
  margin: 0 0 18px;

  color: rgba(76, 94, 82, 0.64);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.035em;
  line-height: 1.9;
}

.section-decoration-icon {
  color: rgba(184, 163, 106, 0.72);
}

.listened-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 6px 9px;

  color: #4d8c66;
  background: rgba(220, 237, 221, 0.52);
  border-radius: 999px;

  font-size: 10px;
  letter-spacing: 0.04em;
}

/* =====================================================
   音频区域
   ===================================================== */

.audio-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;

  margin: 0 0 12px;
  padding-bottom: 3px;
}

.audio-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  flex: none;
  padding: 7px 10px;

  color: rgba(77, 96, 84, 0.64);
  background: rgba(247, 248, 240, 0.4);
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 999px;

  font-size: 10px;
  letter-spacing: 0.03em;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.audio-tab span {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  font-weight: 600;
}

.audio-tab:hover,
.audio-tab.is-active {
  color: #7f423f;
  background: rgba(234, 212, 206, 0.45);
  border-color: rgba(157, 76, 71, 0.28);
}

.transcript-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  margin-top: 14px;
  padding: 0;

  color: #6f887c;
  background: transparent;
  border: 0;

  font-size: 11px;
  letter-spacing: 0.04em;
}

.transcript-toggle svg {
  transition: transform 0.22s ease;
}

.transcript-toggle svg.is-open {
  transform: rotate(90deg);
}

.transcript-card {
  margin-top: 12px;
  padding: 17px 19px;

  background: rgba(250, 249, 240, 0.46);
  border-left: 2px solid rgba(157, 76, 71, 0.5);
  border-radius: 0 12px 12px 0;
}

.transcript-label {
  color: #9d4c47;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.transcript-card p {
  margin: 9px 0 0;

  color: rgba(71, 88, 77, 0.7);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.035em;
  line-height: 1.95;
}

.transcript-slide-enter-active,
.transcript-slide-leave-active {
  overflow: hidden;

  transition:
    opacity 0.24s ease,
    max-height 0.24s ease,
    margin 0.24s ease;
}

.transcript-slide-enter-from,
.transcript-slide-leave-to {
  max-height: 0;
  margin-top: 0;
  opacity: 0;
}

.transcript-slide-enter-to,
.transcript-slide-leave-from {
  max-height: 420px;
  opacity: 1;
}

/* =====================================================
   故事区域
   ===================================================== */

.story-card {
  padding: 27px 28px;

  background:
    linear-gradient(
      135deg,
      rgba(247, 245, 237, 0.64),
      rgba(235, 241, 233, 0.48)
    );
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 19px;
}

.story-card > p {
  margin: 0;

  color: rgba(61, 80, 68, 0.78);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 15px;
  letter-spacing: 0.045em;
  line-height: 2.05;
}

.story-expand-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  margin-top: 16px;
  padding: 0;

  color: #9d4c47;
  background: transparent;
  border: 0;

  font-size: 11px;
  letter-spacing: 0.04em;
}

.story-expand-button svg {
  transition: transform 0.22s ease;
}

.story-expand-button svg.is-open {
  transform: rotate(90deg);
}



/* =====================================================
   右侧辅助卡片
   ===================================================== */

.location-card {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 16px;

  background: rgba(250, 249, 240, 0.54);
  border: 1px solid rgba(111, 136, 124, 0.14);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(62, 82, 69, 0.04);
}

.location-card-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;

  color: #9d4c47;
  background: rgba(234, 212, 206, 0.5);
  border-radius: 50%;
}

.location-card > div:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.location-card p {
  margin: 0;

  color: rgba(88, 105, 93, 0.58);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.location-card strong {
  overflow: hidden;

  color: #45594d;
  font-family:
    "Noto Serif SC",
    serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-card button {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;

  color: #6f887c;
  background: transparent;
  border: 1px solid rgba(111, 136, 124, 0.18);
  border-radius: 50%;

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.location-card button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.8);
}

.next-spot-card,
.route-end-card {
  padding: 22px;

  background:
    linear-gradient(
      135deg,
      rgba(234, 212, 206, 0.52),
      rgba(246, 241, 225, 0.56)
    );
  border: 1px solid rgba(157, 76, 71, 0.16);
  border-radius: 18px;
}

.next-spot-kicker {
  margin: 0;

  color: rgba(157, 76, 71, 0.7);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.next-number {
  display: block;
  margin-top: 12px;

  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
}

.next-spot-card h3,
.route-end-card h3 {
  margin: 8px 0 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1.45;
}

.next-spot-card p,
.route-end-card p {
  margin: 11px 0 0;

  color: rgba(74, 91, 80, 0.66);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 12px;
  letter-spacing: 0.025em;
  line-height: 1.85;
}

.next-spot-card button,
.route-end-card button {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  margin-top: 17px;
  padding: 0;

  color: #9d4c47;
  background: transparent;
  border: 0;

  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;

  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.next-spot-card button:hover,
.route-end-card button:hover {
  color: #7f423f;
  transform: translateX(2px);
}

.route-end-card {
  color: #5d8888;
  background:
    linear-gradient(
      135deg,
      rgba(222, 237, 228, 0.68),
      rgba(244, 239, 220, 0.58)
    );
  border-color: rgba(93, 136, 136, 0.16);
}

/* =====================================================
   响应式布局
   ===================================================== */

@media (max-width: 1100px) {
  .spot-header-inner {
    width: calc(100% - 56px);
  }

  .spot-hero {
    width: calc(100% - 56px);
  }

  .spot-content-layout {
    width: calc(100% - 110px);
    grid-template-columns: minmax(0, 1fr) 290px;
    gap: 24px;
  }

  .spot-hero-content {
    padding: 44px;
  }
}

@media (max-width: 850px) {
  .spot-header-inner {
    width: calc(100% - 36px);
    min-height: 70px;
  }

  .back-map-button span,
  .share-button span,
  .brand-text small {
    display: none;
  }

  .spot-hero {
    display: block;

    width: calc(100% - 36px);
    min-height: 0;
  }

  .spot-hero-image {
    min-height: 250px;
  }

  .spot-hero-content {
    padding: 34px 24px 74px;
  }

  .spot-hero-content h1 {
    font-size: 38px;
  }

  .hero-section-nav {
    right: 18px;
    bottom: 18px;
  }

  .spot-content-layout {
    display: grid;
    grid-template-columns: 1fr;

    width: calc(100% - 42px);
    margin-top: 32px;
  }

  .spot-side-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .spot-header-inner {
    width: calc(100% - 28px);
  }

  .spot-brand {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .brand-text strong {
    font-size: 14px;
  }

  .spot-hero {
    width: calc(100% - 28px);
  }

  .spot-hero-image {
    min-height: 205px;
  }

  .hero-watermark {
    bottom: 18px;
    left: 20px;
    font-size: 35px;
  }

  .spot-hero-content {
    padding: 28px 19px 66px;
  }

  .spot-location {
    margin-top: 20px;
  }

  .spot-hero-content h1 {
    font-size: 31px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .hero-intro {
    font-size: 13px;
  }

  .hero-actions {
    gap: 8px;
  }

  .check-in-button,
  .favorite-button,
  .hero-navigation-button {
    min-height: 38px;
    padding: 0 11px;
    font-size: 11px;
  }

  .hero-section-nav button {
    padding: 5px 7px;
    font-size: 9px;
  }

  .spot-content-layout {
    width: calc(100% - 28px);
    gap: 28px;
  }

  .section-heading h2 {
    font-size: 25px;
  }

  .story-card {
    padding: 21px 19px;
  }

  .story-card > p {
    font-size: 14px;
  }

  .panel-actions {
    grid-template-columns: 1fr;
  }
}
</style>
