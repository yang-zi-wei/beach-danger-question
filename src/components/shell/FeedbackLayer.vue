<template>
  <transition name="feedback">
    <div v-if="status" class="feedback-layer" :class="`feedback-layer--${status}`">
      <!-- 错误：水袖飞过 -->
      <div v-if="status === 'wrong'" class="sleeve-overlay"></div>

      <!-- 中间大字 -->
      <div class="stamp" :class="`stamp--${status}`">
        {{ status === 'correct' ? '中' : '差' }}
      </div>

      <!-- 知识点 -->
      <div v-if="status === 'wrong' && knowledge" class="knowledge-card">
        <div class="knowledge-card__title">小卫提示</div>
        <div class="knowledge-card__body">{{ knowledge }}</div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="showNextBtn" class="action-row">
        <button
          v-if="status === 'wrong'"
          class="opera-btn opera-btn--ghost retry-btn"
          @click="$emit('retry')"
        >
          ↻ 再来一次
        </button>
        <button class="opera-btn next-btn" @click="$emit('next')">
          下一题 →
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { playCorrect, playWrong } from '@/composables/useAudio';

const props = defineProps({
  status: { type: String, default: '' }, // '' | 'correct' | 'wrong'
  knowledge: { type: String, default: '' },
});

defineEmits(['next', 'retry']);

const showNextBtn = ref(false);

watch(() => props.status, (val) => {
  showNextBtn.value = false;
  if (val === 'correct') playCorrect();
  if (val === 'wrong') playWrong();
  if (val) {
    setTimeout(() => { showNextBtn.value = true; }, 1000);
  }
});
</script>

<style scoped>
.feedback-layer {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.sleeve-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    transparent 30%,
    rgba(192, 57, 43, 0.85) 50%,
    transparent 70%
  );
  animation: water-sleeve 800ms ease-in-out;
  pointer-events: none;
}

.stamp {
  position: absolute;
  top: 25%;
  left: 50%;
  font-family: 'STKaiti', 'KaiTi', '楷体', serif;
  font-size: 180px;
  font-weight: bold;
  width: 200px;
  height: 200px;
  line-height: 200px;
  text-align: center;
  border-radius: 50%;
  transform: translateX(-50%);
}

.stamp--correct {
  color: #fff;
  background: radial-gradient(circle, #d4a017 0%, #8b1a1a 100%);
  border: 6px solid #f5d76e;
  box-shadow: 0 0 60px #f5d76e;
  animation: drop-stamp 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stamp--wrong {
  color: #f5d76e;
  background: #2c1810;
  border: 6px solid #c0392b;
  animation: wrong-stamp 400ms ease-out;
}

.knowledge-card {
  position: absolute;
  bottom: 120px;
  left: 20px;
  right: 20px;
  background: #f5e6d3;
  border: 2px solid #8b1a1a;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  animation: card-rise 400ms 600ms both ease-out;
}

.knowledge-card__title {
  font-family: 'STKaiti', 'KaiTi', serif;
  font-size: 16px;
  color: #8b1a1a;
  font-weight: bold;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.knowledge-card__body {
  font-size: 14px;
  color: #2c1810;
  line-height: 1.6;
}

@keyframes card-rise {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.action-row {
  position: absolute;
  bottom: 40px;
  display: flex;
  gap: 12px;
  animation: card-rise 300ms ease-out;
}

.retry-btn,
.next-btn {
  /* 让两个按钮并排展示在同一行 */
  position: static;
}

.opera-btn--ghost {
  background: transparent !important;
  color: #f5d76e !important;
  border: 2px solid #f5d76e !important;
}
.opera-btn--ghost:active {
  background: rgba(245, 215, 110, 0.2) !important;
}

.feedback-enter-active {
  transition: opacity 200ms;
}
.feedback-enter-from {
  opacity: 0;
}
</style>
