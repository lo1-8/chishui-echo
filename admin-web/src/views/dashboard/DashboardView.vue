<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
import * as echarts from 'echarts'
import {
  ChatDotRound,
  Headset,
  Location,
  Star,
  User
} from '@element-plus/icons-vue'

import { getAdminStatistics } from '../../api/admin'

const isLoading = ref(true)
const statistics = ref(null)
const radarRef = ref(null)

let radarChart = null

const cards = computed(() => {
  const data = statistics.value || {}

  return [
    {
      title: '核心点位',
      value: data.spots?.total || 0,
      extra: `已公开 ${data.spots?.published || 0} 个`,
      icon: Location,
      color: 'red'
    },
    {
      title: '体验反馈',
      value: data.feedbacks?.total || 0,
      extra: '匿名问卷提交数量',
      icon: ChatDotRound,
      color: 'gold'
    },
    {
      title: '匿名访客',
      value: data.events?.visitors || 0,
      extra: '按匿名 visitor_id 统计',
      icon: User,
      color: 'sage'
    },
    {
      title: '音频播放',
      value: data.events?.audio_plays || 0,
      extra: `打卡 ${data.events?.checkins || 0} 次`,
      icon: Headset,
      color: 'river'
    }
  ]
})

const scoreItems = computed(() => {
  const scores = statistics.value?.experience_scores || {}

  return [
    {
      name: '清晰度',
      value: Number(scores.clarity_score || 0)
    },
    {
      name: '沉浸感',
      value: Number(scores.immersion_score || 0)
    },
    {
      name: '情感触动',
      value: Number(scores.emotion_score || 0)
    },
    {
      name: '知识获得感',
      value: Number(scores.knowledge_score || 0)
    },
    {
      name: '行动意愿',
      value: Number(scores.action_score || 0)
    }
  ]
})

async function loadStatistics() {
  isLoading.value = true

  try {
    const result = await getAdminStatistics()

    statistics.value = result.data

    await nextTick()

    renderRadarChart()
  } catch (error) {
    console.error('加载统计数据失败：', error)
  } finally {
    isLoading.value = false
  }
}

function renderRadarChart() {
  if (!radarRef.value) return

  if (!radarChart) {
    radarChart = echarts.init(radarRef.value)
  }

  const scores = scoreItems.value
  const hasData = scores.some((item) => item.value > 0)

  radarChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item'
    },
    radar: {
      center: ['50%', '53%'],
      radius: '66%',
      splitNumber: 5,
      indicator: scores.map((item) => ({
        name: item.name,
        max: 5
      })),
      axisName: {
        color: '#61756a',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(111,136,124,0.12)'
          ]
        }
      },
      splitArea: {
        areaStyle: {
          color: [
            'rgba(250,249,240,0.2)',
            'rgba(220,232,222,0.12)'
          ]
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(111,136,124,0.18)'
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: hasData
              ? scores.map((item) => item.value)
              : [0, 0, 0, 0, 0],
            name: '五维体验均值',
            symbol: 'circle',
            symbolSize: 5,
            lineStyle: {
              color: '#9d4c47',
              width: 2
            },
            itemStyle: {
              color: '#9d4c47'
            },
            areaStyle: {
              color: 'rgba(157,76,71,0.18)'
            }
          }
        ]
      }
    ]
  })
}

function handleResize() {
  radarChart?.resize()
}

onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
})
</script>

<template>
  <section class="dashboard-page">
    <div class="page-intro">
      <div>
        <p>MAP DATA OVERVIEW</p>
        <h2>赤水回声运行概览</h2>
        <span>
          通过游客行为、声音体验评价与地图内容数据，观察数字声音导览的使用情况。
        </span>
      </div>

      <el-button
        type="primary"
        :loading="isLoading"
        @click="loadStatistics"
      >
        刷新数据
      </el-button>
    </div>

    <el-skeleton
      v-if="isLoading"
      :rows="10"
      animated
    />

    <template v-else>
      <div class="stat-grid">
        <article
          v-for="card in cards"
          :key="card.title"
          class="stat-card"
        >
          <div
            class="stat-icon"
            :class="`icon-${card.color}`"
          >
            <component
              :is="card.icon"
              :size="21"
            />
          </div>

          <div>
            <p>{{ card.title }}</p>
            <strong>{{ card.value }}</strong>
            <span>{{ card.extra }}</span>
          </div>
        </article>
      </div>

      <div class="dashboard-grid">
        <el-card class="dashboard-card radar-card">
          <template #header>
            <div class="card-header">
              <div>
                <p>EXPERIENCE EVALUATION</p>
                <h3>红色声音体验五维评价</h3>
              </div>

              <span class="score-badge">
                <Star :size="14" />
                问卷 {{ statistics?.feedbacks?.total || 0 }} 份
              </span>
            </div>
          </template>

          <div
            ref="radarRef"
            class="radar-chart"
          ></div>
        </el-card>

        <el-card class="dashboard-card behavior-card">
          <template #header>
            <div class="card-header">
              <div>
                <p>USER ACTIONS</p>
                <h3>用户行为统计</h3>
              </div>
            </div>
          </template>

          <div class="behavior-list">
            <div class="behavior-item">
              <span>总行为事件</span>
              <strong>{{ statistics?.events?.total || 0 }}</strong>
            </div>

            <div class="behavior-item">
              <span>点位打卡</span>
              <strong>{{ statistics?.events?.checkins || 0 }}</strong>
            </div>

            <div class="behavior-item">
              <span>点位收藏</span>
              <strong>{{ statistics?.events?.collections || 0 }}</strong>
            </div>

            <div class="behavior-item">
              <span>音频播放</span>
              <strong>{{ statistics?.events?.audio_plays || 0 }}</strong>
            </div>
          </div>

          <div class="behavior-note">
            <span></span>
            数据来源于匿名 visitor_id 行为记录，仅用于项目调研与产品优化。
          </div>
        </el-card>
      </div>

      <el-card class="dashboard-card score-table-card">
        <template #header>
          <div class="card-header">
            <div>
              <p>DIMENSION SCORES</p>
              <h3>五维评分明细</h3>
            </div>
          </div>
        </template>

        <div class="score-table">
          <div
            v-for="item in scoreItems"
            :key="item.name"
            class="score-row"
          >
            <span>{{ item.name }}</span>

            <div class="score-track">
              <i
                :style="{
                  width: `${(item.value / 5) * 100}%`
                }"
              ></i>
            </div>

            <strong>
              {{ item.value ? item.value.toFixed(2) : '—' }}
            </strong>
          </div>
        </div>
      </el-card>
    </template>
  </section>
</template>

<style scoped lang="scss">
.dashboard-page {
  max-width: 1450px;
}

.page-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;

  margin-bottom: 24px;
}

.page-intro p,
.card-header p {
  margin: 0;

  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.17em;
}

.page-intro h2 {
  margin: 7px 0 7px;

  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 29px;
  font-weight: 500;
}

.page-intro span {
  color: rgba(79, 96, 85, 0.62);
  font-size: 12px;
  line-height: 1.75;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 13px;

  min-height: 108px;
  padding: 18px;

  background: rgba(252, 251, 245, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 15px;
  box-shadow: 0 8px 22px rgba(59, 78, 66, 0.05);
}

.stat-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  place-items: center;
  border-radius: 50%;
}

.icon-red {
  color: #9d4c47;
  background: rgba(234, 212, 206, 0.65);
}

.icon-gold {
  color: #a78a48;
  background: rgba(241, 232, 198, 0.7);
}

.icon-sage {
  color: #587267;
  background: rgba(216, 233, 218, 0.72);
}

.icon-river {
  color: #5d8888;
  background: rgba(211, 231, 228, 0.72);
}

.stat-card p {
  margin: 0;
  color: rgba(87, 104, 93, 0.58);
  font-size: 11px;
}

.stat-card strong {
  display: block;
  margin-top: 4px;

  color: #344139;
  font-family: "Cormorant Garamond", serif;
  font-size: 31px;
  font-weight: 600;
  line-height: 1;
}

.stat-card span {
  display: block;
  margin-top: 4px;
  color: rgba(87, 104, 93, 0.52);
  font-size: 10px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 20px;

  margin-bottom: 20px;
}

.dashboard-card {
  border: 0;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(59, 78, 66, 0.06);
}

.dashboard-card :deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(111, 136, 124, 0.12);
}

.dashboard-card :deep(.el-card__body) {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h3 {
  margin: 6px 0 0;

  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 19px;
  font-weight: 500;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  color: #a78a48;
  background: rgba(241, 232, 198, 0.55);
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 10px;
}

.radar-chart {
  width: 100%;
  height: 330px;
}

.behavior-list {
  display: grid;
  gap: 12px;
}

.behavior-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 12px 0;
  border-bottom: 1px solid rgba(111, 136, 124, 0.1);
}

.behavior-item span {
  color: rgba(77, 95, 84, 0.66);
  font-size: 12px;
}

.behavior-item strong {
  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 23px;
  font-weight: 600;
}

.behavior-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  margin-top: 18px;
  padding-top: 15px;

  color: rgba(87, 104, 93, 0.52);
  border-top: 1px solid rgba(111, 136, 124, 0.1);
  font-size: 10px;
  line-height: 1.65;
}

.behavior-note span {
  width: 7px;
  height: 7px;
  flex: none;
  margin-top: 4px;

  background: #b8a36a;
  border-radius: 50%;
}

.score-table {
  display: grid;
  gap: 17px;
}

.score-row {
  display: grid;
  grid-template-columns: 90px 1fr 45px;
  align-items: center;
  gap: 12px;
}

.score-row > span {
  color: rgba(76, 94, 82, 0.7);
  font-size: 12px;
}

.score-track {
  height: 6px;
  overflow: hidden;

  background: rgba(111, 136, 124, 0.13);
  border-radius: 999px;
}

.score-track i {
  display: block;
  height: 100%;

  background: linear-gradient(90deg, #5d8888, #b8a36a);
  border-radius: inherit;
}

.score-row strong {
  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 17px;
  text-align: right;
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>