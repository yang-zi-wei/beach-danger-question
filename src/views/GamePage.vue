<template>
  <ChapterIntroVideo
    v-if="introSrc && !introDone"
    :src="introSrc"
    :title="introTitle"
    @done="onIntroDone"
  />
  <GameShell
    v-else-if="question && gameComponent"
    :question="question"
    @retry="retryCount++"
    v-slot="{ onCorrect, onWrong }"
  >
    <component
      :is="gameComponent"
      :key="`${question.id}-${retryCount}`"
      :question="question"
      @correct="onCorrect"
      @wrong="onWrong"
    />
  </GameShell>
  <div v-else class="placeholder">
    <p>关卡未实现：{{ id }}</p>
    <button class="opera-btn" @click="$router.push('/')">返回主页</button>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, shallowRef, ref, watch } from 'vue';
import GameShell from '@/components/shell/GameShell.vue';
import ChapterIntroVideo from '@/components/shell/ChapterIntroVideo.vue';
import { getQuestion, isFirstOfChapter, getChapter } from '@/data/questions';

const props = defineProps({ id: String });

const question = computed(() => getQuestion(props.id));

// 动态加载对应 game 组件
const gameComponent = shallowRef(null);
// 重玩计数器 —— 用于 key 强制重挂载游戏组件
const retryCount = ref(0);

// 章节开场视频状态
const introSrc = ref('');
const introTitle = ref('');
const introDone = ref(false);

watch(question, async (q) => {
  retryCount.value = 0;

  // 1) 决定是否需要播放章节开场视频
  if (q && isFirstOfChapter(q.id)) {
    const ch = getChapter(q.chapter);
    if (ch?.introVideo) {
      introSrc.value = ch.introVideo;
      introTitle.value = ch.title;
      introDone.value = false;
    } else {
      introSrc.value = '';
      introDone.value = true;
    }
  } else {
    introSrc.value = '';
    introDone.value = true;
  }

  // 2) 动态加载游戏组件
  if (!q?.component) {
    gameComponent.value = null;
    return;
  }
  gameComponent.value = defineAsyncComponent(() =>
    import(`../components/games/${q.component}.vue`)
  );
}, { immediate: true });

function onIntroDone() {
  introDone.value = true;
}
</script>

<style scoped>
.placeholder {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: #f5e6d3;
}
.placeholder p {
  color: #8b1a1a;
  font-family: 'STKaiti', serif;
  font-size: 18px;
}
</style>
