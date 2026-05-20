<template>
  <div ref="stageRef" class="q01-stage">
    <!-- 背景：礁石海岸 -->
    <div class="q01-bg"></div>

    <!-- 海水图层（带波浪边缘，从上往下退） -->
    <div class="q01-water" :class="{ 'q01-water--retreat': retreating }">
      <!-- 波浪表面光泽 -->
      <div class="q01-water__shimmer"></div>
    </div>

    <!-- 退潮时露出来的湿沙/海螺标记 -->
    <div v-if="retreating" class="q01-revealed">
      <span class="q01-revealed__item q01-revealed__item--1">🐚</span>
      <span class="q01-revealed__item q01-revealed__item--2">🌊</span>
      <span class="q01-revealed__item q01-revealed__item--3">⭐</span>
      <div class="q01-revealed__warning">⚠ 海水异常后退！</div>
    </div>

    <!-- 海啸覆盖（错误时） -->
    <transition name="tsunami">
      <div v-if="result === 'tsunami'" class="q01-tsunami"></div>
    </transition>

    <!-- 角色 -->
    <img
      :src="charSrc"
      class="q01-char"
      :class="[`q01-char--${charState}`]"
      :style="combinedCharStyle"
      alt="小卫"
    />

    <!-- 拖动轨迹（戏曲水袖） -->
    <svg
      v-if="dragging"
      class="q01-trail"
      :viewBox="`0 0 ${stageW} ${stageH}`"
      preserveAspectRatio="none"
    >
      <line
        :x1="sx" :y1="sy"
        :x2="dragPos.x" :y2="dragPos.y"
        stroke="url(#sleeve-grad)"
        stroke-width="8"
        stroke-linecap="round"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="sleeve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f5d76e" stop-opacity="0" />
          <stop offset="50%" stop-color="#c0392b" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#f5d76e" stop-opacity="1" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 倒计时条 -->
    <div v-if="started && !ended" class="q01-countdown">
      <div class="q01-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q01-countdown__text">{{ remaining }}秒内做出选择！</div>
    </div>

    <!-- 方向指引（拖动中实时高亮） -->
    <div v-if="started && !ended" class="q01-hints">
      <div class="q01-hint q01-hint--up" :class="{ 'q01-hint--active': dragDirection === 'up' }">
        <span class="q01-hint__arrow">↑</span>
        <span>追海水跑</span>
      </div>
      <div class="q01-hint q01-hint--right" :class="{ 'q01-hint--active': dragDirection === 'right' }">
        <span class="q01-hint__arrow">→</span>
        <span>跑向沙滩</span>
      </div>
      <div class="q01-hint q01-hint--stay" :class="{ 'q01-hint--active': dragging && !dragDirection }">
        <span class="q01-hint__arrow">⏸</span>
        <span>原地不动</span>
      </div>
    </div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q01-cover">
      <div class="q01-cover__tip">
        <div class="opera-board q01-cover__title">第 一 关</div>
        <p class="q01-cover__name">礁 石 海 浪</p>
        <p class="q01-cover__desc">
          观察海面变化，<br />
          用<b>滑动手指</b>选择正确方向逃生
        </p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';
import { assetUrl } from '@/utils/assetUrl';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const stageW = ref(375);
const stageH = ref(600);

const started = ref(false);
const ended = ref(false);
const retreating = ref(false);
const result = ref(''); // '' | 'safe' | 'tsunami' | 'lost'
const charState = ref('idle'); // idle | run | wash

const resultCharStyle = ref({});

// 拖动状态
const dragging = ref(false);
const dragDirection = ref(''); // '' | 'up' | 'right' | 'down' | 'left'
const dragPos = ref({ x: 0, y: 0 });
let sx = 0, sy = 0;
const SWIPE_THRESHOLD = 30;

const charSrc = computed(() => {
  if (charState.value === 'run') return assetUrl('images/characters/nezha_run.png');
  if (charState.value === 'wash') return assetUrl('images/characters/nezha_fall.png');
  return assetUrl('images/characters/nezha_idle.png');
});

// 角色样式：拖动中跟随手指倾斜，结算后用结算样式
const combinedCharStyle = computed(() => {
  if (ended.value) return resultCharStyle.value;
  if (!dragging.value) return {};
  const dx = dragPos.value.x - sx;
  const dy = dragPos.value.y - sy;
  const tilt = Math.max(-20, Math.min(20, dx / 8));
  const lift = -Math.min(20, Math.max(0, Math.abs(dy) / 4));
  return {
    transform: `translateY(${lift}px) rotate(${tilt}deg)`,
    transition: 'transform 0.08s linear',
  };
});

const totalSeconds = props.question?.gameConfig?.countdown ?? 5;
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds, () => endGame('stay'));

function startGame() {
  started.value = true;
  setTimeout(() => {
    retreating.value = true;
    startCountdown();
  }, 800);
}

function endGame(direction) {
  if (ended.value) return;
  ended.value = true;
  stopCountdown();
  dragging.value = false;

  if (direction === 'right') {
    result.value = 'safe';
    charState.value = 'run';
    resultCharStyle.value = {
      transform: 'translate(140px, -10px) scale(0.7) rotate(0deg)',
      transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
    setTimeout(() => emit('correct'), 1100);
  } else if (direction === 'up') {
    result.value = 'lost';
    charState.value = 'run';
    resultCharStyle.value = {
      transform: 'translate(0, -160px) scale(0.5) rotate(0deg)',
      transition: 'transform 0.6s ease-out',
      opacity: 0.6,
    };
    setTimeout(() => {
      result.value = 'tsunami';
      setTimeout(() => emit('wrong'), 700);
    }, 600);
  } else {
    result.value = 'tsunami';
    charState.value = 'wash';
    resultCharStyle.value = {
      transform: 'rotate(0deg)',
    };
    setTimeout(() => emit('wrong'), 800);
  }
}

// === 拖动手势 ===
function computeDirection(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return '';
  return absX > absY ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

// SVG 轨迹的 viewBox 是 0..stageW / 0..stageH（stage 自身坐标系），
// 必须把 viewport 坐标 (clientX/Y) 减去 stage 的左上角偏移，否则线条会
// 渲染到 stage 之外（表现为：线总是垂直拖向页面底部）。
function getStageOffset() {
  const rect = stageRef.value?.getBoundingClientRect();
  return rect ? { left: rect.left, top: rect.top } : { left: 0, top: 0 };
}

function onPointerDown(e) {
  if (!started.value || ended.value) return;
  const off = getStageOffset();
  sx = e.clientX - off.left;
  sy = e.clientY - off.top;
  dragging.value = true;
  dragDirection.value = '';
  dragPos.value = { x: sx, y: sy };
  try { stageRef.value?.setPointerCapture?.(e.pointerId); } catch {}
}

function onPointerMove(e) {
  if (!started.value || ended.value || !dragging.value) return;
  const off = getStageOffset();
  const x = e.clientX - off.left;
  const y = e.clientY - off.top;
  dragPos.value = { x, y };
  dragDirection.value = computeDirection(x - sx, y - sy);
}

function onPointerUp(e) {
  if (!started.value || ended.value || !dragging.value) return;
  dragging.value = false;
  const dir = dragDirection.value;
  dragDirection.value = '';
  if (!dir) return; // 距离太短，不算滑动，继续等
  endGame(dir);
}

function updateStageSize() {
  const el = stageRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  stageW.value = rect.width;
  stageH.value = rect.height;
}

onMounted(() => {
  const el = stageRef.value;
  updateStageSize();
  window.addEventListener('resize', updateStageSize);
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
});

onUnmounted(() => {
  const el = stageRef.value;
  window.removeEventListener('resize', updateStageSize);
  if (!el) return;
  el.removeEventListener('pointerdown', onPointerDown);
  el.removeEventListener('pointermove', onPointerMove);
  el.removeEventListener('pointerup', onPointerUp);
  el.removeEventListener('pointercancel', onPointerUp);
});
</script>

<style scoped>
.q01-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #b3d8f5;
  touch-action: none;
  cursor: pointer;
}

/* === 背景 === */
.q01-bg {
  position: absolute;
  inset: 0;
  background-image: url('https://beach-danger-question-guangzhou.tos-cn-guangzhou.volces.com/scenes/wave_reef.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #87ceeb;
}

/* === 海水（带波浪边缘，整体上下平移）=== */
.q01-water {
  position: absolute;
  left: 0;
  right: 0;
  top: 28%;
  bottom: 0;
  background: linear-gradient(180deg,
    rgba(52, 152, 219, 0.7) 0%,
    rgba(41, 128, 185, 0.55) 50%,
    rgba(30, 100, 150, 0.3) 100%
  );
  /* 不规则波浪上边缘 */
  clip-path: polygon(
    0% 6%, 4% 2%, 8% 7%, 12% 3%, 16% 6%, 20% 1%, 24% 5%, 28% 2%, 32% 7%, 36% 3%,
    40% 6%, 44% 2%, 48% 6%, 52% 1%, 56% 7%, 60% 3%, 64% 6%, 68% 2%, 72% 7%, 76% 3%,
    80% 6%, 84% 2%, 88% 7%, 92% 3%, 96% 6%, 100% 4%,
    100% 100%, 0% 100%
  );
  transition: transform 3.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.q01-water__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.15) 8%,
    transparent 20%
  );
  animation: water-shimmer 2s ease-in-out infinite alternate;
}

@keyframes water-shimmer {
  from { opacity: 0.7; transform: translateX(-2%); }
  to { opacity: 1; transform: translateX(2%); }
}

/* 海平面下降（向下平移 + 略缩放）*/
.q01-water--retreat {
  transform: translateY(50%) scaleY(0.65);
  transform-origin: bottom;
}

/* === 退潮后露出的物品（提示玩家"水退了"）=== */
.q01-revealed {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.q01-revealed__item {
  position: absolute;
  font-size: 22px;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  animation: item-pop 0.5s 1.5s both cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
}
.q01-revealed__item--1 { top: 64%; left: 18%; animation-delay: 1.2s; }
.q01-revealed__item--2 { top: 70%; left: 55%; animation-delay: 1.6s; }
.q01-revealed__item--3 { top: 72%; left: 78%; animation-delay: 2.0s; }

@keyframes item-pop {
  from { opacity: 0; transform: translateY(8px) scale(0.5); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.q01-revealed__warning {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(192, 57, 43, 0.95);
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  font-size: 13px;
  font-weight: bold;
  padding: 6px 14px;
  border-radius: 16px;
  border: 2px solid #f5d76e;
  letter-spacing: 1px;
  white-space: nowrap;
  animation: warning-blink 0.6s ease-in-out infinite alternate, item-pop 0.4s 0.6s both;
  opacity: 0;
}

@keyframes warning-blink {
  from { box-shadow: 0 0 0 rgba(245, 215, 110, 0); }
  to { box-shadow: 0 0 16px rgba(245, 215, 110, 0.8); }
}

/* === 角色 === */
.q01-char {
  position: absolute;
  top: 38%;
  left: 35%;
  width: 110px;
  height: auto;
  z-index: 5;
  mix-blend-mode: multiply;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  pointer-events: none;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.q01-char--idle {
  animation: char-idle 2s ease-in-out infinite;
}
.q01-char--run {
  animation: char-run 0.25s ease-in-out infinite alternate;
}
.q01-char--wash {
  animation: char-wash 0.4s ease-in-out infinite;
}

@keyframes char-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes char-run {
  from { transform: translateY(-6px) rotate(-3deg); }
  to { transform: translateY(0) rotate(3deg); }
}
@keyframes char-wash {
  0%   { transform: rotate(-20deg) translateX(-8px); }
  50%  { transform: rotate(20deg) translateX(8px); }
  100% { transform: rotate(-20deg) translateX(-8px); }
}

/* === 海啸覆盖 === */
.q01-tsunami {
  position: absolute;
  inset: 0;
  background-image: url('https://beach-danger-question-guangzhou.tos-cn-guangzhou.volces.com/scenes/wave_tsunami.webp');
  background-size: cover;
  background-position: center;
  background-color: #2980b9;
  z-index: 8;
}

.tsunami-enter-active {
  animation: tsunami-in 800ms cubic-bezier(0.55, 0, 0.45, 1);
}

@keyframes tsunami-in {
  from { transform: translateX(120%) scaleX(1.3); opacity: 0.5; }
  to { transform: translateX(0) scaleX(1); opacity: 1; }
}

/* === 戏曲水袖轨迹（拖动反馈） === */
.q01-trail {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 7;
}

/* === 倒计时条 === */
.q01-countdown {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 6;
}

.q01-countdown__bar {
  height: 10px;
  background: linear-gradient(90deg, #f5d76e 0%, #c0392b 100%);
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(192, 57, 43, 0.6);
  border: 2px solid #8b1a1a;
  transition: width 0.1s linear;
}

.q01-countdown__text {
  text-align: center;
  margin-top: 8px;
  color: #8b1a1a;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  font-family: 'STKaiti', serif;
  text-shadow: 0 0 4px #fff, 0 0 8px rgba(255, 255, 255, 0.8);
}

/* === 方向指引 === */
.q01-hints {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.q01-hint {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: 'STKaiti', serif;
  font-size: 12px;
  color: #fff;
  background: rgba(139, 26, 26, 0.85);
  border: 2px solid #f5d76e;
  border-radius: 10px;
  padding: 6px 10px;
  text-align: center;
  animation: hint-pulse 1.5s ease-in-out infinite;
  white-space: nowrap;
  transition: transform 0.15s ease, background 0.15s, box-shadow 0.15s;
}

.q01-hint__arrow {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.q01-hint--up {
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
}
.q01-hint--right {
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
.q01-hint--stay {
  bottom: 80px;
  left: 12px;
}

/* 高亮态：拖动方向匹配 */
.q01-hint--active {
  background: linear-gradient(180deg, #f5d76e 0%, #d4a017 100%) !important;
  color: #8b1a1a !important;
  border-color: #8b1a1a !important;
  box-shadow: 0 0 24px #f5d76e, 0 0 8px #fff inset;
  animation: none;
  z-index: 5;
}
.q01-hint--up.q01-hint--active   { transform: translateX(-50%) scale(1.25); }
.q01-hint--right.q01-hint--active { transform: translateY(-50%) scale(1.25); }
.q01-hint--stay.q01-hint--active  { transform: scale(1.25); }

@keyframes hint-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* === 开始遮罩 === */
.q01-cover {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(45, 24, 16, 0.5) 0%, rgba(45, 24, 16, 0.85) 100%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px;
}

.q01-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}

.q01-cover__title {
  margin-bottom: 16px;
}

.q01-cover__name {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 8px;
  margin-bottom: 20px;
  text-shadow: 3px 3px 0 #8b1a1a;
}

.q01-cover__desc {
  font-size: 15px;
  line-height: 1.9;
  letter-spacing: 1px;
  color: #f5e6d3;
}
.q01-cover__desc b {
  color: #fff;
  background: #c0392b;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
