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
  Headset,
  Plus,
  Refresh,
  Upload,
  VideoPlay
} from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'

import {
  createAudio,
  deleteAudio,
  getAdminAudios,
  getAdminSpots,
  updateAudio,
  uploadFile
} from '../../api/admin'

const isLoading = ref(false)
const audios = ref([])
const spots = ref([])

const currentSpotFilter = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('新增音频')
const isSaving = ref(false)
const uploadLoading = ref(false)

const formRef = ref(null)
const audioPreviewRef = ref(null)

const defaultForm = () => ({
  id: null,
  spot_id: '',
  title: '',
  audio_url: '',
  duration: 0,
  transcript: '',
  audio_type: '环境声与青年旁白',
  record_time: '',
  record_location: '',
  narrator: '',
  authorization_status: 'pending',
  is_public: true,
  sort_order: 1
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
  title: [
    {
      required: true,
      message: '请输入音频标题。',
      trigger: 'blur'
    }
  ],
  audio_url: [
    {
      required: true,
      message: '请上传音频或填写音频地址。',
      trigger: 'blur'
    }
  ]
}

const filteredAudios = computed(() => {
  if (!currentSpotFilter.value) {
    return audios.value
  }

  return audios.value.filter((audio) => {
    return Number(audio.spot_id) ===
      Number(currentSpotFilter.value)
  })
})

function resetForm() {
  Object.assign(form, defaultForm())
}

function getFileUrl(filePath) {
  if (!filePath) return ''

  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://')
  ) {
    return filePath
  }

  return `${import.meta.env.VITE_FILE_BASE_URL}${filePath}`
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0
  const minutes = Math.floor(total / 60)
  const remainSeconds = total % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainSeconds
  ).padStart(2, '0')}`
}

function getAuthorizationText(status) {
  const map = {
    pending: '待确认',
    internal: '仅内部展示',
    public: '允许公开',
    restricted: '受限使用'
  }

  return map[status] || status || '未知'
}

function getAuthorizationTagType(status) {
  const map = {
    pending: 'warning',
    internal: 'info',
    public: 'success',
    restricted: 'danger'
  }

  return map[status] || 'info'
}

async function loadSpots() {
  try {
    const result = await getAdminSpots()
    spots.value = result.data || []
  } catch (error) {
    ElMessage.error('加载点位数据失败。')
  }
}

async function loadAudios() {
  isLoading.value = true

  try {
    const result = await getAdminAudios()
    audios.value = result.data || []
  } catch (error) {
    ElMessage.error('加载音频列表失败。')
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await Promise.all([
    loadSpots(),
    loadAudios()
  ])
}

function openCreateDialog() {
  resetForm()
  dialogTitle.value = '新增声音导览'
  dialogVisible.value = true
}

function openEditDialog(audio) {
  Object.assign(form, {
    ...defaultForm(),
    ...audio,
    spot_id: Number(audio.spot_id),
    duration: Number(audio.duration || 0),
    sort_order: Number(audio.sort_order || 1),
    is_public: Boolean(audio.is_public)
  })

  dialogTitle.value = `编辑音频：${audio.title}`
  dialogVisible.value = true
}

async function handleUpload(uploadRequest) {
  /*
    使用 Element Plus 的 http-request 时，
    参数不是普通文件，而是 UploadRequestOptions。

    真正的原始 File 对象在：
    uploadRequest.file
  */
  const file = uploadRequest.file

  if (!file) {
    ElMessage.error('未获取到要上传的音频文件。')
    return
  }

  uploadLoading.value = true

  try {
    const result = await uploadFile(file)

    /*
      后端上传成功后返回通常类似：

      {
        code: 0,
        message: '文件上传成功。',
        data: {
          url: '/uploads/audios/xxx.mp3'
        }
      }

      将后端返回路径保存进表单。
    */
    form.audio_url = result.data.url

    ElMessage.success('音频上传成功。')
  } catch (error) {
    console.error('音频上传失败详情：', error)

    ElMessage.error(
      error?.response?.data?.message ||
      error?.message ||
      '音频上传失败，请检查后端服务和文件格式。'
    )
  } finally {
    uploadLoading.value = false
  }
}

function beforeAudioUpload(file) {
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/mp4',
    'audio/ogg'
  ]

  const fileName = file.name.toLowerCase()

  const allowedExtensions = [
    '.mp3',
    '.wav',
    '.aac',
    '.m4a',
    '.ogg'
  ]

  const isAllowedType = allowedTypes.includes(file.type)
  const isAllowedExtension = allowedExtensions.some((item) => {
    return fileName.endsWith(item)
  })

  if (!isAllowedType && !isAllowedExtension) {
    ElMessage.error(
      '仅支持 MP3、WAV、AAC、M4A、OGG 音频文件。'
    )

    return false
  }

  if (file.size > 30 * 1024 * 1024) {
    ElMessage.error('音频文件不能超过 30MB。')
    return false
  }

  return true
}

function handleAudioMetadata(event) {
  const audioElement = event.target

  if (
    Number.isFinite(audioElement.duration) &&
    audioElement.duration > 0
  ) {
    form.duration = Math.round(audioElement.duration)
  }
}

function previewAudio() {
  if (!form.audio_url) {
    ElMessage.warning('请先上传音频或填写音频地址。')
    return
  }

  audioPreviewRef.value?.play()
}

async function saveAudio() {
  if (!formRef.value) return

  await formRef.value.validate()

  isSaving.value = true

  const payload = {
    ...form,
    spot_id: Number(form.spot_id),
    duration: Number(form.duration) || 0,
    sort_order: Number(form.sort_order) || 1,
    is_public: Boolean(form.is_public)
  }

  try {
    if (form.id) {
      await updateAudio(form.id, payload)
      ElMessage.success('音频编辑成功。')
    } else {
      await createAudio(payload)
      ElMessage.success('音频新增成功。')
    }

    dialogVisible.value = false

    await loadAudios()
  } catch (error) {
    ElMessage.error(
      error?.response?.data?.message ||
      '保存音频失败。'
    )
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(audio) {
  try {
    await ElMessageBox.confirm(
      `确定删除音频“${audio.title}”吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteAudio(audio.id)

    ElMessage.success('音频已删除。')

    await loadAudios()
  } catch (error) {
    /*
      取消删除不提示。
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
        <p>AUDIO ARCHIVE</p>
        <h2>声音导览管理</h2>
        <span>
          上传、编辑和维护点位音频、字幕、来源与授权状态。
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
          新增音频
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

        <span class="audio-total">
          当前显示 {{ filteredAudios.length }} 条音频
        </span>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="isLoading"
        :data="filteredAudios"
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
          prop="title"
          label="音频标题"
          min-width="180"
        >
          <template #default="{ row }">
            <strong class="audio-title">
              {{ row.title }}
            </strong>

            <small class="audio-meta">
              {{ row.audio_type || '未分类' }}
            </small>
          </template>
        </el-table-column>

        <el-table-column
          label="时长"
          width="90"
        >
          <template #default="{ row }">
            <span class="duration">
              {{ formatDuration(row.duration) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="record_location"
          label="录制地点"
          min-width="130"
        />

        <el-table-column
          prop="narrator"
          label="讲述者 / 来源"
          min-width="140"
        />

        <el-table-column
          label="授权状态"
          width="115"
        >
          <template #default="{ row }">
            <el-tag
              :type="getAuthorizationTagType(
                row.authorization_status
              )"
              effect="plain"
            >
              {{
                getAuthorizationText(
                  row.authorization_status
                )
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="公开"
          width="80"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.is_public ? 'success' : 'info'"
            >
              {{ row.is_public ? '公开' : '隐藏' }}
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
      width="820px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="112px"
      >
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item
              label="所属点位"
              prop="spot_id"
            >
              <el-select
                v-model="form.spot_id"
                filterable
                placeholder="请选择点位"
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
          </el-col>

          <el-col :span="12">
            <el-form-item
              label="排序"
            >
              <el-input-number
                v-model="form.sort_order"
                :min="1"
                :max="99"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item
          label="音频标题"
          prop="title"
        >
          <el-input v-model="form.title" />
        </el-form-item>

        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="声音类别">
              <el-select
                v-model="form.audio_type"
                style="width: 100%"
              >
                <el-option
                  label="环境声与青年旁白"
                  value="环境声与青年旁白"
                />
                <el-option
                  label="讲解片段与青年旁白"
                  value="讲解片段与青年旁白"
                />
                <el-option
                  label="展厅环境声与讲解"
                  value="展厅环境声与讲解"
                />
                <el-option
                  label="赤水河环境声与船工号子"
                  value="赤水河环境声与船工号子"
                />
                <el-option
                  label="口述史原声"
                  value="口述史原声"
                />
                <el-option
                  label="其他"
                  value="其他"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="音频时长（秒）">
              <el-input-number
                v-model="form.duration"
                :min="0"
                :max="3600"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item
          label="上传音频"
          prop="audio_url"
        >
          <div class="audio-upload-row">
           <el-upload
  :show-file-list="false"
  :http-request="handleUpload"
  :before-upload="beforeAudioUpload"
  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/ogg,.mp3,.wav,.aac,.m4a,.ogg"
>
  <el-button
    :icon="Upload"
    :loading="uploadLoading"
  >
    上传音频
  </el-button>
</el-upload>

            <el-input
              v-model="form.audio_url"
              placeholder="/uploads/audios/..."
            />

            <el-button
              :icon="VideoPlay"
              @click="previewAudio"
            >
              试听
            </el-button>
          </div>

          <audio
            v-if="form.audio_url"
            ref="audioPreviewRef"
            :src="getFileUrl(form.audio_url)"
            controls
            class="audio-preview-player"
            @loadedmetadata="handleAudioMetadata"
          />
        </el-form-item>

        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="录制时间">
              <el-input
                v-model="form.record_time"
                placeholder="例如：2026年暑期社会实践采集"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="录制地点">
              <el-input
                v-model="form.record_location"
                placeholder="例如：太平渡渡口"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="讲述者 / 来源">
              <el-input
                v-model="form.narrator"
                placeholder="例如：赤水回声实践团队"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="授权状态">
              <el-select
                v-model="form.authorization_status"
                style="width: 100%"
              >
                <el-option
                  label="待确认"
                  value="pending"
                />
                <el-option
                  label="仅内部展示"
                  value="internal"
                />
                <el-option
                  label="允许公开"
                  value="public"
                />
                <el-option
                  label="受限使用"
                  value="restricted"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="公开状态">
          <el-switch
            v-model="form.is_public"
            active-text="游客端公开"
            inactive-text="暂时隐藏"
          />
        </el-form-item>

        <el-form-item label="音频逐字稿">
          <el-input
            v-model="form.transcript"
            type="textarea"
            :rows="8"
            placeholder="建议按照实际音频内容填写逐字稿；可使用【环境声】、【讲述者】、【青年旁白】等标记。"
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
          @click="saveAudio"
        >
          保存音频
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

.audio-total {
  color: #9d4c47;
  font-size: 11px;
}

.spot-name,
.audio-title {
  display: block;
  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-weight: 500;
}

.audio-meta {
  display: block;
  margin-top: 5px;
  color: rgba(88, 104, 93, 0.54);
  font-size: 10px;
}

.duration {
  color: #5d8888;
  font-family: "Cormorant Garamond", serif;
  font-size: 15px;
  font-weight: 600;
}

.audio-upload-row {
  display: flex;
  width: 100%;
  gap: 10px;
}

.audio-upload-row :deep(.el-input) {
  flex: 1;
}

.audio-preview-player {
  width: 100%;
  margin-top: 12px;
}
</style>