<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref
} from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Compass,
  Heart,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Volume2
} from 'lucide-vue-next'

import { submitFeedback } from '../api/feedback'
import { recordUserEvent } from '../api/map'
import { useJourneyStore } from '../stores/journey'
import { getVisitorId } from '../utils/visitor'

const router = useRouter()
const journeyStore = useJourneyStore()

/* =====================================================
   一、页面状态
   ===================================================== */

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')
const hasTriedSubmit = ref(false)

/*
  默认使用 0，表示还未评分。
  后续提交前会检查五项评分是否均已选择。
*/
const form = reactive({
  clarity_score: 0,
  immersion_score: 0,
  emotion_score: 0,
  knowledge_score: 0,
  action_score: 0,

  share_intention: null,
  recommend_intention: null,
  revisit_intention: null,
  purchase_intention: null,
  study_intention: null,
  payment_intention: null,

  suggestions: ''
})

/* =====================================================
   二、五维体验评价配置
   ===================================================== */

const dimensions = [
  {
    key: 'clarity_score',
    number: '01',
    title: '清晰度',
    subtitle: '声音是否清楚，故事是否容易理解？',
    icon: Volume2,
    lowLabel: '不清楚',
    highLabel: '非常清晰'
  },
  {
    key: 'immersion_score',
    number: '02',
    title: '沉浸感',
    subtitle: '声音是否让你产生身临其境的场景感？',
    icon: Compass,
    lowLabel: '缺少代入感',
    highLabel: '仿佛置身其中'
  },
  {
    key: 'emotion_score',
    number: '03',
    title: '情感触动',
    subtitle: '这段声音是否带来敬意、共情或精神感染？',
    icon: Heart,
    lowLabel: '没有触动',
    highLabel: '非常触动'
  },
  {
    key: 'knowledge_score',
    number: '04',
    title: '知识获得感',
    subtitle: '是否帮助你更理解四渡赤水历史与长征精神？',
    icon: Sparkles,
    lowLabel: '收获较少',
    highLabel: '收获很多'
  },
  {
    key: 'action_score',
    number: '05',
    title: '行动意愿',
    subtitle: '是否愿意继续参观、分享或参加相关研学活动？',
    icon: ArrowRight,
    lowLabel: '意愿较低',
    highLabel: '意愿很强'
  }
]

/* =====================================================
   三、意愿问题配置
   ===================================================== */

const intentionQuestions = [
  {
    key: 'share_intention',
    title: '你愿意将“赤水回声”分享给朋友或社群吗？'
  },
  {
    key: 'recommend_intention',
    title: '你愿意推荐太平古镇红色声音路线吗？'
  },
  {
    key: 'revisit_intention',
    title: '你愿意继续打卡其他红色点位或再次来访吗？'
  },
  {
    key: 'purchase_intention',
    title: '你愿意了解或购买红色文创、地方伴手礼吗？'
  },
  {
    key: 'study_intention',
    title: '你愿意参加更深入的红色研学路线吗？'
  },
  {
    key: 'payment_intention',
    title: '若有完整声音导览内容，你愿意接受小额付费吗？'
  }
]

/* =====================================================
   四、派生数据
   ===================================================== */

const completedSpotCount = computed(() => {
  return journeyStore.checkedInSpotIds.length
})

const completionRate = computed(() => {
  return journeyStore.getCompletionRate(5)
})

const averageScore = computed(() => {
  const values = dimensions
    .map((dimension) => form[dimension.key])
    .filter((score) => Number(score) > 0)

  if (!values.length) {
    return 0
  }

  const total = values.reduce((sum, score) => {
    return sum + Number(score)
  }, 0)

  return (total / values.length).toFixed(1)
})

const completedDimensionCount = computed(() => {
  return dimensions.filter((dimension) => {
    return Number(form[dimension.key]) > 0
  }).length
})

const allDimensionsCompleted = computed(() => {
  return completedDimensionCount.value === dimensions.length
})

const hasUnansweredIntentions = computed(() => {
  return intentionQuestions.some((question) => {
    return form[question.key] === null
  })
})

/* =====================================================
   五、方法：填写评分
   ===================================================== */

function selectScore(key, score) {
  form[key] = score
}

function selectIntention(key, value) {
  form[key] = value
}

function getScoreText(score) {
  const scoreMap = {
    1: '非常不同意',
    2: '不太同意',
    3: '一般',
    4: '比较同意',
    5: '非常同意'
  }

  return scoreMap[score] || '未评分'
}

function isDimensionInvalid(key) {
  return hasTriedSubmit.value && Number(form[key]) === 0
}

/* =====================================================
   六、行为记录
   ===================================================== */

function recordEvent(eventType, eventValue = null) {
  recordUserEvent({
    visitor_id: getVisitorId(),
    event_type: eventType,
    spot_id: null,
    event_value: eventValue
  }).catch((error) => {
    /*
      行为埋点失败不影响问卷提交。
    */
    console.warn('反馈行为记录失败：', error)
  })
}

/* =====================================================
   七、提交问卷
   ===================================================== */

async function handleSubmit() {
  hasTriedSubmit.value = true
  submitError.value = ''

  if (!allDimensionsCompleted.value) {
    submitError.value =
      '请先完成五项声音体验评价。'

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    return
  }

  /*
    意愿问题可以在 MVP 中允许跳过，
    以降低用户填写压力。
    但为了统计方便，未填写时统一保存为 false。
  */
  const payload = {
    visitor_id: getVisitorId(),
    completed_spot_count: completedSpotCount.value,

    clarity_score: Number(form.clarity_score),
    immersion_score: Number(form.immersion_score),
    emotion_score: Number(form.emotion_score),
    knowledge_score: Number(form.knowledge_score),
    action_score: Number(form.action_score),

    share_intention: Boolean(form.share_intention),
    recommend_intention: Boolean(form.recommend_intention),
    revisit_intention: Boolean(form.revisit_intention),
    purchase_intention: Boolean(form.purchase_intention),
    study_intention: Boolean(form.study_intention),
    payment_intention: Boolean(form.payment_intention),

    suggestions: form.suggestions.trim()
  }

  isSubmitting.value = true

  try {
    await submitFeedback(payload)

    recordEvent('feedback_submit', {
      completed_spot_count: completedSpotCount.value,
      average_score: averageScore.value
    })

    isSubmitted.value = true

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } catch (error) {
    console.error('提交反馈失败：', error)

    submitError.value =
      error?.response?.data?.message ||
      '反馈提交失败，请确认后端服务是否正在运行后重试。'
  } finally {
    isSubmitting.value = false
  }
}

/* =====================================================
   八、重置本页问卷
   ===================================================== */

function resetForm() {
  const confirmed = window.confirm(
    '确定要清空当前填写内容吗？'
  )

  if (!confirmed) {
    return
  }

  dimensions.forEach((dimension) => {
    form[dimension.key] = 0
  })

  intentionQuestions.forEach((question) => {
    form[question.key] = null
  })

  form.suggestions = ''

  hasTriedSubmit.value = false
  submitError.value = ''
}

/* =====================================================
   九、导航
   ===================================================== */

function goBackToJourney() {
  router.push('/journey')
}

function goBackToMap() {
  router.push('/map')
}

/* =====================================================
   十、生命周期
   ===================================================== */

onMounted(() => {
  recordEvent('feedback_open', {
    completed_spot_count: completedSpotCount.value,
    completion_rate: completionRate.value
  })
})
</script>

<template>
  <main class="feedback-page">
    <!-- =================================================
         顶部导航
         ================================================= -->

    <header class="feedback-header">
      <div class="feedback-header-inner">
        <button
          type="button"
          class="back-button"
          @click="goBackToJourney"
        >
          <ArrowLeft
            :size="17"
            :stroke-width="1.7"
          />

          <span>返回我的旅程</span>
        </button>

        <RouterLink
          to="/"
          class="feedback-brand"
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
          class="map-button"
          @click="goBackToMap"
        >
          <Map
            :size="17"
            :stroke-width="1.7"
          />

          <span>声音地图</span>
        </button>
      </div>
    </header>

    <!-- =================================================
         提交成功页面
         ================================================= -->

    <section
      v-if="isSubmitted"
      class="feedback-success"
    >
      <div class="success-orbit orbit-one"></div>
      <div class="success-orbit orbit-two"></div>

      <div class="success-icon">
        <CheckCircle2
          :size="42"
          :stroke-width="1.4"
        />
      </div>

      <p class="success-kicker">
        THANK YOU FOR LISTENING
      </p>

      <h1>感谢你留下这段回声</h1>

      <p class="success-description">
        你的体验反馈已被匿名记录。
        每一份真实感受，都会帮助“赤水回声”更好地连接历史空间、青年学习与地方文旅体验。
      </p>

      <div class="success-summary">
        <article>
          <strong>{{ completedSpotCount }}</strong>
          <span>已打卡点位</span>
        </article>

        <article>
          <strong>{{ averageScore }}</strong>
          <span>五维平均评分</span>
        </article>

        <article>
          <strong>{{ completionRate }}%</strong>
          <span>路线完成度</span>
        </article>
      </div>

      <div class="success-actions">
        <button
          type="button"
          class="success-primary-button"
          @click="goBackToMap"
        >
          <Compass
            :size="18"
            :stroke-width="1.7"
          />

          继续探索地图

          <ArrowRight
            :size="17"
            :stroke-width="1.8"
          />
        </button>

        <button
          type="button"
          class="success-secondary-button"
          @click="goBackToJourney"
        >
          查看我的旅程
        </button>
      </div>
    </section>

    <!-- =================================================
         问卷主体
         ================================================= -->

    <template v-else>
      <!-- Hero -->
      <section class="feedback-hero">
        <div class="feedback-hero-copy">
          <p class="hero-kicker">
            EXPERIENCE FEEDBACK
          </p>

          <h1>留下你的<br />赤水回声</h1>

          <p class="hero-subtitle">
            每一段声音、每一次驻足，
            都可能成为理解历史的新入口。
          </p>

          <p class="hero-description">
            这是一份匿名体验反馈问卷，预计需要 1—2 分钟。
            你的回答将用于评估声音导览对青年学习体验、情感共鸣与行动意愿的影响。
          </p>
        </div>

        <div class="feedback-progress-card">
          <div class="progress-card-top">
            <span>当前旅程</span>

            <strong>
              {{ completedSpotCount }} / 5
            </strong>
          </div>

          <div class="progress-line">
            <span
              :style="{
                width: `${completionRate}%`
              }"
            ></span>
          </div>

          <p>
            已完成 {{ completionRate }}% 的声音路线
          </p>

          <div class="feedback-note">
            <CircleHelp
              :size="15"
              :stroke-width="1.6"
            />

            所有反馈均匿名提交，不收集姓名与联系方式。
          </div>
        </div>
      </section>

      <!-- 问卷 -->
      <section class="feedback-layout">
        <!-- 左侧问卷主体 -->
        <div class="feedback-main">
          <div class="form-intro">
            <div class="form-intro-icon">
              <Volume2
                :size="20"
                :stroke-width="1.65"
              />
            </div>

            <div>
              <p>红色声音体验五维评价</p>

              <span>
                请根据你实际使用“赤水回声”声音地图的体验进行评分。
              </span>
            </div>
          </div>

          <div
            v-if="submitError"
            class="submit-error"
          >
            <CircleHelp
              :size="17"
              :stroke-width="1.8"
            />

            <span>{{ submitError }}</span>
          </div>

          <!-- 五维评分 -->
          <section class="dimension-list">
            <article
              v-for="dimension in dimensions"
              :key="dimension.key"
              class="dimension-card"
              :class="{
                'is-invalid': isDimensionInvalid(dimension.key),
                'has-score': form[dimension.key] > 0
              }"
            >
              <div class="dimension-head">
                <div class="dimension-icon">
                  <component
                    :is="dimension.icon"
                    :size="19"
                    :stroke-width="1.6"
                  />
                </div>

                <div class="dimension-copy">
                  <p>
                    <span>{{ dimension.number }}</span>
                    {{ dimension.title }}
                  </p>

                  <small>{{ dimension.subtitle }}</small>
                </div>

                <div class="current-score">
                  <strong>
                    {{
                      form[dimension.key] || '—'
                    }}
                  </strong>

                  <span>/ 5</span>
                </div>
              </div>

              <div class="score-options">
                <button
                  v-for="score in 5"
                  :key="score"
                  type="button"
                  class="score-button"
                  :class="{
                    'is-selected':
                      form[dimension.key] === score
                  }"
                  :title="`${score} 分：${getScoreText(score)}`"
                  @click="selectScore(dimension.key, score)"
                >
                  <Star
                    :size="18"
                    :stroke-width="1.7"
                    :fill="
                      form[dimension.key] === score
                        ? 'currentColor'
                        : 'none'
                    "
                  />

                  <span>{{ score }}</span>
                </button>
              </div>

              <div class="dimension-scale-text">
                <span>{{ dimension.lowLabel }}</span>

                <span>
                  {{
                    form[dimension.key]
                      ? getScoreText(form[dimension.key])
                      : '请选择 1—5 分'
                  }}
                </span>

                <span>{{ dimension.highLabel }}</span>
              </div>
            </article>
          </section>

          <!-- 行动意愿 -->
          <section class="intention-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  WILLINGNESS & ACTION
                </p>

                <h2>行动与传播意愿</h2>
              </div>

              <span class="optional-note">
                可根据实际感受选择
              </span>
            </div>

            <div class="intention-list">
              <article
                v-for="question in intentionQuestions"
                :key="question.key"
                class="intention-card"
              >
                <p>{{ question.title }}</p>

                <div class="intention-options">
                  <button
                    type="button"
                    class="intention-button"
                    :class="{
                      'is-selected':
                        form[question.key] === true
                    }"
                    @click="selectIntention(question.key, true)"
                  >
                    <Check
                      :size="15"
                      :stroke-width="2"
                    />

                    愿意
                  </button>

                  <button
                    type="button"
                    class="intention-button no-button"
                    :class="{
                      'is-selected':
                        form[question.key] === false
                    }"
                    @click="selectIntention(question.key, false)"
                  >
                    暂不愿意
                  </button>
                </div>
              </article>
            </div>
          </section>

          <!-- 开放建议 -->
          <section class="suggestion-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  YOUR SUGGESTION
                </p>

                <h2>想对“赤水回声”说的话</h2>
              </div>

              <span class="optional-note">
                选填
              </span>
            </div>

            <div class="suggestion-wrap">
              <MessageCircle
                :size="19"
                :stroke-width="1.6"
              />

              <textarea
                v-model="form.suggestions"
                maxlength="1000"
                placeholder="例如：希望增加更多古镇环境声音、增加某些历史人物故事，或优化地图路线提示……"
              ></textarea>

              <span class="character-count">
                {{ form.suggestions.length }} / 1000
              </span>
            </div>
          </section>

          <!-- 提交操作 -->
          <section class="submit-area">
            <button
              type="button"
              class="reset-form-button"
              @click="resetForm"
            >
              <RotateCcw
                :size="16"
                :stroke-width="1.7"
              />

              清空本页
            </button>

            <button
              type="button"
              class="submit-button"
              :disabled="isSubmitting"
              @click="handleSubmit"
            >
              <LoaderCircle
                v-if="isSubmitting"
                :size="18"
                :stroke-width="1.7"
                class="submit-loading-icon"
              />

              <Send
                v-else
                :size="18"
                :stroke-width="1.7"
              />

              <span>
                {{
                  isSubmitting
                    ? '正在提交反馈…'
                    : '提交匿名体验反馈'
                }}
              </span>

              <ArrowRight
                v-if="!isSubmitting"
                :size="17"
                :stroke-width="1.8"
              />
            </button>
          </section>
        </div>

        <!-- 右侧说明 -->
        <aside class="feedback-side">
          <section class="score-summary-card">
            <p class="summary-kicker">
              CURRENT SCORE
            </p>

            <div class="summary-score">
              <strong>{{ averageScore }}</strong>
              <span>/ 5</span>
            </div>

            <p class="summary-description">
              已完成
              {{ completedDimensionCount }}
              / 5 项体验评分
            </p>

            <div class="summary-bars">
              <div
                v-for="dimension in dimensions"
                :key="dimension.key"
                class="summary-bar-item"
              >
                <span>{{ dimension.title }}</span>

                <div class="summary-bar-track">
                  <i
                    :style="{
                      width: `${
                        (Number(form[dimension.key]) / 5) * 100
                      }%`
                    }"
                  ></i>
                </div>

                <strong>
                  {{ form[dimension.key] || '—' }}
                </strong>
              </div>
            </div>
          </section>

          <section class="feedback-privacy-card">
            <div class="privacy-icon">
              <Heart
                :size="19"
                :stroke-width="1.55"
              />
            </div>

            <h3>匿名与尊重</h3>

            <p>
              本问卷不收集姓名、电话、精确位置等个人信息。
              数据仅用于社会实践调研、产品优化与成果分析。
            </p>
          </section>

          <section class="feedback-tips-card">
            <p class="tips-title">
              填写提示
            </p>

            <ul>
              <li>请根据实际使用体验作答；</li>
              <li>五项体验评分为必填；</li>
              <li>意愿问题和开放建议可选填；</li>
              <li>提交后可继续返回地图探索。</li>
            </ul>
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

.feedback-page {
  min-height: 100vh;
  overflow-x: hidden;

  color: #45594d;
  background:
    radial-gradient(
      circle at 82% 10%,
      rgba(255, 242, 202, 0.5),
      transparent 25%
    ),
    radial-gradient(
      circle at 8% 78%,
      rgba(180, 208, 192, 0.27),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #f8f7ef,
      #edf1e9 52%,
      #dfe9df
    );
}

.feedback-page::before {
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

.feedback-header {
  position: relative;
  z-index: 5;
}

.feedback-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(calc(100% - 88px), 1480px);
  min-height: 82px;
  margin: 0 auto;
}

.back-button,
.map-button {
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

.back-button:hover {
  color: #9d4c47;
  transform: translateX(-2px);
}

.map-button:hover {
  color: #9d4c47;
  transform: translateY(-2px);
}

.feedback-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: #344139;
  transition: opacity 0.22s ease;
}

.feedback-brand:hover {
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
   Hero
   ===================================================== */

.feedback-hero {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(310px, 0.85fr);
  align-items: center;
  gap: 30px;

  width: min(calc(100% - 88px), 1480px);
  min-height: 320px;

  margin: 12px auto 0;
  padding: 46px 58px;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 77% 22%,
      rgba(246, 232, 191, 0.42),
      transparent 21%
    ),
    linear-gradient(
      135deg,
      rgba(247, 246, 238, 0.8),
      rgba(227, 239, 228, 0.62)
    );
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 26px;
  box-shadow: 0 20px 60px rgba(61, 80, 68, 0.1);
}

.feedback-hero::after {
  position: absolute;
  right: -8%;
  bottom: -82%;

  width: 47%;
  aspect-ratio: 1;

  border: 1px solid rgba(93, 136, 136, 0.18);
  border-radius: 50%;

  content: "";
}

.feedback-hero-copy {
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

.feedback-hero h1 {
  margin: 10px 0 10px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(38px, 4vw, 60px);
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1.2;
}

.hero-subtitle {
  margin: 0;

  color: #9d4c47;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 17px;
  letter-spacing: 0.06em;
  line-height: 1.85;
}

.hero-description {
  max-width: 590px;
  margin: 14px 0 0;

  color: rgba(69, 87, 75, 0.68);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.035em;
  line-height: 2;
}

/* =====================================================
   Hero 右侧进度卡
   ===================================================== */

.feedback-progress-card {
  position: relative;
  z-index: 2;

  padding: 23px;

  background: rgba(250, 249, 240, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 19px;
  box-shadow: 0 10px 26px rgba(64, 84, 72, 0.06);
  backdrop-filter: blur(12px);
}

.progress-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  color: rgba(82, 100, 89, 0.68);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.progress-card-top strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 27px;
  font-weight: 600;
}

.progress-line {
  height: 5px;
  margin-top: 14px;
  overflow: hidden;

  background: rgba(111, 136, 124, 0.15);
  border-radius: 999px;
}

.progress-line span {
  display: block;
  height: 100%;

  background:
    linear-gradient(
      90deg,
      #b8a36a,
      #9d4c47
    );
  border-radius: inherit;
}

.feedback-progress-card > p {
  margin: 9px 0 0;

  color: rgba(85, 103, 91, 0.59);
  font-size: 11px;
  letter-spacing: 0.025em;
}

.feedback-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;

  margin-top: 18px;
  padding-top: 14px;

  color: rgba(81, 100, 88, 0.58);
  border-top: 1px solid rgba(111, 136, 124, 0.13);

  font-size: 10px;
  letter-spacing: 0.02em;
  line-height: 1.65;
}

/* =====================================================
   问卷布局
   ===================================================== */

.feedback-layout {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 32px;

  width: min(calc(100% - 180px), 1300px);
  margin: 44px auto 84px;
}

.feedback-main {
  min-width: 0;
}

.feedback-side {
  display: grid;
  align-content: start;
  gap: 18px;
}

/* =====================================================
   表单介绍
   ===================================================== */

.form-intro {
  display: flex;
  align-items: center;
  gap: 12px;

  margin-bottom: 22px;
  padding: 17px 19px;

  background: rgba(250, 249, 240, 0.46);
  border: 1px solid rgba(111, 136, 124, 0.14);
  border-radius: 17px;
}

.form-intro-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;

  color: #5d8888;
  background: rgba(211, 231, 228, 0.65);
  border-radius: 50%;
}

.form-intro p {
  margin: 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.form-intro span {
  display: block;
  margin-top: 4px;

  color: rgba(85, 103, 91, 0.58);
  font-size: 11px;
  letter-spacing: 0.025em;
}

.submit-error {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-bottom: 18px;
  padding: 12px 14px;

  color: #9d4c47;
  background: rgba(242, 219, 213, 0.62);
  border: 1px solid rgba(157, 76, 71, 0.22);
  border-radius: 13px;

  font-size: 12px;
  letter-spacing: 0.03em;
}

/* =====================================================
   五维评分
   ===================================================== */

.dimension-list {
  display: grid;
  gap: 14px;
}

.dimension-card {
  padding: 20px;

  background: rgba(250, 249, 240, 0.5);
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(62, 83, 70, 0.035);

  transition:
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.dimension-card.has-score {
  background: rgba(250, 249, 240, 0.7);
  border-color: rgba(93, 136, 136, 0.25);
}

.dimension-card.is-invalid {
  border-color: rgba(157, 76, 71, 0.52);
  box-shadow: 0 0 0 3px rgba(157, 76, 71, 0.06);
}

.dimension-head {
  display: flex;
  align-items: center;
  gap: 11px;
}

.dimension-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;

  color: #9d4c47;
  background: rgba(234, 212, 206, 0.52);
  border-radius: 50%;
}

.dimension-copy {
  flex: 1;
  min-width: 0;
}

.dimension-copy p {
  margin: 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.dimension-copy p span {
  margin-right: 6px;

  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  font-weight: 600;
}

.dimension-copy small {
  display: block;
  margin-top: 4px;

  color: rgba(81, 99, 88, 0.6);
  font-size: 11px;
  letter-spacing: 0.02em;
  line-height: 1.55;
}

.current-score {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.current-score strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}

.current-score span {
  color: rgba(91, 107, 97, 0.5);
  font-size: 10px;
}

.score-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;

  margin-top: 17px;
}

.score-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  min-height: 41px;

  color: rgba(107, 125, 113, 0.68);
  background: rgba(245, 247, 240, 0.52);
  border: 1px solid rgba(111, 136, 124, 0.14);
  border-radius: 11px;

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 15px;
  font-weight: 600;

  transition:
    transform 0.18s ease,
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.score-button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.9);
  border-color: rgba(157, 76, 71, 0.28);
  transform: translateY(-2px);
}

.score-button.is-selected {
  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border-color: #9d4c47;
  box-shadow: 0 7px 16px rgba(127, 66, 63, 0.18);
}

.dimension-scale-text {
  display: flex;
  justify-content: space-between;
  gap: 10px;

  margin-top: 9px;

  color: rgba(90, 107, 97, 0.52);
  font-size: 9px;
  letter-spacing: 0.025em;
}

.dimension-scale-text span:nth-child(2) {
  color: #6f887c;
}

/* =====================================================
   行动意愿
   ===================================================== */

.intention-section,
.suggestion-section {
  margin-top: 42px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;

  margin-bottom: 17px;
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

.optional-note {
  color: rgba(92, 108, 97, 0.5);
  font-size: 10px;
  letter-spacing: 0.035em;
}

.intention-list {
  display: grid;
  gap: 10px;
}

.intention-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;

  padding: 15px 17px;

  background: rgba(250, 249, 240, 0.48);
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 14px;
}

.intention-card > p {
  margin: 0;

  color: rgba(65, 83, 72, 0.76);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.03em;
  line-height: 1.7;
}

.intention-options {
  display: flex;
  gap: 7px;
  flex: none;
}

.intention-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  min-height: 32px;
  padding: 0 11px;

  color: #6f887c;
  background: rgba(244, 247, 240, 0.62);
  border: 1px solid rgba(111, 136, 124, 0.2);
  border-radius: 999px;

  font-size: 10px;
  letter-spacing: 0.035em;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.intention-button:hover {
  color: #4d8c66;
  background: rgba(226, 240, 228, 0.78);
  border-color: rgba(77, 140, 102, 0.32);
}

.intention-button.is-selected {
  color: #fffcef;
  background: #6f887c;
  border-color: #6f887c;
}

.intention-button.no-button.is-selected {
  color: #fffcef;
  background: #9d4c47;
  border-color: #9d4c47;
}

/* =====================================================
   开放建议
   ===================================================== */

.suggestion-wrap {
  position: relative;

  display: flex;
  align-items: flex-start;
  gap: 11px;

  padding: 16px;

  background: rgba(250, 249, 240, 0.52);
  border: 1px solid rgba(111, 136, 124, 0.14);
  border-radius: 16px;
}

.suggestion-wrap > svg {
  flex: none;
  margin-top: 2px;

  color: #6f887c;
}

.suggestion-wrap textarea {
  width: 100%;
  min-height: 125px;
  padding: 0 28px 0 0;

  resize: vertical;

  color: #45594d;
  background: transparent;
  border: 0;
  outline: 0;

  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 13px;
  letter-spacing: 0.03em;
  line-height: 1.9;
}

.suggestion-wrap textarea::placeholder {
  color: rgba(103, 118, 108, 0.45);
}

.character-count {
  position: absolute;
  right: 16px;
  bottom: 12px;

  color: rgba(96, 111, 101, 0.48);
  font-size: 9px;
}

/* =====================================================
   提交操作
   ===================================================== */

.submit-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  margin-top: 30px;
  padding-top: 22px;

  border-top: 1px solid rgba(111, 136, 124, 0.14);
}

.reset-form-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: rgba(96, 112, 101, 0.64);
  background: transparent;
  border: 0;

  font-size: 11px;
  letter-spacing: 0.04em;

  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.reset-form-button:hover {
  color: #9d4c47;
  transform: translateX(-2px);
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  min-height: 46px;
  padding: 0 19px;

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
    transform 0.22s ease,
    box-shadow 0.22s ease,
    opacity 0.22s ease;
}

.submit-button:hover:not(:disabled) {
  box-shadow: 0 15px 30px rgba(127, 66, 63, 0.27);
  transform: translateY(-2px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.submit-loading-icon {
  animation: loadingSpin 0.9s linear infinite;
}

/* =====================================================
   右侧评分与说明
   ===================================================== */

.score-summary-card,
.feedback-privacy-card,
.feedback-tips-card {
  padding: 20px;

  background: rgba(250, 249, 240, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(62, 83, 70, 0.045);
}

.summary-kicker {
  margin: 0;

  color: rgba(99, 114, 103, 0.56);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.summary-score {
  display: flex;
  align-items: baseline;
  gap: 4px;

  margin-top: 7px;
}

.summary-score strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 53px;
  font-weight: 600;
  line-height: 1;
}

.summary-score span {
  color: rgba(96, 112, 101, 0.5);
  font-size: 12px;
}

.summary-description {
  margin: 7px 0 0;

  color: rgba(83, 101, 89, 0.6);
  font-size: 10px;
  letter-spacing: 0.03em;
}

.summary-bars {
  display: grid;
  gap: 11px;

  margin-top: 20px;
  padding-top: 17px;

  border-top: 1px solid rgba(111, 136, 124, 0.13);
}

.summary-bar-item {
  display: grid;
  grid-template-columns: 45px 1fr 18px;
  align-items: center;
  gap: 8px;

  color: rgba(73, 91, 80, 0.65);
  font-size: 10px;
}

.summary-bar-track {
  height: 4px;
  overflow: hidden;

  background: rgba(111, 136, 124, 0.14);
  border-radius: 999px;
}

.summary-bar-track i {
  display: block;
  height: 100%;

  background:
    linear-gradient(
      90deg,
      #5d8888,
      #b8a36a
    );
  border-radius: inherit;

  transition: width 0.28s ease;
}

.summary-bar-item strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  text-align: right;
}

.feedback-privacy-card {
  position: relative;

  padding-left: 56px;
}

.privacy-icon {
  position: absolute;
  top: 20px;
  left: 20px;

  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;

  color: #9d4c47;
  background: rgba(234, 212, 206, 0.58);
  border-radius: 50%;
}

.feedback-privacy-card h3 {
  margin: 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.feedback-privacy-card p {
  margin: 8px 0 0;

  color: rgba(79, 97, 85, 0.6);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 11px;
  letter-spacing: 0.025em;
  line-height: 1.82;
}

.tips-title {
  margin: 0;

  color: #9d4c47;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.feedback-tips-card ul {
  display: grid;
  gap: 7px;

  margin: 13px 0 0;
  padding-left: 16px;

  color: rgba(79, 97, 85, 0.6);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 11px;
  letter-spacing: 0.025em;
  line-height: 1.72;
}

/* =====================================================
   提交成功状态
   ===================================================== */

.feedback-success {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-height: calc(100vh - 82px);
  padding: 60px 24px 80px;

  overflow: hidden;

  text-align: center;
}

.success-orbit {
  position: absolute;

  border: 1px solid rgba(93, 136, 136, 0.16);
  border-radius: 50%;
}

.success-orbit.orbit-one {
  width: 330px;
  height: 330px;
}

.success-orbit.orbit-two {
  width: 440px;
  height: 260px;

  transform: rotate(-20deg);
}

.success-icon {
  position: relative;
  z-index: 2;

  display: grid;
  width: 84px;
  height: 84px;
  place-items: center;

  color: #4d8c66;
  background: rgba(218, 237, 219, 0.7);
  border: 1px solid rgba(77, 140, 102, 0.2);
  border-radius: 50%;
  box-shadow: 0 14px 32px rgba(77, 140, 102, 0.1);
}

.success-kicker {
  position: relative;
  z-index: 2;

  margin: 28px 0 0;

  color: rgba(100, 115, 104, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.feedback-success h1 {
  position: relative;
  z-index: 2;

  margin: 12px 0 0;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 500;
  letter-spacing: 0.08em;
}

.success-description {
  position: relative;
  z-index: 2;

  max-width: 610px;
  margin: 18px 0 0;

  color: rgba(70, 88, 77, 0.68);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 14px;
  letter-spacing: 0.04em;
  line-height: 2;
}

.success-summary {
  position: relative;
  z-index: 2;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;

  margin-top: 31px;

  overflow: hidden;

  background: rgba(111, 136, 124, 0.12);
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 17px;
}

.success-summary article {
  display: flex;
  flex-direction: column;
  gap: 5px;

  min-width: 130px;
  padding: 17px 23px;

  background: rgba(250, 249, 240, 0.68);
}

.success-summary strong {
  color: #9d4c47;
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 28px;
  font-weight: 600;
}

.success-summary span {
  color: rgba(82, 100, 89, 0.6);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.success-actions {
  position: relative;
  z-index: 2;

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;

  margin-top: 29px;
}

.success-primary-button,
.success-secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  min-height: 44px;
  padding: 0 17px;

  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.04em;

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;
}

.success-primary-button {
  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 9px 22px rgba(127, 66, 63, 0.18);
}

.success-primary-button:hover {
  box-shadow: 0 14px 30px rgba(127, 66, 63, 0.27);
  transform: translateY(-2px);
}

.success-secondary-button {
  color: #526b60;
  background: rgba(250, 249, 240, 0.62);
  border: 1px solid rgba(95, 120, 107, 0.2);
}

.success-secondary-button:hover {
  background: rgba(255, 253, 245, 0.94);
  transform: translateY(-2px);
}

/* =====================================================
   响应式适配
   ===================================================== */

@media (max-width: 1100px) {
  .feedback-header-inner,
  .feedback-hero {
    width: calc(100% - 56px);
  }

  .feedback-layout {
    width: calc(100% - 110px);
  }

  .feedback-hero {
    padding: 40px;
  }
}

@media (max-width: 850px) {
  .feedback-header-inner {
    width: calc(100% - 36px);
    min-height: 70px;
  }

  .back-button span,
  .map-button span,
  .brand-text small {
    display: none;
  }

  .feedback-hero {
    grid-template-columns: 1fr;

    width: calc(100% - 36px);
    padding: 32px 25px;
  }

  .feedback-layout {
    grid-template-columns: 1fr;

    width: calc(100% - 52px);
  }

  .feedback-side {
    grid-template-columns: repeat(2, 1fr);
  }

  .score-summary-card {
    grid-column: 1 / -1;
  }

  .intention-card {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .feedback-header-inner {
    width: calc(100% - 28px);
  }

  .feedback-brand {
    position: absolute;
    left: 50%;

    transform: translateX(-50%);
  }

  .brand-text strong {
    font-size: 14px;
  }

  .feedback-hero {
    width: calc(100% - 28px);
    padding: 28px 20px;
  }

  .feedback-hero h1 {
    font-size: 34px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .hero-description {
    font-size: 12px;
  }

  .feedback-layout {
    width: calc(100% - 28px);
    margin-top: 28px;
  }

  .feedback-side {
    grid-template-columns: 1fr;
  }

  .dimension-card {
    padding: 16px;
  }

  .dimension-copy p {
    font-size: 15px;
  }

  .score-options {
    gap: 5px;
  }

  .score-button {
    gap: 2px;
    min-height: 38px;
    font-size: 13px;
  }

  .score-button svg {
    width: 15px;
    height: 15px;
  }

  .dimension-scale-text {
    font-size: 8px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .section-heading h2 {
    font-size: 25px;
  }

  .intention-options {
    width: 100%;
  }

  .intention-button {
    flex: 1;
    justify-content: center;
  }

  .submit-area {
    align-items: flex-start;
    flex-direction: column-reverse;
  }

  .submit-button {
    width: 100%;
  }

  .success-summary {
    grid-template-columns: 1fr;
    width: min(100%, 250px);
  }

  .success-summary article {
    min-width: 0;
  }
}
</style>