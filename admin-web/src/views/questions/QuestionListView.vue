<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref
} from 'vue'
import {
  Delete,
  Edit,
  Plus,
  Refresh
} from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'

import {
  createQuestion,
  deleteQuestion,
  getAdminQuestions,
  getAdminSpots,
  updateQuestion
} from '../../api/admin'

const isLoading = ref(false)
const questions = ref([])
const spots = ref([])

const currentSpotFilter = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('新增研学问答')
const isSaving = ref(false)

const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  spot_id: '',
  question: '',
  question_type: 'single',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: '0',
  explanation: '',
  is_published: true
})

const form = reactive(defaultForm())

const formRules = {
  spot_id: [
    {
      required: true,
      message: '请选择所属点位。',
      trigger: 'change'
    }
  ],
  question: [
    {
      required: true,
      message: '请输入题目内容。',
      trigger: 'blur'
    }
  ],
  option_a: [
    {
      required: true,
      message: '请填写 A 选项。',
      trigger: 'blur'
    }
  ],
  option_b: [
    {
      required: true,
      message: '请填写 B 选项。',
      trigger: 'blur'
    }
  ],
  option_c: [
    {
      required: true,
      message: '请填写 C 选项。',
      trigger: 'blur'
    }
  ],
  correct_answer: [
    {
      required: true,
      message: '请选择正确答案。',
      trigger: 'change'
    }
  ]
}

const filteredQuestions = computed(() => {
  if (!currentSpotFilter.value) {
    return questions.value
  }

  return questions.value.filter((question) => {
    return Number(question.spot_id) ===
      Number(currentSpotFilter.value)
  })
})

function resetForm() {
  Object.assign(form, defaultForm())
}

function parseOptions(question) {
  if (Array.isArray(question.options)) {
    return question.options
  }

  if (question.options_json) {
    try {
      return JSON.parse(question.options_json)
    } catch (error) {
      return []
    }
  }

  return []
}

function getCorrectAnswerText(question) {
  const options = parseOptions(question)
  const index = Number(question.correct_answer)

  if (
    Number.isNaN(index) ||
    !options[index]
  ) {
    return '未设置'
  }

  return `${String.fromCharCode(65 + index)}. ${options[index]}`
}

async function loadSpots() {
  try {
    const result = await getAdminSpots()
    spots.value = result.data || []
  } catch (error) {
    ElMessage.error('加载点位数据失败。')
  }
}

async function loadQuestions() {
  isLoading.value = true

  try {
    const result = await getAdminQuestions()
    questions.value = result.data || []
  } catch (error) {
    ElMessage.error('加载研学问答失败。')
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await Promise.all([
    loadSpots(),
    loadQuestions()
  ])
}

function openCreateDialog() {
  resetForm()
  dialogTitle.value = '新增研学问答'
  dialogVisible.value = true
}

function openEditDialog(question) {
  const options = parseOptions(question)

  Object.assign(form, {
    ...defaultForm(),
    ...question,
    spot_id: Number(question.spot_id),
    option_a: options[0] || '',
    option_b: options[1] || '',
    option_c: options[2] || '',
    option_d: options[3] || '',
    correct_answer: String(question.correct_answer || '0'),
    is_published: Boolean(question.is_published)
  })

  dialogTitle.value = '编辑研学问答'
  dialogVisible.value = true
}

function buildOptions() {
  const options = [
    form.option_a.trim(),
    form.option_b.trim(),
    form.option_c.trim()
  ]

  if (form.option_d.trim()) {
    options.push(form.option_d.trim())
  }

  return options
}

async function saveQuestion() {
  if (!formRef.value) return

  await formRef.value.validate()

  const options = buildOptions()

  if (Number(form.correct_answer) >= options.length) {
    ElMessage.error('正确答案不在当前选项范围内。')
    return
  }

  isSaving.value = true

  const payload = {
    spot_id: Number(form.spot_id),
    question: form.question,
    question_type: form.question_type,
    options,
    correct_answer: String(form.correct_answer),
    explanation: form.explanation,
    is_published: Boolean(form.is_published)
  }

  try {
    if (form.id) {
      await updateQuestion(form.id, payload)
      ElMessage.success('研学问答编辑成功。')
    } else {
      await createQuestion(payload)
      ElMessage.success('研学问答新增成功。')
    }

    dialogVisible.value = false

    await loadQuestions()
  } catch (error) {
    ElMessage.error(
      error?.response?.data?.message ||
      '保存研学问答失败。'
    )
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(question) {
  try {
    await ElMessageBox.confirm(
      '确定删除这道研学问答吗？删除后无法恢复。',
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    await deleteQuestion(question.id)

    ElMessage.success('研学问答已删除。')

    await loadQuestions()
  } catch (error) {
    /*
      用户取消时不提示。
    */
  }
}

onMounted(() => {
  refreshData()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <div>
        <p>STUDY QUESTIONS</p>
        <h2>研学问答管理</h2>
        <span>
          管理每个声音点位的互动问题、选项、答案与解析。
        </span>
      </div>

      <div class="toolbar-actions">
        <el-button
          :icon="Refresh"
          @click="refreshData"
        >
          刷新
        </el-button>

        <el-button
          type="primary"
          :icon="Plus"
          @click="openCreateDialog"
        >
          新增问答
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-row">
        <span>所属点位筛选</span>

        <el-select
          v-model="currentSpotFilter"
          clearable
          placeholder="全部点位"
          style="width: 260px"
        >
          <el-option
            v-for="spot in spots"
            :key="spot.id"
            :label="`${String(spot.route_order).padStart(2, '0')} · ${spot.name}`"
            :value="spot.id"
          />
        </el-select>

        <span class="question-total">
          当前显示 {{ filteredQuestions.length }} 道题目
        </span>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="isLoading"
        :data="filteredQuestions"
        stripe
      >
        <el-table-column
          label="所属点位"
          min-width="170"
        >
          <template #default="{ row }">
            <strong class="spot-name">
              {{ row.spot_name || `点位 #${row.spot_id}` }}
            </strong>
          </template>
        </el-table-column>

        <el-table-column
          prop="question"
          label="题目"
          min-width="250"
          show-overflow-tooltip
        />

        <el-table-column
          label="正确答案"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="correct-answer">
              {{ getCorrectAnswerText(row) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="公开状态"
          width="100"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.is_published ? 'success' : 'info'"
            >
              {{ row.is_published ? '已公开' : '已隐藏' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="160"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>

            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="104px"
      >
        <el-form-item
          label="所属点位"
          prop="spot_id"
        >
          <el-select
            v-model="form.spot_id"
            filterable
            placeholder="请选择所属点位"
            style="width: 100%"
          >
            <el-option
              v-for="spot in spots"
              :key="spot.id"
              :label="`${String(spot.route_order).padStart(2, '0')} · ${spot.name}`"
              :value="spot.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="题目内容"
          prop="question"
        >
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="3"
            placeholder="请输入研学问题。"
          />
        </el-form-item>

        <el-form-item label="A 选项" prop="option_a">
          <el-input v-model="form.option_a" />
        </el-form-item>

        <el-form-item label="B 选项" prop="option_b">
          <el-input v-model="form.option_b" />
        </el-form-item>

        <el-form-item label="C 选项" prop="option_c">
          <el-input v-model="form.option_c" />
        </el-form-item>

        <el-form-item label="D 选项（可选）">
          <el-input v-model="form.option_d" />
        </el-form-item>

        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item
              label="正确答案"
              prop="correct_answer"
            >
              <el-select
                v-model="form.correct_answer"
                style="width: 100%"
              >
                <el-option label="A 选项" value="0" />
                <el-option label="B 选项" value="1" />
                <el-option label="C 选项" value="2" />
                <el-option
                  v-if="form.option_d"
                  label="D 选项"
                  value="3"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="公开状态">
              <el-switch
                v-model="form.is_published"
                active-text="公开"
                inactive-text="隐藏"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="答案解析">
          <el-input
            v-model="form.explanation"
            type="textarea"
            :rows="4"
            placeholder="请填写用户答题后展示的答案解析。"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button
          type="primary"
          :loading="isSaving"
          @click="saveQuestion"
        >
          保存问答
        </el-button>
      </template>
    </el-dialog>
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

.filter-card,
.table-card {
  margin-bottom: 18px;
  border: 0;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(59, 78, 66, 0.06);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(75, 92, 81, 0.72);
  font-size: 12px;
}

.question-total {
  color: #9d4c47;
  font-size: 11px;
}

.spot-name {
  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-weight: 500;
}

.correct-answer {
  color: #587267;
  font-size: 12px;
}
</style>