import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// 앱 생성
const app = createApp(App)

// 앱 이름 설정 (DevTools용)
app.config.globalProperties.$appName = 'HelloToday'

// Pinia 스토어 설정
const pinia = createPinia()
app.use(pinia)

// 라우터 설정
app.use(router)

// Vue DevTools 강제 활성화 및 안전한 설정 (개발환경)
if (import.meta.env.DEV) {
  app.config.devtools = true

  // 성능 추적 활성화
  app.config.performance = true

  // 전역 속성으로 Vue 앱 노출 (DevTools 디버깅용)
  if (typeof window !== 'undefined') {
    // 안전한 객체 노출
    try {
      window.__VUE_APP__ = app
      window.__VUE_ROUTER__ = router
      window.__VUE_PINIA__ = pinia

      // DevTools 정보
      window.__VUE_DEV_INFO__ = {
        appName: 'HelloToday',
        vueVersion: app.version,
        environment: 'development',
        timestamp: new Date().toISOString(),
      }

      // Vue DevTools 감지 로그
      console.log('🔧 Vue DevTools 설정:', {
        devtools: app.config.devtools,
        performance: app.config.performance,
        isDev: import.meta.env.DEV,
        vueVersion: app.version,
      })
    } catch (devToolsError) {
      console.warn('⚠️ DevTools 설정 중 오류 발생:', devToolsError)
    }
  }
}

// 더 강화된 전역 에러 핸들러
app.config.errorHandler = (err, instance, info) => {
  console.error('🚨 Global Vue Error:', {
    error: err,
    instance: instance?.$options?.name || 'Unknown Component',
    info,
    timestamp: new Date().toISOString(),
  })

  // DevTools 관련 오류는 무시
  if (
    err?.message?.includes('chrome-extension://') ||
    err?.message?.includes('devtools') ||
    err?.stack?.includes('user-app.js')
  ) {
    console.log('🔧 DevTools 관련 오류 - 무시함')
    return
  }

  // 프로덕션에서는 에러 리포팅 서비스로 전송
  if (import.meta.env.PROD) {
    console.error('Production error:', { err, info })
  }
}

// 경고 핸들러
app.config.warnHandler = (msg, instance, trace) => {
  // DevTools 관련 경고는 무시
  if (msg.includes('devtools') || msg.includes('chrome-extension')) {
    return
  }
  console.warn('Vue Warning:', msg, trace)
}

// 컴포넌트 디버깅 정보
app.config.globalProperties.$debug = import.meta.env.DEV
app.config.globalProperties.$version = '1.0.0'

// 앱 마운트 전 로그
console.log('🚀 Vue 앱 초기화 중...', {
  router: !!router,
  pinia: !!pinia,
  appElement: document.getElementById('app'),
  devtools: app.config.devtools,
})

// 안전한 앱 마운트
let mountedApp = null
try {
  mountedApp = app.mount('#app')

  // 마운트 후 로그
  console.log('✅ Vue 앱 마운트 완료!', {
    app: !!mountedApp,
    currentRoute: router.currentRoute.value?.path,
    routerReady: router.isReady(),
  })
} catch (mountError) {
  console.error('❌ Vue 앱 마운트 실패:', mountError)
}

// 알림 권한 요청 (선택사항)
if ('Notification' in window && import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true') {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission:', permission)
    })
  }
}

// WebSocket 자동 연결 설정
router.isReady().then(async () => {
  console.log('🛣️ 라우터 준비 완료')

  try {
    // 라우터 준비 완료 후 WebSocket 연결
    const { useWebSocketStore } = await import('./stores/websocket')
    const websocketStore = useWebSocketStore()

    // 자동 연결 및 헬스체크 시작
    websocketStore.connect()
    websocketStore.startHealthCheck()

    console.log('🔌 WebSocket 연결 시작')

    // 페이지 언로드 시 연결 해제
    window.addEventListener('beforeunload', () => {
      websocketStore.disconnect()
    })

    // 페이지 포커스 시 연결 상태 확인
    window.addEventListener('focus', () => {
      if (!websocketStore.isConnected && !websocketStore.isConnecting) {
        websocketStore.connect()
      }
    })
  } catch (error) {
    console.error('WebSocket 초기화 실패:', error)
  }
})

// DevTools 확장 프로그램 감지 및 호환성 체크
if (import.meta.env.DEV) {
  setTimeout(async () => {
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      // DevTools 버전 호환성 체크
      try {
        const hook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
        if (hook.Vue) {
        }
      } catch (hookError) {}
    } else {
    }

    // 컴포넌트 테스트 헬퍼 함수들을 전역으로 노출
    window.__TEST_HELPERS__ = {
      // 현재 활성화된 Vue 인스턴스 조회
      getCurrentInstance() {
        return window.__VUE_APP__?._instance
      },

      // 라우터 정보 조회
      getRouterInfo() {
        const router = window.__VUE_ROUTER__
        return {
          currentRoute: router?.currentRoute?.value,
          routes: router?.getRoutes?.(),
          history: router?.options?.history,
        }
      },

      // 모든 등록된 컴포넌트 조회
      getRegisteredComponents() {
        const app = window.__VUE_APP__
        if (!app) return null

        return {
          globalComponents: app._context?.components || {},
          globalProperties: app.config?.globalProperties || {},
          provides: app._context?.provides || {},
        }
      },

      // 현재 페이지의 컴포넌트 인스턴스 찾기
      findComponentByName(name) {
        try {
          const instances = []
          const walker = document.createTreeWalker(
            document.getElementById('app'),
            NodeFilter.SHOW_ELEMENT,
            null,
            false,
          )

          let node
          while ((node = walker.nextNode())) {
            if (
              node.__vueParentComponent?.type?.name === name ||
              node.__vueParentComponent?.type?.__name === name
            ) {
              instances.push({
                element: node,
                component: node.__vueParentComponent,
                props: node.__vueParentComponent?.props,
                data: node.__vueParentComponent?.data,
              })
            }
          }

          return instances
        } catch (error) {
          console.error('컴포넌트 검색 중 오류:', error)
          return []
        }
      },

      // 스토어 상태 조회
      getStoreStates() {
        const pinia = window.__VUE_PINIA__
        if (!pinia) return null

        const stores = {}
        for (const [key, store] of pinia._s) {
          stores[key] = {
            id: store.$id,
            state: store.$state,
            getters: Object.keys(store).filter(
              (k) => typeof store[k] === 'function' && !k.startsWith('$'),
            ),
          }
        }
        return stores
      },

      // 컴포넌트 존재 여부 확인
      checkComponents() {
        const results = {
          timestamp: new Date().toISOString(),
          app: !!window.__VUE_APP__,
          router: !!window.__VUE_ROUTER__,
          pinia: !!window.__VUE_PINIA__,
          devtools: !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__,
          components: {},
        }

        // 주요 컴포넌트들 확인
        const componentNames = [
          'App',
          'TodayView',
          'HistoryView',
          'StatsView',
          'MessageCard',
          'MessageInput',
        ]

        componentNames.forEach((name) => {
          const instances = this.findComponentByName(name)
          results.components[name] = {
            found: instances.length > 0,
            count: instances.length,
            instances: instances.map((i) => ({
              tagName: i.element?.tagName,
              hasProps: !!i.props,
              hasData: !!i.data,
            })),
          }
        })

        return results
      },
    }

    // 고급 테스트 유틸리티 로드
    try {
      const testUtils = await import('./utils/componentTest.js')
    } catch (utilsError) {}
  }, 1000)
}
