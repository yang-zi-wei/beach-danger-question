<template>
  <div ref="stageRef" class="q12-stage">
    <!-- 题目 -->
    <h2 v-if="started" class="q12-prompt">{{ question?.title }}</h2>

    <!-- 码头场景 + 道具 + 飞行物 -->
    <div v-if="started" class="q12-scene">
      <img
        class="q12-bg"
        :src="bgSrc"
        alt="码头救援"
        @error="onBgError"
      />

      <!-- 4 个道具图标（点击触发飞行）-->
      <button
        v-for="it in items"
        :key="it.key"
        type="button"
        class="q12-item"
        :class="{
          'q12-item--used': used[it.key],
          'q12-item--trap': it.key === 'A' && trapTriggered,
        }"
        :style="{ top: it.top, left: it.left, width: it.size, height: it.size }"
        :disabled="used[it.key] || ended"
        @click="onPickItem(it)"
      >
        <img :src="resolveSrc(it.src)" :alt="it.label" class="q12-item__img" />
        <span class="q12-item__label">{{ it.label }}</span>
      </button>

      <!-- 飞行中的道具（从原位置飞到溺水者位置）-->
      <img
        v-for="fly in flying"
        :key="fly.id"
        class="q12-fly"
        :src="resolveSrc(fly.src)"
        :alt="fly.label"
        :style="{
          top: fly.toTop,
          left: fly.toLeft,
          width: fly.size,
          height: fly.size,
          '--from-top': fly.fromTop,
          '--from-left': fly.fromLeft,
        }"
      />

      <!-- 救援标志（每件正确道具到位后冒出小气泡）-->
      <div
        v-for="m in marks"
        :key="m.id"
        class="q12-mark"
        :style="{ top: m.top, left: m.left }"
      >{{ m.text }}</div>

      <!-- A 诱饵：跳水的哪吒剪影 -->
      <div v-if="trapTriggered" class="q12-jump"></div>

      <!-- 失败覆盖：你也成了溺水者 -->
      <div v-if="failBanner" class="q12-fail">
        <div class="q12-fail__icon">⚠</div>
        <div class="q12-fail__title">你也被卷下水！</div>
        <div class="q12-fail__sub">小孩跳下水救不了人，反而会陪伴出事</div>
      </div>

      <!-- 胜利覆盖 -->
      <div v-if="winBanner" class="q12-win">
        <div class="q12-win__title">救 援 成 功</div>
        <div class="q12-win__sub">岸上三步法 · 喊 + 抛 + 叫</div>
      </div>
    </div>

    <!-- 计数器 -->
    <div v-if="started && !ended" class="q12-counter">
      <div class="q12-counter__label">已发出 <b>{{ correctCount }}</b> / 3 次救援</div>
      <div class="q12-counter__dots">
        <span
          v-for="i in 3"
          :key="i"
          class="q12-counter__dot"
          :class="{ 'q12-counter__dot--on': correctCount >= i }"
        >✓</span>
      </div>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="q12-countdown">
      <div class="q12-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="q12-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="q12-flash"
      :class="`q12-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="q12-cover">
      <div class="q12-cover__tip">
        <div class="opera-board q12-cover__title">第 十二 关</div>
        <p class="q12-cover__name">码头救援</p>
        <p class="q12-cover__desc">{{ coverDesc }}</p>
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
const flashColor = ref('');
const trapTriggered = ref(false);
const failBanner = ref(false);
const winBanner = ref(false);

const cfg = computed(() => props.question?.gameConfig || {});
const coverDesc = computed(() => cfg.value.coverDesc || '岸上施救三步法');
const items = computed(() => cfg.value.items || []);
const victim = computed(() => cfg.value.victim || { top: '50%', left: '70%' });

const base = import.meta.env.BASE_URL;
const FALLBACK_BG = `${base}images/scenes/wave_reef.png`;

const bgSrc = ref('');
onMounted(() => {
  bgSrc.value = cfg.value.scene
    ? `${base}${cfg.value.scene.replace(/^\//, '')}`
    : FALLBACK_BG;
});

function resolveSrc(p) {
  if (!p) return '';
  return `${base}${p.replace(/^\//, '')}`;
}
function onBgError() {
  if (bgSrc.value !== FALLBACK_BG) bgSrc.value = FALLBACK_BG;
}

// 道具状态
const used = reactive({ A: false, B: false, C: false, D: false });
const flying = ref([]);   // 飞行中的道具
const marks = ref([]);    // 到位后的小气泡

const correctKeys = computed(() => new Set(props.question?.correct || []));
const correctCount = computed(() =>
  Object.entries(used).filter(([k, v]) => v && correctKeys.value.has(k)).length
);

// 各正确道具到位后的提示文字
const ARRIVAL_TEXT = {
  B: '救生圈到位！',
  C: '长竿伸过去！',
  D: '已联络救援！',
};

const timers = [];
function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

// 倒计时
const totalSeconds = computed(() => cfg.value.countdown ?? 18);
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

let flyId = 0;
function onPickItem(it) {
  if (ended.value || used[it.key]) return;

  // A 是诱饵：跳水 → 失败
  if (it.key === 'A') {
    used[it.key] = true;
    trapTriggered.value = true;
    ended.value = true;
    stopCountdown();
    flashColor.value = 'red';
    later(() => { failBanner.value = true; }, 500);
    later(() => emit('wrong'), 2200);
    return;
  }

  // B/C/D：道具飞向溺水者
  used[it.key] = true;
  const id = ++flyId;
  flying.value.push({
    id,
    src: it.src,
    label: it.label,
    size: it.size,
    fromTop: it.top,
    fromLeft: it.left,
    toTop: victim.value.top,
    toLeft: victim.value.left,
  });

  // 飞行 ~750ms 后落到位置：移除飞行体，弹出 mark 气泡
  later(() => {
    flying.value = flying.value.filter((f) => f.id !== id);
    const mid = id + 1000;
    marks.value.push({
      id: mid,
      top: victim.value.top,
      left: victim.value.left,
      text: ARRIVAL_TEXT[it.key] || '✓',
    });
    later(() => {
      marks.value = marks.value.filter((m) => m.id !== mid);
    }, 1100);

    // 集齐 3 个正确道具 → 胜利
    if (correctCount.value >= 3 && !ended.value) {
      ended.value = true;
      stopCountdown();
      flashColor.value = 'gold';
      later(() => { winBanner.value = true; }, 250);
      later(() => emit('correct'), 2200);
    }
  }, 750);
}

onUnmounted(() => {
  timers.forEach(clearTimeout);
});
</script>

<style scoped>
.q12-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1a1f3a;
  touch-action: manipulation;
}

.q12-prompt {
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

/* === 场景画布 === */
.q12-scene {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 110px);
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #f5d76e;
}
.q12-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

/* === 道具按钮 === */
.q12-item {
  position: absolute;
  appearance: none;
  background: rgba(0, 0, 0, 0.55);
  border: 2px solid #f5d76e;
  border-radius: 12px;
  padding: 4px;
  cursor: pointer;
  z-index: 5;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
}
.q12-item:hover:not(:disabled) {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 0 16px rgba(245, 215, 110, 0.8);
}
.q12-item:active:not(:disabled) { transform: scale(0.95); }
.q12-item__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.q12-item__label {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(45, 24, 16, 0.9);
  color: #f5d76e;
  border: 1px solid #f5d76e;
  border-radius: 4px;
  padding: 1px 6px;
  font-family: 'STKaiti', serif;
  font-size: 11px;
  letter-spacing: 1px;
  pointer-events: none;
}
.q12-item--used { opacity: 0.25; cursor: default; }
.q12-item--trap {
  border-color: #ff3838;
  background: rgba(192, 57, 43, 0.65);
  animation: q12-trap-shake 0.4s ease-out;
}
@keyframes q12-trap-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* === 飞行的道具 === */
.q12-fly {
  position: absolute;
  z-index: 6;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
  transform: translate(-50%, -50%);
  animation: q12-fly-arc 0.75s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  /* 从 from 位置飞到 to 位置：用 transform-origin 不行，
     这里采用 negative translate 动画从 from 起点出发 */
}
@keyframes q12-fly-arc {
  0% {
    /* 起点：从 from 位置开始（相对 to 位置的偏移）-- 用 will-change + transform 不太好做百分比差，
       简单方案：飞行体起初放在 from，然后 transform 到 to。
       这里直接让浏览器从 from -> to 用 left/top 过渡 + 旋转。 */
    left: var(--from-left);
    top:  var(--from-top);
    transform: translate(-50%, -50%) scale(0.85) rotate(0deg);
  }
  60% {
    transform: translate(-50%, -75%) scale(1.05) rotate(180deg);
  }
  100% {
    transform: translate(-50%, -50%) scale(0.9) rotate(360deg);
  }
}

/* === 道具到位提示气泡 === */
.q12-mark {
  position: absolute;
  z-index: 7;
  transform: translate(-50%, -120%);
  background: rgba(46, 204, 113, 0.95);
  color: #fff;
  font-family: 'STKaiti', serif;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 4px 10px;
  border: 1.5px solid #fff;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  animation: q12-mark-rise 1.1s ease-out forwards;
}
@keyframes q12-mark-rise {
  0%   { opacity: 0; transform: translate(-50%, -80%) scale(0.7); }
  20%  { opacity: 1; transform: translate(-50%, -120%) scale(1); }
  80%  { opacity: 1; transform: translate(-50%, -160%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -200%) scale(0.9); }
}

/* === 跳水诱饵动效（抽象的水花柱）=== */
.q12-jump {
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 60%;
  background:
    radial-gradient(ellipse at center bottom, rgba(180, 220, 255, 0.85), transparent 60%),
    linear-gradient(180deg, transparent 0%, rgba(120, 180, 240, 0.6) 100%);
  z-index: 5;
  pointer-events: none;
  animation: q12-splash 0.8s ease-out;
}
@keyframes q12-splash {
  0%   { opacity: 0; transform: scaleY(0.2) translateY(80%); }
  40%  { opacity: 1; transform: scaleY(1.1) translateY(0); }
  100% { opacity: 0.5; transform: scaleY(1) translateY(0); }
}

/* === 失败覆盖 === */
.q12-fail {
  position: absolute;
  inset: 0;
  z-index: 9;
  background: radial-gradient(circle, rgba(192, 57, 43, 0.78), rgba(45, 10, 10, 0.92) 70%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: 'STKaiti', serif;
  color: #fff;
  letter-spacing: 2px;
  padding: 20px;
  animation: q12-fail-in 0.4s ease-out;
}
.q12-fail__icon {
  font-size: 56px;
  color: #ffe79e;
  text-shadow: 0 0 20px rgba(255, 200, 0, 0.8);
  animation: q12-icon-pulse 0.6s ease-in-out infinite alternate;
}
.q12-fail__title {
  font-size: 24px;
  font-weight: bold;
  margin: 8px 0 6px;
  text-shadow: 2px 2px 0 #5a0a0a;
}
.q12-fail__sub {
  font-size: 14px;
  color: #f5e6d3;
  letter-spacing: 1px;
  line-height: 1.5;
  max-width: 80%;
}
@keyframes q12-fail-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes q12-icon-pulse {
  from { transform: scale(1); }
  to   { transform: scale(1.18); }
}

/* === 胜利覆盖 === */
.q12-win {
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
  animation: q12-win-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q12-win__title {
  font-size: 24px;
  font-weight: 900;
  text-shadow: 3px 3px 0 #5a0a0a;
  margin-bottom: 6px;
}
.q12-win__sub {
  font-size: 13px;
  color: #f5e6d3;
  letter-spacing: 4px;
}
@keyframes q12-win-in {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* === 底部计数器 === */
.q12-counter {
  position: absolute;
  bottom: 32px;
  left: 12px;
  right: 12px;
  z-index: 5;
  background: rgba(26, 31, 58, 0.85);
  border: 1.5px solid rgba(245, 215, 110, 0.55);
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.q12-counter__label {
  font-family: 'STKaiti', serif;
  font-size: 13px;
  color: #f5e6d3;
  letter-spacing: 1px;
}
.q12-counter__label b {
  color: #f5d76e;
  font-size: 16px;
  margin: 0 2px;
}
.q12-counter__dots {
  display: flex;
  gap: 6px;
}
.q12-counter__dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px dashed rgba(245, 215, 110, 0.5);
  color: rgba(245, 215, 110, 0.35);
  font-family: 'STKaiti', serif;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}
.q12-counter__dot--on {
  border-style: solid;
  border-color: #2e9b54;
  background: rgba(46, 204, 113, 0.85);
  color: #fff;
  box-shadow: 0 0 12px rgba(46, 204, 113, 0.7);
  animation: q12-dot-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes q12-dot-pop {
  from { transform: scale(1.6); opacity: 0.4; }
  to   { transform: scale(1);   opacity: 1; }
}

/* === 倒计时 === */
.q12-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.q12-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.q12-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* === 全屏闪光 === */
.q12-flash {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  opacity: 0;
  animation: q12-flash 0.6s ease-out forwards;
}
.q12-flash--gold { background: radial-gradient(circle, rgba(245, 215, 110, 0.55), transparent 70%); }
.q12-flash--red  { background: radial-gradient(circle, rgba(192, 57, 43, 0.5), transparent 70%); }
@keyframes q12-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* === 开始遮罩 === */
.q12-cover {
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
.q12-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.q12-cover__title { margin-bottom: 16px; }
.q12-cover__name {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 18px;
  text-shadow: 3px 3px 0 #8b1a1a;
}
.q12-cover__desc {
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
  max-width: 290px;
}
</style>
