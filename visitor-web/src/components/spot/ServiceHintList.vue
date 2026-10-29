<script setup>
import {
  CarFront,
  DoorOpen,
  ExternalLink,
  MapPin,
  Toilet
} from 'lucide-vue-next'

defineProps({
  services: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'navigate'
])

function getServiceIcon(type) {
  if (type === '停车场') {
    return CarFront
  }

  if (type === '北门') {
    return DoorOpen
  }

  if (type === '厕所') {
    return Toilet
  }

  return MapPin
}

function handleNavigate(service) {
  emit('navigate', service)
}
</script>

<template>
  <section class="service-hint-list">
    <div class="service-title-row">
      <span class="section-label">附近服务</span>

      <span class="service-title-note">
        信息以现场为准
      </span>
    </div>

    <div
      v-if="services.length"
      class="service-list"
    >
      <button
        v-for="service in services"
        :key="service.id"
        type="button"
        class="service-item"
        @click="handleNavigate(service)"
      >
        <span class="service-icon">
          <component
            :is="getServiceIcon(service.type)"
            :size="16"
            :stroke-width="1.7"
          />
        </span>

        <span class="service-content">
          <strong>{{ service.name }}</strong>
          <small>
            {{
              service.description ||
              '点击前往地图查看位置'
            }}
          </small>
        </span>

        <ExternalLink
          :size="15"
          :stroke-width="1.6"
          class="service-arrow"
        />
      </button>
    </div>

    <p
      v-else
      class="empty-service"
    >
      暂无附近服务信息。
    </p>
  </section>
</template>

<style scoped lang="scss">
.service-hint-list {
  padding: 20px;

  background: rgba(246, 247, 239, 0.52);
  border: 1px solid rgba(111, 136, 124, 0.14);
  border-radius: 18px;
}

.service-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  color: #9d4c47;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.section-label::before {
  width: 18px;
  height: 1px;
  background: #9d4c47;
  content: "";
}

.service-title-note {
  color: rgba(89, 106, 94, 0.5);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.service-list {
  display: grid;
  gap: 9px;
  margin-top: 15px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  padding: 10px;

  color: #45594d;
  background: rgba(255, 253, 245, 0.56);
  border: 1px solid rgba(111, 136, 124, 0.13);
  border-radius: 12px;

  text-align: left;

  transition:
    transform 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.service-item:hover {
  background: rgba(255, 253, 245, 0.94);
  border-color: rgba(157, 76, 71, 0.26);
  transform: translateX(2px);
}

.service-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;

  color: #6f887c;
  background: rgba(223, 235, 226, 0.56);
  border-radius: 50%;
}

.service-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.service-content strong {
  overflow: hidden;

  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-content small {
  overflow: hidden;

  color: rgba(82, 100, 88, 0.58);
  font-size: 10px;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-arrow {
  flex: none;
  color: rgba(100, 119, 105, 0.56);
}

.empty-service {
  margin: 16px 0 0;

  color: rgba(86, 103, 91, 0.58);
  font-size: 12px;
}
</style>