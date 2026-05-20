<template>
  <div ref="stageRef" class="q10-stage">
    <!-- 题目 -->
    <h2 v-if="started" class="q10-prompt">{{ question?.title }}</h2>

    <!-- 朝霞画布 + 时光快进叠层 -->
    <div
      v-if="started"
      class="q10-canvas"
      :class="`q10-canvas--phase-${phase}`"
    >
      <img
        class="q10-dawn"
        :src="dawnSrc"
        alt="朝霞"
        @error="onImgError"
      />

      <!-- 阴云覆盖（phase>=2 渐入）-->
      <div class="q10-clouds"></div>

      <!-- 雨丝（phase>=3 出现）-->
      <div class="q10-rain"></div>

      <!-- 闪电闪光 -->
      <div v-if="lightning" class="q10-lightning"></div>

      <!-- 大浪（phase>=3 涌起）-->
      <div class="q10-wave"></div>

      <!-- 时间快进指示器（顶部小条幅）-->
      <div v-if="phase > 0 && phase < 4" class="q10-clock">
        <span class="q10-clock__icon">⏩</span>
        <span class="q10-clock__text">{{ clockText }}</span>
      </div>

      <!-- 结果印章 -->
      <div v-if="phase === 4" class="q10-stamp" :class="stampClass">
        {{ stampText }}
      </div>

      <!-- 错误时哪吒一脸懵 -->
      <img
        v-if="phase === 4 && !isCorrect"
        class="q10-confused"
        :src="assetUrl('images/characters/nezha_idle.png')"
        alt="哪吒"
      />
    </div>

    <!-- 选项面板（选完即收起）-->
    <div v-if="started && !chosen" class="q10-options">
      <p class="q10-options__hint">你觉得爷爷为什么这么说？</p>
      <button
        v-for="opt in question?.options"
        :key="opt.key"
        class="q10-option"
        @click="onChoose(opt.key)"
      >
        <span class="q10-option__key">{{ opt.key }}</span>
        <span class="q10-option__text">{{ opt.text }}</span>
      </button>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !chosen" class="q10-countdown">
      <div class="q10-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q10-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="q10-flash"
      :class="`q10-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q10-cover">
      <div class="q10-cover__tip">
        <div class="opera-board q10-cover__title">第 十 关</div>
        <p class="q10-cover__name">朝霞预言</p>
        <p class="q10-cover__desc">{{ coverDesc }}</p>
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
const chosen = ref(null);
const phase = ref(0); // 0 idle | 1 早晨变暗 | 2 阴云聚集 | 3 暴雨闪电 | 4 揭晓
const lightning = ref(false);
const flashColor = ref('');

const cfg = computed(() => props.question?.gameConfig || {});
const coverDesc = computed(() => cfg.value.coverDesc || '看朝霞猜后果');
const FALLBACK_IMG = assetUrl('images/scenes/wave_reef.png');

const dawnSrc = ref('');
onMounted(() => {
  dawnSrc.value = cfg.value.dawnImage ? assetUrl(cfg.value.dawnImage) : FALLBACK_IMG;
});

function onImgError() {
  if (dawnSrc.value !== FALLBACK_IMG) dawnSrc.value = FALLBACK_IMG;
}

// === 倒计时 ===
const totalSeconds = computed(() => cfg.value.countdown ?? 18);
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds.value, () => handleTimeout());

function startGame() {
  started.value = true;
  startCountdown();
}

function handleTimeout() {
  if (chosen.value) return;
  chosen.value = '__timeout';
  flashColor.value = 'red';
  setTimeout(() => emit('wrong'), 600);
}

// === 选择 → 时光快进 ===
const isCorrect = computed(() => chosen.value === props.question?.correct);
const stampText = computed(() => (isCorrect.value ? '神  准' : '看走眼'));
const stampClass = computed(() => (isCorrect.value ? 'q10-stamp--correct' : 'q10-stamp--wrong'));
const clockText = computed(() => {
  if (phase.value === 1) return '上午 9 点…';
  if (phase.value === 2) return '中午 12 点…';
  if (phase.value === 3) return '下午 3 点…';
  return '';
});

const timers = [];
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function onChoose(key) {
  if (chosen.value) return;
  chosen.value = key;
  stopCountdown();

  // 不论答什么，都让玩家看到「天气真的变了」的过程
  later(() => { phase.value = 1; }, 50);                 // 0.05s 早晨变暗
  later(() => { phase.value = 2; }, 900);                // 0.9s 阴云聚集
  later(() => { phase.value = 3; }, 1900);               // 1.9s 暴雨开始
  later(() => { lightning.value = true; }, 2200);        // 闪电 1
  later(() => { lightning.value = false; }, 2350);
  later(() => { lightning.value = true; }, 2700);        // 闪电 2
  later(() => { lightning.value = false; }, 2850);
  later(() => {                                           // 揭晓
    phase.value = 4;
    flashColor.value = isCorrect.value ? 'gold' : 'red';
  }, 3300);
  later(() => {
    emit(isCorrect.value ? 'correct' : 'wrong');
  }, 4500);
}

onUnmounted(() => {
  timers.forEach(clearTimeout);
});
</script>

<style scoped>
.q10-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1a1f3a;
  touch-action: manipulation;
}

.q10-prompt {
  position: absolute;
  top: 6px;
  left: 12px;
  right: 12px;
  z-index: 6;
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

/* === 朝霞画布 + 时光快进的所有图层 === */
.q10-canvas {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 60px);
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.q10-dawn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
  transition: filter 0.85s ease-in-out;
}

/* 阶段化的滤镜：朝霞 → 微暗红 → 灰云笼罩 → 阴沉风暴 */
.q10-canvas--phase-1 .q10-dawn { filter: brightness(0.92) saturate(1.1) contrast(1.05); }
.q10-canvas--phase-2 .q10-dawn { filter: brightness(0.65) saturate(0.75) hue-rotate(-25deg); }
.q10-canvas--phase-3 .q10-dawn,
.q10-canvas--phase-4 .q10-dawn {
  filter: brightness(0.42) saturate(0.45) hue-rotate(-55deg) contrast(0.95);
}

/* === 阴云覆盖层 === */
.q10-clouds {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(35, 38, 55, 0.0) 0%,
    rgba(35, 38, 55, 0.0) 100%);
  opacity: 0;
  transition: opacity 0.8s ease-in-out, background 0.8s;
  pointer-events: none;
  z-index: 2;
}
.q10-canvas--phase-2 .q10-clouds {
  opacity: 0.7;
  background: linear-gradient(180deg,
    rgba(50, 55, 75, 0.85) 0%,
    rgba(70, 75, 95, 0.5) 55%,
    rgba(80, 80, 95, 0.15) 100%);
}
.q10-canvas--phase-3 .q10-clouds,
.q10-canvas--phase-4 .q10-clouds {
  opacity: 1;
  background: linear-gradient(180deg,
    rgba(15, 18, 30, 0.92) 0%,
    rgba(35, 38, 55, 0.78) 50%,
    rgba(60, 65, 80, 0.45) 100%);
}

/* === 雨丝层 === */
.q10-rain {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    100deg,
    transparent 0%,
    transparent 48%,
    rgba(200, 215, 245, 0.55) 50%,
    transparent 52%,
    transparent 100%
  );
  background-size: 6px 22px;
  background-repeat: repeat;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  z-index: 3;
  mix-blend-mode: screen;
}
.q10-canvas--phase-3 .q10-rain,
.q10-canvas--phase-4 .q10-rain {
  opacity: 0.85;
  animation: q10-rain-fall 0.45s linear infinite;
}
@keyframes q10-rain-fall {
  from { background-position: 0 0; }
  to   { background-position: -6px 22px; }
}

/* === 闪电闪光 === */
.q10-lightning {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 60% 20%, rgba(255, 255, 240, 0.95), transparent 55%),
    rgba(245, 245, 255, 0.55);
  z-index: 4;
  pointer-events: none;
  animation: q10-lightning-flash 0.18s ease-out;
}
@keyframes q10-lightning-flash {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  60%  { opacity: 0.4; }
  100% { opacity: 0; }
}

/* === 翻涌大浪（底部）=== */
.q10-wave {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -20%;
  height: 38%;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(40, 60, 95, 0.95), transparent 65%),
    radial-gradient(ellipse at 75% 60%, rgba(20, 35, 65, 0.95), transparent 70%),
    linear-gradient(180deg, rgba(15, 25, 50, 0) 0%, rgba(15, 25, 50, 0.95) 60%);
  border-top: 3px solid rgba(220, 230, 245, 0.6);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
  opacity: 0;
  transform: translateY(40%);
  transition: opacity 0.7s, transform 0.7s ease-out;
  pointer-events: none;
  z-index: 3;
}
.q10-canvas--phase-3 .q10-wave,
.q10-canvas--phase-4 .q10-wave {
  opacity: 1;
  transform: translateY(0);
  animation: q10-wave-bob 1.6s ease-in-out infinite;
}
@keyframes q10-wave-bob {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50%      { transform: translateY(-3%) scaleY(1.04); }
}

/* === 时间快进指示器 === */
.q10-clock {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid #f5d76e;
  border-radius: 18px;
  padding: 4px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'STKaiti', serif;
  color: #f5d76e;
  font-size: 13px;
  letter-spacing: 1px;
  pointer-events: none;
  animation: q10-clock-in 0.3s ease-out;
}
.q10-clock__icon {
  font-size: 16px;
  animation: q10-clock-spin 0.8s linear infinite;
}
@keyframes q10-clock-spin {
  from { transform: scale(1); }
  50%  { transform: scale(1.25); }
  to   { transform: scale(1); }
}
@keyframes q10-clock-in {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

/* === 结果印章 === */
.q10-stamp {
  position: absolute;
  top: 38%;
  left: 50%;
  z-index: 7;
  font-family: 'STKaiti', serif;
  font-size: 56px;
  font-weight: 900;
  letter-spacing: 12px;
  padding: 18px 28px 14px;
  border: 6px solid currentColor;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.45);
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
  pointer-events: none;
  transform-origin: center;
  animation: q10-stamp-down 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q10-stamp--correct {
  color: #f5d76e;
  transform: translate(-50%, -50%) rotate(-12deg);
  box-shadow: 0 0 36px rgba(245, 215, 110, 0.6);
}
.q10-stamp--wrong {
  color: #ff6b5b;
  transform: translate(-50%, -50%) rotate(8deg);
  box-shadow: 0 0 36px rgba(255, 107, 91, 0.55);
}
@keyframes q10-stamp-down {
  0%   { opacity: 0; transform-origin: center; scale: 2.4; }
  60%  { opacity: 1; scale: 0.92; }
  100% { opacity: 1; scale: 1; }
}

/* === 错误时哪吒小一脸懵 === */
.q10-confused {
  position: absolute;
  bottom: 6%;
  left: 8%;
  width: 70px;
  height: 80px;
  object-fit: contain;
  z-index: 7;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7));
  animation: q10-confused-in 0.5s ease-out;
}
@keyframes q10-confused-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* === 选项面板 === */
.q10-options {
  position: absolute;
  bottom: 40px;
  left: 12px;
  right: 12px;
  z-index: 8;
  background: rgba(26, 31, 58, 0.85);
  border: 1.5px solid rgba(245, 215, 110, 0.5);
  border-radius: 10px;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(2px);
}
.q10-options__hint {
  margin: 0 0 2px;
  text-align: center;
  font-family: 'STKaiti', serif;
  font-size: 12px;
  color: #f5d76e;
  letter-spacing: 1px;
}
.q10-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(139, 26, 26, 0.78);
  border: 1.5px solid #f5d76e;
  border-radius: 8px;
  color: #f5e6d3;
  font-family: 'STKaiti', serif;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  text-align: left;
  appearance: none;
  transition: transform 0.12s, background 0.18s;
}
.q10-option:hover {
  background: rgba(192, 57, 43, 0.92);
}
.q10-option:active {
  transform: scale(0.97);
}
.q10-option__key {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5d76e;
  color: #8b1a1a;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.q10-option__text {
  flex: 1;
  line-height: 1.35;
}

/* === 倒计时 === */
.q10-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 6;
}
.q10-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q10-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* === 全屏闪光 === */
.q10-flash {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  opacity: 0;
  animation: q10-flash 0.6s ease-out forwards;
}
.q10-flash--gold { background: radial-gradient(circle, rgba(245, 215, 110, 0.55), transparent 70%); }
.q10-flash--red  { background: radial-gradient(circle, rgba(192, 57, 43, 0.5), transparent 70%); }
@keyframes q10-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* === 开始遮罩 === */
.q10-cover {
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
.q10-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q10-cover__title { margin-bottom: 16px; }
.q10-cover__name {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 18px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q10-cover__desc {
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
  max-width: 280px;
}
</style>
