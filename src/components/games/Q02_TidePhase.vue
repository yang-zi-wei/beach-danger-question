<template>
  <div ref="stageRef" class="q02-stage">
    <div class="q02-bg"></div>

    <h2 v-if="started" class="q02-title">把"大潮月相"拖到对应日期</h2>

    <!-- 农历日历（4x4，初一 / 十五 高亮为目标格）-->
    <div v-if="started" class="q02-calendar">
      <div
        v-for="day in calendarDays"
        :key="day"
        :data-day="day"
        class="q02-cell"
        :class="{
          'q02-cell--target': isTarget(day),
          'q02-cell--correct': dropped[day]?.status === 'correct',
          'q02-cell--wrong': dropped[day]?.status === 'wrong',
        }"
      >
        <span class="q02-cell__num">{{ day }}</span>
        <span v-if="dropped[day]" class="q02-cell__moon">{{ dropped[day].emoji }}</span>
        <span v-else-if="isTarget(day)" class="q02-cell__hint">?</span>
      </div>
    </div>

    <!-- 月相托盘 -->
    <div v-if="started" class="q02-tray">
      <div
        v-for="m in moons"
        :key="m.id"
        :data-moon="m.id"
        class="q02-moon"
        :class="{ 'q02-moon--used': usedMoons.has(m.id) }"
      >
        <span class="q02-moon__icon">{{ m.emoji }}</span>
        <span class="q02-moon__name">{{ m.name }}</span>
      </div>
    </div>

    <!-- 拖动浮层 -->
    <div
      v-if="dragging"
      class="q02-floating"
      :style="{ left: pointer.x + 'px', top: pointer.y + 'px' }"
    >
      {{ dragging.emoji }}
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q02-countdown">
      <div class="q02-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q02-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q02-cover">
      <div class="q02-cover__tip">
        <div class="opera-board q02-cover__title">第 二 关</div>
        <p class="q02-cover__name">月 相 潮 汐</p>
        <p class="q02-cover__desc">
          渔民谚语"初一十五响午潮"<br />
          把月相拖到<b>对应日期格子</b>
        </p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const started = ref(false);
const ended = ref(false);

const calendarDays = Array.from({ length: 16 }, (_, i) => i + 1);
const TARGET_DAYS = new Set([1, 15]);
const TARGET_MOON_FOR = { 1: 'new', 15: 'full' };

function isTarget(day) {
  return TARGET_DAYS.has(day);
}

const moons = [
  { id: 'new', emoji: '🌑', name: '新月' },
  { id: 'crescent', emoji: '🌒', name: '蛾眉月' },
  { id: 'half', emoji: '🌓', name: '上弦月' },
  { id: 'full', emoji: '🌕', name: '满月' },
];

const dropped = reactive({});
const usedMoons = reactive(new Set());

const dragging = ref(null);
const pointer = ref({ x: 0, y: 0 });

const totalSeconds = props.question?.gameConfig?.countdown ?? 25;
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds, () => endGame());

function startGame() {
  started.value = true;
  startCountdown();
}

function endGame() {
  if (ended.value) return;
  ended.value = true;
  stopCountdown();
  const filledDays = Object.keys(dropped).map(Number);
  const allTargetsFilled = [...TARGET_DAYS].every((d) => dropped[d]);
  const allCorrect =
    allTargetsFilled &&
    [...TARGET_DAYS].every((d) => dropped[d].id === TARGET_MOON_FOR[d]) &&
    filledDays.every((d) => TARGET_DAYS.has(d));
  setTimeout(() => emit(allCorrect ? 'correct' : 'wrong'), 700);
}

function hitDay(x, y) {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const day = el.dataset?.day;
    if (day) return Number(day);
  }
  return null;
}

function onPointerDown(e) {
  if (!started.value || ended.value) return;
  const node = e.target?.closest?.('[data-moon]');
  if (!node) return;
  const moonId = node.dataset.moon;
  if (usedMoons.has(moonId)) return;
  const moon = moons.find((m) => m.id === moonId);
  if (!moon) return;
  dragging.value = { ...moon };
  pointer.value = { x: e.clientX, y: e.clientY };
  try { stageRef.value?.setPointerCapture?.(e.pointerId); } catch {}
  e.preventDefault();
}

function onPointerMove(e) {
  if (!dragging.value) return;
  pointer.value = { x: e.clientX, y: e.clientY };
}

function onPointerUp(e) {
  if (!dragging.value) return;
  const moon = dragging.value;
  const day = hitDay(e.clientX, e.clientY);
  dragging.value = null;
  if (day == null || !TARGET_DAYS.has(day) || dropped[day]) return;
  const isCorrect = TARGET_MOON_FOR[day] === moon.id;
  dropped[day] = { ...moon, status: isCorrect ? 'correct' : 'wrong' };
  usedMoons.add(moon.id);
  // 两个目标都填了就结算
  if (TARGET_DAYS.size === Object.values(dropped).filter(Boolean).length) {
    setTimeout(endGame, 800);
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
.q02-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  background: linear-gradient(180deg, #1a1f3a 0%, #2d1810 100%);
}
.q02-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, white, transparent),
    radial-gradient(1px 1px at 60% 50%, white, transparent),
    radial-gradient(1.5px 1.5px at 80% 20%, white, transparent),
    radial-gradient(1px 1px at 30% 70%, white, transparent),
    radial-gradient(1.5px 1.5px at 70% 80%, white, transparent);
  opacity: 0.55;
}
.q02-title {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  font-size: 15px;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}
.q02-calendar {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  width: 88%;
  max-width: 320px;
}
.q02-cell {
  aspect-ratio: 1 / 1;
  background: rgba(245, 230, 211, 0.08);
  border: 2px solid rgba(245, 215, 110, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #f5e6d3;
  font-family: 'STKaiti', serif;
  user-select: none;
}
.q02-cell__num {
  font-size: 13px;
  position: absolute;
  top: 4px;
  left: 6px;
  font-weight: bold;
}
.q02-cell__hint {
  font-size: 22px;
  color: #f5d76e;
  animation: pulse 1s ease-in-out infinite;
}
.q02-cell__moon {
  font-size: 28px;
}
.q02-cell--target {
  background: rgba(245, 215, 110, 0.18);
  border-color: #f5d76e;
  box-shadow: 0 0 14px rgba(245, 215, 110, 0.5);
}
.q02-cell--correct {
  background: rgba(46, 204, 113, 0.35) !important;
  border-color: #27ae60 !important;
  animation: pop 0.4s;
}
.q02-cell--wrong {
  background: rgba(192, 57, 43, 0.4) !important;
  border-color: #c0392b !important;
  animation: shake 0.4s;
}
@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
@keyframes pop {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.q02-tray {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 0 12px;
}
.q02-moon {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(139, 26, 26, 0.85);
  border: 2px solid #f5d76e;
  border-radius: 12px;
  padding: 6px 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.q02-moon__icon {
  font-size: 32px;
  line-height: 1;
}
.q02-moon__name {
  font-size: 10px;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  margin-top: 2px;
}
.q02-moon--used {
  opacity: 0.3;
  pointer-events: none;
}
.q02-floating {
  position: fixed;
  font-size: 44px;
  pointer-events: none;
  z-index: 100;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}
.q02-countdown {
  position: absolute;
  top: 36px;
  left: 16px;
  right: 16px;
}
.q02-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q02-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}
.q02-cover {
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
.q02-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q02-cover__title {
  margin-bottom: 16px;
}
.q02-cover__name {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 8px;
  margin-bottom: 20px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q02-cover__desc {
  font-size: 15px;
  line-height: 1.9;
  letter-spacing: 1px;
  color: #f5e6d3;
}
.q02-cover__desc b {
  color: #fff;
  background: #c0392b;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
