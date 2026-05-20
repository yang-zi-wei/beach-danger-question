<template>
  <div ref="stageRef" class="q08-stage">
    <!-- 题目 -->
    <h2 v-if="started" class="q08-prompt">把火烈鸟泳圈拖到适合的水域</h2>

    <!-- 三横区域 + 背景图（坐标系） -->
    <div v-if="started" class="q08-board">
      <img
        class="q08-bg"
        :src="bgSrc"
        alt="三种水域"
        @error="onBgError"
      />

      <!-- 三个落点区域：与背景图三横对齐 -->
      <div
        v-for="zone in zones"
        :key="zone.key"
        :data-zone="zone.key"
        class="q08-zone"
        :class="{
          'q08-zone--hover': dragging && hoverZone === zone.key,
          'q08-zone--correct': resultZone === zone.key && resultZone === question?.correct,
          'q08-zone--wrong': resultZone === zone.key && resultZone !== question?.correct,
        }"
        :style="{ top: zone.top, height: zone.height }"
      >
        <span class="q08-zone__label">{{ optionTextByKey[zone.key] }}</span>
      </div>

    </div>

    <!-- 答对后的庆祝大图（覆盖整个 stage）-->
    <div v-if="showSuccess" class="q08-success">
      <img
        class="q08-success__img"
        :src="successSrc"
        alt="答对了！"
      />
      <div class="q08-success__banner">答对啦！</div>
    </div>

    <!-- 底部托盘里的火烈鸟泳圈（拖动起点）-->
    <div v-if="started && !ended" class="q08-tray">
      <div
        class="q08-ring-card"
        :class="{ 'q08-ring-card--picked': dragging }"
        data-ring="flamingo"
      >
        <img class="q08-ring-card__icon" :src="ringSrc" alt="火烈鸟泳圈" />
        <span class="q08-ring-card__hint">拖我 →</span>
      </div>
    </div>

    <!-- 拖动浮层 -->
    <img
      v-if="dragging"
      class="q08-floating"
      :src="ringSrc"
      :style="{ left: pointer.x + 'px', top: pointer.y + 'px' }"
      alt="拖动中"
    />

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q08-countdown">
      <div class="q08-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q08-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="q08-flash"
      :class="`q08-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q08-cover">
      <div class="q08-cover__tip">
        <div class="opera-board q08-cover__title">第 八 关</div>
        <p class="q08-cover__name">火烈鸟泳圈</p>
        <p class="q08-cover__desc">
          把粉色火烈鸟泳圈<br />
          <b>拖到适合的水域</b>
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
const started = ref(false);
const ended = ref(false);
const flashColor = ref('');
const resultZone = ref(null); // 'A' | 'B' | 'C' 玩家最终落到的区域
const hoverZone = ref(null); // 拖动中悬停的区域

const dragging = ref(false);
const pointer = ref({ x: 0, y: 0 });

const cfg = computed(() => props.question?.gameConfig || {});

const bgSrc = ref('');
const ringSrc = ref('');
const successSrc = ref('');
const showSuccess = ref(false);
const FALLBACK_BG = assetUrl('images/scenes/wave_reef.png');

onMounted(() => {
  bgSrc.value = cfg.value.background ? assetUrl(cfg.value.background) : FALLBACK_BG;
  ringSrc.value = assetUrl(cfg.value.ringIcon);
  successSrc.value = assetUrl(cfg.value.successImage);
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

function onBgError() {
  if (bgSrc.value !== FALLBACK_BG) bgSrc.value = FALLBACK_BG;
}

// === 区域定义（百分比，相对 .q08-board）===
const zones = [
  { key: 'A', top: '0%',     height: '33.33%' }, // 顶：码头深水
  { key: 'B', top: '33.33%', height: '33.34%' }, // 中：浅水池（正确）
  { key: 'C', top: '66.67%', height: '33.33%' }, // 底：台风海
];

const optionTextByKey = computed(() => {
  const map = {};
  (props.question?.options || []).forEach((o) => { map[o.key] = o.text; });
  return map;
});

// === 倒计时 ===
const totalSeconds = cfg.value.countdown ?? 15;
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds, () => handleTimeout());

function startGame() {
  started.value = true;
  startCountdown();
}

function handleTimeout() {
  if (ended.value) return;
  ended.value = true;
  flashColor.value = 'red';
  setTimeout(() => emit('wrong'), 600);
}

// === 拖拽 ===
function pickRing(node) {
  return node?.dataset?.ring === 'flamingo';
}

function detectZone(x, y) {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const z = el.dataset?.zone;
    if (z) return z;
  }
  return null;
}

function onPointerDown(e) {
  if (!started.value || ended.value) return;
  const node = e.target?.closest?.('[data-ring]');
  if (!pickRing(node)) return;
  dragging.value = true;
  pointer.value = { x: e.clientX, y: e.clientY };
  try { stageRef.value?.setPointerCapture?.(e.pointerId); } catch {}
  e.preventDefault();
}

function onPointerMove(e) {
  if (!dragging.value) return;
  pointer.value = { x: e.clientX, y: e.clientY };
  hoverZone.value = detectZone(e.clientX, e.clientY);
}

function onPointerUp(e) {
  if (!dragging.value) return;
  const zone = detectZone(e.clientX, e.clientY);
  dragging.value = false;
  hoverZone.value = null;
  if (!zone) return; // 拖到区域外松手，不结算
  resolveZone(zone);
}

function resolveZone(key) {
  if (ended.value) return;
  ended.value = true;
  stopCountdown();
  resultZone.value = key;
  const isCorrect = key === props.question?.correct;
  flashColor.value = isCorrect ? 'gold' : 'red';
  if (isCorrect && successSrc.value) {
    // 短暂高亮正确区域后展示庆祝大图，再交给 FeedbackLayer
    setTimeout(() => { showSuccess.value = true; }, 700);
    setTimeout(() => emit('correct'), 2600);
  } else {
    setTimeout(() => emit(isCorrect ? 'correct' : 'wrong'), 1100);
  }
}
</script>

<style scoped>
.q08-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1a1f3a;
  touch-action: none;
}

.q08-prompt {
  position: absolute;
  top: 6px;
  left: 12px;
  right: 12px;
  z-index: 4;
  margin: 0;
  text-align: center;
  font-family: 'STKaiti', serif;
  font-size: 14px;
  font-weight: bold;
  color: #f5d76e;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85);
  pointer-events: none;
}

/* 三区背景 + 落点叠层 */
.q08-board {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 130px); /* 留出底部 tray + 倒计时 */
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
}
.q08-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

.q08-zone {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, box-shadow 0.2s;
  background: rgba(0, 0, 0, 0);
}
.q08-zone__label {
  background: rgba(0, 0, 0, 0.6);
  color: #f5e6d3;
  font-family: 'STKaiti', serif;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(245, 215, 110, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}
.q08-zone--hover {
  background: rgba(245, 215, 110, 0.22);
  box-shadow: inset 0 0 0 3px #f5d76e;
}
.q08-zone--correct {
  background: rgba(46, 204, 113, 0.28);
  box-shadow: inset 0 0 0 3px #27ae60;
  animation: q08-pop 0.5s;
}
.q08-zone--wrong {
  background: rgba(192, 57, 43, 0.28);
  box-shadow: inset 0 0 0 3px #c0392b;
  animation: q08-shake 0.5s;
}

/* 答对后的庆祝大图覆盖层 */
.q08-success {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: radial-gradient(circle at center, rgba(245, 215, 110, 0.35), rgba(26, 31, 58, 0.92) 75%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: q08-success-in 0.45s ease-out;
}
.q08-success__img {
  max-width: 92%;
  max-height: 75%;
  object-fit: contain;
  border: 3px solid #f5d76e;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(245, 215, 110, 0.6),
              0 12px 30px rgba(0, 0, 0, 0.6);
  animation: q08-success-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q08-success__banner {
  margin-top: 16px;
  padding: 6px 22px;
  background: #c0392b;
  color: #f5e6d3;
  font-family: 'STKaiti', serif;
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 6px;
  border: 2px solid #f5d76e;
  border-radius: 30px;
  text-shadow: 2px 2px 0 #5a0a0a;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  animation: q08-success-pop 0.55s 0.1s backwards cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes q08-success-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes q08-success-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes q08-pop {
  0% { transform: scale(0.96); }
  60%{ transform: scale(1.04); }
  100%{transform: scale(1); }
}
@keyframes q08-shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-5px); }
  75%     { transform: translateX(5px); }
}

/* 底部 tray + 火烈鸟泳圈卡片 */
.q08-tray {
  position: absolute;
  bottom: 36px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 5;
  pointer-events: none; /* 仅卡片可被点 */
}
.q08-ring-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(139, 26, 26, 0.92);
  border: 2px solid #f5d76e;
  border-radius: 14px;
  padding: 6px 10px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  pointer-events: auto;
  transition: opacity 0.15s, transform 0.15s;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
}
.q08-ring-card:active { cursor: grabbing; }
.q08-ring-card--picked { opacity: 0.3; transform: scale(0.92); }
.q08-ring-card__icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  pointer-events: none;
}
.q08-ring-card__hint {
  margin-top: 2px;
  font-size: 11px;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  letter-spacing: 1px;
}

/* 拖动浮层 */
.q08-floating {
  position: fixed;
  width: 90px;
  height: 90px;
  object-fit: contain;
  z-index: 100;
  pointer-events: none;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
}

/* 倒计时 */
.q08-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.q08-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q08-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* 全屏闪光 */
.q08-flash {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  animation: q08-flash 0.55s ease-out forwards;
}
.q08-flash--gold { background: radial-gradient(circle, rgba(245, 215, 110, 0.5), transparent 70%); }
.q08-flash--red  { background: radial-gradient(circle, rgba(192, 57, 43, 0.45), transparent 70%); }
@keyframes q08-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 开始遮罩 */
.q08-cover {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(26, 31, 58, 0.55), rgba(26, 31, 58, 0.95));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px;
}
.q08-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q08-cover__title { margin-bottom: 16px; }
.q08-cover__name {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 18px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q08-cover__desc {
  font-size: 14px;
  line-height: 1.9;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
}
.q08-cover__desc b {
  color: #fff;
  background: #c0392b;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
