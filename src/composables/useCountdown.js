import { ref } from 'vue';

/**
 * 倒计时 hook（已禁用倒计时机制）
 *
 * 应用层产品决定取消"限时答题"压力：
 *   - start() / stop() / reset() 都是空操作，永远不会调用 onTimeout
 *   - remaining 与 percent 保持初值（100%、初始秒数），便于已有 UI 引用不报错
 *   - 配套在 src/styles/global.css 里把所有 .*-countdown 元素隐藏掉
 *
 * 想要恢复倒计时只需要 git revert 这一文件 + global.css 里那条隐藏规则。
 *
 * @param {number} seconds 总秒数（仅用于初始化 remaining 显示值）
 * @param {Function} onTimeout 已不再调用，保留参数以兼容旧调用方
 * @returns { remaining, percent, start, stop, reset }
 */
// eslint-disable-next-line no-unused-vars
export function useCountdown(seconds, onTimeout) {
  const remaining = ref(seconds);
  const percent = ref(100);
  const noop = () => {};
  return { remaining, percent, start: noop, stop: noop, reset: noop };
}
