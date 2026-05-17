<template>
  <div class="intro-video" @click="onTap">
    <video
      ref="videoRef"
      class="intro-video__player"
      :src="resolvedSrc"
      playsinline
      webkit-playsinline
      preload="auto"
      @ended="finish"
      @error="finish"
    />

    <div v-if="title" class="intro-video__title">
      <span class="opera-board">{{ title }}</span>
    </div>

    <button class="intro-video__skip" @click.stop="finish">跳过 ›</button>

    <div v-if="needTap" class="intro-video__tap" @click.stop="onTap">
      <div class="intro-video__tap-inner">
        <div class="intro-video__tap-icon">▶</div>
        <div class="intro-video__tap-text">点击屏幕开始播放</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' },
});
const emit = defineEmits(['done']);

const videoRef = ref(null);
const needTap = ref(false);
let finished = false;

const resolvedSrc = computed(() => {
  const base = import.meta.env.BASE_URL;
  const path = props.src.replace(/^\//, '');
  return `${base}${path}`;
});

async function tryPlay() {
  const v = videoRef.value;
  if (!v) return;
  try {
    v.muted = false;
    await v.play();
    needTap.value = false;
  } catch {
    // iOS / Safari 不允许带声音自动播放，先静音播放再让用户点击解除静音
    try {
      v.muted = true;
      await v.play();
      needTap.value = true;
    } catch {
      // 完全无法播放，直接跳过
      needTap.value = true;
    }
  }
}

function onTap() {
  const v = videoRef.value;
  if (!v) return;
  if (needTap.value) {
    v.muted = false;
    v.play().catch(() => {});
    needTap.value = false;
  }
}

function finish() {
  if (finished) return;
  finished = true;
  emit('done');
}

onMounted(() => {
  tryPlay();
});

onBeforeUnmount(() => {
  const v = videoRef.value;
  if (v) {
    try { v.pause(); } catch {}
  }
});
</script>

<style scoped>
.intro-video {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: introFadeIn 0.35s ease both;
}

@keyframes introFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.intro-video__player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.intro-video__title {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
}

.intro-video__skip {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.55);
  color: #f5d76e;
  border: 1px solid rgba(245, 215, 110, 0.55);
  border-radius: 999px;
  font-family: 'STKaiti', serif;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.intro-video__skip:active {
  background: rgba(0, 0, 0, 0.75);
}

.intro-video__tap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 2;
}
.intro-video__tap-inner {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  animation: tapPulse 1.4s ease-in-out infinite;
}
.intro-video__tap-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 8px;
}
.intro-video__tap-text {
  font-size: 14px;
  letter-spacing: 2px;
}
@keyframes tapPulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.06); opacity: 1; }
}
</style>
