import { defineStore } from 'pinia'
import { ref } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { useMessageStore } from './message'

export const useWebSocketStore = defineStore('websocket', () => {
  // State
  const connected = ref(false)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const client = ref(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const lastError = ref(null)
  const messageListeners = ref(new Map())

  // Actions
  const connect = () => {
    if (isConnected.value || isConnecting.value) {
      return
    }

    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/ws'

    isConnecting.value = true
    lastError.value = null
    const messageStore = useMessageStore()

    try {
      // SockJS 클라이언트 생성
      const socket = new SockJS(wsUrl)

      // STOMP 클라이언트 생성
      client.value = new Client({
        webSocketFactory: () => socket,
        debug: () => {
          // Silent debug
        },

        // 연결 타임아웃 설정
        connectionTimeout: 10000,

        // 하트비트 설정
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: (frame) => {
          connected.value = true
          isConnected.value = true
          isConnecting.value = false
          reconnectAttempts.value = 0
          lastError.value = null

          // 메시지 채널 구독 - 서버에서 @SubscribeMapping으로 초기 데이터를 보내줌
          const subscription = client.value.subscribe('/topic/messages', (message) => {
            try {
              const data = JSON.parse(message.body)

              // 구독 시 받는 초기 메시지 목록인지 새로운 단일 메시지인지 확인
              if (data.messages && Array.isArray(data.messages)) {
                // 초기 메시지 목록 (DailyMessageResponse)
                messageStore.updateTodayMessages(data)
              } else if (data.id && data.content) {
                // 새로운 단일 메시지
                messageStore.addNewMessage(data)
              } else {
                console.warn('❓ 알 수 없는 메시지 형식:', data)
              }
            } catch (err) {
              console.error('❌ 메시지 파싱 실패:', err)
              console.error('❌ 원본 메시지:', message.body)
            }
          })

          // 일일 리셋 알림 구독
          client.value.subscribe('/topic/reset', (message) => {
            messageStore.handleDailyReset()

            // 사용자에게 알림 (선택사항)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Hello Today', {
                body: '새로운 하루가 시작되었습니다!',
                icon: '/favicon.ico',
              })
            }
          })
        },

        onDisconnect: (frame) => {
          connected.value = false
          isConnected.value = false
          isConnecting.value = false
        },

        onStompError: (frame) => {
          console.error('🚨 STOMP 프로토콜 오류:', frame)
          lastError.value = `STOMP Error: ${frame.headers.message || 'Unknown error'}`
          connected.value = false
          isConnected.value = false
          isConnecting.value = false

          // 자동 재연결 시도
          attemptReconnect()
        },

        onWebSocketError: (event) => {
          console.error('🚨 WebSocket 연결 오류:', event)
          lastError.value = 'WebSocket connection failed'
          connected.value = false
          isConnected.value = false
          isConnecting.value = false

          // 자동 재연결 시도
          attemptReconnect()
        },

        onWebSocketClose: (event) => {
          // 정상 종료가 아닌 경우 재연결 시도
          if (event.code !== 1000) {
            lastError.value = `Connection closed: ${event.reason || 'Unknown reason'}`
            attemptReconnect()
          }
        },
      })

      // 연결 시작
      client.value.activate()
    } catch (error) {
      console.error('❌ WebSocket 클라이언트 생성 실패:', error)
      lastError.value = error.message
      isConnecting.value = false
      attemptReconnect()
    }
  }

  const disconnect = () => {
    if (client.value) {
      client.value.deactivate()
      client.value = null
    }
    connected.value = false
    isConnected.value = false
    isConnecting.value = false
    reconnectAttempts.value = 0
    lastError.value = null
  }

  // 메시지 리스너 추가
  const onMessage = (type, callback) => {
    if (!messageListeners.value.has(type)) {
      messageListeners.value.set(type, [])
    }
    messageListeners.value.get(type).push(callback)
  }

  // 메시지 전송
  const send = (destination, data) => {
    if (client.value && isConnected.value) {
      try {
        client.value.publish({
          destination,
          body: JSON.stringify(data),
        })
      } catch (error) {
        console.error('메시지 전송 실패:', error)
        throw error
      }
    } else {
      throw new Error('WebSocket이 연결되지 않았습니다.')
    }
  }

  // 구독
  const subscribe = (destination, callback) => {
    if (client.value && isConnected.value) {
      return client.value.subscribe(destination, callback)
    } else {
      throw new Error('WebSocket이 연결되지 않았습니다.')
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      lastError.value = 'Max reconnection attempts reached'
      return
    }

    reconnectAttempts.value += 1
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000) // 최대 30초

    setTimeout(() => {
      if (!isConnected.value && !isConnecting.value) {
        connect()
      }
    }, delay)
  }

  const sendPing = () => {
    if (client.value && isConnected.value) {
      try {
        client.value.publish({
          destination: '/app/ping',
          body: JSON.stringify({ timestamp: Date.now() }),
        })
      } catch (error) {
        console.error('❌ Ping 전송 실패:', error)
      }
    }
  }

  // 연결 상태 체크를 위한 헬스체크
  const startHealthCheck = () => {
    setInterval(() => {
      if (isConnected.value) {
        sendPing()
      } else if (!isConnecting.value && reconnectAttempts.value < maxReconnectAttempts.value) {
        connect()
      }
    }, 30000) // 30초마다 체크
  }

  // 수동 재연결
  const forceReconnect = () => {
    disconnect()
    reconnectAttempts.value = 0
    lastError.value = null
    setTimeout(() => connect(), 1000)
  }

  return {
    // State
    connected,
    isConnected,
    isConnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    lastError,

    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    onMessage,
    sendPing,
    startHealthCheck,
    forceReconnect,
  }
})
