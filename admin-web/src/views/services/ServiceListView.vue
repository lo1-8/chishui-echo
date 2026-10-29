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
  createServicePoint,
  deleteServicePoint,
  getAdminServicePoints,
  updateServicePoint
} from '../../api/admin'

const isLoading = ref(false)
const services = ref([])

const typeFilter = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('新增服务设施')
const isSaving = ref(false)

const formRef = ref(null)

const serviceTypes = [
  '北门',
  '停车场',
  '厕所',
  '餐饮',
  '文创',
  '补给点',
  '休息点',
  '游客服务中心',
  '医疗服务',
  '其他'
]

const defaultForm = () => ({
  id: null,
  name: '',
  type: '厕所',
  address: '',
  map_x: '',
  map_y: '',
  latitude: '',
  longitude: '',
  description: '',
  opening_hours: '',
  navigation_url: '',
  is_published: true
})

const form = reactive(defaultForm())

const formRules = {
  name: [
    {
      required: true,
      message: '请输入服务点名称。',
      trigger: 'blur'
    }
  ],
  type: [
    {
      required: true,
      message: '请选择服务类型。',
      trigger: 'change'
    }
  ],
  map_x: [
    {
      required: true,
      message: '请填写地图 X 坐标。',
      trigger: 'blur'
    }
  ],
  map_y: [
    {
      required: true,
      message: '请填写地图 Y 坐标。',
      trigger: 'blur'
    }
  ]
}

const filteredServices = computed(() => {
  if (!typeFilter.value) {
    return services.value
  }

  return services.value.filter((service) => {
    return service.type === typeFilter.value
  })
})

function resetForm() {
  Object.assign(form, defaultForm())
}

async function loadServices() {
  isLoading.value = true

  try {
    const result = await getAdminServicePoints()
    services.value = result.data || []
  } catch (error) {
    ElMessage.error('加载服务设施失败。')
  } finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  resetForm()
  dialogTitle.value = '新增服务设施'
  dialogVisible.value = true
}

function openEditDialog(service) {
  Object.assign(form, {
    ...defaultForm(),
    ...service,
    is_published: Boolean(service.is_published)
  })

  dialogTitle.value = `编辑服务设施：${service.name}`
  dialogVisible.value = true
}

async function saveService() {
  if (!formRef.value) return

  await formRef.value.validate()

  isSaving.value = true

  const payload = {
    ...form,
    map_x: Number(form.map_x),
    map_y: Number(form.map_y),
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
    is_published: Boolean(form.is_published)
  }

  try {
    if (form.id) {
      await updateServicePoint(form.id, payload)
      ElMessage.success('服务设施编辑成功。')
    } else {
      await createServicePoint(payload)
      ElMessage.success('服务设施新增成功。')
    }

    dialogVisible.value = false

    await loadServices()
  } catch (error) {
    ElMessage.error(
      error?.response?.data?.message ||
      '保存服务设施失败。'
    )
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(service) {
  try {
    await ElMessageBox.confirm(
      `确定删除服务点“${service.name}”吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )

    await deleteServicePoint(service.id)

    ElMessage.success('服务设施已删除。')

    await loadServices()
  } catch (error) {
    /*
      用户取消时无需提示。
    */
  }
}

function getTagType(type) {
  const map = {
    北门: 'success',
    停车场: 'warning',
    厕所: 'info',
    餐饮: 'danger',
    文创: '',
    补给点: 'success',
    休息点: 'info',
    游客服务中心: 'success',
    医疗服务: 'danger',
    其他: 'info'
  }

  return map[type] || 'info'
}

onMounted(() => {
  loadServices()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-toolbar">
      <div>
        <p>SERVICE FACILITIES</p>
        <h2>服务设施管理</h2>
        <span>
          管理北门、停车场、厕所及后续餐饮、文创、补给等服务点。
        </span>
      </div>

      <div class="toolbar-actions">
        <el-button
          :icon="Refresh"
          @click="loadServices"
        >
          刷新
        </el-button>

        <el-button
          type="primary"
          :icon="Plus"
          @click="openCreateDialog"
        >
          新增服务点
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-row">
        <span>服务类型筛选</span>

        <el-select
          v-model="typeFilter"
          clearable
          placeholder="全部类型"
          style="width: 220px"
        >
          <el-option
            v-for="type in serviceTypes"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>

        <span class="service-total">
          当前显示 {{ filteredServices.length }} 个服务点
        </span>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="isLoading"
        :data="filteredServices"
        stripe
      >
        <el-table-column
          prop="name"
          label="服务点名称"
          min-width="200"
        >
          <template #default="{ row }">
            <strong class="service-name">
              {{ row.name }}
            </strong>

            <small class="service-address">
              {{ row.address || '暂无地址说明' }}
            </small>
          </template>
        </el-table-column>

        <el-table-column
          label="服务类型"
          width="115"
        >
          <template #default="{ row }">
            <el-tag
              :type="getTagType(row.type)"
              effect="plain"
            >
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
          prop="opening_hours"
          label="开放时间"
          min-width="140"
        >
          <template #default="{ row }">
            {{ row.opening_hours || '以现场为准' }}
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
      width="720px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="108px"
      >
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="服务点名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="服务类型" prop="type">
              <el-select
                v-model="form.type"
                style="width: 100%"
              >
                <el-option
                  v-for="type in serviceTypes"
                  :key="type"
                  :label="type"
                  :value="type"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址说明">
          <el-input
            v-model="form.address"
            placeholder="例如：太平古镇东侧"
          />
        </el-form-item>

        <el-row :gutter="18">
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
        </el-row>

        <el-row :gutter="18">
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

        <el-form-item label="服务说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="例如：建议自驾游客根据现场标识和管理要求停车。"
          />
        </el-form-item>

        <el-form-item label="开放时间">
          <el-input
            v-model="form.opening_hours"
            placeholder="例如：以现场开放情况为准"
          />
        </el-form-item>

        <el-form-item label="导航链接">
          <el-input
            v-model="form.navigation_url"
            placeholder="https://map.baidu.com/search/..."
          />
        </el-form-item>

        <el-form-item label="公开状态">
          <el-switch
            v-model="form.is_published"
            active-text="游客端公开"
            inactive-text="暂时隐藏"
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
          @click="saveService"
        >
          保存服务点
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

.service-total {
  color: #9d4c47;
  font-size: 11px;
}

.service-name {
  display: block;
  color: #344139;
  font-family: "Noto Serif SC", serif;
  font-weight: 500;
}

.service-address {
  display: block;
  margin-top: 5px;
  color: rgba(88, 104, 93, 0.54);
  font-size: 10px;
}

.coordinate {
  color: rgba(77, 95, 84, 0.68);
  font-family: "Cormorant Garamond", serif;
  font-size: 12px;
  line-height: 1.45;
}
</style>