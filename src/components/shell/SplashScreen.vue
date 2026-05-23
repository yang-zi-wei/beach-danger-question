<template>
  <transition name="splash-fade">
    <div
      v-if="visible"
      class="splash"
      @click="onTap"
      @touchstart.passive="onTap"
    >
      <!-- 水彩海景底图 + 缓慢 Ken Burns 推近 -->
      <div
        class="splash-bg"
        :style="{ backgroundImage: `url(${bgUrl})` }"
      ></div>
      <!-- 暖色 + 暗角叠层，让标题更突出 -->
      <div class="splash-bg-tint"></div>
      <div class="splash-bg-vignette"></div>

      <!-- 顶部垂挂灯笼 -->
      <div class="splash-lantern splash-lantern--left">
        <div class="splash-lantern-string"></div>
        <div class="splash-lantern-body">
          <div class="splash-lantern-glow"></div>
          <div class="splash-lantern-char">福</div>
        </div>
        <div class="splash-lantern-tassel"></div>
      </div>
      <div class="splash-lantern splash-lantern--right">
        <div class="splash-lantern-string"></div>
        <div class="splash-lantern-body">
          <div class="splash-lantern-glow"></div>
          <div class="splash-lantern-char">安</div>
        </div>
        <div class="splash-lantern-tassel"></div>
      </div>

      <!-- 飘动金色光点 -->
      <div class="splash-sparkles">
        <span v-for="i in 14" :key="i" :style="sparkleStyle(i)"></span>
      </div>

      <!-- 中央水牌 -->
      <div class="splash-content">
        <div class="splash-board-wrap">
          <span class="splash-corner splash-corner--tl">❖</span>
          <span class="splash-corner splash-corner--tr">❖</span>
          <span class="splash-corner splash-corner--bl">❖</span>
          <span class="splash-corner splash-corner--br">❖</span>

          <div class="splash-board">
            <div class="splash-board-shimmer"></div>

            <div class="splash-title">
              <span class="splash-title-ch" style="--d:0ms">安</span>
              <span class="splash-title-ch" style="--d:120ms">全</span>
              <span class="splash-title-ch" style="--d:240ms">小</span>
              <span class="splash-title-ch" style="--d:360ms">卫</span>
            </div>

            <div class="splash-divider">
              <span class="splash-divider-line"></span>
              <span class="splash-divider-icon">⚓</span>
              <span class="splash-divider-line"></span>
            </div>

            <div class="splash-subtitle">闯 海 岛</div>
            <div class="splash-tag">「泳」不冒险 · 防「溺」未然</div>
          </div>
        </div>

        <div class="splash-cta">
          <div class="splash-cta-hand">👆</div>
          <div class="splash-cta-text">点 击 屏 幕 启 动</div>
        </div>
      </div>

      <!-- 底部多层 SVG 海浪 -->
      <svg
        class="splash-waves"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f5d76e" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#d4a017" stop-opacity="0.85" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3a6b9c" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#1c3a5a" stop-opacity="0.9" />
          </linearGradient>
        </defs>
        <path
          class="wave wave-back"
          d="M0,120 C240,160 480,80 720,120 C960,160 1200,80 1440,120 L1440,200 L0,200 Z"
          fill="url(#waveGrad1)"
        />
        <path
          class="wave wave-front"
          d="M0,150 C240,120 480,180 720,150 C960,120 1200,180 1440,150 L1440,200 L0,200 Z"
          fill="url(#waveGrad2)"
        />
      </svg>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { assetUrl } from '@/utils/assetUrl';

const visible = ref(true);
const emit = defineEmits(['dismiss']);

const bgUrl = computed(() => assetUrl('images/scenes/wave_reef.png'));

let tapped = false;
function onTap() {
  if (tapped) return;
  tapped = true;
  emit('dismiss');
  setTimeout(() => { visible.value = false; }, 450);
}

// 散布的金色光点位置/延时
function sparkleStyle(i) {
  // 用伪随机算法（基于 i），保证每次渲染稳定
  const left = ((i * 73) % 100);
  const top = ((i * 41 + 13) % 80) + 10;
  const delay = ((i * 0.37) % 4).toFixed(2);
  const dur = (3 + (i % 4)).toFixed(1);
  const size = 3 + (i % 3);
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${dur}s`,
  };
}
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  background: #1a0a06;
}

/* ===== 背景层 ===== */
.splash-bg {
  position: absolute;
  inset: -4%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  animation: bg-kenburns 14s ease-in-out infinite alternate;
}
@keyframes bg-kenburns {
  0%   { transform: scale(1.04) translate(0, 0); }
  100% { transform: scale(1.14) translate(-1%, -2%); }
}

.splash-bg-tint {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%,
      rgba(80, 30, 10, 0.15) 0%,
      rgba(40, 15, 8, 0.55) 60%,
      rgba(20, 5, 3, 0.85) 100%);
}
.splash-bg-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 180px 30px rgba(0, 0, 0, 0.75);
}

/* ===== 灯笼 ===== */
.splash-lantern {
  position: absolute;
  top: 0;
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: top center;
  animation: lantern-sway 4.5s ease-in-out infinite;
}
.splash-lantern--left  { left: 8%;  animation-delay: -1.2s; }
.splash-lantern--right { right: 8%; animation-delay: -2.6s; }
.splash-lantern-string {
  width: 2px;
  height: 36px;
  background: #f5d76e;
  box-shadow: 0 0 4px rgba(245, 215, 110, 0.6);
}
.splash-lantern-body {
  position: relative;
  width: 56px;
  height: 64px;
  border-radius: 50% / 60%;
  background:
    radial-gradient(circle at 50% 35%, #ff9b8a 0%, #d24d4d 45%, #8b1a1a 100%);
  border: 2px solid #5a0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 -8px 12px rgba(0, 0, 0, 0.4),
    0 0 24px rgba(255, 110, 80, 0.55),
    0 0 8px rgba(245, 215, 110, 0.4);
}
.splash-lantern-glow {
  position: absolute;
  inset: 0;
  border-radius: 50% / 60%;
  background: radial-gradient(circle at 50% 40%, rgba(255, 235, 180, 0.55) 0%, transparent 60%);
  animation: lantern-flicker 2.2s ease-in-out infinite;
}
.splash-lantern-char {
  position: relative;
  font-family: 'STKaiti', 'KaiTi', serif;
  font-size: 24px;
  color: #f5d76e;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
}
.splash-lantern-tassel {
  width: 8px;
  height: 18px;
  background:
    linear-gradient(180deg, #f5d76e 0%, #d4a017 50%, transparent 50%),
    repeating-linear-gradient(180deg, transparent 0 2px, #d4a017 2px 4px);
  background-size: 100% 50%, 100% 100%;
  background-repeat: no-repeat;
  margin-top: 2px;
  border-radius: 2px;
}
@keyframes lantern-sway {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
@keyframes lantern-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.78; }
}

/* ===== 金色光点 ===== */
.splash-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.splash-sparkles span {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, #fff4c2 0%, #f5d76e 40%, transparent 70%);
  box-shadow: 0 0 8px rgba(245, 215, 110, 0.8);
  animation: sparkle-float linear infinite;
  opacity: 0;
}
@keyframes sparkle-float {
  0%   { transform: translateY(20px); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(-80px); opacity: 0; }
}

/* ===== 中央内容 ===== */
.splash-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
  padding: 80px 24px;
}

.splash-board-wrap {
  position: relative;
  padding: 12px;
}
.splash-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #f5d76e;
  text-shadow: 0 0 6px rgba(245, 215, 110, 0.7);
  animation: corner-twinkle 3s ease-in-out infinite;
}
.splash-corner--tl { top: -4px; left: -4px; }
.splash-corner--tr { top: -4px; right: -4px; animation-delay: -0.75s; }
.splash-corner--bl { bottom: -4px; left: -4px; animation-delay: -1.5s; }
.splash-corner--br { bottom: -4px; right: -4px; animation-delay: -2.25s; }
@keyframes corner-twinkle {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50%      { transform: scale(1.2); opacity: 1; }
}

.splash-board {
  position: relative;
  padding: 28px 36px 24px;
  background:
    linear-gradient(180deg, #fdf3d8 0%, #f5d76e 55%, #d4a017 100%);
  border: 3px solid #8b1a1a;
  border-radius: 10px;
  box-shadow:
    inset 0 0 0 2px #f5d76e,
    inset 0 0 24px rgba(212, 160, 23, 0.5),
    0 14px 40px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(245, 215, 110, 0.25);
  text-align: center;
  overflow: hidden;
  animation: board-drop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
/* 鎏金 shimmer 扫过 */
.splash-board-shimmer {
  position: absolute;
  top: 0;
  left: -60%;
  width: 60%;
  height: 100%;
  background: linear-gradient(110deg,
    transparent 0%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 100%);
  animation: board-shimmer 3.2s ease-in-out 800ms infinite;
}
@keyframes board-drop {
  0%   { transform: translateY(-30px) scale(0.85); opacity: 0; }
  60%  { transform: translateY(0) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes board-shimmer {
  0%   { left: -60%; }
  60%  { left: 110%; }
  100% { left: 110%; }
}

.splash-title {
  font-family: 'STKaiti', 'KaiTi', '楷体', serif;
  font-size: 46px;
  font-weight: bold;
  color: #8b1a1a;
  letter-spacing: 8px;
  margin-left: 8px;
  display: flex;
  justify-content: center;
  text-shadow:
    1px 1px 0 #fff4c2,
    2px 2px 0 rgba(139, 26, 26, 0.25);
}
.splash-title-ch {
  display: inline-block;
  animation: title-drop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--d);
}
@keyframes title-drop {
  0%   { transform: translateY(-24px) rotate(-12deg) scale(0.7); opacity: 0; }
  70%  { transform: translateY(2px) rotate(2deg) scale(1.08); opacity: 1; }
  100% { transform: translateY(0) rotate(0) scale(1); opacity: 1; }
}

.splash-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 10px;
  animation: fade-up 500ms 600ms both;
}
.splash-divider-line {
  display: block;
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #8b1a1a 50%, transparent);
}
.splash-divider-icon {
  font-size: 18px;
  color: #8b1a1a;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4));
}

.splash-subtitle {
  font-family: 'STKaiti', serif;
  font-size: 26px;
  color: #3a6b9c;
  letter-spacing: 14px;
  margin-left: 14px;
  margin-bottom: 10px;
  animation: fade-up 500ms 700ms both;
}
.splash-tag {
  font-size: 13px;
  color: #5a2a0e;
  letter-spacing: 2px;
  animation: fade-up 500ms 800ms both;
}
@keyframes fade-up {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

/* ===== 点击提示 ===== */
.splash-cta {
  text-align: center;
  color: #fff4c2;
  font-family: 'STKaiti', serif;
  animation: cta-float 1.6s ease-in-out 1.2s infinite;
}
.splash-cta-hand {
  font-size: 38px;
  line-height: 1;
  margin-bottom: 6px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55));
}
.splash-cta-text {
  font-size: 17px;
  letter-spacing: 6px;
  text-shadow:
    0 0 8px rgba(245, 215, 110, 0.7),
    0 2px 6px rgba(0, 0, 0, 0.7);
}
@keyframes cta-float {
  0%, 100% { transform: translateY(0);   opacity: 0.9; }
  50%      { transform: translateY(-6px); opacity: 1; }
}

/* ===== 底部海浪 ===== */
.splash-waves {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 18vh;
  min-height: 120px;
  pointer-events: none;
}
.wave {
  transform-origin: center bottom;
}
.wave-back {
  animation: wave-slide-back 12s linear infinite;
}
.wave-front {
  animation: wave-slide-front 8s linear infinite;
}
@keyframes wave-slide-back {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-720px); }
}
@keyframes wave-slide-front {
  0%   { transform: translateX(-720px); }
  100% { transform: translateX(0); }
}

/* ===== 出场淡出 ===== */
.splash-fade-leave-active {
  transition: opacity 0.45s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}

/* 小屏适配 */
@media (max-width: 380px) {
  .splash-title { font-size: 38px; letter-spacing: 6px; }
  .splash-subtitle { font-size: 22px; letter-spacing: 10px; }
  .splash-board { padding: 22px 26px 20px; }
  .splash-lantern { width: 48px; }
  .splash-lantern-body { width: 44px; height: 52px; }
  .splash-lantern-char { font-size: 20px; }
}
</style>
