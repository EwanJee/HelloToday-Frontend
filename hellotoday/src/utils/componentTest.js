/**
 * 🧪 Vue 컴포넌트 테스트 유틸리티
 *
 * 사용법:
 * import { testComponents, testRoute, testStore } from '@/utils/componentTest'
 *
 * // 컴포넌트 테스트
 * testComponents()
 *
 * // 라우터 테스트
 * testRoute('/stats')
 *
 * // 스토어 테스트
 * testStore('message')
 */

export const testComponents = () => {
  const results = {
    timestamp: new Date().toISOString(),
    vue: {
      app: !!window.__VUE_APP__,
      router: !!window.__VUE_ROUTER__,
      pinia: !!window.__VUE_PINIA__,
      devtools: !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__,
    },
    components: {},
    dom: {},
  }

  // 1. 컴포넌트 인스턴스 확인
  const componentNames = [
    'App',
    'TodayView',
    'HistoryView',
    'StatsView',
    'MessageCard',
    'MessageInput',
  ]

  componentNames.forEach((name) => {
    // DOM에서 컴포넌트 찾기
    const elements = Array.from(document.querySelectorAll('*')).filter(
      (el) =>
        el.__vueParentComponent?.type?.name === name ||
        el.__vueParentComponent?.type?.__name === name,
    )

    results.components[name] = {
      found: elements.length > 0,
      count: elements.length,
      mounted: elements.some((el) => el.__vueParentComponent?.isMounted),
      hasProps: elements.some((el) => el.__vueParentComponent?.props),
    }
  })

  // 2. DOM 구조 확인
  results.dom = {
    app: !!document.getElementById('app'),
    routerContainer: !!document.querySelector('.router-container'),
    navigation: !!document.querySelector('nav'),
    messageInput: !!document.querySelector('textarea'),
    debugPanels: document.querySelectorAll('[class*="debug"]').length,
  }

  console.table(results.components)
  console.log('🧪 컴포넌트 테스트 결과:', results)

  return results
}

export const testRoute = (path) => {
  const router = window.__VUE_ROUTER__
  if (!router) {
    console.error('❌ 라우터를 찾을 수 없습니다')
    return false
  }

  console.log(`🛣️ 라우터 테스트: ${path}`)

  const currentPath = router.currentRoute.value.path
  console.log('현재 경로:', currentPath)

  if (path) {
    router
      .push(path)
      .then(() => {
        console.log(`✅ 라우터 이동 완료: ${currentPath} → ${path}`)
        setTimeout(() => testComponents(), 500) // 컴포넌트 마운트 후 테스트
      })
      .catch((err) => {
        console.error('❌ 라우터 이동 실패:', err)
      })
  }

  return {
    current: currentPath,
    routes: router.getRoutes().map((r) => ({ path: r.path, name: r.name })),
    available: router.hasRoute.bind(router),
  }
}

export const testStore = (storeId) => {
  const pinia = window.__VUE_PINIA__
  if (!pinia) {
    console.error('❌ Pinia 스토어를 찾을 수 없습니다')
    return false
  }

  console.log(`🗃️ 스토어 테스트: ${storeId || 'all'}`)

  const stores = {}
  for (const [key, store] of pinia._s) {
    if (!storeId || key === storeId) {
      stores[key] = {
        id: store.$id,
        state: store.$state,
        actions: Object.keys(store).filter(
          (k) => typeof store[k] === 'function' && !k.startsWith('$') && !k.startsWith('_'),
        ),
      }
    }
  }

  console.table(stores)
  return stores
}

export const testAPI = async () => {
  console.log('🌐 API 연결 테스트 시작')

  try {
    // API 서비스 import
    const { default: apiService } = await import('@/services/api')

    const tests = [
      { name: 'Today Stats', fn: () => apiService.getTodayStats() },
      { name: 'All Stats', fn: () => apiService.getAllStats() },
      { name: 'Dates', fn: () => apiService.getDates() },
    ]

    const results = {}

    for (const test of tests) {
      try {
        console.log(`📡 ${test.name} 테스트 중...`)
        const response = await test.fn()
        results[test.name] = {
          success: true,
          status: response.status,
          hasData: !!response.data,
        }
        console.log(`✅ ${test.name} 성공`)
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
          status: error.response?.status,
        }
        console.log(`❌ ${test.name} 실패:`, error.message)
      }
    }

    console.table(results)
    return results
  } catch (error) {
    console.error('❌ API 테스트 설정 실패:', error)
    return false
  }
}

export const testWebSocket = () => {
  const wsStore = window.__VUE_PINIA__?._s?.get('websocket')
  if (!wsStore) {
    console.error('❌ WebSocket 스토어를 찾을 수 없습니다')
    return false
  }

  console.log('🔌 WebSocket 연결 테스트')

  const status = {
    connected: wsStore.isConnected,
    connecting: wsStore.isConnecting,
    url: wsStore.wsUrl,
    client: !!wsStore.stompClient,
    subscriptions: wsStore.subscriptions?.size || 0,
  }

  console.table(status)

  // 연결 테스트
  if (!wsStore.isConnected) {
    console.log('🔄 WebSocket 연결 시도 중...')
    wsStore.connect()
  }

  return status
}

// 전체 시스템 테스트
export const runFullTest = async () => {
  console.log('🚀 전체 시스템 테스트 시작')
  console.log('=' * 50)

  const results = {
    components: testComponents(),
    route: testRoute(),
    stores: testStore(),
    websocket: testWebSocket(),
    api: await testAPI(),
  }

  console.log('🏁 전체 테스트 완료!')
  console.log('📊 종합 결과:', results)

  return results
}

// 브라우저 콘솔에서 사용할 수 있도록 전역 노출
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.__COMPONENT_TESTS__ = {
    testComponents,
    testRoute,
    testStore,
    testAPI,
    testWebSocket,
    runFullTest,
  }
}
