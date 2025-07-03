<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">📊 통계 대시보드</h1>
      <p class="text-gray-600">메시지 작성 패턴과 성과를 확인해보세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">통계를 불러오는 중...</span>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">{{ error }}</p>
      <button
        @click="loadAllStats"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        다시 시도
      </button>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="space-y-6">
      <!-- 새로고침 버튼 -->
      <div class="flex justify-end">
        <button
          @click="refreshStats"
          :disabled="refreshing"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {{ refreshing ? '새로고침 중...' : '📊 통계 새로고침' }}
        </button>
      </div>

      <!-- 오늘의 현황 -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">🌅 오늘의 현황</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ todayStats.count || 0 }}</div>
            <div class="text-sm text-gray-600">오늘 작성한 메시지</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ totalDays }}</div>
            <div class="text-sm text-gray-600">총 기록 일수</div>
          </div>
          <div class="text-center md:col-span-1 col-span-2">
            <div class="text-3xl font-bold text-purple-600">{{ averagePerDay }}</div>
            <div class="text-sm text-gray-600">일평균 메시지</div>
          </div>
        </div>
      </div>

      <!-- 최근 7일 활동 차트 -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 최근 7일 활동</h3>
        <div class="space-y-2">
          <div
            v-for="day in recentSevenDays"
            :key="day.date"
            class="flex items-center justify-between p-2 rounded hover:bg-gray-50"
          >
            <div class="flex items-center space-x-3">
              <span class="text-sm font-medium text-gray-700 w-20">{{
                formatDayDate(day.date)
              }}</span>
              <span class="text-xs text-gray-500">{{ formatDayName(day.date) }}</span>
            </div>

            <div class="flex items-center space-x-3 flex-1 mx-4">
              <div class="flex-1 bg-gray-200 rounded-full h-2 relative">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :class="getBarColor(day.count)"
                  :style="{ width: `${getBarWidth(day.count)}%` }"
                ></div>
              </div>
              <span class="text-sm font-medium text-gray-700 w-8 text-right">{{ day.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 월별 통계 -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📅 월별 통계</h3>
        <div v-if="monthlyStats.length === 0" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-4">📊</div>
          <p>아직 충분한 데이터가 없습니다.</p>
          <p class="text-sm mt-2">더 많은 메시지를 작성하면 월별 통계를 볼 수 있습니다.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="month in monthlyStats" :key="month.month" class="bg-gray-50 rounded-lg p-4">
            <div class="text-lg font-semibold text-gray-900">{{ month.month }}</div>
            <div class="text-2xl font-bold text-blue-600">{{ month.count }}</div>
            <div class="text-sm text-gray-500">{{ month.days }}일 기록</div>
          </div>
        </div>
      </div>

      <!-- 성과 배지 -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🏆 성과 배지</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="text-center p-4 rounded-lg transition-all duration-200"
            :class="
              badge.earned
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            "
          >
            <div class="text-3xl mb-2">{{ badge.icon }}</div>
            <div class="font-medium text-gray-900">{{ badge.name }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ badge.description }}</div>
            <div v-if="badge.earned" class="text-xs text-green-600 mt-2 font-medium">
              달성! {{ badge.earnedDate }}
            </div>
            <div v-else class="text-xs text-gray-500 mt-2">
              {{ badge.progress }}
            </div>
          </div>
        </div>
      </div>

      <!-- 통계 요약 -->
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📋 전체 요약</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ totalMessages }}</div>
            <div class="text-sm text-gray-600">총 메시지</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-pink-600">{{ mostActiveDay?.count || 0 }}</div>
            <div class="text-sm text-gray-600">최고 기록</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-indigo-600">{{ streak }}</div>
            <div class="text-sm text-gray-600">연속 기록</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ daysSinceStart }}</div>
            <div class="text-sm text-gray-600">시작한 지</div>
          </div>
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
  name: 'StatsView',
})

// 상태 관리
const messageStore = useMessageStore()

// 반응형 데이터
const loading = ref(true)
const refreshing = ref(false)
const error = ref(null)
const todayStats = ref({ count: 0, date: '', createdAt: '', updatedAt: '' })
const allStats = ref({ stats: [], totalDays: 0 })

// 계산된 속성
const totalDays = computed(() => allStats.value.totalDays || 0)
const totalMessages = computed(() => {
  return allStats.value.stats.reduce((total, stat) => total + stat.count, 0)
})
const averagePerDay = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.round((totalMessages.value / totalDays.value) * 10) / 10
})

// 최근 7일 데이터
const recentSevenDays = computed(() => {
  const days = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]

    const stat = allStats.value.stats.find((s) => s.date === dateString)
    days.push({
      date: dateString,
      count: stat ? stat.count : 0,
    })
  }
  return days
})

// 월별 통계
const monthlyStats = computed(() => {
  const monthlyData = new Map()

  allStats.value.stats.forEach((stat) => {
    const date = new Date(stat.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { month: monthName, count: 0, days: 0 })
    }

    const data = monthlyData.get(monthKey)
    data.count += stat.count
    data.days += 1
  })

  return Array.from(monthlyData.values()).sort((a, b) => b.month.localeCompare(a.month))
})

// 최고 기록 날짜
const mostActiveDay = computed(() => {
  if (allStats.value.stats.length === 0) return null
  return allStats.value.stats.reduce((max, stat) => (stat.count > max.count ? stat : max))
})

// 연속 기록일 계산
const streak = computed(() => {
  const stats = [...allStats.value.stats].sort((a, b) => new Date(b.date) - new Date(a.date))
  let currentStreak = 0
  let expectedDate = new Date()

  for (const stat of stats) {
    const statDate = new Date(stat.date)
    const expectedDateString = expectedDate.toISOString().split('T')[0]

    if (stat.date === expectedDateString && stat.count > 0) {
      currentStreak++
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      break
    }
  }

  return currentStreak
})

// 시작한 지 며칠
const daysSinceStart = computed(() => {
  if (allStats.value.stats.length === 0) return 0
  const firstDate = new Date(Math.min(...allStats.value.stats.map((s) => new Date(s.date))))
  const today = new Date()
  const diffTime = Math.abs(today - firstDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// 성과 배지
const badges = computed(() => {
  const totalMsg = totalMessages.value
  const maxDaily = mostActiveDay.value?.count || 0
  const streakDays = streak.value
  const activeDays = totalDays.value

  return [
    {
      id: 'first-message',
      name: '첫 걸음',
      description: '첫 메시지 작성',
      icon: '🎯',
      earned: totalMsg >= 1,
      earnedDate: totalMsg >= 1 ? '달성함' : null,
      progress: totalMsg >= 1 ? '완료' : `${totalMsg}/1`,
    },
    {
      id: 'daily-champion',
      name: '하루 챔피언',
      description: '하루에 10개 메시지',
      icon: '🏆',
      earned: maxDaily >= 10,
      earnedDate: maxDaily >= 10 ? '달성함' : null,
      progress: maxDaily >= 10 ? '완료' : `${maxDaily}/10`,
    },
    {
      id: 'week-warrior',
      name: '주간 워리어',
      description: '7일 연속 기록',
      icon: '🔥',
      earned: streakDays >= 7,
      earnedDate: streakDays >= 7 ? '달성함' : null,
      progress: streakDays >= 7 ? '완료' : `${streakDays}/7`,
    },
    {
      id: 'hundred-club',
      name: '백 클럽',
      description: '총 100개 메시지',
      icon: '💯',
      earned: totalMsg >= 100,
      earnedDate: totalMsg >= 100 ? '달성함' : null,
      progress: totalMsg >= 100 ? '완료' : `${totalMsg}/100`,
    },
    {
      id: 'month-master',
      name: '월간 마스터',
      description: '30일 동안 기록',
      icon: '📅',
      earned: activeDays >= 30,
      earnedDate: activeDays >= 30 ? '달성함' : null,
      progress: activeDays >= 30 ? '완료' : `${activeDays}/30`,
    },
    {
      id: 'dedication',
      name: '헌신',
      description: '500개 메시지 달성',
      icon: '🌟',
      earned: totalMsg >= 500,
      earnedDate: totalMsg >= 500 ? '달성함' : null,
      progress: totalMsg >= 500 ? '완료' : `${totalMsg}/500`,
    },
  ]
})

// 날짜 포맷팅 함수
const formatDayDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', { weekday: 'short' })
}

// 차트 관련 함수
const getBarWidth = (count) => {
  if (recentSevenDays.value.length === 0) return 0
  const maxCount = Math.max(...recentSevenDays.value.map((d) => d.count), 1)
  return (count / maxCount) * 100
}

const getBarColor = (count) => {
  if (count === 0) return 'bg-gray-300'
  if (count <= 2) return 'bg-green-300'
  if (count <= 5) return 'bg-green-400'
  if (count <= 10) return 'bg-green-500'
  return 'bg-green-600'
}

// API 호출 함수들
const loadTodayStats = async () => {
  try {
    console.log('🔄 StatsView: 오늘 통계 로드 시작')
    const response = await messageStore.getTodayStats()

    if (response.success) {
      todayStats.value = response.data
      console.log('✅ StatsView: 오늘 통계 로드 성공:', response.data)
    } else {
      console.error('❌ StatsView: 오늘 통계 로드 실패:', response.message)
      todayStats.value = { count: 0, date: '', createdAt: '', updatedAt: '' }
    }
  } catch (err) {
    console.error('❌ StatsView: 오늘 통계 로드 오류:', err)
    todayStats.value = { count: 0, date: '', createdAt: '', updatedAt: '' }
  }
}

const loadAllStats = async () => {
  try {
    loading.value = true
    error.value = null

    console.log('🔄 StatsView: 전체 통계 로드 시작')
    const response = await messageStore.getAllStats()

    if (response.success) {
      allStats.value = response.data
      console.log('✅ StatsView: 전체 통계 로드 성공:', response.data)
    } else {
      error.value = response.message || '통계를 불러오는데 실패했습니다.'
      console.error('❌ StatsView: 전체 통계 로드 실패:', response.message)
    }
  } catch (err) {
    console.error('❌ StatsView: 전체 통계 로드 오류:', err)
    error.value = '서버 연결에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 통계 새로고침
const refreshStats = async () => {
  refreshing.value = true
  await Promise.all([loadTodayStats(), loadAllStats()])
  refreshing.value = false
}

// 컴포넌트 마운트
onMounted(async () => {
  console.log('✅ StatsView 컴포넌트가 마운트되었습니다!')
  await Promise.all([loadTodayStats(), loadAllStats()])
})
</script>
