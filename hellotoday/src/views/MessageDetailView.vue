<template>
  <div class="space-y-6 pb-20">
    <!-- 디버그: 컴포넌트 로드 확인 -->
    <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      MessageDetailView 컴포넌트가 로드되었습니다! (날짜: {{ date }})
    </div>

    <!-- Header -->
    <div class="flex items-center space-x-4">
      <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl">
        ←
      </button>
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ formatDate(date) }}
        </h2>
        <p class="text-gray-600 text-sm">{{ messages.length }}개의 메시지</p>
      </div>
    </div>

    <!-- Messages -->
    <div class="space-y-4">
      <div v-if="messages.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-gray-500">이 날에는 메시지가 없습니다.</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="bg-white rounded-lg shadow-sm border p-4"
      >
        <div class="flex items-start space-x-3">
          <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm">👤</span>
          </div>
          <div class="flex-1">
            <div class="text-gray-900 whitespace-pre-wrap">
              {{ message.content }}
            </div>
            <div class="mt-2 text-xs text-gray-500">
              {{ formatTime(message.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const date = route.params.date
const messages = ref([])

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  console.log('MessageDetailView 컴포넌트가 마운트되었습니다. 날짜:', date)

  // 임시 메시지 데이터 생성
  const sampleMessages = [
    '오늘은 정말 좋은 하루였어요!',
    '새로운 도전을 시작해보려고 합니다.',
    '가족과 함께 보낸 시간이 소중했습니다.',
    '내일은 더 나은 하루가 되길 바랍니다.',
  ]

  const messageCount = Math.floor(Math.random() * 4) + 1

  for (let i = 0; i < messageCount; i++) {
    const randomTime = new Date(date)
    randomTime.setHours(Math.floor(Math.random() * 24))
    randomTime.setMinutes(Math.floor(Math.random() * 60))

    messages.value.push({
      id: i,
      content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      createdAt: randomTime.toISOString(),
    })
  }

  // 시간순 정렬
  messages.value.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})
</script>
