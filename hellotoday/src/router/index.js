import { createRouter, createWebHistory } from 'vue-router'
import TodayView from '@/views/TodayView.vue'
import HistoryView from '@/views/HistoryView.vue'
import StatsView from '@/views/StatsView.vue'
import TestView from '@/views/TestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'today',
      component: TodayView,
      meta: {
        title: '오늘의 메시지',
      },
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: {
        title: '히스토리',
      },
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
      meta: {
        title: '통계',
      },
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
      meta: {
        title: '테스트 페이지',
      },
    },
    {
      // 테스트용 인라인 컴포넌트
      path: '/inline-test',
      name: 'inline-test',
      component: {
        template:
          '<div><h1>🎯 인라인 컴포넌트 테스트</h1><p>이것이 보인다면 라우터는 정상입니다!</p></div>',
      },
      meta: {
        title: '인라인 테스트',
      },
    },
  ],
})

// 네비게이션 가드
router.beforeEach((to, from, next) => {
  // 페이지 타이틀 설정
  document.title = to.meta.title ? `${to.meta.title} - Hello Today` : 'Hello Today'

  // 디버그 로그
  console.log(`라우터 이동: ${from.path} → ${to.path}`)

  next()
})

export default router
