import path from 'node:path'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

/** Ensures Netlify SPA fallback files exist in dist for Git and drag-and-drop deploys. */
function netlifySpaFallback(): Plugin {
  return {
    name: 'netlify-spa-fallback',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const indexHtml = path.join(dist, 'index.html')
      if (!existsSync(indexHtml)) return
      writeFileSync(path.join(dist, '_redirects'), '/*    /index.html   200\n')
      copyFileSync(indexHtml, path.join(dist, '404.html'))
    },
  }
}

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    netlifySpaFallback(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@public': path.resolve(__dirname, './src/public'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
  define: {
    global: 'globalThis',
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      '/flutter': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
