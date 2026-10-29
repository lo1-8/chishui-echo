<script setup>
import { computed } from 'vue'
import {
  CarFront,
  DoorOpen,
  Toilet
} from 'lucide-vue-next'

const props = defineProps({
  service: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'select'
])

const positionStyle = computed(() => ({
  left: `${props.service.map_x}%`,
  top: `${props.service.map_y}%`
}))

const iconComponent = computed(() => {
  if (props.service.type === '停车场') {
    return CarFront
  }

  if (props.service.type === '北门') {
    return DoorOpen
  }

  return Toilet
})

function handleSelect(event) {
  event.stopPropagation()
  emit('select', props.service)
}
</script>

<template>
  <button
    type="button"
    class="service-marker"
    :style="positionStyle"
    :title="service.name"
    @click="handleSelect"
  >
    <span class="service-icon">
      <component
        :is="iconComponent"
        :size="14"
        :stroke-width="1.8"
      />
    </span>

    <span class="service-label">
      {{ service.type }}
    </span>
  </button>
</template>

<style scoped lang="scss">
.service-marker {
  position: absolute;
  z-index: 9;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  color: #6f887c;
  background: transparent;
  border: 0;
  cursor: pointer;
  transform: translate(-12px, -12px);
}

.service-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  background: rgba(250, 249, 240, 0.82);
  border: 1px solid rgba(111, 136, 124, 0.54);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(65, 85, 72, 0.1);
  backdrop-filter: blur(7px);
  transition:
    color 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease,
    transform 0.22s ease;
}

.service-label {
  padding: 4px 7px;
  color: rgba(75, 96, 84, 0.8);
  background: rgba(250, 249, 240, 0.58);
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.03em;
  opacity: 0;
  transform: translateX(-5px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.service-marker:hover .service-icon {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.98);
  border-color: #9d4c47;
  transform: scale(1.08);
}

.service-marker:hover .service-label {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 760px) {
  .service-label {
    display: none;
  }
}
</style>
