<template>
  <div ref="stageRef" class="ih-stage">
    <!-- 题目说明 -->
    <h2 v-if="started" class="ih-prompt">{{ question?.title }}</h2>

    <!-- 场景图 + 图标 -->
    <div v-if="started" class="ih-scenewrap">
      <img
        class="ih-scene"
        :src="resolvedScene"
        :alt="question?.title"
        @error="onSceneError"
      />

      <button
        v-for="icon in icons"
        :key="icon.key"
        type="button"
        class="ih-icon"
        :class="{
          'ih-icon--selected': chosen === icon.key,
          'ih-icon--correct': showCorrect(icon.key),
          'ih-icon--wrong': showWrong(icon.key),
          'ih-icon--dim': chosen && chosen !== icon.key && icon.key !== question?.correct,
        }"
        :style="{
          top: icon.top,
          left: icon.left,
          width: icon.size || '64px',
          height: icon.size || '64px',
        }"
        :disabled="!!chosen || ended"
        @click="onIconClick(icon.key)"
      >
        <img class="ih-icon__img" :src="resolvedIconSrc(icon.src)" :alt="optionTextByKey[icon.key]" />
        <span class="ih-icon__label">{{ optionTextByKey[icon.key] }}</span>
      </button>
    </div>

    <!-- 倒计时 -->
    <div v-if="started && !ended" class="ih-countdown">
      <div class="ih-countdown__bar" :style="{ width: percent + '%' }"></div>
      <div class="ih-countdown__text">{{ remaining }}秒</div>
    </div>

    <!-- 全屏闪光 -->
    <div
      v-if="flashColor"
      class="ih-flash"
      :class="`ih-flash--${flashColor}`"
    ></div>

    <!-- 开始遮罩 -->
    <div v-if="!started" class="ih-cover">
      <div class="ih-cover__tip">
        <div class="opera-board ih-cover__title">{{ chapterLabel }}</div>
        <p class="ih-cover__name">{{ question?.title }}</p>
        <p class="ih-cover__desc">{{ coverDesc }}</p>
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
const flashColor = ref('');

const cfg = computed(() => props.question?.gameConfig || {});
const coverDesc = computed(() => cfg.value.coverDesc || '点击图中的图标做出选择');

const chapterLabel = computed(() => {
  const id = props.question?.id || '';
  const n = id.replace(/[^0-9]/g, '');
  return n ? `第 ${n} 关` : '挑战题';
});

const base = import.meta.env.BASE_URL;
const FALLBACK_SCENE = `${base}images/scenes/wave_reef.png`;
const resolvedScene = ref(FALLBACK_SCENE);

onMounted(() => {
  const path = cfg.value.scene || '';
  resolvedScene.value = path ? `${base}${path.replace(/^\//, '')}` : FALLBACK_SCENE;
});

function onSceneError() {
  if (resolvedScene.value !== FALLBACK_SCENE) resolvedScene.value = FALLBACK_SCENE;
}

function resolvedIconSrc(src) {
  if (!src) return '';
  return src.startsWith('http') || src.startsWith('data:')
    ? src
    : `${base}${src.replace(/^\//, '')}`;
}

const icons = computed(() => Array.isArray(cfg.value.icons) ? cfg.value.icons : []);
const optionTextByKey = computed(() => {
  const map = {};
  (props.question?.options || []).forEach((o) => { map[o.key] = o.text; });
  return map;
});

const totalSeconds = cfg.value.countdown ?? 12;
const { remaining, percent, start: startCountdown, stop: stopCountdown } =
  useCountdown(totalSeconds, () => handleTimeout());

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

function onIconClick(key) {
  if (chosen.value || ended.value) return;
  chosen.value = key;
  stopCountdown();
  const isCorrect = key === props.question?.correct;
  flashColor.value = isCorrect ? 'gold' : 'red';
  setTimeout(() => {
    ended.value = true;
    setTimeout(() => emit(isCorrect ? 'correct' : 'wrong'), 200);
  }, 900);
}

function showCorrect(key) {
  if (!chosen.value) return false;
  if (key === chosen.value && key === props.question?.correct) return true;
  if (chosen.value !== props.question?.correct && key === props.question?.correct && ended.value) return true;
  return false;
}
function showWrong(key) {
  return !!chosen.value && key === chosen.value && key !== props.question?.correct;
}
</script>

<style scoped>
.ih-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #2d1810;
  touch-action: manipulation;
}

.ih-prompt {
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
  text-shadow: 0 2px 4px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.6);
  pointer-events: none;
}

/* 场景 + 图标共用同一坐标系（强制 1:1 正方形）
   横向铺满 96%，纵向自动撑到 stage 可用高度（不超过 100% - 78px） */
.ih-scenewrap {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  aspect-ratio: 1 / 1;
  max-height: calc(100% - 78px);
  /* 大屏：受 max-height 限制后宽度也按 1:1 同步缩小，会留出横向边距 */
  z-index: 1;
}

.ih-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  display: block;
  border-radius: 8px;
}

/* 图标按钮：透明背景按钮包裹图标 PNG */
.ih-icon {
  position: absolute;
  z-index: 3;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  appearance: none;
  transform: translate(-50%, -50%);
  transition: transform 0.18s, filter 0.2s;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.55));
}
.ih-icon:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.08);
}
.ih-icon:active:not(:disabled) {
  transform: translate(-50%, -50%) scale(0.95);
}
.ih-icon--selected {
  z-index: 5;
}
.ih-icon--correct {
  animation: ih-pop 0.55s ease-out;
  filter: drop-shadow(0 0 14px rgba(46,204,113,0.95)) drop-shadow(0 4px 8px rgba(0,0,0,0.55));
}
.ih-icon--wrong {
  animation: ih-shake 0.5s;
  filter: drop-shadow(0 0 14px rgba(192,57,43,0.95)) drop-shadow(0 4px 8px rgba(0,0,0,0.55));
}
.ih-icon--dim {
  opacity: 0.35;
  filter: grayscale(0.5) drop-shadow(0 4px 8px rgba(0,0,0,0.4));
}

.ih-icon__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  -webkit-user-drag: none;
  user-select: none;
}

/* 选项文字标签——常显在图标下方（不挡住上方角色） */
.ih-icon__label {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(139, 26, 26, 0.92);
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 3px 8px;
  border: 1.5px solid #f5d76e;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  z-index: 4;
}

@keyframes ih-pop {
  0%   { transform: translate(-50%, -50%) scale(1); }
  35%  { transform: translate(-50%, -50%) scale(1.18); }
  100% { transform: translate(-50%, -50%) scale(1.05); }
}
@keyframes ih-shake {
  0%, 100% { transform: translate(-50%, -50%); }
  20%      { transform: translate(calc(-50% - 6px), -50%); }
  60%      { transform: translate(calc(-50% + 6px), -50%); }
  80%      { transform: translate(calc(-50% - 3px), -50%); }
}

/* 倒计时 */
.ih-countdown {
  position: absolute;
  bottom: 6px;
  left: 16px;
  right: 16px;
  z-index: 4;
}
.ih-countdown__bar {
  height: 6px;
  background: linear-gradient(90deg, #f5d76e, #c0392b);
  border-radius: 3px;
  border: 1.5px solid #8b1a1a;
  transition: width 0.1s linear;
}
.ih-countdown__text {
  text-align: center;
  color: #f5d76e;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'STKaiti', serif;
}

/* 全屏闪光 */
.ih-flash {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  animation: ih-flash 0.55s ease-out forwards;
}
.ih-flash--gold { background: radial-gradient(circle at center, rgba(245,215,110,0.5), transparent 70%); }
.ih-flash--red  { background: radial-gradient(circle at center, rgba(192,57,43,0.45), transparent 70%); }
@keyframes ih-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 开始遮罩 */
.ih-cover {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(180deg, rgba(45,24,16,0.55), rgba(45,24,16,0.92));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 20px;
}
.ih-cover__tip {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
}
.ih-cover__title { margin-bottom: 16px; }
.ih-cover__name {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 0 0 16px;
  text-shadow: 2px 2px 0 #8b1a1a;
  line-height: 1.5;
}
.ih-cover__desc {
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
  color: #f5e6d3;
  margin: 0;
}
</style>
