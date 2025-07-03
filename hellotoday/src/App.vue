<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b flex-shrink-0">
      <div class="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-gray-900">Hello Today</h1>
        <p class="text-gray-600 text-sm">오늘 하루의 생각을 나누어보세요</p>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="bg-white border-b flex-shrink-0">
      <div class="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4">
        <div class="flex space-x-8">
          <button
            @click="navigateTo('오늘', '/')"
            class="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer bg-transparent border-0 border-b-2"
            :class="
              $route.path === '/'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            <ChatBubbleLeftIcon class="w-4 h-4" />
            <span>오늘</span>
          </button>

          <button
            @click="navigateTo('히스토리', '/history')"
            class="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer bg-transparent border-0 border-b-2"
            :class="
              $route.path === '/history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            <CalendarDaysIcon class="w-4 h-4" />
            <span>히스토리</span>
          </button>

          <button
            @click="navigateTo('통계', '/stats')"
            class="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer bg-transparent border-0 border-b-2"
            :class="
              $route.path === '/stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            <ChartBarIcon class="w-4 h-4" />
            <span>통계</span>
          </button>

          <button
            @click="navigateTo('테스트', '/test')"
            class="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer bg-transparent border-0 border-b-2"
            :class="
              $route.path === '/test'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            "
          >
            <span>🧪</span>
            <span>테스트</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto">
      <div class="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-6">
        <!-- 컴포넌트 렌더링 영역 -->
        <TodayView v-if="$route.name === 'today'" />
        <HistoryView v-else-if="$route.name === 'history'" />
        <StatsView v-else-if="$route.name === 'stats'" />
        <TestView v-else-if="$route.name === 'test'" />
      </div>
    </main>

    <!-- ChatGPT Style Message Input (Fixed Bottom) -->
    <div
      v-if="$route.path === '/'"
      class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex-shrink-0"
    >
      <div class="max-w-4xl mx-auto px-4 py-4">
        <form @submit.prevent="sendMessage" class="flex items-end space-x-3">
          <!-- Message Input -->
          <div class="flex-1 relative">
            <textarea
              v-model="messageContent"
              ref="messageInput"
              placeholder="메시지를 입력하세요..."
              class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 max-h-32"
              rows="1"
              @keydown="handleKeydown"
              @input="adjustHeight"
              @compositionstart="isComposing = true"
              @compositionend="isComposing = false"
            ></textarea>

            <!-- Character count -->
            <div class="absolute bottom-2 right-2 text-xs text-gray-400">
              {{ messageContent.length }}/500
            </div>
          </div>

          <!-- Send Button -->
          <button
            type="submit"
            :disabled="!messageContent.trim() || messageContent.length > 500"
            class="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PaperAirplaneIcon class="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChatBubbleLeftIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
} from '@heroicons/vue/24/outline'
import { useMessageStore } from '@/stores/message'
import TodayView from '@/views/TodayView.vue'
import HistoryView from '@/views/HistoryView.vue'
import StatsView from '@/views/StatsView.vue'
import TestView from '@/views/TestView.vue'
import Toast from '@/components/Toast.vue'
import { useToastStore } from '@/stores/toast'

// 컴포넌트 이름 명시 (DevTools용)
defineOptions({
  name: 'App',
})

const route = useRoute()
const router = useRouter()
const messageStore = useMessageStore()
const toastStore = useToastStore()

const messageContent = ref('')
const messageInput = ref(null)
const isComposing = ref(false) // 한글 조합 중인지 확인

// 메시지 전송 (간소화)
const sendMessage = async () => {
  // 한글 조합 중이면 전송하지 않음
  if (isComposing.value) {
    return
  }

  const trimmedContent = messageContent.value.trim()

  // 기본 유효성 검사만
  if (!trimmedContent) {
    return
  }

  try {
    // 메시지 전송 (에러 처리는 MessageStore에서 담당)
    await messageStore.sendMessage(trimmedContent)
    messageContent.value = ''

    // 텍스트영역 높이 리셋
    nextTick(() => {
      if (messageInput.value) {
        messageInput.value.style.height = 'auto'
      }
    })
  } catch (error) {
    // 에러는 MessageStore에서 이미 처리됨
    console.error('메시지 전송 실패:', error)
  }
}

// 키보드 이벤트 처리
const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
    event.preventDefault()
    sendMessage()
  }
}

// 텍스트영역 높이 자동 조절
const adjustHeight = () => {
  nextTick(() => {
    const textarea = messageInput.value
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 128 // max-h-32 (8rem = 128px)
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px'
    }
  })
}

// 컴포넌트 마운트 시
onMounted(async () => {
  // 라우터 준비 상태 확인
  try {
    await router.isReady()
  } catch (error) {
    console.error('라우터 준비 실패:', error)
  }
})

// 네비게이션 함수
const navigateTo = (label, path) => {
  if (route.path !== path) {
    router.push(path).catch((error) => {
      console.error('라우터 이동 실패:', error)
    })
  }
}
</script>

<style>
#app {
  font-family:
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    system-ui,
    Roboto,
    sans-serif;
}

/* 페이지 전환 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
