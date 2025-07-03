import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api'
import { useToastStore } from '@/stores/toast'

export const useMessageStore = defineStore('message', () => {
  // State
  const todayMessages = ref(null)
  const selectedDateMessages = ref(null)
  const availableDates = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 하이브리드 메시지 관리
  // 초기 조회: REST API 사용
  // 실시간 업데이트: WebSocket 사용
  // 메시지 전송: API 사용

  const loadTodayMessages = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.getTodayMessages()

      todayMessages.value = response.data.data || response.data

      return {
        success: true,
        data: todayMessages.value,
        message: 'Initial messages loaded successfully',
      }
    } catch (err) {
      console.error('❌ API 호출 실패:', err)
      error.value =
        err.response?.data?.message || err.message || '메시지를 불러오는데 실패했습니다.'

      return {
        success: false,
        data: null,
        message: error.value,
      }
    } finally {
      loading.value = false
    }
  }

  const loadMessagesByDate = async (date) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.getMessagesByDate(date)
      selectedDateMessages.value = response.data.data || response.data
      return selectedDateMessages.value
    } catch (err) {
      error.value = err.response?.data?.message || '메시지를 불러오는데 실패했습니다.'
      console.error('Failed to load messages by date:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadAvailableDates = async () => {
    try {
      const response = await apiService.getAvailableDates()
      availableDates.value = response.data.data || response.data
      return availableDates.value
    } catch (err) {
      console.error('Failed to load available dates:', err)
      throw err
    }
  }

  const sendMessage = async (content) => {
    const toastStore = useToastStore()

    try {
      const response = await apiService.sendMessage({ content })

      console.log('📤 API 응답:', response.data)

      // API 응답의 success 필드 확인 (다양한 형태의 false 값 처리)
      if (response.success === false || response.success === 'false') {
        const errorMessage = response.message || '메시지 전송에 실패했습니다.'

        toastStore.showError('메시지 전송 실패', errorMessage)

        const error = new Error(errorMessage)
        error.response = response
        throw error
      }

      const newMessage = response.data.data || response.data
      // 메시지 전송은 API만 사용, 메시지 목록은 WebSocket을 통해 실시간 업데이트
      return newMessage
    } catch (err) {
      console.error('❌ 메시지 전송 실패:', err)
      console.log('🔍 에러 전체 구조:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
      })

      // HTTP 상태 코드별 처리
      if (err.response) {
        const status = err.response.status
        const responseData = err.response.data

        console.log(`🔥 HTTP ${status} 에러 발생:`, responseData)

        let errorMessage = '메시지 전송에 실패했습니다.'

        // 429 Too Many Requests 처리
        if (status === 429) {
          errorMessage = responseData?.message || '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
        }
        // 400번대 에러 처리
        else if (status >= 400 && status < 500) {
          errorMessage = responseData?.message || `클라이언트 오류 (${status})`
        }
        // 500번대 서버 에러 처리
        else if (status >= 500) {
          errorMessage = responseData?.message || '서버 오류가 발생했습니다.'
        }
        // 기타 응답에서 메시지 추출
        else {
          errorMessage = responseData?.message || err.message || errorMessage
        }

        console.log('🚨 HTTP 에러 - 토스트 표시:', errorMessage)
        toastStore.showError('메시지 전송 실패', errorMessage)
      } else {
        // 네트워크 에러 등
        const errorMessage = err.message || '네트워크 연결에 실패했습니다.'
        console.log('🚨 네트워크 에러 - 토스트 표시:', errorMessage)
        toastStore.showError('네트워크 오류', errorMessage)
      }

      throw err
    }
  }

  const addNewMessage = (message) => {
    // WebSocket을 통해 새 메시지 실시간 추가
    if (todayMessages.value) {
      // 중복 방지 체크
      const exists = todayMessages.value.messages.some((m) => m.id === message.id)
      if (!exists) {
        todayMessages.value.messages.push(message)
        todayMessages.value.totalCount = todayMessages.value.messages.length
      }
    } else {
      // todayMessages가 없는 경우 초기화
      todayMessages.value = {
        date: new Date().toISOString().split('T')[0],
        messages: [message],
        totalCount: 1,
      }
    }
  }

  const updateTodayMessages = (data) => {
    // REST API로 받은 초기 메시지 목록으로 설정 (덮어쓰기)
    todayMessages.value = {
      date: data.date,
      messages: data.messages || [],
      totalCount: data.totalCount || data.messages?.length || 0,
    }
  }

  const handleDailyReset = () => {
    // 새로운 하루 시작 시 호출
    todayMessages.value = {
      date: new Date().toISOString().split('T')[0],
      messages: [],
      totalCount: 0,
    }
  }

  // 통계 관련 메서드들 추가
  const getTodayMessages = async () => {
    try {
      const response = await apiService.getTodayMessages()
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('getTodayMessages 실패:', err)
      return {
        success: false,
        data: null,
        message: err.message || '오늘 메시지를 불러오는데 실패했습니다.',
      }
    }
  }

  const getMessagesByDate = async (date) => {
    try {
      const response = await apiService.getMessagesByDate(date)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('getMessagesByDate 실패:', err)
      return {
        success: false,
        data: null,
        message: err.message || '해당 날짜의 메시지를 불러오는데 실패했습니다.',
      }
    }
  }

  const getAvailableDates = async () => {
    try {
      const response = await apiService.getAvailableDates()
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('getAvailableDates 실패:', err)
      return {
        success: false,
        data: [],
        message: err.message || '날짜 목록을 불러오는데 실패했습니다.',
      }
    }
  }

  const sendMessageAPI = async (content) => {
    try {
      const response = await apiService.sendMessage({ content })
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('sendMessage 실패:', err)
      return {
        success: false,
        data: null,
        message: err.message || '메시지 전송에 실패했습니다.',
      }
    }
  }

  const getTodayStats = async () => {
    try {
      const response = await apiService.getTodayStats()
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('getTodayStats 실패:', err)
      return {
        success: false,
        data: { count: 0, date: '', createdAt: '', updatedAt: '' },
        message: err.message || '오늘 통계를 불러오는데 실패했습니다.',
      }
    }
  }

  const getAllStats = async () => {
    try {
      const response = await apiService.getAllStats()
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (err) {
      console.error('getAllStats 실패:', err)
      return {
        success: false,
        data: { stats: [], totalDays: 0 },
        message: err.message || '전체 통계를 불러오는데 실패했습니다.',
      }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    todayMessages,
    selectedDateMessages,
    availableDates,
    loading,
    error,

    // Core Actions (하이브리드 방식)
    loadTodayMessages, // REST API 초기 로드
    sendMessage, // API 전송
    addNewMessage, // WebSocket 실시간 추가
    updateTodayMessages, // 초기 데이터 설정
    handleDailyReset,
    clearError,

    // Legacy Actions (히스토리/통계용)
    loadMessagesByDate,
    loadAvailableDates,

    // API 래퍼 메서드들 (테스트용)
    getTodayMessages,
    getMessagesByDate,
    getAvailableDates,
    sendMessageAPI,
    getTodayStats,
    getAllStats,
  }
})
