import { ref, onUnmounted } from 'vue';

/**
 * 倒计时 hook
 * @param {number} seconds 总秒数
 * @param {Function} onTimeout 倒计时结束回调
 * @returns { remaining, percent, start, stop, reset }
 */
export function useCountdown(seconds, onTimeout) {
  const remaining = ref(seconds);
  const percent = ref(100);
  let timer = null;
  let startTime = 0;
  let totalMs = seconds * 1000;

  function tick() {
    const elapsed = performance.now() - startTime;
    const left = Math.max(0, totalMs - elapsed);
    remaining.value = Math.ceil(left / 1000);
    percent.value = (left / totalMs) * 100;
    if (left <= 0) {
      stop();
      onTimeout?.();
    } else {
      timer = requestAnimationFrame(tick);
    }
  }

  function start() {
    stop();
    startTime = performance.now();
    timer = requestAnimationFrame(tick);
  }

  function stop() {
    if (timer) {
      cancelAnimationFrame(timer);
      timer = null;
    }
  }

  function reset() {
    stop();
    remaining.value = seconds;
    percent.value = 100;
  }

  onUnmounted(stop);

  return { remaining, percent, start, stop, reset };
}
