<template>
  <div
    class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200"
    :class="{ 'animate-slideIn': isNew }"
  >
    <div class="flex items-start space-x-3">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <div
          class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"
        >
          <UserIcon class="w-4 h-4 text-white" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Message content -->
        <div class="text-gray-900 whitespace-pre-wrap break-words">
          {{ message.content }}
        </div>

        <!-- Timestamp -->
        <div class="mt-2 flex items-center text-xs text-gray-500">
          <ClockIcon class="w-3 h-3 mr-1" />
          <span>{{ message.timeAgo }}</span>
          <span class="mx-1">•</span>
          <span>{{ formatTime(message.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Reactions (추후 확장 가능) -->
    <div v-if="showReactions" class="mt-3 pt-3 border-t border-gray-100">
      <div class="flex items-center space-x-2">
        <button
          class="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
        >
          <HeartIcon class="w-4 h-4" />
          <span class="text-xs">공감</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { UserIcon, ClockIcon, HeartIcon } from '@heroicons/vue/24/outline'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 컴포넌트 이름 명시 (DevTools용)
defineOptions({
  name: 'MessageCard',
})

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  isOwn: {
    type: Boolean,
    default: false,
  },
  showReactions: {
    type: Boolean,
    default: false,
  },
})

const isNew = ref(false)

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return format(date, 'HH:mm', { locale: ko })
}

onMounted(() => {
  // 새로 추가된 메시지인 경우 애니메이션 효과
  const now = new Date()
  const messageTime = new Date(props.message.createdAt)
  const diffInSeconds = (now - messageTime) / 1000

  if (diffInSeconds < 5) {
    // 5초 이내 메시지
    isNew.value = true
    setTimeout(() => {
      isNew.value = false
    }, 2000)
  }
})
</script>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.5s ease-out;
}
</style>
