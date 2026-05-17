<template>
  <div ref="stageRef" class="hs-stage">
    <!-- 题目说明（顶部）-->
    <h2 v-if="started" class="hs-prompt">{{ question?.title }}</h2>

    <!-- 三宫格 AI 图 + 热区（同一个 wrap 作为坐标系）-->
    <div v-if="started" class="hs-imagewrap">
      <img
        class="hs-image"
        :src="resolvedImg"
        :alt="question?.title"
        @error="onImgError"
      />

      <!-- 三个热区（默认垂直三等分）-->
      <button
        v-for="spot in hotspotList"
        :key="spot.key"
        type="button"
        class="hs-spot"
        :class="{
          'hs-spot--selected': chosen === spot.key,
          'hs-spot--correct': showCorrect(spot.key),
          'hs-spot--wrong': showWrong(spot.key),
          'hs-spot--dim': chosen && chosen !== spot.key && spot.key !== question?.correct,
        }"
        :style="{
          top: spot.top,
          height: spot.height,
          left: spot.left,
          width: spot.width,
        }"
        :disabled="!!chosen || ended"
        @click="onSpotClick(spot.key)"
      >
        <span v-if="overlayLabels" class="hs-spot__label">
          {{ optionTextByKey[spot.key] }}
        </span>
      </button>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="hs-countdown">
      <div class="hs-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="hs-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏正确/错误闪光 -->
    <div
      v-if="flashColor"
      class="hs-flash"
      :class="`hs-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="hs-cover">
      <div class="hs-cover__tip">
        <div class="opera-board hs-cover__title">{{ chapterLabel }}</div>
        <p class="hs-cover__name">{{ question?.title }}</p>
        <p class="hs-cover__desc">{{ coverDesc }}</p>
      </div>
      <button class="opera-btn" @click="startGame">开 始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCountdown } from '@/composables/useCountdown';

const props = defineProps({ question: Object });
const emit = defineEmits(['correct', 'wrong']);

const stageRef = ref(null);
const started = ref(false);
const ended = ref(false);
const chosen = ref(null);
const flashColor = ref(''); // '' | 'gold' | 'red'

const cfg = computed(() => props.question?.gameConfig || {});
const overlayLabels = computed(() => !!cfg.value.overlayLabels);
const coverDesc = computed(() => cfg.value.coverDesc || '点击图中正确的画面');

// 章节标题——用来做开始页"第 X 关"等装饰；保持与其他游戏一致的样式
const chapterLabel = computed(() => {
  const id = props.question?.id || '';
  const n = id.replace(/[^0-9]/g, '');
  return n ? `第 ${n} 关` : '挑战题';
});

const resolvedImg = ref('');
const FALLBACK_IMG = `${import.meta.env.BASE_URL}images/scenes/wave_reef.png`;

onMounted(() => {
  const path = cfg.value.image || '';
  resolvedImg.value = path
    ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
    : FALLBACK_IMG;
});

function onImgError() {
  if (resolvedImg.value !== FALLBACK_IMG) {
    resolvedImg.value = FALLBACK_IMG;
  }
}

// === 选项与热区 ===
const optionTextByKey = computed(() => {
  const map = {};
  (props.question?.options || []).forEach((o) => { map[o.key] = o.text; });
  return map;
});

// 默认竖向三等分：留 2% 内边距避开 AI 图的金色分隔带
const DEFAULT_HOTSPOTS = [
  { key: 'A', top: '2%',  height: '30%', left: '2%', width: '96%' },
  { key: 'B', top: '35%', height: '30%', left: '2%', width: '96%' },
  { key: 'C', top: '68%', height: '30%', left: '2%', width: '96%' },
];

const hotspotList = computed(() => {
  const custom = cfg.value.hotspots;
  if (Array.isArray(custom) && custom.length) {
    return custom.map((h) => ({
      key: h.key,
      top: h.top,
      height: h.height,
      left: h.left ?? '2%',
      width: h.width ?? '96%',
    }));
  }
  return DEFAULT_HOTSPOTS;
});

// === 倒计时 ===
const totalSeconds = computed(() => cfg.value.countdown ?? 15);
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds.value, () => handleTimeout());

function startGame() {
  started.value = true;
  startCountdown();
}

function handleTimeout() {
  if (ended.value || chosen.value) return;
  ended.value = true;
  flashColor.value = 'red';
  setTimeout(() => emit('wrong'), 600);
}

function onSpotClick(key) {
  if (chosen.value || ended.value) return;
  chosen.value = key;
  stopCountdown();
  const isCorrect = key === props.question?.correct;
  flashColor.value = isCorrect ? 'gold' : 'red';
  // 错误时延迟 700ms 高亮正确热区，再延迟收尾让玩家看清教学反馈
  setTimeout(() => {
    ended.value = true;
    setTimeout(() => emit(isCorrect ? 'correct' : 'wrong'), 200);
  }, 900);
}

function showCorrect(key) {
  // 选中且答对 → 立刻绿；或选中错误后，正确热区延迟高亮（用 ended 触发）
  if (!chosen.value) return false;
  if (key === chosen.value && key === props.question?.correct) return true;
  if (chosen.value !== props.question?.correct && key === props.question?.correct && ended.value) {
    return true;
  }
  return false;
}

function showWrong(key) {
  return !!chosen.value && key === chosen.value && key !== props.question?.correct;
}
</script>

<style scoped>
.hs-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #2d1810;
  touch-action: manipulation;
}

.hs-prompt {
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

/* 图片 + 热区共用同一个坐标系（强制 1:1 正方形），
   保证 AI 三宫格画面与热区百分比一一对齐 */
.hs-imagewrap {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 78px); /* 上题目 32px + 下倒计时 ~46px */
  z-index: 1;
}

.hs-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
}

/* 热区：相对 .hs-imagewrap 用百分比定位到三宫格的某个面板 */
.hs-spot {
  position: absolute;
  z-index: 3;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  padding: 0;
  appearance: none;
  font: inherit;
  transition: transform 0.15s, box-shadow 0.2s, border-color 0.2s, background 0.2s;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.hs-spot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(245, 215, 110, 0);
  transition: background 0.2s;
}
.hs-spot:hover:not(:disabled)::before {
  background: rgba(245, 215, 110, 0.12);
}
.hs-spot:active:not(:disabled) {
  transform: scale(0.98);
}

.hs-spot--selected {
  border-color: #f5d76e;
}
.hs-spot--correct {
  border-color: #27ae60;
  box-shadow: 0 0 22px rgba(46, 204, 113, 0.85), inset 0 0 14px rgba(46, 204, 113, 0.45);
  animation: hs-pop 0.45s;
}
.hs-spot--wrong {
  border-color: #c0392b;
  box-shadow: 0 0 22px rgba(192, 57, 43, 0.7), inset 0 0 14px rgba(192, 57, 43, 0.45);
  animation: hs-shake 0.45s;
}
.hs-spot--dim {
  opacity: 0.35;
}

.hs-spot__label {
  display: inline-block;
  margin: 0 8px 8px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.65);
  color: #f5d76e;
  border: 1px solid #f5d76e;
  border-radius: 6px;
  font-family: 'STKaiti', serif;
  font-size: 12px;
  letter-spacing: 1px;
  pointer-events: none;
}

@keyframes hs-pop {
  0%   { transform: scale(0.94); }
  55%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes hs-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  60%      { transform: translateX(6px); }
  80%      { transform: translateX(-3px); }
}

/* === 全屏闪光 === */
.hs-flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  opacity: 0;
  animation: hs-flash 0.55s ease-out forwards;
}
.hs-flash--gold {
  background: radial-gradient(circle at center, rgba(245, 215, 110, 0.5), transparent 70%);
}
.hs-flash--red {
  background: radial-gradient(circle at center, rgba(192, 57, 43, 0.45), transparent 70%);
}
@keyframes hs-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* === 倒计时 === */
.hs-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.hs-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.hs-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* === 开始遮罩 === */
.hs-cover {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(45, 24, 16, 0.55), rgba(45, 24, 16, 0.92));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px;
}
.hs-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.hs-cover__title {
  margin-bottom: 16px;
}
.hs-cover__name {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 0 0 16px;
  text-shadow: 2px 2px 0 #8b1a1a;
  line-height: 1.5;
}
.hs-cover__desc {
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
}
</style>
