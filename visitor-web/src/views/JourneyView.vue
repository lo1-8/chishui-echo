<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CircleCheck,
  Clock3,
  Compass,
  Heart,
  LoaderCircle,
  Map,
  MapPin,
  RefreshCcw,
  Sparkles,
  Star,
  Volume2
} from 'lucide-vue-next'

import { getPublicSpots } from '../api/map'
import { getAssetUrl } from '../utils/asset'
import { useJourneyStore } from '../stores/journey'

const router = useRouter()
const journeyStore = useJourneyStore()

/* =====================================================
   一、页面数据状态
   ===================================================== */

const spots = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

/* =====================================================
   二、徽章配置
   ===================================================== */

/*
  这里的 badge id 必须与 journey.js 中 updateBadges() 的
  badge id 保持一致。

  当前 journeyStore 中已有：

  ferry-listener
  town-explorer
  chishui-walker
*/
const badgeDefinitions = [
  {
    id: 'ferry-listener',
    name: '渡口聆听者',
    subtitle: '完成太平渡渡口导览',
    description: '你曾在赤水河畔停下脚步，聆听渡口的水声与回响。',
    icon: Volume2,
    colorClass: 'badge-river'
  },
  {
    id: 'town-explorer',
    name: '古镇寻迹者',
    subtitle: '完成 3 个核心点位打卡',
    description: '你已经沿着太平古镇的街巷，寻找过三段不同的红色记忆。',
    icon: MapPin,
    colorClass: 'badge-town'
  },
  {
    id: 'chishui-walker',
    name: '赤水回声行者',
    subtitle: '完成全部 5 个核心点位打卡',
    description: '你已完成整条声音路线，让赤水河畔的历史回响留在旅程之中。',
    icon: Award,
    colorClass: 'badge-chishui'
  }
]

/* =====================================================
   三、派生数据
   ===================================================== */

const sortedSpots = computed(() => {
  return [...spots.value].sort(
    (a, b) => Number(a.route_order) - Number(b.route_order)
  )
})

const totalSpotCount = computed(() => {
  return sortedSpots.value.length
})

const checkedInSpots = computed(() => {
  return sortedSpots.value.filter((spot) => {
    return journeyStore.isCheckedIn(spot.id)
  })
})

const uncompletedSpots = computed(() => {
  return sortedSpots.value.filter((spot) => {
    return !journeyStore.isCheckedIn(spot.id)
  })
})

const favoriteSpots = computed(() => {
  return sortedSpots.value.filter((spot) => {
    return journeyStore.isFavorite(spot.id)
  })
})

const listenedSpots = computed(() => {
  return sortedSpots.value.filter((spot) => {
    return journeyStore.isListened(spot.id)
  })
})

const quizCompletedSpots = computed(() => {
  return sortedSpots.value.filter((spot) => {
    return journeyStore.isQuizCompleted(spot.id)
  })
})

const completionRate = computed(() => {
  return journeyStore.getCompletionRate(
    totalSpotCount.value || 5
  )
})

const nextRecommendedSpot = computed(() => {
  return uncompletedSpots.value[0] || null
})

const earnedBadges = computed(() => {
  return badgeDefinitions.filter((badge) => {
    return journeyStore.earnedBadgeIds.includes(badge.id)
  })
})

const lockedBadges = computed(() => {
  return badgeDefinitions.filter((badge) => {
    return !journeyStore.earnedBadgeIds.includes(badge.id)
  })
})

const journeyStatusText = computed(() => {
  const rate = completionRate.value

  if (rate === 0) {
    return '声音旅程刚刚开始'
  }

  if (rate < 50) {
    return '你正在沿着古镇寻找历史回声'
  }

  if (rate < 100) {
    return '旅程已过半，继续前往下一站吧'
  }

  return '你已完成赤水回声声音路线'
})

const journeyStatusDescription = computed(() => {
  const rate = completionRate.value

  if (rate === 0) {
    return '从地图中选择一个红色点位，戴上耳机，开始你的太平古镇声音旅程。'
  }

  if (rate < 100) {
    return '每一次驻足、聆听与打卡，都会让太平古镇的红色记忆更加清晰。'
  }

  return '从古镇街巷到赤水河畔，你已走过五段声音记忆。欢迎填写体验反馈，让这张声音地图继续成长。'
})

/* =====================================================
   四、加载点位数据
   ===================================================== */

async function loadJourneyData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await getPublicSpots()

    spots.value = result.data || []
  } catch (error) {
    console.error('加载旅程数据失败：', error)

    errorMessage.value =
      '旅程数据加载失败，请确认后端服务是否已启动。'
  } finally {
    isLoading.value = false
  }
}

/* =====================================================
   五、页面操作
   ===================================================== */

function goBackToMap() {
  router.push('/map')
}

function goToSpot(spot) {
  if (!spot?.id) return

  router.push({
    name: 'spot-detail',
    params: {
      id: spot.id
    }
  })
}

function goToFeedback() {
  router.push('/feedback')
}

function getSpotImageUrl(spot) {
  if (!spot?.cover_image) {
    return ''
  }

  return getAssetUrl(spot.cover_image)
}

function getSpotNumber(spot) {
  return String(spot.route_order).padStart(2, '0')
}

function resetLocalJourney() {
  const confirmed = window.confirm(
    '确定要重置本地旅程吗？这会清除当前浏览器中的打卡、收藏、已聆听和徽章记录。此操作仅用于开发测试，无法恢复。'
  )

  if (!confirmed) {
    return
  }

  journeyStore.resetJourney()

  window.alert('本地旅程记录已重置。')
}

onMounted(() => {
  loadJourneyData()
})
</script>

<template>
  <main class="journey-page">
    <!-- =================================================
         顶部导航
         ================================================= -->

    <header class="journey-header">
      <div class="journey-header-inner">
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
          class="journey-brand"
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
          to="/about"
          class="about-link"
        >
          <BookOpen
            :size="17"
            :stroke-width="1.7"
          />

          <span>关于项目</span>
        </RouterLink>
      </div>
    </header>

    <!-- =================================================
         加载状态
         ================================================= -->

    <section
      v-if="isLoading"
      class="journey-loading"
    >
      <LoaderCircle
        :size="34"
        :stroke-width="1.4"
        class="loading-icon"
      />

      <p>正在整理你的赤水声音旅程…</p>
    </section>

    <!-- =================================================
         错误状态
         ================================================= -->

    <section
      v-else-if="errorMessage"
      class="journey-error"
    >
      <MapPin
        :size="34"
        :stroke-width="1.4"
      />

      <h1>暂时无法读取旅程</h1>

      <p>{{ errorMessage }}</p>

      <button
        type="button"
        @click="loadJourneyData"
      >
        重新加载
      </button>
    </section>

    <!-- =================================================
         页面主体
         ================================================= -->

    <template v-else>
      <!-- Hero 概览 -->
      <section class="journey-hero">
        <div class="hero-copy">
          <p class="hero-kicker">
            MY CHISHUI JOURNEY
          </p>

          <h1>我的赤水旅程</h1>

          <p class="hero-status">
            {{ journeyStatusText }}
          </p>

          <p class="hero-description">
            {{ journeyStatusDescription }}
          </p>

          <div class="hero-actions">
            <button
              v-if="nextRecommendedSpot"
              type="button"
              class="continue-button"
              @click="goToSpot(nextRecommendedSpot)"
            >
              <Compass
                :size="18"
                :stroke-width="1.7"
              />

              <span>
                继续前往：
                {{ nextRecommendedSpot.name }}
              </span>

              <ArrowRight
                :size="17"
                :stroke-width="1.8"
              />
            </button>

            <button
              v-else
              type="button"
              class="feedback-button"
              @click="goToFeedback"
            >
              <Sparkles
                :size="18"
                :stroke-width="1.7"
              />

              <span>填写体验反馈</span>

              <ArrowRight
                :size="17"
                :stroke-width="1.8"
              />
            </button>
          </div>
        </div>

        <!-- 路线进度圆盘 -->
        <div class="journey-progress-visual">
          <div
            class="progress-orbit orbit-one"
          ></div>

          <div
            class="progress-orbit orbit-two"
          ></div>

          <div
            class="progress-circle"
            :style="{
              '--progress': `${completionRate * 3.6}deg`
            }"
          >
            <div class="progress-circle-inner">
              <strong>{{ completionRate }}</strong>
              <span>%</span>

              <small>路线完成度</small>
            </div>
          </div>

          <div class="progress-side-note note-top">
            <span>{{ checkedInSpots.length }}</span>
            <small>已打卡点位</small>
          </div>

          <div class="progress-side-note note-bottom">
            <span>{{ favoriteSpots.length }}</span>
            <small>已收藏声音</small>
          </div>
        </div>
      </section>

      <!-- 总体数据卡片 -->
      <section class="journey-stat-grid">
        <article class="stat-card">
          <div class="stat-icon icon-red">
            <MapPin
              :size="19"
              :stroke-width="1.7"
            />
          </div>

          <div>
            <strong>
              {{ checkedInSpots.length }}
              <small>/ {{ totalSpotCount }}</small>
            </strong>

            <span>核心点位已打卡</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-river">
            <Volume2
              :size="19"
              :stroke-width="1.7"
            />
          </div>

          <div>
            <strong>
              {{ listenedSpots.length }}
              <small>/ {{ totalSpotCount }}</small>
            </strong>

            <span>已完整聆听声音</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-gold">
            <CircleCheck
              :size="19"
              :stroke-width="1.7"
            />
          </div>

          <div>
            <strong>
              {{ quizCompletedSpots.length }}
              <small>/ {{ totalSpotCount }}</small>
            </strong>

            <span>已完成研学问答</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-sage">
            <Heart
              :size="19"
              :stroke-width="1.7"
            />
          </div>

          <div>
            <strong>
              {{ favoriteSpots.length }}
            </strong>

            <span>已收藏的声音点位</span>
          </div>
        </article>
      </section>

      <!-- 路线足迹 -->
      <section class="journey-section route-section">
        <div class="section-heading">
          <div>
            <p class="section-kicker">
              ROUTE FOOTPRINTS
            </p>

            <h2>声音路线足迹</h2>
          </div>

          <span class="section-note">
            每完成一站，足迹便会被点亮
          </span>
        </div>

        <div class="route-track-wrap">
          <div class="route-track-line"></div>

          <article
            v-for="spot in sortedSpots"
            :key="spot.id"
            class="route-spot-item"
            :class="{
              'is-completed': journeyStore.isCheckedIn(spot.id),
              'is-current':
                nextRecommendedSpot?.id === spot.id
            }"
          >
            <button
              type="button"
              class="route-spot-marker"
              :title="`前往：${spot.name}`"
              @click="goToSpot(spot)"
            >
              <Check
                v-if="journeyStore.isCheckedIn(spot.id)"
                :size="15"
                :stroke-width="2.1"
              />

              <span v-else>
                {{ getSpotNumber(spot) }}
              </span>
            </button>

            <div class="route-spot-content">
              <span class="route-spot-number">
                第 {{ getSpotNumber(spot) }} 站
              </span>

              <h3>{{ spot.name }}</h3>

              <p>
                {{
                  journeyStore.isCheckedIn(spot.id)
                    ? '你已在此留下赤水足迹'
                    : nextRecommendedSpot?.id === spot.id
                      ? '推荐继续前往这一站'
                      : '等待你前往聆听'
                }}
              </p>

              <button
                type="button"
                class="route-spot-action"
                @click="goToSpot(spot)"
              >
                {{
                  journeyStore.isCheckedIn(spot.id)
                    ? '再次聆听'
                    : '前往此站'
                }}

                <ArrowRight
                  :size="14"
                  :stroke-width="1.8"
                />
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- 徽章区 -->
      <section class="journey-section badges-section">
        <div class="section-heading">
          <div>
            <p class="section-kicker">
              ECHO BADGES
            </p>

            <h2>赤水回声徽章</h2>
          </div>

          <span class="badge-count">
            已获得 {{ earnedBadges.length }} / {{ badgeDefinitions.length }}
          </span>
        </div>

        <div class="badge-grid">
          <article
            v-for="badge in badgeDefinitions"
            :key="badge.id"
            class="badge-card"
            :class="[
              badge.colorClass,
              {
                'is-earned': earnedBadges.some(
                  (item) => item.id === badge.id
                )
              }
            ]"
          >
            <div class="badge-icon-wrap">
              <component
                :is="badge.icon"
                :size="26"
                :stroke-width="1.45"
              />
            </div>

            <div class="badge-content">
              <h3>{{ badge.name }}</h3>

              <p class="badge-subtitle">
                {{ badge.subtitle }}
              </p>

              <p class="badge-description">
                {{ badge.description }}
              </p>
            </div>

            <span
              v-if="
                earnedBadges.some(
                  (item) => item.id === badge.id
                )
              "
              class="earned-mark"
            >
              <Check
                :size="13"
                :stroke-width="2.2"
              />

              已获得
            </span>

            <span
              v-else
              class="locked-mark"
            >
              <Clock3
                :size="13"
                :stroke-width="1.8"
              />

              待解锁
            </span>
          </article>
        </div>
      </section>

      <!-- 已完成点位与收藏 -->
      <section class="journey-double-grid">
        <!-- 已完成点位 -->
        <section class="journey-section completed-section">
          <div class="section-heading compact-heading">
            <div>
              <p class="section-kicker">
                COMPLETED STOPS
              </p>

              <h2>已完成的声音点位</h2>
            </div>

            <span class="compact-count">
              {{ checkedInSpots.length }}
            </span>
          </div>

          <div
            v-if="checkedInSpots.length"
            class="journey-card-list"
          >
            <article
              v-for="spot in checkedInSpots"
              :key="spot.id"
              class="journey-spot-card"
            >
              <div
                class="journey-spot-image"
                :style="{
                  backgroundImage: getSpotImageUrl(spot)
                    ? `url(${getSpotImageUrl(spot)})`
                    : ''
                }"
              >
                <span>
                  {{ getSpotNumber(spot) }}
                </span>
              </div>

              <div class="journey-spot-content">
                <p>{{ spot.type }}</p>

                <h3>{{ spot.name }}</h3>

                <small>
                  <Check
                    :size="12"
                    :stroke-width="2"
                  />

                  已留下赤水足迹
                </small>
              </div>

              <button
                type="button"
                title="再次前往此站"
                @click="goToSpot(spot)"
              >
                <ArrowRight
                  :size="16"
                  :stroke-width="1.8"
                />
              </button>
            </article>
          </div>

          <div
            v-else
            class="empty-journey-card"
          >
            <MapPin
              :size="25"
              :stroke-width="1.4"
            />

            <h3>还没有打卡点位</h3>

            <p>
              从地图中选择一站开始，
              让第一段声音记忆成为你的旅程起点。
            </p>

            <button
              type="button"
              @click="goBackToMap"
            >
              前往声音地图
            </button>
          </div>
        </section>

        <!-- 收藏点位 -->
        <section class="journey-section favorites-section">
          <div class="section-heading compact-heading">
            <div>
              <p class="section-kicker">
                SAVED ECHOES
              </p>

              <h2>我收藏的声音</h2>
            </div>

            <span class="compact-count favorite-count">
              {{ favoriteSpots.length }}
            </span>
          </div>

          <div
            v-if="favoriteSpots.length"
            class="journey-card-list"
          >
            <article
              v-for="spot in favoriteSpots"
              :key="spot.id"
              class="journey-spot-card favorite-card"
            >
              <div
                class="journey-spot-image"
                :style="{
                  backgroundImage: getSpotImageUrl(spot)
                    ? `url(${getSpotImageUrl(spot)})`
                    : ''
                }"
              >
                <Heart
                  :size="16"
                  :stroke-width="1.8"
                  fill="currentColor"
                />
              </div>

              <div class="journey-spot-content">
                <p>{{ spot.type }}</p>

                <h3>{{ spot.name }}</h3>

                <small>
                  <Star
                    :size="12"
                    :stroke-width="1.8"
                  />

                  已收藏，随时可再聆听
                </small>
              </div>

              <button
                type="button"
                title="前往此站"
                @click="goToSpot(spot)"
              >
                <ArrowRight
                  :size="16"
                  :stroke-width="1.8"
                />
              </button>
            </article>
          </div>

          <div
            v-else
            class="empty-journey-card"
          >
            <Heart
              :size="25"
              :stroke-width="1.4"
            />

            <h3>暂未收藏声音</h3>

            <p>
              在点位详情页点击“收藏此站”，
              你喜欢的声音会保存在这里。
            </p>
          </div>
        </section>
      </section>

      <!-- 底部行动区 -->
      <section class="journey-footer-actions">
        <div class="footer-action-copy">
          <p>YOUR NEXT ECHO</p>

          <h2>
            {{
              nextRecommendedSpot
                ? '下一段历史回声，仍在前方等待。'
                : '你已走完路线，欢迎留下你的声音体验。'
            }}
          </h2>
        </div>

        <div class="footer-action-buttons">
          <button
            v-if="nextRecommendedSpot"
            type="button"
            class="footer-primary-button"
            @click="goToSpot(nextRecommendedSpot)"
          >
            <Compass
              :size="18"
              :stroke-width="1.7"
            />

            继续声音导览

            <ArrowRight
              :size="17"
              :stroke-width="1.8"
            />
          </button>

          <button
            type="button"
            class="footer-secondary-button"
            @click="goToFeedback"
          >
            <Sparkles
              :size="17"
              :stroke-width="1.7"
            />

            填写体验反馈
          </button>
        </div>
      </section>

      <!-- 开发环境辅助工具 -->
      <section class="developer-tools">
        <button
          type="button"
          @click="resetLocalJourney"
        >
          <RefreshCcw
            :size="14"
            :stroke-width="1.7"
          />

          重置本地旅程记录
        </button>

        <span>
          仅用于开发与测试。重置后会清除当前浏览器中的打卡、收藏与徽章数据。
        </span>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
/* =====================================================
   页面基础
   ===================================================== */

.journey-page {
  min-height: 100vh;
  overflow-x: hidden;

  color: #45594d;
  background:
    radial-gradient(
      circle at 82% 12%,
      rgba(255, 243, 205, 0.56),
      transparent 26%
    ),
    radial-gradient(
      circle at 8% 73%,
      rgba(181, 210, 195, 0.28),
      transparent 31%
    ),
    linear-gradient(
      135deg,
      #f8f7ef 0%,
      #edf1e9 53%,
      #dfe9df 100%
    );
}

.journey-page::before {
  position: fixed;
  z-index: 0;
  inset: 0;

  pointer-events: none;

  opacity: 0.14;
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

.journey-header {
  position: relative;
  z-index: 5;
}

.journey-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(calc(100% - 88px), 1480px);
  min-height: 82px;
  margin: 0 auto;
}

.back-map-button,
.about-link {
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

.back-map-button:hover,
.about-link:hover {
  color: #9d4c47;
  transform: translateX(-2px);
}

.journey-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: #344139;
  transition: opacity 0.22s ease;
}

.journey-brand:hover {
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

.journey-loading,
.journey-error {
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

.journey-loading {
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

@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}

.journey-loading p {
  margin-top: 16px;
  font-size: 15px;
  letter-spacing: 0.06em;
}

.journey-error {
  color: #45594d;
}

.journey-error h1 {
  margin: 17px 0 8px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    serif;
  font-size: 27px;
  font-weight: 500;
}

.journey-error p {
  max-width: 460px;
  margin: 0;

  color: rgba(75, 92, 80, 0.66);
  font-size: 14px;
  line-height: 1.8;
}

.journey-error button {
  margin-top: 24px;
  padding: 11px 18px;

  color: #fffcef;
  background: #9d4c47;
  border: 0;
  border-radius: 999px;
}

/* =====================================================
   Hero 概览区
   ===================================================== */

.journey-hero {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(350px, 0.88fr);
  align-items: center;
  gap: 28px;

  width: min(calc(100% - 88px), 1480px);
  min-height: 380px;
  overflow: hidden;

  margin: 12px auto 0;
  padding: 48px 58px;

  background:
    radial-gradient(
      circle at 76% 20%,
      rgba(246, 233, 193, 0.44),
      transparent 22%
    ),
    linear-gradient(
      135deg,
      rgba(247, 246, 238, 0.78),
      rgba(226, 237, 227, 0.62)
    );
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 26px;
  box-shadow: 0 20px 60px rgba(61, 80, 68, 0.1);
}

.journey-hero::after {
  position: absolute;
  right: -12%;
  bottom: -55%;

  width: 58%;
  aspect-ratio: 1;

  opacity: 0.2;
  border: 1px solid rgba(93, 136, 136, 0.5);
  border-radius: 50%;

  content: "";
}

.hero-copy {
  position: relative;
  z-index: 2;
}

.hero-kicker,
.section-kicker {
  margin: 0;

  color: rgba(102, 117, 106, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.19em;
}

.hero-copy h1 {
  margin: 11px 0 10px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(38px, 4.1vw, 62px);
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1.2;
}

.hero-status {
  margin: 0;

  color: #9d4c47;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 18px;
  letter-spacing: 0.06em;
  line-height: 1.8;
}

.hero-description {
  max-width: 540px;
  margin: 14px 0 0;

  color: rgba(67, 86, 74, 0.69);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 14px;
  letter-spacing: 0.04em;
  line-height: 2;
}

.hero-actions {
  margin-top: 27px;
}

.continue-button,
.feedback-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;

  min-height: 46px;
  padding: 0 17px;

  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(127, 66, 63, 0.18);

  font-size: 12px;
  letter-spacing: 0.04em;

  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease;
}

.continue-button:hover,
.feedback-button:hover {
  box-shadow: 0 15px 30px rgba(127, 66, 63, 0.26);
  transform: translateY(-3px);
}

/* =====================================================
   进度圆盘
   ===================================================== */

.journey-progress-visual {
  position: relative;
  z-index: 2;

  display: grid;
  min-height: 270px;
  place-items: center;
}

.progress-circle {
  position: relative;
  z-index: 2;

  display: grid;
  width: 196px;
  height: 196px;
  place-items: center;

  background:
    conic-gradient(
      #9d4c47 0deg,
      #b8a36a var(--progress),
      rgba(181, 199, 187, 0.2) var(--progress),
      rgba(181, 199, 187, 0.2) 360deg
    );
  border-radius: 50%;
  box-shadow:
    0 18px 40px rgba(73, 99, 84, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.progress-circle::before {
  position: absolute;
  inset: 11px;

  background:
    linear-gradient(
      135deg,
      rgba(250, 249, 241, 0.96),
      rgba(233, 240, 232, 0.96)
    );
  border-radius: 50%;

  content: "";
}

.progress-circle-inner {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;

  width: 100%;
}

.progress-circle-inner strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 58px;
  font-weight: 600;
  line-height: 1;
}

.progress-circle-inner > span {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 24px;
  font-weight: 600;
}

.progress-circle-inner small {
  width: 100%;
  margin-top: 8px;

  color: rgba(82, 100, 89, 0.62);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-align: center;
}

.progress-orbit {
  position: absolute;

  border: 1px solid rgba(93, 136, 136, 0.18);
  border-radius: 50%;
}

.orbit-one {
  width: 245px;
  height: 245px;
}

.orbit-two {
  width: 292px;
  height: 178px;

  transform: rotate(-22deg);
}

.progress-side-note {
  position: absolute;
  z-index: 3;

  display: flex;
  flex-direction: column;

  color: #45594d;
}

.progress-side-note span {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 25px;
  font-weight: 600;
}

.progress-side-note small {
  color: rgba(82, 101, 89, 0.58);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.note-top {
  top: 20px;
  right: 6%;
  text-align: right;
}

.note-bottom {
  bottom: 12px;
  left: 4%;
}

/* =====================================================
   数据统计卡
   ===================================================== */

.journey-stat-grid {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  width: min(calc(100% - 180px), 1300px);
  margin: 22px auto 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;

  min-height: 92px;
  padding: 16px;

  background: rgba(250, 249, 240, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 17px;
  box-shadow: 0 10px 24px rgba(61, 82, 69, 0.05);
  backdrop-filter: blur(10px);
}

.stat-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;

  border-radius: 50%;
}

.icon-red {
  color: #9d4c47;
  background: rgba(234, 212, 206, 0.62);
}

.icon-river {
  color: #5d8888;
  background: rgba(211, 231, 228, 0.62);
}

.icon-gold {
  color: #a78a48;
  background: rgba(241, 232, 198, 0.68);
}

.icon-sage {
  color: #587267;
  background: rgba(216, 233, 218, 0.68);
}

.stat-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-card strong {
  color: #344139;
  font-family:
    "Cormorant Garamond",
    "Noto Serif SC",
    serif;
  font-size: 25px;
  font-weight: 600;
  line-height: 1;
}

.stat-card strong small {
  color: rgba(90, 106, 95, 0.52);
  font-size: 14px;
}

.stat-card span {
  color: rgba(78, 96, 84, 0.64);
  font-size: 10px;
  letter-spacing: 0.035em;
}

/* =====================================================
   通用内容区
   ===================================================== */

.journey-section {
  position: relative;
  z-index: 1;
}

.route-section,
.badges-section {
  width: min(calc(100% - 180px), 1300px);
  margin: 54px auto 0;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;

  margin-bottom: 22px;
}

.section-heading h2 {
  margin: 7px 0 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.section-note,
.badge-count {
  color: rgba(83, 101, 89, 0.57);
  font-size: 11px;
  letter-spacing: 0.035em;
}

.badge-count {
  color: #9d4c47;
}

/* =====================================================
   路线足迹
   ===================================================== */

.route-track-wrap {
  position: relative;

  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;

  padding-top: 34px;
}

.route-track-line {
  position: absolute;
  top: 48px;
  right: 10%;
  left: 10%;

  height: 2px;

  background:
    linear-gradient(
      90deg,
      rgba(184, 163, 106, 0.6),
      rgba(157, 76, 71, 0.45)
    );
  border-radius: 999px;
}

.route-spot-item {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;
}

.route-spot-marker {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;

  color: rgba(112, 128, 117, 0.66);
  background: rgba(250, 249, 240, 0.9);
  border: 1px solid rgba(111, 136, 124, 0.35);
  border-radius: 50%;
  box-shadow: 0 5px 13px rgba(65, 86, 72, 0.08);

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 14px;
  font-weight: 600;

  transition:
    transform 0.22s ease,
    color 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.route-spot-marker:hover {
  color: #fffcef;
  background: #9d4c47;
  border-color: #9d4c47;
  transform: scale(1.1);
}

.route-spot-item.is-completed .route-spot-marker {
  color: #fffcef;
  background: #b8a36a;
  border-color: #b8a36a;
}

.route-spot-item.is-current .route-spot-marker {
  color: #fffcef;
  background: #9d4c47;
  border-color: #9d4c47;
  box-shadow: 0 8px 20px rgba(127, 66, 63, 0.23);
}

.route-spot-content {
  margin-top: 16px;
}

.route-spot-number {
  color: rgba(100, 115, 104, 0.52);
  font-size: 10px;
  letter-spacing: 0.07em;
}

.route-spot-content h3 {
  min-height: 46px;
  margin: 7px 0 6px;

  color: #45594d;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.03em;
  line-height: 1.5;
}

.route-spot-content p {
  min-height: 32px;
  margin: 0;

  color: rgba(86, 103, 92, 0.56);
  font-size: 10px;
  line-height: 1.6;
}

.route-spot-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  margin-top: 10px;
  padding: 0;

  color: #9d4c47;
  background: transparent;
  border: 0;

  font-size: 10px;
  letter-spacing: 0.035em;

  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.route-spot-action:hover {
  color: #7f423f;
  transform: translateX(2px);
}

/* =====================================================
   徽章区
   ===================================================== */

.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.badge-card {
  position: relative;

  display: flex;
  gap: 14px;

  min-height: 168px;
  padding: 19px;

  opacity: 0.48;
  background: rgba(243, 243, 235, 0.46);
  border: 1px dashed rgba(111, 136, 124, 0.26);
  border-radius: 18px;

  filter: grayscale(0.48);

  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.badge-card.is-earned {
  opacity: 1;
  background: rgba(250, 249, 240, 0.7);
  border: 1px solid rgba(184, 163, 106, 0.34);
  box-shadow: 0 12px 28px rgba(74, 91, 78, 0.07);

  filter: none;
}

.badge-card.is-earned:hover {
  box-shadow: 0 16px 34px rgba(74, 91, 78, 0.12);
  transform: translateY(-3px);
}

.badge-icon-wrap {
  display: grid;
  width: 54px;
  height: 54px;
  flex: none;
  place-items: center;

  border-radius: 50%;
}

.badge-river .badge-icon-wrap {
  color: #5d8888;
  background: rgba(211, 231, 228, 0.72);
}

.badge-town .badge-icon-wrap {
  color: #9d4c47;
  background: rgba(234, 212, 206, 0.72);
}

.badge-chishui .badge-icon-wrap {
  color: #a78a48;
  background: rgba(241, 232, 198, 0.76);
}

.badge-content h3 {
  margin: 2px 0 5px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.badge-subtitle {
  margin: 0;

  color: #9d4c47;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.badge-description {
  margin: 10px 0 0;

  color: rgba(75, 93, 81, 0.64);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 11px;
  line-height: 1.72;
}

.earned-mark,
.locked-mark {
  position: absolute;
  right: 13px;
  bottom: 12px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  font-size: 9px;
  letter-spacing: 0.04em;
}

.earned-mark {
  color: #4d8c66;
}

.locked-mark {
  color: rgba(91, 106, 96, 0.58);
}

/* =====================================================
   已完成与收藏双栏
   ===================================================== */

.journey-double-grid {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  width: min(calc(100% - 180px), 1300px);
  margin: 54px auto 0;
}

.compact-heading {
  margin-bottom: 17px;
}

.compact-heading h2 {
  font-size: 26px;
}

.compact-count {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;

  color: #fffcef;
  background: #b8a36a;
  border-radius: 50%;

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 18px;
  font-weight: 600;
}

.favorite-count {
  background: #9d4c47;
}

.journey-card-list {
  display: grid;
  gap: 10px;
}

.journey-spot-card {
  display: flex;
  align-items: center;
  gap: 11px;

  min-height: 76px;
  padding: 10px;

  background: rgba(250, 249, 240, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 15px;
  box-shadow: 0 7px 18px rgba(64, 83, 70, 0.04);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.journey-spot-card:hover {
  background: rgba(255, 253, 245, 0.84);
  box-shadow: 0 10px 24px rgba(64, 83, 70, 0.08);
  transform: translateX(3px);
}

.journey-spot-image {
  display: grid;
  width: 54px;
  height: 54px;
  flex: none;
  place-items: center;

  overflow: hidden;

  color: #fffcef;
  background-color: #8daaa0;
  background-position: center;
  background-size: cover;
  border-radius: 11px;
  box-shadow: inset 0 0 0 100px rgba(42, 64, 53, 0.24);

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 20px;
  font-weight: 600;
}

.favorite-card .journey-spot-image {
  color: #fffcef;
  background-color: #a66660;
}

.journey-spot-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.journey-spot-content p {
  margin: 0;

  color: rgba(91, 106, 95, 0.57);
  font-size: 9px;
  letter-spacing: 0.05em;
}

.journey-spot-content h3 {
  overflow: hidden;
  margin: 0;

  color: #45594d;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journey-spot-content small {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  color: #4d8c66;
  font-size: 9px;
  letter-spacing: 0.02em;
}

.favorite-card .journey-spot-content small {
  color: #9d4c47;
}

.journey-spot-card > button {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;

  color: #6f887c;
  background: transparent;
  border: 1px solid rgba(111, 136, 124, 0.17);
  border-radius: 50%;

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.journey-spot-card > button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.76);
}

.empty-journey-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  min-height: 210px;
  padding: 24px;

  color: rgba(102, 120, 108, 0.58);
  background: rgba(247, 248, 240, 0.34);
  border: 1px dashed rgba(111, 136, 124, 0.25);
  border-radius: 17px;
}

.empty-journey-card h3 {
  margin: 16px 0 7px;

  color: #45594d;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 18px;
  font-weight: 500;
}

.empty-journey-card p {
  margin: 0;

  color: rgba(84, 101, 90, 0.58);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 12px;
  line-height: 1.85;
}

.empty-journey-card button {
  margin-top: 16px;
  padding: 0;

  color: #9d4c47;
  background: transparent;
  border: 0;

  font-size: 11px;
  letter-spacing: 0.04em;
}

/* =====================================================
   底部行动区
   ===================================================== */

.journey-footer-actions {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;

  width: min(calc(100% - 180px), 1300px);
  margin: 54px auto 0;
  padding: 30px 34px;

  background:
    linear-gradient(
      135deg,
      rgba(89, 127, 118, 0.9),
      rgba(76, 108, 96, 0.9)
    );
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  box-shadow: 0 18px 38px rgba(62, 93, 81, 0.14);
}

.footer-action-copy p {
  margin: 0;

  color: rgba(255, 251, 234, 0.64);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.footer-action-copy h2 {
  max-width: 560px;
  margin: 9px 0 0;

  color: #fffdf3;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 1.55;
}

.footer-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.footer-primary-button,
.footer-secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  min-height: 42px;
  padding: 0 15px;

  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.footer-primary-button {
  color: #52756d;
  background: #fffdf3;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.footer-primary-button:hover {
  box-shadow: 0 8px 20px rgba(27, 58, 47, 0.16);
  transform: translateY(-2px);
}

.footer-secondary-button {
  color: #fffdf3;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.27);
}

.footer-secondary-button:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

/* =====================================================
   开发辅助区
   ===================================================== */

.developer-tools {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: center;
  gap: 10px;

  width: min(calc(100% - 180px), 1300px);
  margin: 24px auto 68px;

  color: rgba(92, 106, 96, 0.47);
  font-size: 10px;
  line-height: 1.6;
}

.developer-tools button {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  flex: none;
  padding: 7px 10px;

  color: rgba(110, 82, 73, 0.65);
  background: transparent;
  border: 1px solid rgba(157, 76, 71, 0.2);
  border-radius: 999px;

  font-size: 10px;

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.developer-tools button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.58);
}

/* =====================================================
   响应式适配
   ===================================================== */

@media (max-width: 1100px) {
  .journey-header-inner,
  .journey-hero {
    width: calc(100% - 56px);
  }

  .journey-stat-grid,
  .route-section,
  .badges-section,
  .journey-double-grid,
  .journey-footer-actions,
  .developer-tools {
    width: calc(100% - 110px);
  }

  .journey-hero {
    padding: 42px;
  }

  .journey-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .journey-double-grid {
    gap: 24px;
  }
}

@media (max-width: 850px) {
  .journey-header-inner {
    width: calc(100% - 36px);
    min-height: 70px;
  }

  .back-map-button span,
  .about-link span,
  .brand-text small {
    display: none;
  }

  .journey-hero {
    grid-template-columns: 1fr;

    width: calc(100% - 36px);
    padding: 34px 26px;
  }

  .journey-progress-visual {
    min-height: 245px;
  }

  .journey-stat-grid,
  .route-section,
  .badges-section,
  .journey-double-grid,
  .journey-footer-actions,
  .developer-tools {
    width: calc(100% - 52px);
  }

  .route-track-wrap {
    grid-template-columns: 1fr;
    gap: 0;

    padding-top: 0;
  }

  .route-track-line {
    top: 18px;
    bottom: 18px;
    left: 16px;

    width: 2px;
    height: auto;

    background:
      linear-gradient(
        to bottom,
        rgba(184, 163, 106, 0.6),
        rgba(157, 76, 71, 0.45)
      );
  }

  .route-spot-item {
    display: grid;
    grid-template-columns: 38px 1fr;
    gap: 14px;

    padding: 0 0 22px;

    text-align: left;
  }

  .route-spot-marker {
    grid-column: 1;
    grid-row: 1;
  }

  .route-spot-content {
    grid-column: 2;
    grid-row: 1;

    margin-top: 0;
  }

  .route-spot-content h3,
  .route-spot-content p {
    min-height: 0;
  }

  .badge-grid,
  .journey-double-grid {
    grid-template-columns: 1fr;
  }

  .journey-footer-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .footer-action-buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .journey-header-inner {
    width: calc(100% - 28px);
  }

  .journey-brand {
    position: absolute;
    left: 50%;

    transform: translateX(-50%);
  }

  .brand-text strong {
    font-size: 14px;
  }

  .journey-hero {
    width: calc(100% - 28px);
    padding: 29px 20px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-status {
    font-size: 16px;
  }

  .hero-description {
    font-size: 13px;
  }

  .progress-circle {
    width: 170px;
    height: 170px;
  }

  .progress-circle-inner strong {
    font-size: 50px;
  }

  .progress-orbit.orbit-one {
    width: 214px;
    height: 214px;
  }

  .progress-orbit.orbit-two {
    width: 250px;
    height: 158px;
  }

  .note-top {
    right: 0;
  }

  .note-bottom {
    left: 0;
  }

  .journey-stat-grid,
  .route-section,
  .badges-section,
  .journey-double-grid,
  .journey-footer-actions,
  .developer-tools {
    width: calc(100% - 28px);
  }

  .journey-stat-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-card {
    min-height: 82px;
    padding: 12px;
  }

  .stat-icon {
    width: 34px;
    height: 34px;
  }

  .stat-card strong {
    font-size: 22px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .section-heading h2 {
    font-size: 25px;
  }

  .badge-card {
    min-height: 145px;
  }

  .journey-footer-actions {
    padding: 24px 20px;
  }

  .footer-action-copy h2 {
    font-size: 20px;
  }

  .developer-tools {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
