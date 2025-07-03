<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-red-600 mb-2">🧪 API 테스트 도구</h1>
      <p class="text-gray-600">모든 API 엔드포인트와 WebSocket 연결을 테스트할 수 있습니다</p>
    </div>

    <!-- 시스템 상태 요약 -->
    <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">🔍 시스템 상태</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold" :class="apiStatus ? 'text-green-600' : 'text-red-600'">
            {{ apiStatus ? '정상' : '오류' }}
          </div>
          <div class="text-sm text-gray-600">REST API</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold" :class="wsStatus ? 'text-green-600' : 'text-red-600'">
            {{ wsStatus ? '연결됨' : '연결 안됨' }}
          </div>
          <div class="text-sm text-gray-600">WebSocket</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalTests }}</div>
          <div class="text-sm text-gray-600">실행된 테스트</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ passedTests }}</div>
          <div class="text-sm text-gray-600">성공한 테스트</div>
        </div>
      </div>
    </div>

    <!-- 빠른 테스트 버튼들 -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 테스트</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button @click="testAllAPIs" :disabled="testing" class="btn-test bg-blue-500 text-white">
          {{ testing ? '테스트 중...' : '🔄 모든 API' }}
        </button>
        <button @click="testWebSocket" :disabled="testing" class="btn-test bg-green-500 text-white">
          🔌 WebSocket
        </button>
        <button
          @click="sendTestMessage"
          :disabled="testing"
          class="btn-test bg-purple-500 text-white"
        >
          📤 테스트 메시지
        </button>
        <button @click="clearLogs" class="btn-test bg-red-500 text-white">🗑️ 로그 지우기</button>
      </div>
    </div>

    <!-- Rate Limiting 테스트 -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">🚦 Rate Limiting 테스트</h3>
        <p class="text-sm text-gray-600 mt-1">
          1분간 10번 이상 요청 시 429 에러가 발생하는지 테스트합니다
        </p>
      </div>
      <div class="p-4 space-y-4">
        <div class="flex items-center space-x-4">
          <button
            @click="testRateLimit"
            :disabled="rateLimitTesting"
            class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium disabled:bg-gray-300"
          >
            {{
              rateLimitTesting ? `테스트 중... (${rateLimitCount}/15)` : '🚦 Rate Limiting 테스트'
            }}
          </button>
          <div class="text-sm text-gray-600">
            15개의 연속 요청을 보내서 Rate Limiting을 유발합니다
          </div>
        </div>

        <div v-if="rateLimitResult" class="p-3 rounded-lg border">
          <div
            class="font-medium mb-2"
            :class="rateLimitResult.success ? 'text-green-600' : 'text-red-600'"
          >
            {{
              rateLimitResult.success
                ? '✅ Rate Limiting 테스트 성공!'
                : '❌ Rate Limiting 테스트 실패'
            }}
          </div>
          <div class="text-sm text-gray-600">
            <div>총 요청: {{ rateLimitResult.totalRequests }}개</div>
            <div>성공 요청: {{ rateLimitResult.successCount }}개</div>
            <div>429 에러: {{ rateLimitResult.rateLimitedCount }}개</div>
            <div v-if="rateLimitResult.firstRateLimitAt">
              첫 번째 Rate Limit: {{ rateLimitResult.firstRateLimitAt }}번째 요청
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 개별 API 테스트 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 메시지 API 테스트 -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">📨 메시지 API 테스트</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex space-x-2">
            <button
              @click="testGetTodayMessages"
              :disabled="testing"
              class="btn-test-sm bg-blue-500 text-white"
            >
              GET /api/messages/today
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.getTodayMessages"
                :class="testResults.getTodayMessages.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.getTodayMessages.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="testGetAvailableDates"
              :disabled="testing"
              class="btn-test-sm bg-blue-500 text-white"
            >
              GET /api/messages/dates
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.getAvailableDates"
                :class="testResults.getAvailableDates.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.getAvailableDates.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2">
            <input v-model="testDate" type="date" class="px-2 py-1 border rounded text-sm" />
            <button
              @click="testGetMessagesByDate"
              :disabled="testing || !testDate"
              class="btn-test-sm bg-blue-500 text-white"
            >
              GET /api/messages/date/{date}
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.getMessagesByDate"
                :class="testResults.getMessagesByDate.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.getMessagesByDate.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2">
            <input
              v-model="testMessageContent"
              type="text"
              placeholder="테스트 메시지 내용"
              class="flex-1 px-2 py-1 border rounded text-sm"
            />
            <button
              @click="testSendMessage"
              :disabled="testing || !testMessageContent"
              class="btn-test-sm bg-green-500 text-white"
            >
              POST /api/messages
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.sendMessage"
                :class="testResults.sendMessage.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.sendMessage.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 통계 API 테스트 -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">📊 통계 API 테스트</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex space-x-2">
            <button
              @click="testGetTodayStats"
              :disabled="testing"
              class="btn-test-sm bg-purple-500 text-white"
            >
              GET /api/stats/today
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.getTodayStats"
                :class="testResults.getTodayStats.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.getTodayStats.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="testGetAllStats"
              :disabled="testing"
              class="btn-test-sm bg-purple-500 text-white"
            >
              GET /api/stats/all
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.getAllStats"
                :class="testResults.getAllStats.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.getAllStats.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="testHealthCheck"
              :disabled="testing"
              class="btn-test-sm bg-orange-500 text-white"
            >
              GET /actuator/health
            </button>
            <div class="flex items-center">
              <div
                v-if="testResults.healthCheck"
                :class="testResults.healthCheck.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ testResults.healthCheck.success ? '✅' : '❌' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WebSocket 테스트 -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">🔌 WebSocket 연결 테스트</h3>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="text-center p-3 bg-gray-50 rounded">
            <div
              class="text-lg font-bold"
              :class="wsStore.connected ? 'text-green-600' : 'text-red-600'"
            >
              {{ wsStore.connected ? '연결됨' : '연결 안됨' }}
            </div>
            <div class="text-sm text-gray-600">연결 상태</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded">
            <div class="text-lg font-bold text-blue-600">{{ wsStore.reconnectAttempts }}</div>
            <div class="text-sm text-gray-600">재연결 시도</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded">
            <div class="text-lg font-bold text-purple-600">{{ receivedMessages }}</div>
            <div class="text-sm text-gray-600">수신 메시지</div>
          </div>
        </div>

        <div class="flex space-x-2 mb-4">
          <button
            @click="connectWebSocket"
            :disabled="wsStore.connected"
            class="btn-test-sm bg-green-500 text-white"
          >
            연결
          </button>
          <button
            @click="disconnectWebSocket"
            :disabled="!wsStore.connected"
            class="btn-test-sm bg-red-500 text-white"
          >
            연결 해제
          </button>
          <button
            @click="testWebSocketPing"
            :disabled="!wsStore.connected"
            class="btn-test-sm bg-blue-500 text-white"
          >
            Ping 테스트
          </button>
        </div>

        <div v-if="wsStore.lastError" class="text-sm text-red-600 bg-red-50 p-2 rounded">
          오류: {{ wsStore.lastError }}
        </div>
      </div>
    </div>

    <!-- 실시간 테스트 로그 -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-4 border-b">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">📋 실시간 테스트 로그</h3>
          <div class="text-sm text-gray-500">최근 {{ logs.length }}개 항목</div>
        </div>
      </div>
      <div class="p-4">
        <div v-if="logs.length === 0" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-4">📋</div>
          <p>아직 테스트 로그가 없습니다.</p>
          <p class="text-sm mt-2">위의 테스트 버튼을 눌러 API를 테스트해보세요.</p>
        </div>
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(log, index) in logs.slice().reverse()"
            :key="index"
            class="flex items-start space-x-3 p-3 rounded-lg transition-colors"
            :class="{
              'bg-green-50 border border-green-200': log.type === 'success',
              'bg-red-50 border border-red-200': log.type === 'error',
              'bg-blue-50 border border-blue-200': log.type === 'info',
              'bg-yellow-50 border border-yellow-200': log.type === 'warning',
            }"
          >
            <div class="text-lg">
              {{
                log.type === 'success'
                  ? '✅'
                  : log.type === 'error'
                    ? '❌'
                    : log.type === 'warning'
                      ? '⚠️'
                      : 'ℹ️'
              }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ log.message }}</div>
              <div v-if="log.details" class="text-sm text-gray-600 mt-1">{{ log.details }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ log.timestamp }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useWebSocketStore } from '@/stores/websocket'
import { useToastStore } from '@/stores/toast'
import apiService from '@/services/api'

// 컴포넌트 이름 명시
defineOptions({
  name: 'TestView',
})

// 상태 관리
const messageStore = useMessageStore()
const wsStore = useWebSocketStore()
const toastStore = useToastStore()

// 반응형 데이터
const testing = ref(false)
const logs = ref([])
const testResults = ref({})
const testDate = ref(new Date().toISOString().split('T')[0])
const testMessageContent = ref('테스트 메시지 - ' + new Date().toLocaleTimeString())
const receivedMessages = ref(0)

// Rate Limiting 테스트 관련
const rateLimitTesting = ref(false)
const rateLimitCount = ref(0)
const rateLimitResult = ref(null)

// 계산된 속성
const apiStatus = computed(() => {
  const results = Object.values(testResults.value)
  return results.length > 0 && results.some((r) => r.success)
})

const wsStatus = computed(() => wsStore.connected)

const totalTests = computed(() => Object.keys(testResults.value).length)

const passedTests = computed(() => {
  return Object.values(testResults.value).filter((r) => r.success).length
})

// 로그 추가 함수
const addLog = (type, message, details = null) => {
  logs.value.push({
    type,
    message,
    details,
    timestamp: new Date().toLocaleTimeString(),
  })

  // 최대 100개 로그만 유지
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(-100)
  }
}

// 테스트 결과 저장
const saveTestResult = (testName, success, message = null) => {
  testResults.value[testName] = { success, message, timestamp: new Date() }
}

// 개별 API 테스트 함수들
const testGetTodayMessages = async () => {
  const testName = 'getTodayMessages'
  try {
    addLog('info', 'GET /api/messages/today 테스트 시작')
    const response = await messageStore.getTodayMessages()

    if (response.success) {
      addLog(
        'success',
        'GET /api/messages/today 성공',
        `${response.data.messages?.length || 0}개 메시지`,
      )
      saveTestResult(testName, true)
    } else {
      addLog('error', 'GET /api/messages/today 실패', response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', 'GET /api/messages/today 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testGetAvailableDates = async () => {
  const testName = 'getAvailableDates'
  try {
    addLog('info', 'GET /api/messages/dates 테스트 시작')
    const response = await messageStore.getAvailableDates()

    if (response.success) {
      addLog('success', 'GET /api/messages/dates 성공', `${response.data.length}개 날짜`)
      saveTestResult(testName, true)
    } else {
      addLog('error', 'GET /api/messages/dates 실패', response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', 'GET /api/messages/dates 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testGetMessagesByDate = async () => {
  const testName = 'getMessagesByDate'
  try {
    addLog('info', `GET /api/messages/date/${testDate.value} 테스트 시작`)
    const response = await messageStore.getMessagesByDate(testDate.value)

    if (response.success) {
      addLog(
        'success',
        `GET /api/messages/date/${testDate.value} 성공`,
        `${response.data.messages?.length || 0}개 메시지`,
      )
      saveTestResult(testName, true)
    } else {
      addLog('error', `GET /api/messages/date/${testDate.value} 실패`, response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', `GET /api/messages/date/${testDate.value} 오류`, err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testSendMessage = async () => {
  const testName = 'sendMessage'
  try {
    addLog('info', 'POST /api/messages 테스트 시작', testMessageContent.value)
    const response = await messageStore.sendMessageAPI(testMessageContent.value)

    if (response.success) {
      addLog('success', 'POST /api/messages 성공', `메시지 ID: ${response.data.id}`)
      saveTestResult(testName, true)
      // 새로운 테스트 메시지 내용 생성
      testMessageContent.value = '테스트 메시지 - ' + new Date().toLocaleTimeString()
    } else {
      addLog('error', 'POST /api/messages 실패', response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', 'POST /api/messages 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testGetTodayStats = async () => {
  const testName = 'getTodayStats'
  try {
    addLog('info', 'GET /api/stats/today 테스트 시작')
    const response = await messageStore.getTodayStats()

    if (response.success) {
      addLog('success', 'GET /api/stats/today 성공', `오늘 메시지: ${response.data.count}개`)
      saveTestResult(testName, true)
    } else {
      addLog('error', 'GET /api/stats/today 실패', response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', 'GET /api/stats/today 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testGetAllStats = async () => {
  const testName = 'getAllStats'
  try {
    addLog('info', 'GET /api/stats/all 테스트 시작')
    const response = await messageStore.getAllStats()

    if (response.success) {
      addLog('success', 'GET /api/stats/all 성공', `총 ${response.data.totalDays}일간의 통계`)
      saveTestResult(testName, true)
    } else {
      addLog('error', 'GET /api/stats/all 실패', response.message)
      saveTestResult(testName, false, response.message)
    }
  } catch (err) {
    addLog('error', 'GET /api/stats/all 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

const testHealthCheck = async () => {
  const testName = 'healthCheck'
  try {
    addLog('info', 'GET /actuator/health 테스트 시작')
    const response = await apiService.healthCheck()

    addLog('success', 'GET /actuator/health 성공', '서버가 정상 작동 중')
    saveTestResult(testName, true)
  } catch (err) {
    addLog('error', 'GET /actuator/health 오류', err.message)
    saveTestResult(testName, false, err.message)
  }
}

// Rate Limiting 테스트 함수
const testRateLimit = async () => {
  rateLimitTesting.value = true
  rateLimitCount.value = 0
  rateLimitResult.value = null

  addLog('info', '🚦 Rate Limiting 테스트 시작 - 15개 요청 전송')

  const results = {
    totalRequests: 15,
    successCount: 0,
    rateLimitedCount: 0,
    firstRateLimitAt: null,
  }

  try {
    for (let i = 1; i <= 15; i++) {
      rateLimitCount.value = i

      try {
        const testContent = `Rate Limit 테스트 메시지 ${i}/15 - ${new Date().toLocaleTimeString()}`
        await apiService.sendMessage({ content: testContent })

        results.successCount++
        addLog('success', `요청 ${i}/15 성공`, testContent.substring(0, 30) + '...')

        // 요청 간 짧은 지연 (Rate Limiting 회피하지 않도록)
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        if (error.response?.status === 429) {
          results.rateLimitedCount++
          if (!results.firstRateLimitAt) {
            results.firstRateLimitAt = i
          }
          addLog('warning', `요청 ${i}/15 Rate Limited (429)`, error.message)
        } else {
          addLog('error', `요청 ${i}/15 실패`, error.message)
        }
      }
    }

    // 결과 분석
    const success = results.rateLimitedCount > 0

    rateLimitResult.value = {
      ...results,
      success,
    }

    if (success) {
      addLog(
        'success',
        '✅ Rate Limiting 테스트 성공!',
        `${results.firstRateLimitAt}번째 요청부터 Rate Limited`,
      )
    } else {
      addLog(
        'warning',
        '⚠️ Rate Limiting이 발생하지 않음',
        '서버 설정을 확인하거나 더 많은 요청이 필요할 수 있습니다',
      )
    }
  } catch (error) {
    addLog('error', '❌ Rate Limiting 테스트 중 오류', error.message)
    rateLimitResult.value = {
      ...results,
      success: false,
      error: error.message,
    }
  } finally {
    rateLimitTesting.value = false
    rateLimitCount.value = 0
  }
}

// WebSocket 테스트 함수들
const connectWebSocket = () => {
  addLog('info', 'WebSocket 연결 시작')
  wsStore.connect()
}

const disconnectWebSocket = () => {
  addLog('info', 'WebSocket 연결 해제')
  wsStore.disconnect()
}

const testWebSocketPing = () => {
  addLog('info', 'WebSocket Ping 테스트')
  wsStore.sendPing()
}

const testWebSocket = async () => {
  addLog('info', 'WebSocket 전체 테스트 시작')

  if (!wsStore.connected) {
    connectWebSocket()
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  if (wsStore.connected) {
    testWebSocketPing()
    addLog('success', 'WebSocket 테스트 완료')
  } else {
    addLog('error', 'WebSocket 연결 실패')
  }
}

// 테스트 메시지 전송
const sendTestMessage = async () => {
  await testSendMessage()
}

// 모든 API 테스트
const testAllAPIs = async () => {
  testing.value = true
  addLog('info', '🔄 모든 API 테스트 시작')

  try {
    // 메시지 API 테스트
    await testGetTodayMessages()
    await testGetAvailableDates()
    await testGetMessagesByDate()

    // 통계 API 테스트
    await testGetTodayStats()
    await testGetAllStats()

    // 헬스체크
    await testHealthCheck()

    addLog('success', '✅ 모든 API 테스트 완료')
  } catch (err) {
    addLog('error', '❌ API 테스트 중 오류 발생', err.message)
  } finally {
    testing.value = false
  }
}

// 로그 지우기
const clearLogs = () => {
  logs.value = []
  testResults.value = {}
  addLog('info', '로그가 지워졌습니다')
}

// WebSocket 메시지 수신 감지
const setupWebSocketListeners = () => {
  // WebSocket 메시지 수신 시 카운트 증가
  wsStore.onMessage('newMessage', () => {
    receivedMessages.value += 1
    addLog('info', 'WebSocket 메시지 수신', `총 ${receivedMessages.value}개 수신`)
  })
}

// 컴포넌트 마운트
onMounted(() => {
  console.log('✅ TestView 컴포넌트가 마운트되었습니다!')
  addLog('info', '🧪 테스트 도구가 시작되었습니다')

  setupWebSocketListeners()

  // WebSocket 자동 연결 시도
  if (!wsStore.connected) {
    connectWebSocket()
  }
})

// 컴포넌트 언마운트
onUnmounted(() => {
  console.log('👋 TestView 컴포넌트가 언마운트됩니다.')
})
</script>

<style scoped>
.btn-test {
  @apply px-4 py-2 rounded font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed;
}

.btn-test-sm {
  @apply px-3 py-1 rounded text-sm font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed;
}
</style>
