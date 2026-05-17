<template>
  <div class="home">
    <div class="opera-curtain-top"></div>

    <header class="home-header">
      <h1 class="home-title">安全小卫</h1>
      <h2 class="home-subtitle">闯海岛</h2>
      <div class="home-tag">— "泳"不冒险，防"溺"未然 —</div>
    </header>

    <div class="chapter-list">
      <div
        v-for="ch in chapters"
        :key="ch.key"
        class="chapter-card"
        :style="{ borderColor: ch.color }"
      >
        <div class="chapter-card__head" :style="{ background: ch.color }">
          {{ ch.title }}
        </div>
        <div class="chapter-card__levels">
          <button
            v-for="q in questionsByChapter[ch.key]"
            :key="q.id"
            class="level-btn"
            :class="{ 'level-btn--passed': isPassed(q.id), 'level-btn--disabled': !q.component }"
            @click="goGame(q)"
          >
            <span v-if="isPassed(q.id)">✓</span>
            <span v-else>{{ q.id.slice(1) }}</span>
          </button>
        </div>
      </div>
    </div>

    <button class="opera-btn start-btn" @click="goFirst">开 启 闯 关</button>

    <div class="opera-curtain-bottom"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { chapters, questions } from '@/data/questions';
import { isPassed } from '@/stores/progress';

const router = useRouter();

const questionsByChapter = computed(() => {
  const map = {};
  for (const q of questions) {
    if (!map[q.chapter]) map[q.chapter] = [];
    map[q.chapter].push(q);
  }
  return map;
});

function goGame(q) {
  if (!q.component) {
    alert('该关卡正在开发中，敬请期待');
    return;
  }
  router.push({ name: 'game', params: { id: q.id } });
}

function goFirst() {
  router.push({ name: 'game', params: { id: 'Q01' } });
}
</script>

<style scoped>
.home {
  position: relative;
  height: 100vh;
  overflow-y: auto;
  padding: 48px 20px 24px;
  background: linear-gradient(180deg, #b3d8f5 0%, #f5e6d3 100%);
}

.home-header {
  text-align: center;
  margin-bottom: 24px;
}

.home-title {
  font-family: 'STKaiti', 'KaiTi', serif;
  font-size: 48px;
  color: #8b1a1a;
  letter-spacing: 12px;
  text-shadow: 3px 3px 0 #f5d76e, 5px 5px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
}

.home-subtitle {
  font-family: 'STKaiti', serif;
  font-size: 32px;
  color: #3a6b9c;
  letter-spacing: 8px;
  margin-bottom: 8px;
}

.home-tag {
  font-size: 13px;
  color: #5a2a0e;
  letter-spacing: 2px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.chapter-card {
  background: #fff;
  border: 2px solid;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.chapter-card__head {
  padding: 8px 14px;
  color: #fff;
  font-family: 'STKaiti', serif;
  font-size: 16px;
  letter-spacing: 2px;
  font-weight: bold;
}

.chapter-card__levels {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
}

.level-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5e6d3;
  border: 2px solid #8b1a1a;
  color: #8b1a1a;
  font-family: 'STKaiti', serif;
  font-size: 16px;
  font-weight: bold;
  transition: transform 0.1s;
}
.level-btn:active {
  transform: scale(0.95);
}
.level-btn--passed {
  background: #d4a017;
  color: #fff;
  border-color: #d4a017;
}
.level-btn--disabled {
  opacity: 0.4;
  color: #999;
  border-color: #ccc;
}

.start-btn {
  display: block;
  margin: 0 auto 24px;
}
</style>
