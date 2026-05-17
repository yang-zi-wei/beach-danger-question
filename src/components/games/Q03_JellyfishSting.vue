<template>
  <div ref="stageRef" class="q03-stage">
    <!-- 场景图作为全屏背景 -->
    <img :src="sceneSrc" class="q03-scene" alt="玲玲在沙滩被水母蜇伤" />

    <!-- 伤口热区（拖放目标，位置可调） -->
    <div
      class="q03-wound"
      :class="[
        `q03-wound--${woundState}`,
        { 'q03-wound--hover': dragging && pointerOnVictim },
      ]"
      :style="{ top: woundPos.top, left: woundPos.left, width: woundPos.size, height: woundPos.size }"
      data-wound="1"
    >
      <div class="q03-wound__ring" data-wound="1"></div>
      <div class="q03-wound__icon" data-wound="1">
        {{ woundState === 'healed' ? '✓' : woundState === 'washed' ? '✦' : woundState === 'worse' ? '✗' : '!' }}
      </div>
    </div>

    <!-- 步骤标识 -->
    <div v-if="started && !ended" class="q03-steps">
      <span class="q03-steps__dot" :class="{ active: step === 'wash', done: step !== 'wash' }">①冲洗</span>
      <span class="q03-steps__arrow">›</span>
      <span class="q03-steps__dot" :class="{ active: step === 'help' }">②求助</span>
    </div>

    <!-- 提示文字 -->
    <div v-if="started && !ended" class="q03-prompt">
      <p v-if="step === 'wash'">💢 玲玲被蜇了！拖<b>正确冲洗物</b>到她身上</p>
      <p v-else-if="step === 'help'">✨ 冲洗完成！接下来该<b>做什么</b>？</p>
    </div>

    <!-- 物品托盘 -->
    <div v-if="started && !ended" class="q03-tray">
      <div
        v-for="it in currentItems"
        :key="it.id"
        :data-item="it.id"
        class="q03-item"
        :class="{ 'q03-item--used': usedItems.has(it.id) }"
      >
        <span class="q03-item__icon">{{ it.emoji }}</span>
        <span class="q03-item__name">{{ it.name }}</span>
      </div>
    </div>

    <!-- 拖动浮层 -->
    <div
      v-if="dragging"
      class="q03-floating"
      :style="{ left: pointer.x + 'px', top: pointer.y + 'px' }"
    >
      {{ dragging.emoji }}
    </div>

    <!-- 错误提示弹层 -->
    <div v-if="errorMsg" class="q03-error-toast">{{ errorMsg }}</div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q03-countdown">
      <div class="q03-countdown__bar" :style="{ width: percent + '%' }"></div>
    </div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q03-cover">
      <div class="q03-cover__tip">
        <div class="opera-board q03-cover__title">第 三 关</div>
        <p class="q03-cover__name">水 母 救 治</p>
        <p class="q03-cover__desc">
          玲玲被水母蜇伤了！<br />
          第 ① 步选对<b>冲洗物</b>，第 ② 步选对<b>反应</b>
        </p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const started = ref(false);
const ended = ref(false);

const step = ref('wash'); // wash | help
const woundState = ref('stung'); // stung | washed | healed | worse
const usedItems = reactive(new Set());
const errorMsg = ref('');

// 第一步：冲洗物（海水正解；淡水/沙子错）
const washItems = [
  { id: 'freshwater', name: '淡水', emoji: '💧',
    error: '淡水会让水母刺胞释放更多毒液！' },
  { id: 'sand',       name: '沙子', emoji: '🏖️',
    error: '用沙子搓会把毒刺压得更深！' },
  { id: 'seawater',   name: '海水', emoji: '🌊' },
];
// 第二步：反应（找大人正解；自己挑刺/继续玩错）
const helpItems = [
  { id: 'pick',  name: '自己挑刺', emoji: '🤚',
    error: '徒手挑刺会让毒液扩散到指尖！' },
  { id: 'play',  name: '继续玩水', emoji: '🐟',
    error: '继续玩水会延误救治，毒素扩散更快！' },
  { id: 'adult', name: '找大人',   emoji: '🆘' },
];

const currentItems = computed(() => (step.value === 'wash' ? washItems : helpItems));

const dragging = ref(null);
const pointer = ref({ x: 0, y: 0 });
const pointerOnVictim = ref(false);

const sceneSrc = computed(() => {
  const base = import.meta.env.BASE_URL;
  return `${base}images/characters/linglin_hurt.png`;
});

// 伤口热区位置 —— 占位中心，等看图后微调
// （传入 question.gameConfig.wound 可覆盖，例如 { top:'58%', left:'46%', size:'120px' }）
const woundPos = computed(() => ({
  top:  props.question?.gameConfig?.wound?.top  ?? '50%',
  left: props.question?.gameConfig?.wound?.left ?? '50%',
  size: props.question?.gameConfig?.wound?.size ?? '120px',
}));

const totalSeconds = props.question?.gameConfig?.countdown ?? 14;
const { percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds, () => endGame(false));

function startGame() {
  started.value = true;
  startCountdown();
}

function endGame(success) {
  if (ended.value) return;
  ended.value = true;
  stopCountdown();
  setTimeout(() => emit(success ? 'correct' : 'wrong'), 900);
}

function showError(msg) {
  errorMsg.value = msg;
  setTimeout(() => (errorMsg.value = ''), 1500);
}

function hitWound(x, y) {
  const els = document.elementsFromPoint(x, y);
  return els.some((el) => el.dataset?.wound === '1');
}

function onPointerDown(e) {
  if (!started.value || ended.value) return;
  const node = e.target?.closest?.('[data-item]');
  if (!node) return;
  const id = node.dataset.item;
  if (usedItems.has(id)) return;
  const it = currentItems.value.find((x) => x.id === id);
  if (!it) return;
  dragging.value = { ...it };
  pointer.value = { x: e.clientX, y: e.clientY };
  try { stageRef.value?.setPointerCapture?.(e.pointerId); } catch {}
  e.preventDefault();
}

function onPointerMove(e) {
  if (!dragging.value) return;
  pointer.value = { x: e.clientX, y: e.clientY };
  pointerOnVictim.value = hitWound(e.clientX, e.clientY);
}

function onPointerUp(e) {
  if (!dragging.value) return;
  const it = dragging.value;
  const hit = hitWound(e.clientX, e.clientY);
  dragging.value = null;
  pointerOnVictim.value = false;
  if (!hit) return;

  if (step.value === 'wash') {
    if (it.id === 'seawater') {
      usedItems.add(it.id);
      woundState.value = 'washed';
      setTimeout(() => (step.value = 'help'), 600);
    } else {
      // 淡水 or 沙子 都错
      woundState.value = 'worse';
      showError(it.error || '错误做法！');
      endGame(false);
    }
  } else if (step.value === 'help') {
    if (it.id === 'adult') {
      usedItems.add(it.id);
      woundState.value = 'healed';
      endGame(true);
    } else {
      woundState.value = 'worse';
      showError(it.error || '错误做法！');
      endGame(false);
    }
  }
}

onMounted(() => {
  const el = stageRef.value;
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
});

onUnmounted(() => {
  const el = stageRef.value;
  if (!el) return;
  el.removeEventListener('pointerdown', onPointerDown);
  el.removeEventListener('pointermove', onPointerMove);
  el.removeEventListener('pointerup', onPointerUp);
  el.removeEventListener('pointercancel', onPointerUp);
});
</script>

<style scoped>
.q03-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
}
.q03-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}
/* 伤口热区：以位置中心为锚点的圆 —— 必须可被 elementsFromPoint 命中 */
.q03-wound {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  /* 不要监听任何手势，避免抢走 stage 的 pointer 事件 */
  touch-action: none;
}
.q03-wound__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px dashed #f5d76e;
  background: radial-gradient(circle, rgba(192, 57, 43, 0.45) 0%, rgba(192, 57, 43, 0.18) 60%, transparent 100%);
  box-shadow: 0 0 18px rgba(245, 215, 110, 0.6);
  animation: wound-pulse 1.1s ease-in-out infinite;
}
.q03-wound__icon {
  position: relative;
  color: #fff;
  font-weight: bold;
  font-size: 30px;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
}
.q03-wound--hover .q03-wound__ring {
  border-color: #fff;
  background: radial-gradient(circle, rgba(245, 215, 110, 0.7) 0%, rgba(245, 215, 110, 0.2) 70%, transparent 100%);
  box-shadow: 0 0 28px rgba(245, 215, 110, 0.9);
  transform: scale(1.06);
}
.q03-wound--washed .q03-wound__ring {
  border-color: #f1c40f;
  background: radial-gradient(circle, rgba(241, 196, 15, 0.55) 0%, rgba(241, 196, 15, 0.15) 70%, transparent 100%);
}
.q03-wound--healed .q03-wound__ring {
  border-color: #2ecc71;
  background: radial-gradient(circle, rgba(46, 204, 113, 0.65) 0%, rgba(46, 204, 113, 0.15) 70%, transparent 100%);
  animation: none;
}
.q03-wound--worse .q03-wound__ring {
  border-color: #c0392b;
  background: radial-gradient(circle, rgba(120, 0, 0, 0.75) 0%, rgba(192, 57, 43, 0.25) 70%, transparent 100%);
  animation: wound-pulse 0.28s ease-in-out infinite;
}
@keyframes wound-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.14); }
}
.q03-steps {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(45, 24, 16, 0.7);
  padding: 5px 10px;
  border-radius: 14px;
  border: 1px solid #f5d76e;
  z-index: 3;
}
.q03-steps__dot {
  font-family: 'STKaiti', serif;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(245, 215, 110, 0.45);
  transition: color 0.25s;
}
.q03-steps__dot.active { color: #f5d76e; font-weight: bold; }
.q03-steps__dot.done   { color: #2ecc71; }
.q03-steps__arrow { color: #f5d76e; font-size: 14px; }
.q03-prompt {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 3;
}
.q03-prompt p {
  display: inline-block;
  background: rgba(45, 24, 16, 0.85);
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  padding: 8px 16px;
  border-radius: 16px;
  border: 2px solid #f5d76e;
  margin: 0;
  font-size: 14px;
  max-width: 70%;
}
.q03-prompt b { color: #fff; }
.q03-tray {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 0 12px;
}
.q03-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(139, 26, 26, 0.85);
  border: 2px solid #f5d76e;
  border-radius: 14px;
  padding: 8px 14px;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s;
  touch-action: none;
}
.q03-item:active {
  transform: scale(0.92);
}
.q03-item__icon {
  font-size: 36px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}
.q03-item__name {
  font-size: 12px;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  margin-top: 4px;
  white-space: nowrap;
}
.q03-item--used { opacity: 0.3; pointer-events: none; }
.q03-floating {
  position: fixed;
  font-size: 46px;
  z-index: 100;
  pointer-events: none;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6));
}
.q03-error-toast {
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(192, 57, 43, 0.95);
  color: #fff;
  font-family: 'STKaiti', serif;
  font-size: 16px;
  letter-spacing: 1px;
  padding: 12px 20px;
  border: 2px solid #f5d76e;
  border-radius: 14px;
  z-index: 50;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  animation: errorPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  max-width: 80%;
  text-align: center;
}
@keyframes errorPop {
  from { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
  to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
}
.q03-countdown {
  position: absolute;
  top: 50px;
  left: 16px;
  right: 16px;
}
.q03-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q03-cover {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(45, 24, 16, 0.5), rgba(45, 24, 16, 0.9));
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px;
}
.q03-cover__tip { text-align: center; color: #f5d76e; font-family: 'STKaiti', serif; }
.q03-cover__title { margin-bottom: 16px; }
.q03-cover__name {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 8px;
  margin-bottom: 20px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q03-cover__desc {
  font-size: 15px;
  line-height: 1.9;
  letter-spacing: 1px;
  color: #f5e6d3;
}
.q03-cover__desc b {
  color: #fff;
  background: #c0392b;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
