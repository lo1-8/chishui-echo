<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'
import {
  Download,
  Refresh,
  Star
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { getAdminFeedbacks } from '../../api/admin'

const isLoading = ref(false)
const feedbackList = ref([])
const total = ref(0)

const currentPage = ref(1)
const pageSize = ref(20)

/*
  后端当前接口支持：
  limit
  offset

  前端用 currentPage 和 pageSize 转换为 offset。
*/
const averageScores = computed(() => {
  if (!feedbackList.value.length) {
    return {
      clarity: 0,
      immersion: 0,
      emotion: 0,
      knowledge: 0,
      action: 0
    }
  }

  const sum = feedbackList.value.reduce(
    (result, item) => {
      result.clarity += Number(item.clarity_score || 0)
      result.immersion += Number(item.immersion_score || 0)
      result.emotion += Number(item.emotion_score || 0)
      result.knowledge += Number(item.knowledge_score || 0)
      result.action += Number(item.action_score || 0)

      return result
    },
    {
      clarity: 0,
      immersion: 0,
      emotion: 0,
      knowledge: 0,
      action: 0
    }
  )

  const count = feedbackList.value.length

  return {
    clarity: sum.clarity / count,
    immersion: sum.immersion / count,
    emotion: sum.emotion / count,
    knowledge: sum.knowledge / count,
    action: sum.action / count
  }
})

const scoreCards = computed(() => {
  return [
    {
      name: '清晰度',
      value: averageScores.value.clarity
    },
    {
      name: '沉浸感',
      value: averageScores.value.immersion
    },
    {
      name: '情感触动',
      value: averageScores.value.emotion
    },
    {
      name: '知识获得感',
      value: averageScores.value.knowledge
    },
    {
      name: '行动意愿',
      value: averageScores.value.action
    }
  ]
})

async function loadFeedbacks() {
  isLoading.value = true

  try {
    const offset = (currentPage.value - 1) * pageSize.value

    const result = await getAdminFeedbacks({
      limit: pageSize.value,
      offset
    })

    total.value = result.data?.total || 0
    feedbackList.value = result.data?.list || []
  } catch (error) {
    ElMessage.error('加载反馈数据失败。')
  } finally {
    isLoading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  loadFeedbacks()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadFeedbacks()
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function booleanText(value) {
  return Number(value) === 1 ? '愿意' : '暂不愿意'
}

function booleanTagType(value) {
  return Number(value) === 1 ? 'success' : 'info'
}

function escapeCsvValue(value) {
  const text = String(value ?? '')

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function exportCurrentPageCsv() {
  if (!feedbackList.value.length) {
    ElMessage.warning('当前没有可导出的反馈数据。')
    return
  }

  const headers = [
    '反馈ID',
    '匿名访客ID',
    '提交时间',
    '完成点位数',
    '清晰度',
    '沉浸感',
    '情感触动',
    '知识获得感',
    '行动意愿',
    '分享意愿',
    '推荐意愿',
    '继续参观意愿',
    '文创购买意愿',
    '研学参与意愿',
    '小额付费意愿',
    '开放建议'
  ]

  const rows = feedbackList.value.map((item) => [
    item.id,
    item.visitor_id,
    formatDate(item.created_at),
    item.completed_spot_count,
    item.clarity_score,
    item.immersion_score,
    item.emotion_score,
    item.knowledge_score,
    item.action_score,
    booleanText(item.share_intention),
    booleanText(item.recommend_intention),
    booleanText(item.revisit_intention),
    booleanText(item.purchase_intention),
    booleanText(item.study_intention),
    booleanText(item.payment_intention),
    item.suggestions || ''
  ])

  const csvContent = [
    headers,
    ...rows
  ]
    .map((row) => {
      return row
        .map(escapeCsvValue)
        .join(',')
    })
    .join('\n')

  /*
    加 BOM，避免 Excel 打开中文 CSV 乱码。
  */
  const blob = new Blob(
    [`\uFEFF${csvContent}`],
    {
      type: 'text/csv;charset=utf-8;'
    }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `赤水回声体验反馈_第${currentPage.value}页_${Date.now()}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)

  ElMessage.success('CSV 文件已开始下载。')
}

onMounted(() => {
  loadFeedbacks()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <div>
        <p>EXPERIENCE FEEDBACK</p>
        <h2>体验反馈数据</h2>
        <span>
          查看游客的五维声音体验评价、行动意愿和开放建议。
        </span>
      </div>

      <div class="toolbar-actions">
        <el-button
          :icon="Refresh"
          @click="loadFeedbacks"
        >
          刷新
        </el-button>

        <el-button
          type="primary"
          :icon="Download"
          @click="exportCurrentPageCsv"
        >
          导出当前页 CSV
        </el-button>
      </div>
    </div>

    <div class="feedback-overview-grid">
      <article class="feedback-stat-card">
        <p>总反馈数量</p>
        <strong>{{ total }}</strong>
        <span>匿名体验问卷</span>
      </article>

      <article
        v-for="item in scoreCards"
        :key="item.name"
        class="score-card"
      >
        <div>
          <p>{{ item.name }}</p>
          <strong>
            {{
              item.value
                ? item.value.toFixed(2)
                : '—'
            }}
          </strong>
        </div>

        <div class="mini-score-track">
          <i
            :style="{
              width: `${(item.value / 5) * 100}%`
            }"
          ></i>
        </div>
      </article>
    </div>

    <el-card class="table-card">
      <el-table
        v-loading="isLoading"
        :data="feedbackList"
        stripe
        max-height="560"
      >
        <el-table-column
          label="提交时间"
          width="170"
        >
          <template #default="{ row }">
            <span class="date-text">
              {{ formatDate(row.created_at) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="完成点位"
          width="100"
        >
          <template #default="{ row }">
            <span class="completed-count">
              {{ row.completed_spot_count }} / 5
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="五维评分"
          min-width="260"
        >
          <template #default="{ row }">
            <div class="score-tags">
              <el-tag size="small">
                清 {{ row.clarity_score }}
              </el-tag>

              <el-tag size="small" type="success">
                沉 {{ row.immersion_score }}
              </el-tag>

              <el-tag size="small" type="warning">
                情 {{ row.emotion_score }}
              </el-tag>

              <el-tag size="small" type="danger">
                知 {{ row.knowledge_score }}
              </el-tag>

              <el-tag size="small" effect="plain">
                行 {{ row.action_score }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="分享"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.share_intention)"
            >
              {{ booleanText(row.share_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="推荐"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.recommend_intention)"
            >
              {{ booleanText(row.recommend_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="复游"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.revisit_intention)"
            >
              {{ booleanText(row.revisit_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="文创"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.purchase_intention)"
            >
              {{ booleanText(row.purchase_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="研学"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.study_intention)"
            >
              {{ booleanText(row.study_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="付费"
          width="76"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="booleanTagType(row.payment_intention)"
            >
              {{ booleanText(row.payment_intention) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="开放建议"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="suggestion-text">
              {{ row.suggestions || '—' }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <span>
          当前显示第 {{ currentPage }} 页，共 {{ total }} 条反馈
        </span>

        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </section>
</template>

<style scoped lang="scss">
.admin-page {
  max-width: 1450px;
}

.page-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.page-toolbar p {
  margin: 0;
  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.17em;
}

.page-toolbar h2 {
  margin: 7px 0;
  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-size: 29px;
  font-weight: 500;
}

.page-toolbar span {
  color: rgba(79, 96, 85, 0.62);
  font-size: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.feedback-overview-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.feedback-stat-card,
.score-card {
  min-height: 110px;
  padding: 17px;

  background: rgba(252, 251, 245, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 15px;
  box-shadow: 0 8px 22px rgba(59, 78, 66, 0.05);
}

.feedback-stat-card p,
.score-card p {
  margin: 0;
  color: rgba(87, 104, 93, 0.58);
  font-size: 11px;
}

.feedback-stat-card strong,
.score-card strong {
  display: block;
  margin-top: 7px;

  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 31px;
  font-weight: 600;
  line-height: 1;
}

.feedback-stat-card span {
  display: block;
  margin-top: 6px;
  color: rgba(87, 104, 93, 0.5);
  font-size: 10px;
}

.score-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mini-score-track {
  height: 4px;
  margin-top: 13px;
  overflow: hidden;

  background: rgba(111, 136, 124, 0.13);
  border-radius: 999px;
}

.mini-score-track i {
  display: block;
  height: 100%;

  background: linear-gradient(90deg, #5d8888, #b8a36a);
  border-radius: inherit;
}

.table-card {
  border: 0;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(59, 78, 66, 0.06);
}

.date-text,
.completed-count {
  color: rgba(74, 92, 81, 0.7);
  font-family: "Cormorant Garamond", serif;
  font-size: 12px;
}

.score-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.suggestion-text {
  color: rgba(76, 94, 82, 0.68);
  font-size: 11px;
}

.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 18px;

  color: rgba(84, 101, 90, 0.58);
  font-size: 11px;
}

@media (max-width: 1300px) {
  .feedback-overview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .feedback-overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pagination-wrap {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>