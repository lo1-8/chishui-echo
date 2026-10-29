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
  Refresh,
  Upload
} from '@element-plus/icons-vue'
import {
  ElMessage,
  ElMessageBox
} from 'element-plus'

import {
  createSpot,
  deleteSpot,
  getAdminSpots,
  updateSpot,
  uploadFile
} from '../../api/admin'

const isLoading = ref(false)
const spots = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增点位')
const isSaving = ref(false)

const formRef = ref(null)
const uploadLoading = ref(false)

const defaultForm = () => ({
  id: null,
  name: '',
  subtitle: '',
  type: '红色场馆',
  route_order: 999,
  map_x: '',
  map_y: '',
  latitude: '',
  longitude: '',
  cover_image: '',
  short_intro: '',
  story_content: '',
  story_source: '',
  next_spot_id: null,
  navigation_url: '',
  is_published: true
})

const form = reactive(defaultForm())

const formRules = {
  name: [
    {
      required: true,
      message: '请输入点位名称。',
      trigger: 'blur'
    }
  ],
  type: [
    {
      required: true,
      message: '请选择点位类型。',
      trigger: 'change'
    }
  ],
  route_order: [
    {
      required: true,
      message: '请填写路线顺序。',
      trigger: 'blur'
    }
  ],
  map_x: [
    {
      required: true,
      message: '请填写地图横坐标 map_x。',
      trigger: 'blur'
    }
  ],
  map_y: [
    {
      required: true,
      message: '请填写地图纵坐标 map_y。',
      trigger: 'blur'
    }
  ]
}

const sortedSpots = computed(() => {
  return [...spots.value].sort(
    (a, b) => Number(a.route_order) - Number(b.route_order)
  )
})

function resetForm() {
  Object.assign(form, defaultForm())
}

async function loadSpots() {
  isLoading.value = true

  try {
    const result = await getAdminSpots()
    spots.value = result.data || []
  } catch (error) {
    ElMessage.error('加载点位列表失败。')
  } finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  resetForm()
  dialogTitle.value = '新增点位'
  dialogVisible.value = true
}

function openEditDialog(spot) {
  Object.assign(form, {
    ...defaultForm(),
    ...spot,
    next_spot_id: spot.next_spot_id || null,
    is_published: Boolean(spot.is_published)
  })

  dialogTitle.value = `编辑点位：${spot.name}`
  dialogVisible.value = true
}

async function saveSpot() {
  if (!formRef.value) return

  await formRef.value.validate()

  isSaving.value = true

  const payload = {
    ...form,
    route_order: Number(form.route_order),
    map_x: Number(form.map_x),
    map_y: Number(form.map_y),
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
    next_spot_id: form.next_spot_id || null,
    is_published: Boolean(form.is_published)
  }

  try {
    if (form.id) {
      await updateSpot(form.id, payload)
      ElMessage.success('点位编辑成功。')
    } else {
      await createSpot(payload)
      ElMessage.success('点位新增成功。')
    }

    dialogVisible.value = false
    await loadSpots()
  } catch (error) {
    ElMessage.error(
      error?.response?.data?.message ||
      '保存点位失败。'
    )
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(spot) {
  try {
    await ElMessageBox.confirm(
      `确定删除点位“${spot.name}”吗？关联音频和问答也可能被删除。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    await deleteSpot(spot.id)

    ElMessage.success('点位已删除。')

    await loadSpots()
  } catch (error) {
    /*
      用户取消时无需提示。
    */
  }
}

async function handleUpload(uploadRequest) {
  /*
    Element Plus 的 http-request 回调中，
    上传文件在 uploadRequest.file。
  */
  const file = uploadRequest.file

  if (!file) {
    ElMessage.error('未获取到要上传的图片文件。')
    return
  }

  uploadLoading.value = true

  try {
    const result = await uploadFile(file)

    /*
      例如：
      /uploads/images/1719999999999-123456.jpg
    */
    form.cover_image = result.data.url

    ElMessage.success('封面图片上传成功。')
  } catch (error) {
    console.error('图片上传失败详情：', error)

    ElMessage.error(
      error?.response?.data?.message ||
      error?.message ||
      '图片上传失败，请检查后端服务和文件格式。'
    )
  } finally {
    uploadLoading.value = false
  }
}

function beforeImageUpload(file) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]

  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 JPG、PNG、WebP 图片。')
    return false
  }

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片不能超过 10MB。')
    return false
  }

  return true
}

function getImageUrl(path) {
  if (!path) return ''

  if (path.startsWith('http')) {
    return path
  }

  return `${import.meta.env.VITE_FILE_BASE_URL}${path}`
}

onMounted(() => {
  loadSpots()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <div>
        <p>MAP SPOTS</p>
        <h2>声音点位管理</h2>
        <span>
          管理地图点位、坐标、路线顺序、故事内容与外部导航。
        </span>
      </div>

      <div class="toolbar-actions">
        <el-button
          :icon="Refresh"
          @click="loadSpots"
        >
          刷新
        </el-button>

        <el-button
          type="primary"
          :icon="Plus"
          @click="openCreateDialog"
        >
          新增点位
        </el-button>
      </div>
    </div>

    <el-card class="table-card">
      <el-table
        v-loading="isLoading"
        :data="sortedSpots"
        stripe
      >
        <el-table-column
          label="顺序"
          width="78"
        >
          <template #default="{ row }">
            <span class="route-order">
              {{ String(row.route_order).padStart(2, '0') }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="封面"
          width="92"
        >
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="getImageUrl(row.cover_image)"
              fit="cover"
              class="spot-cover"
              :preview-src-list="[getImageUrl(row.cover_image)]"
            />

            <span v-else class="empty-image">
              无图片
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="name"
          label="点位名称"
          min-width="180"
        >
          <template #default="{ row }">
            <strong class="spot-name">{{ row.name }}</strong>
            <small class="spot-subtitle">
              {{ row.subtitle || '暂无副标题' }}
            </small>
          </template>
        </el-table-column>

        <el-table-column
          prop="type"
          label="类型"
          width="110"
        >
          <template #default="{ row }">
            <el-tag effect="plain">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="地图坐标"
          width="150"
        >
          <template #default="{ row }">
            <span class="coordinate">
              X {{ Number(row.map_x).toFixed(2) }}
              <br />
              Y {{ Number(row.map_y).toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="公开状态"
          width="105"
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
          width="150"
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
        label-width="106px"
      >
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="点位名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="点位类型" prop="type">
              <el-select
                v-model="form.type"
                style="width: 100%"
              >
                <el-option label="红色场馆" value="红色场馆" />
                <el-option label="红色旧址" value="红色旧址" />
                <el-option label="红色博物馆" value="红色博物馆" />
                <el-option label="红色纪念馆" value="红色纪念馆" />
                <el-option label="渡口遗址" value="渡口遗址" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="路线顺序" prop="route_order">
              <el-input-number
                v-model="form.route_order"
                :min="1"
                :max="999"
                style="width: 100%"
              />
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

          <el-col :span="12">
            <el-form-item label="地图 X 坐标" prop="map_x">
              <el-input-number
                v-model="form.map_x"
                :min="0"
                :max="100"
                :precision="4"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="地图 Y 坐标" prop="map_y">
              <el-input-number
                v-model="form.map_y"
                :min="0"
                :max="100"
                :precision="4"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input v-model="form.latitude" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="经度">
              <el-input v-model="form.longitude" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" />
        </el-form-item>

        <el-form-item label="封面图片">
          <div class="upload-row">
            <el-upload
              :show-file-list="false"
              :http-request="handleUpload"
              :before-upload="beforeImageUpload"
              accept="image/jpeg,image/png,image/webp"
            >
              <el-button
                :loading="uploadLoading"
                :icon="Upload"
              >
                上传图片
              </el-button>
            </el-upload>

            <el-input
              v-model="form.cover_image"
              placeholder="/uploads/images/..."
            />
          </div>

          <el-image
            v-if="form.cover_image"
            :src="getImageUrl(form.cover_image)"
            fit="cover"
            class="form-cover-preview"
          />
        </el-form-item>

        <el-form-item label="短简介">
          <el-input
            v-model="form.short_intro"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="红色故事">
          <el-input
            v-model="form.story_content"
            type="textarea"
            :rows="6"
          />
        </el-form-item>

        <el-form-item label="资料来源">
          <el-input
            v-model="form.story_source"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="外部导航链接">
          <el-input
            v-model="form.navigation_url"
            placeholder="https://map.baidu.com/search/..."
          />
        </el-form-item>

        <el-form-item label="推荐下一站">
          <el-select
            v-model="form.next_spot_id"
            clearable
            placeholder="不设置下一站"
            style="width: 100%"
          >
            <el-option
              v-for="spot in sortedSpots.filter(
                (item) => item.id !== form.id
              )"
              :key="spot.id"
              :label="`${String(spot.route_order).padStart(2, '0')} · ${spot.name}`"
              :value="spot.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>

        <el-button
          type="primary"
          :loading="isSaving"
          @click="saveSpot"
        >
          保存点位
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
  margin-bottom: 22px;
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
  margin: 7px 0 7px;
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

.table-card {
  border: 0;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(59, 78, 66, 0.06);
}

.route-order {
  color: #9d4c47;
  font-family: "Cormorant Garamond", serif;
  font-size: 18px;
  font-weight: 600;
}

.spot-cover {
  width: 56px;
  height: 42px;
  border-radius: 7px;
}

.empty-image {
  color: #a0aaa1;
  font-size: 11px;
}

.spot-name {
  display: block;
  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-weight: 500;
}

.spot-subtitle {
  display: block;
  margin-top: 5px;
  color: rgba(87, 104, 93, 0.55);
  font-size: 10px;
}

.coordinate {
  color: rgba(77, 95, 84, 0.68);
  font-family: "Cormorant Garamond", serif;
  font-size: 12px;
  line-height: 1.45;
}

.upload-row {
  display: flex;
  width: 100%;
  gap: 10px;
}

.form-cover-preview {
  width: 150px;
  height: 90px;
  margin-top: 12px;
  border-radius: 9px;
}
</style>