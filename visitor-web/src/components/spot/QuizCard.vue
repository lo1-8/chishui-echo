<script setup>
import {
  Check,
  CircleHelp,
  RotateCcw,
  X
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },

  /*
    当前点位是否已经完成问答。
  */
  isCompleted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'complete'
])

const selectedAnswer = ref(null)
const isSubmitted = ref(false)

const parsedOptions = computed(() => {
  /*
    后端接口通常已把 options_json 转换为 options 数组。
    这里仍做一次兼容处理。
  */
  if (Array.isArray(props.question.options)) {
    return props.question.options
  }

  if (props.question.options_json) {
    try {
      return JSON.parse(props.question.options_json)
    } catch (error) {
      return []
    }
  }

  return []
})

const isCorrect = computed(() => {
  if (!isSubmitted.value) {
    return null
  }

  return String(selectedAnswer.value) ===
    String(props.question.correct_answer)
})

function chooseAnswer(index) {
  if (isSubmitted.value) {
    return
  }

  selectedAnswer.value = index
}

function submitAnswer() {
  if (selectedAnswer.value === null) {
    window.alert('请先选择一个答案。')
    return
  }

  isSubmitted.value = true

  emit('complete', {
    questionId: props.question.id,
    isCorrect: isCorrect.value,
    selectedAnswer: selectedAnswer.value
  })
}

function retryQuestion() {
  selectedAnswer.value = null
  isSubmitted.value = false
}

/*
  切换点位或题目时，重置题目状态。
*/
watch(
  () => props.question?.id,
  () => {
    selectedAnswer.value = null
    isSubmitted.value = false
  }
)
</script>

<template>
  <section
    class="quiz-card"
    :class="{
      'is-correct': isSubmitted && isCorrect,
      'is-wrong': isSubmitted && !isCorrect
    }"
  >
    <div class="quiz-header">
      <div class="quiz-icon">
        <CircleHelp
          :size="18"
          :stroke-width="1.65"
        />
      </div>

      <div>
        <p>研学问答</p>
        <span>
          {{
            isCompleted
              ? '你已完成这一站的思考任务'
              : '带着问题重新理解这一段历史'
          }}
        </span>
      </div>
    </div>

    <h3 class="quiz-question">
      {{ question.question }}
    </h3>

    <div class="quiz-options">
      <button
        v-for="(option, index) in parsedOptions"
        :key="`${question.id}-${index}`"
        type="button"
        class="quiz-option"
        :class="{
          'is-selected': selectedAnswer === index,
          'is-correct-option':
            isSubmitted &&
            String(question.correct_answer) === String(index),
          'is-wrong-option':
            isSubmitted &&
            selectedAnswer === index &&
            String(question.correct_answer) !== String(index)
        }"
        @click="chooseAnswer(index)"
      >
        <span class="option-index">
          {{ String.fromCharCode(65 + index) }}
        </span>

        <span class="option-text">
          {{ option }}
        </span>

        <Check
          v-if="
            isSubmitted &&
            String(question.correct_answer) === String(index)
          "
          :size="16"
          :stroke-width="2"
          class="option-result-icon"
        />

        <X
          v-if="
            isSubmitted &&
            selectedAnswer === index &&
            String(question.correct_answer) !== String(index)
          "
          :size="16"
          :stroke-width="2"
          class="option-result-icon"
        />
      </button>
    </div>

    <div
      v-if="isSubmitted"
      class="quiz-result"
    >
      <div class="quiz-result-title">
        <Check
          v-if="isCorrect"
          :size="16"
          :stroke-width="2"
        />

        <X
          v-else
          :size="16"
          :stroke-width="2"
        />

        <strong>
          {{
            isCorrect
              ? '回答正确'
              : '再听一听，也许会有新的发现'
          }}
        </strong>
      </div>

      <p>
        {{ question.explanation }}
      </p>

      <button
        v-if="!isCorrect"
        type="button"
        class="retry-button"
        @click="retryQuestion"
      >
        <RotateCcw
          :size="14"
          :stroke-width="1.8"
        />

        再试一次
      </button>
    </div>

    <button
      v-else
      type="button"
      class="submit-answer-button"
      @click="submitAnswer"
    >
      提交答案
    </button>
  </section>
</template>

<style scoped lang="scss">
.quiz-card {
  padding: 21px;

  background:
    linear-gradient(
      135deg,
      rgba(247, 242, 229, 0.72),
      rgba(238, 243, 233, 0.62)
    );
  border: 1px solid rgba(184, 163, 106, 0.2);
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(75, 87, 71, 0.04);
}

.quiz-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quiz-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;

  color: #9d4c47;
  background: rgba(234, 212, 206, 0.6);
  border-radius: 50%;
}

.quiz-header p {
  margin: 0;

  color: #9d4c47;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.quiz-header span {
  display: block;
  margin-top: 3px;

  color: rgba(84, 101, 88, 0.62);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.quiz-question {
  margin: 18px 0 14px;

  color: #344139;
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1.72;
}

.quiz-options {
  display: grid;
  gap: 9px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 10px;

  width: 100%;
  min-height: 45px;
  padding: 9px 11px;

  color: rgba(66, 84, 72, 0.76);
  background: rgba(255, 253, 245, 0.62);
  border: 1px solid rgba(111, 136, 124, 0.15);
  border-radius: 12px;

  text-align: left;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.quiz-option:hover:not(.is-correct-option):not(.is-wrong-option) {
  background: rgba(255, 253, 245, 0.9);
  border-color: rgba(157, 76, 71, 0.32);
  transform: translateX(2px);
}

.quiz-option.is-selected {
  color: #7f423f;
  background: rgba(234, 212, 206, 0.48);
  border-color: rgba(157, 76, 71, 0.48);
}

.option-index {
  display: grid;
  width: 23px;
  height: 23px;
  flex: none;
  place-items: center;

  color: #708075;
  background: rgba(221, 226, 218, 0.55);
  border-radius: 50%;

  font-family:
    "Cormorant Garamond",
    serif;
  font-size: 13px;
  font-weight: 700;
}

.is-selected .option-index {
  color: #fffcef;
  background: #9d4c47;
}

.option-text {
  flex: 1;

  font-size: 12px;
  letter-spacing: 0.025em;
  line-height: 1.55;
}

.option-result-icon {
  flex: none;
}

.is-correct-option {
  color: #436d57;
  background: rgba(211, 233, 215, 0.62);
  border-color: rgba(77, 140, 102, 0.42);
}

.is-correct-option .option-index {
  color: #fffcef;
  background: #4d8c66;
}

.is-wrong-option {
  color: #9d4c47;
  background: rgba(242, 218, 212, 0.62);
  border-color: rgba(157, 76, 71, 0.38);
}

.is-wrong-option .option-index {
  color: #fffcef;
  background: #9d4c47;
}

.quiz-result {
  margin-top: 15px;
  padding: 13px;

  border-top: 1px solid rgba(111, 136, 124, 0.15);
}

.quiz-result-title {
  display: flex;
  align-items: center;
  gap: 7px;

  color: #4d8c66;
  font-size: 12px;
}

.is-wrong .quiz-result-title {
  color: #9d4c47;
}

.quiz-result p {
  margin: 8px 0 0;

  color: rgba(69, 87, 75, 0.7);
  font-family:
    "Noto Serif SC",
    "Songti SC",
    serif;
  font-size: 12px;
  letter-spacing: 0.025em;
  line-height: 1.8;
}

.submit-answer-button,
.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  min-height: 37px;
  margin-top: 16px;
  padding: 0 15px;

  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.05em;
}

.submit-answer-button {
  width: 100%;

  color: #fffcef;
  background: #6f887c;
  border: 1px solid rgba(255, 255, 255, 0.22);

  transition:
    background 0.22s ease,
    transform 0.22s ease;
}

.submit-answer-button:hover {
  background: #587267;
  transform: translateY(-2px);
}

.retry-button {
  color: #9d4c47;
  background: transparent;
  border: 1px solid rgba(157, 76, 71, 0.26);
}

.retry-button:hover {
  background: rgba(255, 253, 245, 0.64);
}
</style>