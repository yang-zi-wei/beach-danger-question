import { Howl } from 'howler';

// 音效缓存，避免重复加载
const cache = new Map();

function getHowl(src, options = {}) {
  if (!cache.has(src)) {
    cache.set(src, new Howl({ src: [src], ...options }));
  }
  return cache.get(src);
}

/**
 * 播放音效
 * @param {string} src 音效文件路径（public/audio/ 下相对路径，如 '/audio/gong.mp3'）
 */
export function playSound(src, options = {}) {
  try {
    const sound = getHowl(src, options);
    sound.play();
  } catch (err) {
    console.warn('音效播放失败:', src, err);
  }
}

// 预设音效（文件可后续补充，没有也不影响功能）
export const SFX = {
  correct: '/audio/correct.mp3',  // 锣鼓喝彩
  wrong:   '/audio/wrong.mp3',    // 戏曲"咣"
  tap:     '/audio/tap.mp3',      // 点击
  swoosh:  '/audio/swoosh.mp3',   // 水袖飞过
  horn:    '/audio/horn.mp3',     // 螺号
};

export function playCorrect() { playSound(SFX.correct); }
export function playWrong()   { playSound(SFX.wrong); }
export function playTap()     { playSound(SFX.tap); }
