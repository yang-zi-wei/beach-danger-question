<template>
  <div ref="stageRef" class="q13-stage">
    <!-- 题目 -->
    <h2 v-if="started" class="q13-prompt">{{ question?.title }}</h2>

    <!-- 勋章舞台 -->
    <div v-if="started" class="q13-medal" :class="{ 'q13-medal--shake': shaking, 'q13-medal--won': won, 'q13-medal--rise': risen }">
      <img
        class="q13-medal__bg"
        :src="medalSrc"
        alt="安全小卫士勋章"
        @error="onMedalError"
      />

      <!-- 3 个空槽 + 嵌入的能力徽章 -->
      <div
        v-for="(slot, idx) in slots"
        :key="idx"
        class="q13-slot"
        :class="{ 'q13-slot--filled': filledSlots[idx] }"
        :style="{ top: slot.top, left: slot.left }"
      >
        <div v-if="!filledSlots[idx]" class="q13-slot__pulse"></div>
        <img
          v-if="filledSlots[idx]"
          class="q13-slot__badge"
          :src="resolveSrc(filledSlots[idx].src)"
          :alt="filledSlots[idx].label"
        />
      </div>

      <!-- 飞行中的徽章 -->
      <img
        v-for="fly in flying"
        :key="fly.id"
        class="q13-fly"
        :src="resolveSrc(fly.src)"
        :alt="fly.label"
        :style="{
          top: fly.toTop,
          left: fly.toLeft,
          '--from-top': fly.fromTop,
          '--from-left': fly.fromLeft,
        }"
      />

      <!-- 裂痕（D 触发）-->
      <div v-if="cracked" class="q13-crack"></div>

      <!-- 失败横幅 -->
      <div v-if="failBanner" class="q13-fail">
        <div class="q13-fail__icon">✕</div>
        <div class="q13-fail__title">失去守护资格</div>
        <div class="q13-fail__sub">把命当流量，绝不是小卫士的样子</div>
      </div>
    </div>

    <!-- 终极头衔（胜利后浮现）-->
    <div v-if="won" class="q13-title">
      <div class="q13-title__line">{{ finalTitle }}</div>
      <div class="q13-title__sub">SEA · GUARDIAN</div>
    </div>

    <!-- 金粒子（胜利时撒出）-->
    <div v-if="won" class="q13-particles" aria-hidden="true">
      <span v-for="i in 16" :key="i" class="q13-particle" :style="particleStyle(i)"></span>
    </div>

    <!-- 底部能力徽章托盘 -->
    <div v-if="started && !ended" class="q13-tray">
      <button
        v-for="b in badges"
        :key="b.key"
        type="button"
        class="q13-badge-card"
        :class="{
          'q13-badge-card--used': used[b.key],
          'q13-badge-card--trap': b.key === 'D' && trapHover,
        }"
        :disabled="used[b.key] || ended"
        @click="onPickBadge(b)"
      >
        <img :src="resolveSrc(b.src)" :alt="b.label" class="q13-badge-card__img" />
        <span class="q13-badge-card__label">{{ b.label }}</span>
      </button>
    </div>

    <!-- 计数器（剩余空槽数）-->
    <div v-if="started && !ended" class="q13-counter">
      <div class="q13-counter__label">还需嵌入 <b>{{ remainingSlots }}</b> 枚徽章</div>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q13-countdown">
      <div class="q13-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q13-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="q13-flash"
      :class="`q13-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q13-cover">
      <div class="q13-cover__tip">
        <div class="opera-board q13-cover__title">第 十三 关 · 终</div>
        <p class="q13-cover__name">小卫士授勋</p>
        <p class="q13-cover__desc">{{ coverDesc }}</p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const started = ref(false);
const ended = ref(false);
const won = ref(false);
const risen = ref(false);
const shaking = ref(false);
const cracked = ref(false);
const trapHover = ref(false);
const failBanner = ref(false);
const flashColor = ref('');

const cfg = computed(() => props.question?.gameConfig || {});
const coverDesc = computed(() => cfg.value.coverDesc || '依次嵌入正确能力徽章');
const slots = computed(() => cfg.value.slots || [
  { top: '35%', left: '50%' },
  { top: '65%', left: '35%' },
  { top: '65%', left: '65%' },
]);
const badges = computed(() => cfg.value.badges || []);
const finalTitle = computed(() => cfg.value.finalTitle || '安全小卫士');

const base = import.meta.env.BASE_URL;
const FALLBACK_BG = `${base}images/scenes/wave_reef.png`;

const medalSrc = ref('');
onMounted(() => {
  medalSrc.value = cfg.value.medalImage
    ? `${base}${cfg.value.medalImage.replace(/^\//, '')}`
    : FALLBACK_BG;
});

function resolveSrc(p) {
  if (!p) return '';
  return `${base}${p.replace(/^\//, '')}`;
}
function onMedalError() {
  if (medalSrc.value !== FALLBACK_BG) medalSrc.value = FALLBACK_BG;
}

// === 状态 ===
const used = reactive({ A: false, B: false, C: false, D: false });
const filledSlots = ref([null, null, null]); // 每个槽放的是 badge 对象
const flying = ref([]);
const correctKeys = computed(() => new Set(props.question?.correct || []));

const remainingSlots = computed(() =>
  filledSlots.value.filter((s) => !s).length
);
const filledCount = computed(() =>
  filledSlots.value.filter((s) => s).length
);

const timers = [];
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

// === 倒计时 ===
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
  later(() => emit('wrong'), 600);
}

// === 选徽章 ===
let flyId = 0;
function onPickBadge(b) {
  if (ended.value || used[b.key]) return;

  // D 是诱饵：勋章震碎
  if (b.key === 'D') {
    used[b.key] = true;
    trapHover.value = true;
    ended.value = true;
    stopCountdown();
    shaking.value = true;
    flashColor.value = 'red';
    later(() => { cracked.value = true; }, 350);
    later(() => { failBanner.value = true; }, 800);
    later(() => emit('wrong'), 2400);
    return;
  }

  // 正确徽章：飞向下一个空槽
  const slotIdx = filledSlots.value.findIndex((s) => !s);
  if (slotIdx < 0) return;
  const slot = slots.value[slotIdx];

  used[b.key] = true;
  // 起飞：从托盘飞向勋章中央槽位
  // 托盘按钮在屏幕底部固定区域，徽章卡的中心位置每个 key 不同。
  // 简化：每个徽章都从屏幕底部居中位置升起到勋章槽位（视觉一致即可）。
  const id = ++flyId;
  flying.value.push({
    id,
    src: b.src,
    label: b.label,
    fromTop: '108%',  // 从勋章下方（托盘高度）出发
    fromLeft: '50%',
    toTop: slot.top,
    toLeft: slot.left,
  });

  // 飞行 ~700ms 后嵌入槽位
  later(() => {
    flying.value = flying.value.filter((f) => f.id !== id);
    filledSlots.value[slotIdx] = b;

    if (filledCount.value >= 3) {
      // 全部嵌入 → 胜利
      ended.value = true;
      stopCountdown();
      flashColor.value = 'gold';
      later(() => { won.value = true; }, 250);
      later(() => { risen.value = true; }, 700);
      later(() => emit('correct'), 2800);
    }
  }, 700);
}

function particleStyle(i) {
  // 围绕勋章中心散开的金色粒子
  const angle = (i / 16) * Math.PI * 2;
  const dist = 120 + (i % 4) * 30;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist;
  return {
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    'animation-delay': `${(i % 8) * 40}ms`,
  };
}

onUnmounted(() => {
  timers.forEach(clearTimeout);
});
</script>

<style scoped>
.q13-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(circle at center, #5a1a1a 0%, #1a0a0a 75%);
  touch-action: manipulation;
}

.q13-prompt {
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

/* === 勋章 === */
.q13-medal {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 88%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 180px);
  z-index: 1;
  transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q13-medal--shake {
  animation: q13-medal-shake 0.5s ease-out;
}
.q13-medal--won {
  filter: drop-shadow(0 0 32px rgba(245, 215, 110, 0.85));
}
.q13-medal--rise {
  transform: translateX(-50%) translateY(-4%) scale(1.05);
}
@keyframes q13-medal-shake {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  20% { transform: translateX(-50%) rotate(-3deg); }
  60% { transform: translateX(-50%) rotate(3deg); }
  80% { transform: translateX(-50%) rotate(-2deg); }
}

.q13-medal__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

/* === 槽位 === */
.q13-slot {
  position: absolute;
  width: 18%;
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.q13-slot__pulse {
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(140, 220, 255, 0.55), transparent 70%);
  animation: q13-slot-pulse 1.6s ease-in-out infinite;
}
@keyframes q13-slot-pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.5; }
  50%      { transform: scale(1.08); opacity: 1; }
}
.q13-slot__badge {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 14px rgba(245, 215, 110, 0.8));
  animation: q13-badge-settle 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes q13-badge-settle {
  0% { opacity: 0; transform: scale(1.6); }
  60% { opacity: 1; transform: scale(0.92); }
  100% { opacity: 1; transform: scale(1); }
}

/* === 飞行中的徽章 === */
.q13-fly {
  position: absolute;
  z-index: 5;
  width: 18%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7));
  transform: translate(-50%, -50%);
  animation: q13-fly-rise 0.7s cubic-bezier(0.42, 0.0, 0.4, 1.0);
}
@keyframes q13-fly-rise {
  0% {
    left: var(--from-left);
    top:  var(--from-top);
    transform: translate(-50%, -50%) scale(0.6) rotate(-180deg);
    opacity: 0.6;
  }
  60% {
    transform: translate(-50%, -55%) scale(1.15) rotate(-30deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* === 裂痕覆盖（D 触发）=== */
.q13-crack {
  position: absolute;
  inset: 5%;
  z-index: 4;
  background:
    linear-gradient(45deg, transparent 48%, rgba(255, 255, 255, 0.85) 49%, rgba(255, 255, 255, 0.85) 51%, transparent 52%),
    linear-gradient(-30deg, transparent 47%, rgba(255, 255, 255, 0.7) 48%, rgba(255, 255, 255, 0.7) 50%, transparent 51%),
    linear-gradient(85deg, transparent 49%, rgba(255, 255, 255, 0.6) 49.5%, rgba(255, 255, 255, 0.6) 50.5%, transparent 51%);
  mix-blend-mode: screen;
  pointer-events: none;
  animation: q13-crack-in 0.5s ease-out forwards;
}
@keyframes q13-crack-in {
  from { opacity: 0; transform: scale(1.2); }
  to   { opacity: 1; transform: scale(1); }
}

/* === 失败横幅 === */
.q13-fail {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  background: rgba(45, 10, 10, 0.95);
  border: 3px solid #c0392b;
  border-radius: 12px;
  padding: 16px 22px;
  text-align: center;
  font-family: 'STKaiti', serif;
  color: #fff;
  letter-spacing: 2px;
  box-shadow: 0 0 30px rgba(192, 57, 43, 0.7);
  animation: q13-fail-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q13-fail__icon {
  font-size: 38px;
  color: #c0392b;
  line-height: 1;
  text-shadow: 0 0 12px rgba(255, 80, 80, 0.8);
}
.q13-fail__title {
  font-size: 22px;
  font-weight: bold;
  margin: 6px 0 4px;
  text-shadow: 2px 2px 0 #5a0a0a;
}
.q13-fail__sub {
  font-size: 13px;
  color: #f5e6d3;
  letter-spacing: 1px;
}
@keyframes q13-fail-in {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* === 终极头衔 === */
.q13-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 30%);
  z-index: 8;
  text-align: center;
  font-family: 'STKaiti', serif;
  pointer-events: none;
  animation: q13-title-in 0.8s 0.3s backwards cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q13-title__line {
  font-size: 22px;
  font-weight: 900;
  color: #f5d76e;
  letter-spacing: 4px;
  text-shadow: 3px 3px 0 #5a0a0a, 0 0 22px rgba(245, 215, 110, 0.8);
  background: rgba(45, 24, 16, 0.85);
  padding: 8px 18px;
  border: 2px solid #f5d76e;
  border-radius: 8px;
  display: inline-block;
}
.q13-title__sub {
  margin-top: 6px;
  font-size: 11px;
  color: #f5e6d3;
  letter-spacing: 6px;
  font-family: serif;
}
@keyframes q13-title-in {
  0% { opacity: 0; transform: translate(-50%, 60%) scale(0.6); }
  100% { opacity: 1; transform: translate(-50%, 30%) scale(1); }
}

/* === 金粒子 === */
.q13-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 7;
  pointer-events: none;
}
.q13-particle {
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff5b8 0%, #f5d76e 50%, transparent 75%);
  box-shadow: 0 0 8px #f5d76e;
  transform: translate(-50%, -50%);
  animation: q13-particle-out 1.4s ease-out forwards;
}
@keyframes q13-particle-out {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  20%  { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.2);
  }
}

/* === 底部托盘 === */
.q13-tray {
  position: absolute;
  bottom: 60px;
  left: 8px;
  right: 8px;
  z-index: 6;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.q13-badge-card {
  position: relative;
  appearance: none;
  background: rgba(45, 24, 16, 0.85);
  border: 2px solid #f5d76e;
  border-radius: 10px;
  padding: 6px 4px 18px;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.3s, background 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.q13-badge-card:hover:not(:disabled) {
  transform: translateY(-3px);
  background: rgba(139, 26, 26, 0.95);
  box-shadow: 0 0 14px rgba(245, 215, 110, 0.7);
}
.q13-badge-card:active:not(:disabled) { transform: scale(0.96); }
.q13-badge-card__img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  pointer-events: none;
}
.q13-badge-card__label {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  font-size: 11px;
  letter-spacing: 1px;
  pointer-events: none;
}
.q13-badge-card--used { opacity: 0.25; cursor: default; }
.q13-badge-card--trap {
  border-color: #ff3838;
  background: rgba(192, 57, 43, 0.85);
  animation: q13-trap-flash 0.45s ease-out;
}
@keyframes q13-trap-flash {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* === 计数器 === */
.q13-counter {
  position: absolute;
  bottom: 32px;
  left: 16px;
  right: 16px;
  z-index: 5;
  text-align: center;
  font-family: 'STKaiti', serif;
  font-size: 12px;
  color: #f5e6d3;
  letter-spacing: 1px;
}
.q13-counter__label b {
  color: #f5d76e;
  font-size: 14px;
  margin: 0 2px;
}

/* === 倒计时 === */
.q13-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.q13-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q13-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* === 全屏闪光 === */
.q13-flash {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  opacity: 0;
  animation: q13-flash 0.6s ease-out forwards;
}
.q13-flash--gold { background: radial-gradient(circle, rgba(245, 215, 110, 0.6), transparent 70%); }
.q13-flash--red  { background: radial-gradient(circle, rgba(192, 57, 43, 0.55), transparent 70%); }
@keyframes q13-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* === 开始遮罩 === */
.q13-cover {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(45, 10, 10, 0.6), rgba(20, 5, 5, 0.95));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px;
}
.q13-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q13-cover__title { margin-bottom: 16px; }
.q13-cover__name {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 18px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q13-cover__desc {
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
  max-width: 290px;
}
</style>
