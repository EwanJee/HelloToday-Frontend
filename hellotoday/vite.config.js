import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 커스텀 컴포넌트 최적화
          isCustomElement: (tag) => tag.includes('-'),
        },
      },
    }),
  ],
  // global 변수 정의 (sockjs-client 호환성을 위해)
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true, // 외부 접속 허용
    proxy: {
      // 개발 시 API 프록시 설정 (선택사항)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // WebSocket 프록시 활성화
        secure: false,
      },
    },
  },
  build: {
    // 빌드 최적화
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 청크 분할 최적화
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          websocket: ['sockjs-client', '@stomp/stompjs'],
          utils: ['axios', 'date-fns'],
        },
      },
    },
  },
  optimizeDeps: {
    // 사전 번들링 최적화
    include: ['vue', 'vue-router', 'pinia', 'axios', 'date-fns', 'sockjs-client', '@stomp/stompjs'],
  },
})
