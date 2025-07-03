import axios from 'axios'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 요청 로깅 (개발환경에서만)
    if (import.meta.env.DEV) {
      console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
      if (config.data) {
        console.log('📦 요청 데이터:', config.data)
      }
    }
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  },
)

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발환경에서만)
    if (import.meta.env.DEV) {
      console.log(
        `✅ API 응답: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      )
      console.log('📋 응답 데이터:', response.data)
    }
    return response
  },
  (error) => {
    console.error(
      `❌ API 오류: ${error.response?.status || 'NO_RESPONSE'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
    )
    if (error.response?.data) {
      console.error('❌ 오류 상세:', error.response.data)
    }

    // 에러 메시지 정규화
    // 429 에러 우선 처리 (Rate Limiting)
    if (error.response?.status === 429) {
      // 서버 응답에서 메시지 추출 시도
      let message = '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'

      try {
        // JSON 형태의 응답인 경우
        if (error.response?.data?.message) {
          message = error.response.data.message
        }
        // 문자열 형태의 응답인 경우
        else if (typeof error.response?.data === 'string') {
          const parsed = JSON.parse(error.response.data)
          if (parsed.message) {
            message = parsed.message
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
        console.warn('429 에러 응답 파싱 실패:', e)
      }

      error.message = message
    } else if (error.response?.data?.message) {
      // 서버에서 제공한 메시지 사용
      error.message = error.response.data.message

      // 특정 에러 상황에 대한 추가 처리
      const serverMessage = error.response.data.message
      if (serverMessage.includes('입력값 검증에 실패')) {
        if (error.config?.data) {
          try {
            const requestData = JSON.parse(error.config.data)
            if (!requestData.content || requestData.content.trim() === '') {
              error.message = '메시지 내용을 입력해주세요.'
            } else if (requestData.content.length > 500) {
              error.message = '메시지는 500자 이하로 입력해주세요.'
            }
          } catch (e) {
            // JSON 파싱 실패 시 기본 메시지 유지
          }
        }
      }
    } else if (error.response?.status === 400) {
      error.message = '잘못된 요청입니다. 입력 내용을 확인해주세요.'
    } else if (error.response?.status === 413) {
      error.message = '메시지가 너무 깁니다. 500자 이하로 입력해주세요.'
    } else if (error.response?.status >= 500) {
      error.message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    } else if (error.code === 'ECONNABORTED') {
      error.message = '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'
    } else if (!error.response) {
      error.message = '네트워크 연결을 확인해주세요.'
    }

    return Promise.reject(error)
  },
)

// API 서비스 메서드들
const apiService = {
  // 메시지 관련 API
  messages: {
    // 오늘 메시지 조회
    getToday: async () => {
      console.log('📅 [메시지 API] 오늘 메시지 조회 시작')
      try {
        const response = await api.get('/api/messages/today')
        console.log('✅ [메시지 API] 오늘 메시지 조회 성공:', response.data)
        return response
      } catch (error) {
        console.error('❌ [메시지 API] 오늘 메시지 조회 실패:', error.message)
        throw error
      }
    },

    // 특정 날짜 메시지 조회
    getByDate: async (date) => {
      console.log(`📅 [메시지 API] ${date} 날짜 메시지 조회 시작`)
      try {
        const response = await api.get(`/api/messages/date/${date}`)
        console.log(`✅ [메시지 API] ${date} 날짜 메시지 조회 성공:`, response.data)
        return response
      } catch (error) {
        console.error(`❌ [메시지 API] ${date} 날짜 메시지 조회 실패:`, error.message)
        throw error
      }
    },

    // 사용 가능한 날짜 목록 조회
    getAvailableDates: async () => {
      try {
        const response = await api.get('/api/messages/dates')
        return response
      } catch (error) {
        throw error
      }
    },

    // 새 메시지 전송
    send: async (data) => {
      try {
        const response = await api.post('/api/messages', data)
        return response
      } catch (error) {
        throw error
      }
    },
  },

  // 통계 관련 API
  stats: {
    // 오늘 통계 조회
    getToday: async () => {
      console.log('📊 [통계 API] 오늘 통계 조회 시작')
      try {
        const response = await api.get('/api/stats/today')
        console.log('✅ [통계 API] 오늘 통계 조회 성공:', response.data)
        return response
      } catch (error) {
        console.error('❌ [통계 API] 오늘 통계 조회 실패:', error.message)
        throw error
      }
    },

    // 전체 통계 조회
    getAll: async () => {
      console.log('📊 [통계 API] 전체 통계 조회 시작')
      try {
        const response = await api.get('/api/stats/all')
        console.log('✅ [통계 API] 전체 통계 조회 성공:', response.data)
        return response
      } catch (error) {
        console.error('❌ [통계 API] 전체 통계 조회 실패:', error.message)
        throw error
      }
    },

    // 특정 날짜 통계 조회
    getByDate: async (date) => {
      console.log(`📊 [통계 API] ${date} 날짜 통계 조회 시작`)
      try {
        const response = await api.get(`/api/stats/date/${date}`)
        console.log(`✅ [통계 API] ${date} 날짜 통계 조회 성공:`, response.data)
        return response
      } catch (error) {
        console.error(`❌ [통계 API] ${date} 날짜 통계 조회 실패:`, error.message)
        throw error
      }
    },
  },

  // 헬스체크
  health: async () => {
    console.log('🏥 [헬스체크] 서버 상태 확인 시작')
    try {
      const response = await api.get('/actuator/health').catch(() => api.get('/'))
      console.log('✅ [헬스체크] 서버 상태 확인 성공:', response.data)
      return response
    } catch (error) {
      console.error('❌ [헬스체크] 서버 상태 확인 실패:', error.message)
      throw error
    }
  },
}

// 편의 메서드들 (하위 호환성)
export default {
  // 메시지 API
  getTodayMessages: () => {
    return apiService.messages.getToday()
  },
  getMessagesByDate: (date) => {
    return apiService.messages.getByDate(date)
  },
  getAvailableDates: () => {
    return apiService.messages.getAvailableDates()
  },
  sendMessage: (data) => {
    return apiService.messages.send(data)
  },

  // 통계 API
  getTodayStats: () => {
    return apiService.stats.getToday()
  },
  getAllStats: () => {
    return apiService.stats.getAll()
  },
  getStatsByDate: (date) => {
    return apiService.stats.getByDate(date)
  },

  // 기타
  healthCheck: () => {
    return apiService.health()
  },

  // 원본 API 인스턴스 (고급 사용법)
  api: apiService,
}
