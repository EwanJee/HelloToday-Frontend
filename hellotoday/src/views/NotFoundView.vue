<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full text-center">
      <!-- 404 이미지/아이콘 -->
      <div class="mb-8">
        <div class="text-6xl mb-4">🤔</div>
        <h1 class="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p class="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
      </div>

      <!-- 액션 버튼들 -->
      <div class="space-y-4">
        <router-link
          to="/"
          class="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          홈으로 돌아가기
        </router-link>

        <button
          @click="goBack"
          class="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          이전 페이지로
        </button>
      </div>

      <!-- 도움말 링크 -->
      <div class="mt-8 text-sm text-gray-500">
        <p>문제가 지속되면 새로고침을 시도해보세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>
