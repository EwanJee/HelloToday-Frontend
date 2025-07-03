<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📚 메시지 히스토리</h1>
      <p class="text-gray-600">과거에 작성한 모든 메시지들을 확인해보세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">히스토리를 불러오는 중...</span>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
      <button
        @click="loadDates"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        다시 시도
      </button>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 날짜 목록 (왼쪽) -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-4 border-b">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-900">📅 날짜 선택</h2>
              <button
                @click="refreshDates"
                :disabled="refreshing"
                class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {{ refreshing ? '새로고침...' : '새로고침' }}
              </button>
            </div>
            <p class="text-sm text-gray-500 mt-1">총 {{ availableDates.length }}일간의 기록</p>
          </div>

          <div v-if="availableDates.length === 0" class="p-6 text-center text-gray-500">
            <div class="text-4xl mb-4">📅</div>
            <p>아직 작성된 메시지가 없습니다.</p>
            <p class="text-sm mt-2">메시지를 작성하면 여기에 표시됩니다.</p>
          </div>

          <div v-else class="divide-y max-h-96 overflow-y-auto">
            <button
              v-for="date in availableDates"
              :key="date"
              @click="selectDate(date)"
              class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              :class="{
                'bg-blue-50 border-r-2 border-blue-500': selectedDate === date,
                'text-blue-600 font-medium': selectedDate === date,
              }"
            >
              <div class="font-medium">{{ formatDate(date) }}</div>
              <div class="text-sm text-gray-500">{{ getDateDayName(date) }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 선택된 날짜의 메시지들 (오른쪽) -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-4 border-b">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-900">
                {{ selectedDate ? formatDate(selectedDate) : '날짜를 선택하세요' }}
              </h2>
              <button
                v-if="selectedDate"
                @click="refreshSelectedMessages"
                :disabled="loadingMessages"
                class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {{ loadingMessages ? '로딩...' : '새로고침' }}
              </button>
            </div>
            <p v-if="selectedDate" class="text-sm text-gray-500 mt-1">
              {{ selectedMessages.length }}개의 메시지
            </p>
          </div>

          <div v-if="!selectedDate" class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">📅</div>
            <p class="text-lg mb-2">날짜를 선택하세요</p>
            <p class="text-sm">왼쪽에서 날짜를 선택하면 해당 날짜의 메시지들을 볼 수 있습니다.</p>
          </div>

          <div v-else-if="loadingMessages" class="p-8 flex justify-center items-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">메시지를 불러오는 중...</span>
          </div>

          <div v-else-if="selectedMessages.length === 0" class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">📝</div>
            <p class="text-lg mb-2">메시지가 없습니다</p>
            <p class="text-sm">이 날짜에는 작성된 메시지가 없습니다.</p>
          </div>

          <div v-else class="divide-y max-h-96 overflow-y-auto">
            <div
              v-for="(message, index) in selectedMessages"
              :key="message.id"
              class="p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <p class="text-gray-800 flex-1">{{ message.content }}</p>
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                  #{{ index + 1 }}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                {{ formatTime(message.createdAt) }}
                <span v-if="message.timeAgo"> • {{ message.timeAgo }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 통계 요약 -->
    <div
      v-if="!loading && !error"
      class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 히스토리 요약</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ availableDates.length }}</div>
          <div class="text-sm text-gray-600">기록된 날짜</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ totalMessages }}</div>
          <div class="text-sm text-gray-600">전체 메시지</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ averagePerDay }}</div>
          <div class="text-sm text-gray-600">일평균 메시지</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ daysSinceFirst }}</div>
          <div class="text-sm text-gray-600">기록 시작일</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessageStore } from '@/stores/message'

// 컴포넌트 이름 명시
defineOptions({
  name: 'HistoryView',
})

// 상태 관리
const messageStore = useMessageStore()

// 반응형 데이터
const loading = ref(true)
const refreshing = ref(false)
const loadingMessages = ref(false)
const error = ref(null)
const availableDates = ref([])
const selectedDate = ref(null)
const selectedMessages = ref([])
const messageCountByDate = ref(new Map())

// 계산된 속성
const totalMessages = computed(() => {
  return Array.from(messageCountByDate.value.values()).reduce((total, count) => total + count, 0)
})

const averagePerDay = computed(() => {
  if (availableDates.value.length === 0) return 0
  return Math.round((totalMessages.value / availableDates.value.length) * 10) / 10
})

const daysSinceFirst = computed(() => {
  if (availableDates.value.length === 0) return 0
  const firstDate = new Date(availableDates.value[availableDates.value.length - 1])
  const today = new Date()
  const diffTime = Math.abs(today - firstDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getDateDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    weekday: 'long',
  })
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 날짜 목록 로드
const loadDates = async () => {
  try {
    loading.value = true
    error.value = null

    console.log('🔄 HistoryView: 날짜 목록 로드 시작')
    const response = await messageStore.getAvailableDates()

    if (response.success) {
      availableDates.value = response.data || []
      console.log('✅ HistoryView: 날짜 목록 로드 성공:', availableDates.value.length, '개')

      // 가장 최근 날짜를 자동 선택
      if (availableDates.value.length > 0) {
        await selectDate(availableDates.value[0])
      }
    } else {
      error.value = response.message || '날짜 목록을 불러오는데 실패했습니다.'
      console.error('❌ HistoryView: 날짜 목록 로드 실패:', response.message)
    }
  } catch (err) {
    console.error('❌ HistoryView: 날짜 목록 로드 오류:', err)
    error.value = '서버 연결에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 날짜 목록 새로고침
const refreshDates = async () => {
  refreshing.value = true
  await loadDates()
  refreshing.value = false
}

// 특정 날짜의 메시지들 로드
const selectDate = async (date) => {
  try {
    selectedDate.value = date
    loadingMessages.value = true

    console.log('🔄 HistoryView: 날짜별 메시지 로드 시작:', date)
    const response = await messageStore.getMessagesByDate(date)

    if (response.success) {
      selectedMessages.value = response.data.messages || []

      // 메시지 수 저장
      messageCountByDate.value.set(date, selectedMessages.value.length)

      console.log('✅ HistoryView: 날짜별 메시지 로드 성공:', selectedMessages.value.length, '개')
    } else {
      console.error('❌ HistoryView: 날짜별 메시지 로드 실패:', response.message)
      selectedMessages.value = []
      messageCountByDate.value.set(date, 0)
    }
  } catch (err) {
    console.error('❌ HistoryView: 날짜별 메시지 로드 오류:', err)
    selectedMessages.value = []
    messageCountByDate.value.set(date, 0)
  } finally {
    loadingMessages.value = false
  }
}

// 선택된 날짜 메시지 새로고침
const refreshSelectedMessages = async () => {
  if (selectedDate.value) {
    await selectDate(selectedDate.value)
  }
}

// 컴포넌트 마운트
onMounted(async () => {
  console.log('✅ HistoryView 컴포넌트가 마운트되었습니다!')
  await loadDates()
})
</script>
