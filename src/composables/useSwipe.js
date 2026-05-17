import { onMounted, onUnmounted } from 'vue';

/**
 * 检测手指/鼠标滑动方向
 * @param {Ref<HTMLElement>} elRef 目标元素 ref
 * @param {Function} onSwipe 回调，参数为 'left' | 'right' | 'up' | 'down' | 'tap'
 * @param {Object} options { minDistance: 30 }
 */
export function useSwipe(elRef, onSwipe, options = {}) {
  const minDistance = options.minDistance ?? 30;
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  function onPointerDown(e) {
    startX = e.clientX;
    startY = e.clientY;
    startTime = performance.now();
  }

  function onPointerUp(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const dt = performance.now() - startTime;

    // 太慢或太短认为是 tap
    if (absX < minDistance && absY < minDistance) {
      if (dt < 300) onSwipe('tap', e);
      return;
    }

    if (absX > absY) {
      onSwipe(dx > 0 ? 'right' : 'left', e);
    } else {
      onSwipe(dy > 0 ? 'down' : 'up', e);
    }
  }

  onMounted(() => {
    const el = elRef.value;
    if (!el) return;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
  });

  onUnmounted(() => {
    const el = elRef.value;
    if (!el) return;
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointerup', onPointerUp);
  });
}
