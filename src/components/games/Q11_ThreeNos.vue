<template>
  <div ref="stageRef" class="q11-stage">
    <!-- 题目 -->
    <h2 v-if="started" class="q11-prompt">{{ question?.title }}</h2>

    <!-- 田字格场景 + 印章覆盖 -->
    <div v-if="started" class="q11-board" :class="{ 'q11-board--won': won }">
      <img
        class="q11-bg"
        :src="bgSrc"
        alt="四种行为"
        @error="onBgError"
      />

      <!-- 4 个点选区域（田字格）-->
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="q11-cell"
        :class="{
          'q11-cell--stamped': stamps[cell.key],
          'q11-cell--wrong': stamps[cell.key] === 'wrong',
        }"
        :style="{ top: cell.top, left: cell.left, width: '50%', height: '50%' }"
        :disabled="!!stamps[cell.key] || ended"
        @click="onStamp(cell.key)"
      >
        <!-- 落下的印章 -->
        <span
          v-if="stamps[cell.key] === 'correct'"
          class="q11-seal q11-seal--correct"
          :style="{ transform: `translate(-50%, -50%) rotate(${cell.rot}deg)` }"
        >不</span>
        <span
          v-if="stamps[cell.key] === 'wrong'"
          class="q11-seal q11-seal--wrong"
          :style="{ transform: `translate(-50%, -50%) rotate(${cell.rot}deg)` }"
        >✓</span>
      </button>

      <!-- 错误时的反向提示 toast -->
      <div v-if="wrongToast" class="q11-toast">
        听天气预报恰恰是 <b>要做的事</b>！
      </div>

      <!-- 胜利横幅 -->
      <div v-if="won" class="q11-banner">
        <div class="q11-banner__title">三 · 不 · 原 · 则</div>
        <div class="q11-banner__sub">守护海边安全</div>
      </div>
    </div>

    <!-- 计数器（剩余几个"不"字要盖）-->
    <div v-if="started && !ended" class="q11-counter">
      <div class="q11-counter__label">还需盖 <b>{{ remainingStamps }}</b> 个"不"</div>
      <div class="q11-counter__dots">
        <span
          v-for="i in 3"
          :key="i"
          class="q11-counter__dot"
          :class="{ 'q11-counter__dot--on': stampedCount >= i }"
        >不</span>
      </div>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q11-countdown">
      <div class="q11-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q11-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="q11-flash"
      :class="`q11-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q11-cover">
      <div class="q11-cover__tip">
        <div class="opera-board q11-cover__title">第 十一 关</div>
        <p class="q11-cover__name">三不原则</p>
        <p class="q11-cover__desc">{{ coverDesc }}</p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const started = ref(false);
const ended = ref(false);
const won = ref(false);
const wrongToast = ref(false);
const flashColor = ref('');

const cfg = computed(() => props.question?.gameConfig || {});
const coverDesc = computed(() => cfg.value.coverDesc || '依次盖出三个红"不"字大印');
const base = import.meta.env.BASE_URL;
const FALLBACK_BG = `${base}images/scenes/wave_reef.png`;

const bgSrc = ref('');
onMounted(() => {
  bgSrc.value = cfg.value.sceneImage
    ? `${base}${cfg.value.sceneImage.replace(/^\//, '')}`
    : FALLBACK_BG;
});

function onBgError() {
  if (bgSrc.value !== FALLBACK_BG) bgSrc.value = FALLBACK_BG;
}

// 田字格 4 个单元的定位 + 印章倾斜角度（戏曲印章手盖天然不正）
const cells = [
  { key: 'A', top: '0%',  left: '0%',  rot: -8 },
  { key: 'B', top: '0%',  left: '50%', rot: 6 },
  { key: 'C', top: '50%', left: '0%',  rot: 4 },
  { key: 'D', top: '50%', left: '50%', rot: -10 },
];

// 印章状态：每个单元独立 'correct' | 'wrong' | null
const stamps = reactive({ A: null, B: null, C: null, D: null });
const correctKeys = computed(() => new Set(props.question?.correct || []));

const stampedCount = computed(() =>
  Object.values(stamps).filter((v) => v === 'correct').length
);
const remainingStamps = computed(() => Math.max(0, 3 - stampedCount.value));

// 倒计时
const totalSeconds = computed(() => cfg.value.countdown ?? 25);
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds.value, () => handleTimeout());

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

function onStamp(key) {
  if (ended.value || stamps[key]) return;
  const isRight = correctKeys.value.has(key);

  if (isRight) {
    stamps[key] = 'correct';
    // 集齐 3 个"不"字 → 胜利
    if (stampedCount.value >= 3) {
      ended.value = true;
      stopCountdown();
      flashColor.value = 'gold';
      setTimeout(() => { won.value = true; }, 350);
      setTimeout(() => emit('correct'), 2400);
    }
  } else {
    // 盖错（D 是干扰项）→ 标记 + 反向提示 → 失败
    stamps[key] = 'wrong';
    ended.value = true;
    stopCountdown();
    flashColor.value = 'red';
    setTimeout(() => { wrongToast.value = true; }, 250);
    setTimeout(() => emit('wrong'), 1900);
  }
}
</script>

<style scoped>
.q11-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #2d1810;
  touch-action: manipulation;
}

.q11-prompt {
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85), 0 0 8px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* === 田字格 === */
.q11-board {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 110px); /* 留出计数器 + 倒计时空间 */
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #f5d76e;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}
.q11-board--won {
  animation: q11-board-cheer 0.8s ease-out;
}
@keyframes q11-board-cheer {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50%      { transform: translateX(-50%) scale(1.03); box-shadow: 0 0 40px rgba(245, 215, 110, 0.85); }
}

.q11-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

/* === 4 个单元的按钮 === */
.q11-cell {
  position: absolute;
  z-index: 3;
  appearance: none;
  background: transparent;
  border: 2px dashed rgba(245, 215, 110, 0);
  padding: 0;
  cursor: pointer;
  font: inherit;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.q11-cell:hover:not(:disabled) {
  background: rgba(245, 215, 110, 0.08);
  border-color: rgba(245, 215, 110, 0.6);
}
.q11-cell:active:not(:disabled) {
  background: rgba(192, 57, 43, 0.18);
}
.q11-cell--stamped {
  cursor: default;
}

/* === 印章（"不"字 / "✓"）=== */
.q11-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 5px solid currentColor;
  font-family: 'STKaiti', serif;
  font-weight: 900;
  font-size: 56px;
  line-height: 1;
  background: rgba(0, 0, 0, 0.25);
  box-shadow: 0 0 28px currentColor, inset 0 0 14px rgba(0, 0, 0, 0.35);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.45);
  pointer-events: none;
  animation: q11-stamp-slam 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}
.q11-seal--correct {
  color: #ff3838;
  /* 朱砂红印 + 略不均匀的边缘叠层 */
  background:
    radial-gradient(circle at 35% 35%, rgba(255, 90, 70, 0.55), transparent 60%),
    rgba(180, 20, 20, 0.85);
  box-shadow:
    0 0 30px rgba(255, 60, 60, 0.85),
    inset 0 0 18px rgba(120, 0, 0, 0.55);
  color: #fff5e0;
  border-color: #c41818;
}
.q11-seal--wrong {
  color: #f5d76e;
  background:
    radial-gradient(circle at 35% 35%, rgba(255, 230, 130, 0.6), transparent 60%),
    rgba(180, 130, 20, 0.85);
  border-color: #f5d76e;
  box-shadow:
    0 0 30px rgba(245, 215, 110, 0.85),
    inset 0 0 18px rgba(120, 80, 0, 0.55);
  color: #2d1810;
}
@keyframes q11-stamp-slam {
  0%   { opacity: 0; scale: 2.4; }
  55%  { opacity: 1; scale: 0.88; }
  100% { opacity: 1; scale: 1; }
}

/* === 反向提示 toast === */
.q11-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 8;
  background: rgba(45, 24, 16, 0.95);
  border: 2px solid #f5d76e;
  border-radius: 12px;
  padding: 14px 22px;
  color: #f5e6d3;
  font-family: 'STKaiti', serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: 1px;
  text-align: center;
  max-width: 80%;
  box-shadow: 0 0 26px rgba(245, 215, 110, 0.5);
  animation: q11-toast-in 0.4s ease-out;
}
.q11-toast b {
  color: #f5d76e;
  text-decoration: underline;
  font-weight: bold;
}
@keyframes q11-toast-in {
  from { opacity: 0; transform: translate(-50%, -40%); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

/* === 胜利横幅 === */
.q11-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  background: linear-gradient(180deg, #c0392b, #8b1a1a);
  border: 3px solid #f5d76e;
  border-radius: 14px;
  padding: 18px 28px;
  text-align: center;
  font-family: 'STKaiti', serif;
  color: #f5d76e;
  letter-spacing: 4px;
  box-shadow:
    0 0 40px rgba(245, 215, 110, 0.7),
    0 12px 30px rgba(0, 0, 0, 0.5);
  animation: q11-banner-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q11-banner__title {
  font-size: 26px;
  font-weight: 900;
  text-shadow: 3px 3px 0 #5a0a0a;
  margin-bottom: 6px;
}
.q11-banner__sub {
  font-size: 14px;
  color: #f5e6d3;
  letter-spacing: 6px;
}
@keyframes q11-banner-in {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* === 底部计数器 === */
.q11-counter {
  position: absolute;
  bottom: 32px;
  left: 12px;
  right: 12px;
  z-index: 5;
  background: rgba(45, 24, 16, 0.85);
  border: 1.5px solid rgba(245, 215, 110, 0.55);
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.q11-counter__label {
  font-family: 'STKaiti', serif;
  font-size: 13px;
  color: #f5e6d3;
  letter-spacing: 1px;
}
.q11-counter__label b {
  color: #f5d76e;
  font-size: 16px;
  margin: 0 2px;
}
.q11-counter__dots {
  display: flex;
  gap: 6px;
}
.q11-counter__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px dashed rgba(245, 215, 110, 0.5);
  color: rgba(245, 215, 110, 0.35);
  font-family: 'STKaiti', serif;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}
.q11-counter__dot--on {
  border-style: solid;
  border-color: #c41818;
  background: radial-gradient(circle at 35% 35%, rgba(255, 90, 70, 0.55), transparent 60%), rgba(180, 20, 20, 0.85);
  color: #fff5e0;
  box-shadow: 0 0 14px rgba(255, 60, 60, 0.7);
  animation: q11-dot-fill 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes q11-dot-fill {
  from { transform: scale(1.6); opacity: 0.4; }
  to   { transform: scale(1);   opacity: 1; }
}

/* === 倒计时 === */
.q11-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.q11-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q11-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* === 全屏闪光 === */
.q11-flash {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  animation: q11-flash 0.6s ease-out forwards;
}
.q11-flash--gold { background: radial-gradient(circle, rgba(245, 215, 110, 0.55), transparent 70%); }
.q11-flash--red  { background: radial-gradient(circle, rgba(192, 57, 43, 0.5), transparent 70%); }
@keyframes q11-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* === 开始遮罩 === */
.q11-cover {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(45, 24, 16, 0.55), rgba(45, 24, 16, 0.95));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px;
}
.q11-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q11-cover__title { margin-bottom: 16px; }
.q11-cover__name {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 18px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q11-cover__desc {
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
  max-width: 280px;
}
</style>
