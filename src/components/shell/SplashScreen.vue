<template>
  <transition name="splash-fade">
    <div v-if="visible" class="splash" @click="onTap" @touchstart.passive="onTap">
      <div class="splash-curtain-top"></div>
      <div class="splash-curtain-bottom"></div>

      <div class="splash-content">
        <div class="splash-board">
          <div class="splash-title">安全小卫</div>
          <div class="splash-subtitle">闯 海 岛</div>
          <div class="splash-tag">— "泳" 不冒险 · 防 "溺" 未然 —</div>
        </div>

        <div class="splash-cta">
          <div class="splash-cta-icon">👆</div>
          <div class="splash-cta-text">点 击 屏 幕 启 动</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(true);
const emit = defineEmits(['dismiss']);

let tapped = false;
function onTap() {
  if (tapped) return;
  tapped = true;
  // 在用户姿态调用栈内同步派发事件，让 App.vue 调用 startBgm()
  emit('dismiss');
  // 给淡出动画一点时间，再卸载
  setTimeout(() => { visible.value = false; }, 350);
}
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at center, #4a0e0e 0%, #1a0606 70%, #000 100%);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 上下幕布 */
.splash-curtain-top,
.splash-curtain-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 36px;
  background:
    repeating-linear-gradient(90deg,
      #8b1a1a 0px, #8b1a1a 28px,
      #5a0e0e 28px, #5a0e0e 56px);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.45);
}
.splash-curtain-top {
  top: 0;
  border-bottom: 3px solid #f5d76e;
}
.splash-curtain-bottom {
  bottom: 0;
  border-top: 3px solid #f5d76e;
}

.splash-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 32px;
  z-index: 1;
}

/* 金色水牌（标题卷轴） */
.splash-board {
  position: relative;
  padding: 36px 44px 28px;
  background: linear-gradient(180deg, #f5d76e 0%, #d4a017 100%);
  border: 4px solid #8b1a1a;
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 2px #f5d76e,
    0 12px 30px rgba(0, 0, 0, 0.55),
    0 0 60px rgba(245, 215, 110, 0.25);
  text-align: center;
  animation: splash-board-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
/* 卷轴上下端的红绳装饰 */
.splash-board::before,
.splash-board::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 28px;
  height: 14px;
  background: #8b1a1a;
  border: 2px solid #f5d76e;
  transform: translateX(-50%);
}
.splash-board::before { top: -12px; border-radius: 14px 14px 4px 4px; }
.splash-board::after  { bottom: -12px; border-radius: 4px 4px 14px 14px; }

.splash-title {
  font-family: 'STKaiti', 'KaiTi', '楷体', serif;
  font-size: 52px;
  font-weight: bold;
  color: #8b1a1a;
  letter-spacing: 12px;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.5);
  margin-left: 12px; /* 视觉补偿 letter-spacing 末位 */
}
.splash-subtitle {
  font-family: 'STKaiti', serif;
  font-size: 32px;
  color: #3a6b9c;
  letter-spacing: 14px;
  margin: 8px 0 12px;
  margin-left: 14px;
}
.splash-tag {
  font-size: 13px;
  color: #5a2a0e;
  letter-spacing: 2px;
}

/* 点击提示 */
.splash-cta {
  text-align: center;
  color: #f5d76e;
  font-family: 'STKaiti', serif;
  animation: splash-cta-pulse 1.4s ease-in-out 800ms infinite;
}
.splash-cta-icon {
  font-size: 36px;
  line-height: 1;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
.splash-cta-text {
  font-size: 18px;
  letter-spacing: 6px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

@keyframes splash-board-in {
  0%   { transform: translateY(-32px) scale(0.8); opacity: 0; }
  60%  { transform: translateY(0) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes splash-cta-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.08); opacity: 1; }
}

/* 淡出 */
.splash-fade-leave-active {
  transition: opacity 0.35s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>
