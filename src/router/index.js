import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import GamePage from '@/views/GamePage.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/game/:id', name: 'game', component: GamePage, props: true },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
