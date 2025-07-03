<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 space-y-2" style="z-index: 99999">
      <TransitionGroup name="toast" tag="div" class="space-y-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm min-w-80"
          :class="{
            'border-red-500': toast.type === 'error',
            'border-green-500': toast.type === 'success',
            'border-yellow-500': toast.type === 'warning',
            'border-blue-500': toast.type === 'info',
          }"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <CheckCircleIcon v-if="toast.type === 'success'" class="h-5 w-5 text-green-500" />
              <ExclamationTriangleIcon
                v-else-if="toast.type === 'warning'"
                class="h-5 w-5 text-yellow-500"
              />
              <XCircleIcon v-else-if="toast.type === 'error'" class="h-5 w-5 text-red-500" />
              <InformationCircleIcon v-else class="h-5 w-5 text-blue-500" />
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ toast.title }}
              </p>
              <p v-if="toast.message" class="mt-1 text-sm text-gray-600">
                {{ toast.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <button
                @click="removeToast(toast.id)"
                class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '@/stores/toast'

// 컴포넌트 이름 명시 (DevTools용)
defineOptions({
  name: 'Toast',
})

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
const { removeToast } = toastStore

// 토스트 변화 감시 (디버깅용)
watch(
  toasts,
  (newToasts) => {
    console.log('🍞 Toast 컴포넌트: 토스트 목록 변경됨', newToasts.length, '개')
    newToasts.forEach((toast) => {
      console.log(`  - ${toast.type}: ${toast.title} - ${toast.message}`)
    })
  },
  { deep: true },
)
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
