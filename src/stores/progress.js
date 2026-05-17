// 用 localStorage 保存通关进度，无需 Pinia
import { ref, watch } from 'vue';

const KEY = 'sea-guard-progress-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

const state = ref(load());

watch(state, (val) => {
  localStorage.setItem(KEY, JSON.stringify(val));
}, { deep: true });

export function markPassed(id) {
  state.value[id] = { passed: true, time: Date.now() };
}

export function isPassed(id) {
  return !!state.value[id]?.passed;
}

export function reset() {
  state.value = {};
}

export const progress = state;
