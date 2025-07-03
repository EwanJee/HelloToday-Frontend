import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  // State
  const toasts = ref([])
  let nextId = 1

  // Actions
  const addToast = (toast) => {
    const id = nextId++
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration || 5000,
    }

    toasts.value.push(newToast)

    // 자동 제거
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    toasts.value = []
  }

  // 편의 메서드들
  const showSuccess = (title, message = '', duration = 3000) => {
    return addToast({ type: 'success', title, message, duration })
  }

  const showError = (title, message = '', duration = 5000) => {
    console.log('🎯 토스트 에러 표시:', { title, message, duration })
    const toastId = addToast({ type: 'error', title, message, duration })
    console.log('✅ 토스트 추가됨. ID:', toastId, '현재 토스트 수:', toasts.value.length)
    return toastId
  }

  const showWarning = (title, message = '', duration = 4000) => {
    return addToast({ type: 'warning', title, message, duration })
  }

  const showInfo = (title, message = '', duration = 3000) => {
    return addToast({ type: 'info', title, message, duration })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
})
