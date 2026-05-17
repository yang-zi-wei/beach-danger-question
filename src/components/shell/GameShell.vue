<template>
  <div class="game-shell">
    <!-- 顶部状态栏 -->
    <header class="shell-header">
      <button class="back-btn" @click="onBack">‹</button>
      <div class="shell-header__board">
        <span class="opera-board">{{ chapterTitle }}</span>
      </div>
      <div class="shell-header__progress">
        {{ question.id }}
      </div>
    </header>

    <!-- 题干 -->
    <div class="shell-question opera-scroll">
      {{ question.title }}
    </div>

    <!-- 小游戏插槽 -->
    <main class="shell-main">
      <slot :on-correct="onCorrect" :on-wrong="onWrong" />
    </main>

    <!-- 反馈层 -->
    <FeedbackLayer
      :status="status"
      :knowledge="status === 'wrong' ? question.knowledge : ''"
      @next="goNext"
      @retry="onRetry"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FeedbackLayer from './FeedbackLayer.vue';
import { chapters, getNextQuestionId } from '@/data/questions';
import { markPassed } from '@/stores/progress';

const props = defineProps({
  question: { type: Object, required: true },
});
const emit = defineEmits(['retry']);

const router = useRouter();
const status = ref(''); // '' | 'correct' | 'wrong'

const chapterTitle = chapters.find(c => c.key === props.question.chapter)?.title || '';

function onCorrect() {
  status.value = 'correct';
  markPassed(props.question.id);
}

function onWrong() {
  status.value = 'wrong';
}

function goNext() {
  const nextId = getNextQuestionId(props.question.id);
  status.value = '';
  if (nextId) {
    router.push({ name: 'game', params: { id: nextId } });
  } else {
    router.push({ name: 'home' });
  }
}

function onRetry() {
  // 隐藏反馈层，并通知父级重挂载游戏组件
  status.value = '';
  emit('retry');
}

function onBack() {
  router.push({ name: 'home' });
}

defineExpose({ onCorrect, onWrong });
</script>

<style scoped>
.game-shell {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, #8b1a1a 0%, #5a0e0e 100%);
  color: #f5d76e;
  flex-shrink: 0;
  z-index: 2;
}

.back-btn {
  color: #f5d76e;
  font-size: 28px;
  width: 32px;
  height: 32px;
  line-height: 1;
}

.shell-header__progress {
  font-family: 'STKaiti', serif;
  font-size: 14px;
  letter-spacing: 1px;
  min-width: 32px;
  text-align: right;
}

.shell-question {
  margin: 16px;
  padding: 14px 18px;
  font-size: 16px;
  line-height: 1.6;
  color: #2c1810;
  flex-shrink: 0;
  text-align: center;
}

.shell-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
