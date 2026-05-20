<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <!-- 全局 BGM 开关：固定在右上角 -->
  <!-- 启动屏未关闭、或章节片头视频期间隐藏 -->
  <button
    v-if="!videoActive && !splashShown"
    class="bgm-toggle"
    :class="{ 'bgm-toggle--off': !enabled }"
    :aria-label="enabled ? '关闭背景音乐' : '开启背景音乐'"
    @click="toggleBgm"
  >
    <svg v-if="enabled" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        fill="currentColor" />
    </svg>
    <svg v-else viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M3 3l18 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" />
    </svg>
  </button>

  <!-- 启动屏：用户首次 tap 同时解锁 autoplay 并触发 BGM -->
  <SplashScreen v-if="!splashShown" @dismiss="onSplashDismiss" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useBgm } from '@/composables/useBgm';
import SplashScreen from '@/components/shell/SplashScreen.vue';

const { enabled, playing, videoActive, toggleBgm, startBgm, preloadBgm } = useBgm();

// 启动屏只在 App 挂载这一次显示；SPA 内部路由跳转不会重显
const splashShown = ref(false);

function onSplashDismiss() {
  // 此回调是用户 tap 启动屏的同步事件处理链上，仍在「用户姿态」里——
  // 此刻调 startBgm() 浏览器才会真正放行 play()。
  startBgm();
  splashShown.value = true;
}

// 兜底：用户即便没在启动屏点（不太可能，因为遮罩盖全屏），后续任何交互也会触发 play()
const EVENTS = ['touchstart', 'pointerdown', 'click', 'keydown'];

function onAnyInteract() {
  startBgm();
}

function attachUnlockListeners() {
  for (const ev of EVENTS) {
    window.addEventListener(ev, onAnyInteract, { passive: true, capture: true });
  }
}

function detachUnlockListeners() {
  for (const ev of EVENTS) {
    window.removeEventListener(ev, onAnyInteract, { capture: true });
  }
}

const stopWatch = watch(playing, (val) => {
  if (val) detachUnlockListeners();
});

onMounted(() => {
  // App 挂载即开始下载 BGM 文件，启动屏期间利用这段读图/读 logo 的时间预加载
  preloadBgm();
  attachUnlockListeners();
});

onBeforeUnmount(() => {
  detachUnlockListeners();
  stopWatch();
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全局 BGM 开关 —— 固定在 #app（最大 500px 居中容器）的右上角 */
.bgm-toggle {
  position: fixed;
  top: 12px;
  right: calc(50% - 250px + 12px);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(180deg, #d24d4d 0%, #8b1a1a 100%);
  color: #f5d76e;
  border: 2px solid #f5d76e;
  box-shadow: 0 2px 0 #5a0e0e, 0 3px 8px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  margin-top: env(safe-area-inset-top, 0);
  transition: transform 0.1s, opacity 0.2s;
}
.bgm-toggle:active {
  transform: translateY(1px);
}
.bgm-toggle--off {
  opacity: 0.65;
  background: linear-gradient(180deg, #6b6b6b 0%, #3a3a3a 100%);
  color: #cccccc;
  border-color: #cccccc;
}

@media (max-width: 500px) {
  .bgm-toggle {
    right: 12px;
  }
}
</style>
