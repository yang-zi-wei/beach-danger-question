/**
 * 全局背景音乐 composable —— 单例，使用原生 <audio> 元素。
 *
 * 之前用 Howler 在 html5 模式下被浏览器拒绝 autoplay 后，内部状态会变成
 * "已经在播了"，后续即使在用户姿态里调 play() 也不真正起播。原生 audio
 * 元素行为更直观、容易排错。
 *
 * 设计：
 * - `enabled`：用户主动开关偏好，持久化到 localStorage
 * - `videoActive`：章节片头视频期间临时挂起，不影响 enabled
 * - `playing`：当前是否真在播放
 * - 默认开启；浏览器 autoplay 限制由 App.vue 用首次交互监听兜底
 * - 音量 0.4，给答题音效留头空间
 */
import { ref } from 'vue';

const STORAGE_KEY = 'sea-guard.bgm-enabled';
const VOLUME = 0.4;

// BGM 托管在火山引擎 TOS（广州）
const BGM_SRC = `https://beach-danger-question-guangzhou.tos-cn-guangzhou.volces.com/video/_originals/${encodeURIComponent('海风小哪吒.mp3')}`;

/** @type {HTMLAudioElement|null} */
let audio = null;

const enabled = ref(loadEnabled());
const playing = ref(false);
const videoActive = ref(false);

function loadEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

function saveEnabled(val) {
  try { localStorage.setItem(STORAGE_KEY, val ? '1' : '0'); } catch {}
}

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.src = BGM_SRC;
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = 'auto';
    // 不设 crossOrigin：避免 CDN 没配 CORS 时浏览器拒播；我们不需要 audio API
    audio.addEventListener('play', () => {
      playing.value = true;
      console.log('[BGM] play event');
    });
    audio.addEventListener('pause', () => {
      playing.value = false;
    });
    audio.addEventListener('canplay', () => console.log('[BGM] canplay'));
    audio.addEventListener('error', (e) => {
      console.warn('[BGM] audio error', e, audio?.error);
    });
  }
  return audio;
}

/**
 * 仅预加载音频，不尝试播放。App.vue 在 onMounted 调用，让用户后续 tap
 * 时音频已经准备好（避免 tap 触发 play 时还在缓冲、起播延迟）。
 */
export function preloadBgm() {
  getAudio();
}

/**
 * 起播。enabled 为 false 或视频期间会被忽略。
 * 必须在用户姿态调用栈内调用（pointerdown / click / touchstart / keydown 等），
 * 否则浏览器会拒绝并打印 NotAllowedError。
 */
export function startBgm() {
  if (!enabled.value || videoActive.value) return;
  const a = getAudio();
  if (!a.paused) return;
  const p = a.play();
  if (p && typeof p.catch === 'function') {
    p.catch((err) => {
      console.warn('[BGM] play() rejected:', err && err.name, err && err.message);
    });
  }
}

export function stopBgm() {
  if (audio && !audio.paused) audio.pause();
}

export function toggleBgm() {
  enabled.value = !enabled.value;
  saveEnabled(enabled.value);
  if (enabled.value) startBgm();
  else stopBgm();
}

export function suspendForVideo() {
  videoActive.value = true;
  stopBgm();
}

export function resumeFromVideo() {
  if (!videoActive.value) return;
  videoActive.value = false;
  startBgm();
}

export function useBgm() {
  return {
    enabled,
    playing,
    videoActive,
    preloadBgm,
    startBgm,
    stopBgm,
    toggleBgm,
    suspendForVideo,
    resumeFromVideo,
  };
}
