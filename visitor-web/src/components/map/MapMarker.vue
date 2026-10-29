<script setup>
import { computed } from 'vue'
import { Check, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  spot: {
    type: Object,
    required: true
  },

  isActive: {
    type: Boolean,
    default: false
  },

  isCheckedIn: {
    type: Boolean,
    default: false
  },

  isRecommended: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'select'
])

const positionStyle = computed(() => ({
  left: `${props.spot.map_x}%`,
  top: `${props.spot.map_y}%`
}))

function handleSelect(event) {
  event.stopPropagation()
  emit('select', props.spot)
}
</script>

<template>
  <button
    type="button"
    class="map-marker"
    :class="{
      'is-active': isActive,
      'is-checked-in': isCheckedIn,
      'is-recommended': isRecommended
    }"
    :style="positionStyle"
    :title="spot.name"
    @click="handleSelect"
  >
    <span class="marker-pulse"></span>

    <span class="marker-ring"></span>

    <span class="marker-core">
      <Check
        v-if="isCheckedIn"
        :size="14"
        :stroke-width="2"
      />

      <span v-else>
        {{ String(spot.route_order).padStart(2, '0') }}
      </span>
    </span>

    <span class="marker-label">
      <span class="marker-label-title">
        {{ spot.name }}
      </span>

      <ChevronRight
        v-if="isRecommended"
        :size="12"
        :stroke-width="1.8"
      />
    </span>
  </button>
</template>

<style scoped lang="scss">
.map-marker {
  position: absolute;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0;
  color: #45594d;
  background: transparent;
  border: 0;
  cursor: pointer;
  transform: translate(-14px, -14px);
  user-select: none;
}

.marker-pulse {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 44px;
  height: 44px;
  pointer-events: none;
  border: 1px solid rgba(157, 76, 71, 0);
  border-radius: 50%;
  transition:
    border-color 0.25s ease,
    transform 0.25s ease;
}

.marker-ring {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 40px;
  height: 40px;
  pointer-events: none;
  border: 1px solid rgba(157, 76, 71, 0.2);
  border-radius: 50%;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.marker-core {
  position: relative;
  z-index: 2;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.96);
  border: 1.5px solid #9d4c47;
  border-radius: 50%;
  box-shadow: 0 5px 16px rgba(75, 82, 71, 0.12);
  font-family:
    "Cormorant Garamond",
    "Noto Serif SC",
    serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  transition:
    color 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.marker-label {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 3px;
  max-width: 190px;
  padding: 5px 9px;
  overflow: hidden;
  color: #45594d;
  background: rgba(250, 249, 240, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
  box-shadow: 0 5px 16px rgba(72, 86, 74, 0.06);
  font-family:
    "Noto Sans SC",
    "Microsoft YaHei",
    sans-serif;
  font-size: 11px;
  letter-spacing: 0.025em;
  line-height: 1.2;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  opacity: 0.86;
  transform: translateX(-4px);
  transition:
    opacity 0.25s ease,
    color 0.25s ease,
    background 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.marker-label-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-marker:hover .marker-core {
  color: #fffcef;
  background: #9d4c47;
  box-shadow: 0 9px 22px rgba(133, 66, 61, 0.25);
  transform: scale(1.08);
}

.map-marker:hover .marker-ring {
  background: rgba(157, 76, 71, 0.09);
  border-color: rgba(157, 76, 71, 0.3);
  transform: scale(1.12);
}

.map-marker:hover .marker-label {
  color: #7f423f;
  background: rgba(255, 253, 245, 0.95);
  box-shadow: 0 9px 22px rgba(72, 86, 74, 0.12);
  opacity: 1;
  transform: translateX(0);
}

.is-active .marker-core {
  color: #fffcef;
  background: #7f423f;
  border-color: #7f423f;
  box-shadow: 0 10px 25px rgba(114, 61, 57, 0.3);
  transform: scale(1.12);
}

.is-active .marker-ring {
  border-color: rgba(157, 76, 71, 0.42);
  background: rgba(157, 76, 71, 0.14);
  transform: scale(1.18);
}

.is-active .marker-pulse {
  border-color: rgba(157, 76, 71, 0.42);
  animation: activePulse 2.2s ease-out infinite;
}

.is-active .marker-label {
  color: #7f423f;
  background: rgba(255, 253, 245, 0.96);
  opacity: 1;
  transform: translateX(0);
}

.is-checked-in .marker-core {
  color: #fffcef;
  background: #b8a36a;
  border-color: #b8a36a;
}

.is-checked-in .marker-ring {
  border-color: rgba(184, 163, 106, 0.42);
}

.is-recommended .marker-label {
  color: #7f423f;
  border-color: rgba(157, 76, 71, 0.25);
}

@keyframes activePulse {
  0% {
    opacity: 0.9;
    transform: scale(0.72);
  }

  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@media (max-width: 760px) {
  .marker-label {
    max-width: 128px;
    font-size: 10px;
  }

  .marker-core {
    width: 25px;
    height: 25px;
    font-size: 12px;
  }

  .marker-ring {
    width: 36px;
    height: 36px;
    top: -5px;
    left: -5px;
  }
}
</style>