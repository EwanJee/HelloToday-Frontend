<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">☀️ 오늘의 하루</h1>
      <p class="text-gray-600">{{ currentDate }} - 오늘 하루 어떻게 보내고 계신가요?</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">메시지를 불러오는 중...</span>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
      <button
        @click="loadTodayMessages"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        다시 시도
      </button>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="space-y-6">
      <!-- 오늘의 통계 -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h2 class="text-lg font-semibold text-blue-900 mb-3">📊 오늘의 현황</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ messagesCount }}</div>
            <div class="text-sm text-blue-700">오늘 작성한 메시지</div>
          </div>
          <div class="text-center">
            <div
              class="text-2xl font-bold"
              :class="wsConnected ? 'text-green-600' : 'text-red-600'"
            >
              {{ wsConnected ? '연결됨' : '연결 안됨' }}
            </div>
            <div class="text-sm text-gray-700">실시간 연결 상태</div>
          </div>
        </div>
      </div>

      <!-- 오늘의 메시지 목록 -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-4 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">💭 오늘의 메시지들</h2>
            <div class="flex gap-2">
              <button
                @click="refreshMessages"
                :disabled="refreshing"
                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {{ refreshing ? '새로고침 중...' : '새로고침' }}
              </button>
              <button
                @click="testToast"
                class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                토스트 테스트
              </button>
            </div>
          </div>
        </div>

        <div v-if="messagesCount === 0" class="p-8 text-center text-gray-500">
          <div class="text-4xl mb-4">✏️</div>
          <p class="mb-4">아직 오늘 작성된 메시지가 없습니다.</p>
          <p class="text-sm">아래 입력창에서 첫 번째 메시지를 작성해보세요!</p>
        </div>

        <div v-else class="divide-y max-h-96 overflow-y-auto" ref="messagesContainer">
          <div
            v-for="message in displayMessages"
            :key="message.id"
            class="p-4 hover:bg-gray-50 transition-colors"
            :class="{ 'bg-green-50 border-l-4 border-green-500': isNewMessage(message) }"
          >
            <div class="flex justify-between items-start mb-2">
              <p class="text-gray-800 flex-1">{{ message.content }}</p>
              <span
                v-if="isNewMessage(message)"
                class="text-xs bg-green-500 text-white px-2 py-1 rounded-full ml-2"
              >
                새 메시지
              </span>
            </div>
            <p class="text-sm text-gray-500">
              {{ message.timeAgo || formatTimeAgo(message.createdAt) }} •
              {{ formatTime(message.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 실시간 연결 상태 -->
      <div class="flex items-center justify-center space-x-4 text-sm bg-gray-50 rounded-lg p-3">
        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full transition-colors"
            :class="wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
          ></div>
          <span class="text-gray-600">
            {{ wsConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 끊어짐' }}
          </span>
        </div>

        <button
          v-if="!wsConnected"
          @click="reconnectWebSocket"
          class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          다시 연결
        </button>

        <div v-if="wsConnected" class="text-xs text-gray-500">
          마지막 업데이트: {{ lastUpdate }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useWebSocketStore } from '@/stores/websocket'
import { useToastStore } from '@/stores/toast'

// 컴포넌트 이름 명시
defineOptions({
  name: 'TodayView',
})

// 상태 관리
const messageStore = useMessageStore()
const wsStore = useWebSocketStore()
const toastStore = useToastStore()

// 반응형 데이터
const loading = ref(true)
const refreshing = ref(false)
const error = ref(null)
const newMessageIds = ref(new Set())
const lastUpdate = ref(new Date().toLocaleTimeString())
const messagesContainer = ref(null)

// 현재 날짜 포맷팅
const currentDate = computed(() => {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
})

// WebSocket 연결 상태
const wsConnected = computed(() => wsStore.connected)

// 메시지 관련 computed
const todayMessagesData = computed(() => messageStore.todayMessages)
const displayMessages = computed(() => {
  const messages = todayMessagesData.value?.messages || []
  return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})
const messagesCount = computed(() => displayMessages.value.length)

// 시간 포맷팅 함수
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '-'
  const now = new Date()
  const messageTime = new Date(timestamp)
  const diffMs = now - messageTime
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  return messageTime.toLocaleDateString('ko-KR')
}

const isNewMessage = (message) => {
  return newMessageIds.value.has(message.id)
}

// 메시지 컨테이너를 아래로 스크롤
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// REST API를 통한 초기 메시지 로드
const loadTodayMessages = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await messageStore.loadTodayMessages()

    if (!response.success) {
      error.value = response.message || '메시지를 불러오는데 실패했습니다.'
    } else {
      // 스토어의 todayMessages 업데이트
      messageStore.updateTodayMessages(response.data)

      lastUpdate.value = new Date().toLocaleTimeString()

      // 메시지 로드 후 스크롤을 아래로 이동
      scrollToBottom()
    }
  } catch (err) {
    console.error('❌ TodayView: 메시지 로드 오류:', err)
    error.value = '서버 연결에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// REST API를 통한 메시지 새로고침
const refreshMessages = async () => {
  refreshing.value = true
  await loadTodayMessages()
  refreshing.value = false
}

// WebSocket 연결 설정 (실시간 업데이트용)
const setupWebSocket = () => {
  try {
    // WebSocket 연결
    wsStore.connect()

    // 새 메시지 실시간 수신 처리
    const handleNewMessage = (message) => {
      // 메시지 스토어에 새 메시지 추가
      messageStore.addNewMessage(message)

      // 새 메시지 표시를 위해 ID 추가
      newMessageIds.value.add(message.id)

      // 3초 후 새 메시지 표시 제거
      setTimeout(() => {
        newMessageIds.value.delete(message.id)
      }, 3000)

      lastUpdate.value = new Date().toLocaleTimeString()

      // 새 메시지 수신 시 스크롤을 아래로 이동
      scrollToBottom()
    }

    // WebSocket 구독: /topic/messages
    wsStore.subscribe('/topic/messages', handleNewMessage)
  } catch (err) {
    console.error('❌ TodayView: WebSocket 연결 실패:', err)
  }
}

// WebSocket 재연결
const reconnectWebSocket = () => {
  wsStore.forceReconnect()
}

// 토스트 테스트 함수
const testToast = () => {
  console.log('🧪 토스트 테스트 시작')
  toastStore.showError('테스트 에러', '이것은 토스트 테스트 메시지입니다.')
}

// 컴포넌트 마운트
onMounted(async () => {
  // REST API를 통한 초기 데이터 로드
  await loadTodayMessages()

  // WebSocket 연결 설정 (실시간 업데이트용)
  setupWebSocket()

  // 5분마다 자동 새로고침 (REST API 통해)
  const interval = setInterval(
    () => {
      if (!loading.value && !refreshing.value) {
        refreshMessages()
      }
    },
    5 * 60 * 1000,
  )

  // 컴포넌트 언마운트 시 interval 정리
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// WebSocket 연결 상태 감시
watch(wsConnected, (connected) => {
  if (connected) {
    lastUpdate.value = new Date().toLocaleTimeString()
  }
})

// 메시지 목록 변경 감시 (새 메시지 추가 시 자동 스크롤)
watch(
  displayMessages,
  () => {
    scrollToBottom()
  },
  { flush: 'post' },
)

// 컴포넌트 언마운트
onUnmounted(() => {})
</script>

<style scoped>
/* 채팅 컨테이너 스크롤바 스타일링 */
.chat-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.chat-container::-webkit-scrollbar {
  width: 6px;
}

.chat-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 부드러운 스크롤 애니메이션 */
.chat-container {
  scroll-behavior: smooth;
}

/* 새 메시지 알림 버튼 호버 효과 */
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate(-50%, 0);
  }
  40%,
  43% {
    transform: translate(-50%, -5px);
  }
  70% {
    transform: translate(-50%, -3px);
  }
  90% {
    transform: translate(-50%, -2px);
  }
}
</style>
