<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch
} from 'vue'
import {
  Pause,
  Play,
  Volume2,
  VolumeX
} from 'lucide-vue-next'

import { getAssetUrl } from '../../utils/asset'

const props = defineProps({
  /*
    音频对象，来自后端 audios 表。
    包含：
    id
    title
    audio_url
    duration
    audio_type
    transcript
  */
  audio: {
    type: Object,
    required: true
  },

  /*
    是否自动播放。
    默认 false，避免浏览器自动播放限制。
  */
  autoplay: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'play',
  'pause',
  'ended',
  'error',
  'time-update'
])

const audioElementRef = ref(null)

const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(Number(props.audio?.duration) || 0)
const isAudioReady = ref(false)
const hasAudioError = ref(false)

const audioUrl = computed(() => {
  return getAssetUrl(props.audio?.audio_url)
})

const progressPercent = computed(() => {
  if (!duration.value) {
    return 0
  }

  return Math.min(
    (currentTime.value / duration.value) * 100,
    100
  )
})

function formatTime(time) {
  if (!Number.isFinite(time) || time < 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(time)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`
}

function handleLoadedMetadata() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  if (
    Number.isFinite(audioElement.duration) &&
    audioElement.duration > 0
  ) {
    duration.value = audioElement.duration
  }

  isAudioReady.value = true
  hasAudioError.value = false

  if (props.autoplay) {
    playAudio()
  }
}

async function playAudio() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  try {
    await audioElement.play()

    isPlaying.value = true
    emit('play', props.audio)
  } catch (error) {
    console.warn('音频播放失败：', error)

    hasAudioError.value = true
    isPlaying.value = false

    emit('error', error)
  }
}

function pauseAudio() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  audioElement.pause()

  isPlaying.value = false

  emit('pause', props.audio)
}

function togglePlay() {
  if (isPlaying.value) {
    pauseAudio()
  } else {
    playAudio()
  }
}

function handleTimeUpdate() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  currentTime.value = audioElement.currentTime

  emit('time-update', {
    audio: props.audio,
    currentTime: currentTime.value,
    duration: duration.value
  })
}

function handleEnded() {
  isPlaying.value = false
  currentTime.value = duration.value

  emit('ended', props.audio)
}

function handleAudioError() {
  hasAudioError.value = true
  isPlaying.value = false

  emit('error', new Error('音频资源加载失败'))
}

function handleProgressClick(event) {
  const progressElement = event.currentTarget
  const audioElement = audioElementRef.value

  if (!progressElement || !audioElement || !duration.value) {
    return
  }

  const rect = progressElement.getBoundingClientRect()

  const clickX = event.clientX - rect.left
  const ratio = Math.min(
    Math.max(clickX / rect.width, 0),
    1
  )

  const newTime = ratio * duration.value

  audioElement.currentTime = newTime
  currentTime.value = newTime
}

function handleProgressKeyboard(event) {
  const audioElement = audioElementRef.value

  if (!audioElement || !duration.value) {
    return
  }

  const step = 5

  if (event.key === 'ArrowRight') {
    event.preventDefault()

    const nextTime = Math.min(
      currentTime.value + step,
      duration.value
    )

    audioElement.currentTime = nextTime
    currentTime.value = nextTime
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()

    const previousTime = Math.max(
      currentTime.value - step,
      0
    )

    audioElement.currentTime = previousTime
    currentTime.value = previousTime
  }
}

function toggleMute() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  audioElement.muted = !audioElement.muted
  isMuted.value = audioElement.muted
}

function resetAudio() {
  const audioElement = audioElementRef.value

  if (!audioElement) return

  audioElement.pause()
  audioElement.currentTime = 0

  currentTime.value = 0
  isPlaying.value = false
}

/*
  当切换到下一站时，audio prop 会变化。
  需要停止旧音频并重置状态。
*/
watch(
  () => props.audio?.audio_url,
  () => {
    resetAudio()

    hasAudioError.value = false
    isAudioReady.value = false
    duration.value = Number(props.audio?.duration) || 0
  }
)

onBeforeUnmount(() => {
  resetAudio()
})
</script>

<template>
  <section
    class="audio-player"
    :class="{
      'is-playing': isPlaying,
      'has-error': hasAudioError
    }"
  >
    <!-- 原生 audio 元素 -->
    <audio
      ref="audioElementRef"
      :src="audioUrl"
      preload="metadata"
      @loadedmetadata="handleLoadedMetadata"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
      @error="handleAudioError"
    ></audio>

    <!-- 左侧播放按钮 -->
    <button
      type="button"
      class="play-button"
      :title="isPlaying ? '暂停声音导览' : '播放声音导览'"
      @click="togglePlay"
    >
      <span
        v-if="isPlaying"
        class="playing-wave wave-one"
      ></span>

      <span
        v-if="isPlaying"
        class="playing-wave wave-two"
      ></span>

      <Pause
        v-if="isPlaying"
        :size="18"
        :stroke-width="1.8"
      />

      <Play
        v-else
        :size="18"
        :stroke-width="1.8"
        fill="currentColor"
      />
    </button>

    <!-- 中部音频文字和进度 -->
    <div class="audio-main">
      <div class="audio-title-row">
        <span class="audio-title">
          {{ audio.title || '声音导览' }}
        </span>

        <span class="audio-duration">
          {{ formatTime(currentTime) }}
          /
          {{ formatTime(duration) }}
        </span>
      </div>

      <p class="audio-meta">
        {{ audio.audio_type || '现场声音导览' }}
      </p>

      <div
        class="progress-wrap"
        role="slider"
        tabindex="0"
        aria-label="音频播放进度"
        :aria-valuemin="0"
        :aria-valuemax="duration"
        :aria-valuenow="currentTime"
        @click="handleProgressClick"
        @keydown="handleProgressKeyboard"
      >
        <span class="progress-track"></span>

        <span
          class="progress-value"
          :style="{
            width: `${progressPercent}%`
          }"
        ></span>

        <span
          class="progress-thumb"
          :style="{
            left: `${progressPercent}%`
          }"
        ></span>
      </div>
    </div>

    <!-- 静音按钮 -->
    <button
      type="button"
      class="mute-button"
      :title="isMuted ? '开启声音' : '静音'"
      @click="toggleMute"
    >
      <VolumeX
        v-if="isMuted"
        :size="17"
        :stroke-width="1.7"
      />

      <Volume2
        v-else
        :size="17"
        :stroke-width="1.7"
      />
    </button>

    <!-- 音频资源错误提示 -->
    <div
      v-if="hasAudioError"
      class="audio-error-tip"
    >
      当前音频暂时无法播放，请检查音频文件路径。
    </div>
  </section>
</template>

<style scoped lang="scss">
.audio-player {
  position: relative;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 13px 14px;

  color: #45594d;
  background:
    linear-gradient(
      135deg,
      rgba(247, 248, 240, 0.72),
      rgba(230, 239, 232, 0.56)
    );
  border: 1px solid rgba(112, 142, 127, 0.18);
  border-radius: 18px;
  box-shadow: 0 10px 26px rgba(62, 83, 70, 0.06);
  backdrop-filter: blur(12px);

  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.audio-player.is-playing {
  background:
    linear-gradient(
      135deg,
      rgba(243, 248, 238, 0.82),
      rgba(218, 235, 225, 0.76)
    );
  border-color: rgba(93, 136, 136, 0.34);
  box-shadow: 0 13px 30px rgba(79, 123, 117, 0.1);
}

.play-button {
  position: relative;

  display: grid;
  width: 44px;
  height: 44px;
  flex: none;
  place-items: center;

  overflow: visible;

  color: #fffcef;
  background:
    linear-gradient(
      135deg,
      #9d4c47,
      #7f423f
    );
  border: 0;
  border-radius: 50%;
  box-shadow: 0 7px 18px rgba(127, 66, 63, 0.2);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.play-button:hover {
  box-shadow: 0 10px 24px rgba(127, 66, 63, 0.3);
  transform: scale(1.05);
}

.playing-wave {
  position: absolute;

  width: 44px;
  height: 44px;

  pointer-events: none;

  border: 1px solid rgba(157, 76, 71, 0.38);
  border-radius: 50%;

  animation: soundPulse 2s ease-out infinite;
}

.playing-wave.wave-two {
  animation-delay: 1s;
}

@keyframes soundPulse {
  0% {
    opacity: 0.72;
    transform: scale(0.9);
  }

  100% {
    opacity: 0;
    transform: scale(1.65);
  }
}

.audio-main {
  flex: 1;
  min-width: 0;
}

.audio-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.audio-title {
  overflow: hidden;

  color: #45594d;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-duration {
  flex: none;

  color: rgba(89, 109, 96, 0.58);
  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.audio-meta {
  margin: 4px 0 0;

  color: rgba(84, 105, 92, 0.6);
  font-size: 10px;
  letter-spacing: 0.035em;
}

.progress-wrap {
  position: relative;

  height: 16px;
  margin-top: 7px;

  cursor: pointer;
  outline: none;
}

.progress-wrap:focus-visible {
  border-radius: 999px;
  outline: 2px solid rgba(157, 76, 71, 0.36);
  outline-offset: 2px;
}

.progress-track,
.progress-value {
  position: absolute;
  top: 7px;
  left: 0;

  height: 3px;

  border-radius: 999px;
}

.progress-track {
  width: 100%;
  background: rgba(111, 136, 124, 0.18);
}

.progress-value {
  background:
    linear-gradient(
      90deg,
      #5d8888,
      #b8a36a
    );

  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 3px;

  width: 11px;
  height: 11px;

  background: #fdfbf3;
  border: 2px solid #5d8888;
  border-radius: 50%;
  box-shadow: 0 2px 7px rgba(64, 96, 91, 0.18);

  transform: translateX(-50%);
  transition: left 0.1s linear;
}

.mute-button {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;

  color: #6f887c;
  background: transparent;
  border: 1px solid rgba(111, 136, 124, 0.2);
  border-radius: 50%;

  transition:
    color 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.mute-button:hover {
  color: #9d4c47;
  background: rgba(255, 253, 245, 0.8);
  border-color: rgba(157, 76, 71, 0.34);
}

.audio-error-tip {
  position: absolute;
  right: 12px;
  bottom: -28px;
  left: 12px;

  color: #9d4c47;
  font-size: 10px;
  letter-spacing: 0.02em;
}

.has-error {
  border-color: rgba(157, 76, 71, 0.4);
}

@media (max-width: 600px) {
  .audio-player {
    gap: 10px;
    padding: 11px;
  }

  .play-button {
    width: 40px;
    height: 40px;
  }

  .audio-duration {
    font-size: 11px;
  }

  .mute-button {
    display: none;
  }
}
</style>