import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
    // 在开发模式下禁用HMR，避免与Wails冲突和ATS问题
    hmr: false, // 完全禁用HMR避免localhost:5174连接问题
    // 添加代理配置，避免404错误
    proxy: {
      '/api': {
        target: 'http://localhost:34115',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // 优化构建以避免chunk加载问题
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser', // 使用terser确保中文字符正确处理
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
        // 确保Unicode字符正确处理
        ascii_only: false,
        ecma: 2020,
      },
    },
  },
  // 为Wails环境优化
  define: {
    global: 'globalThis',
  },
  // 确保资源正确加载
  base: './',
})
