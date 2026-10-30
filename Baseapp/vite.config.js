import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const frontendRoot = fileURLToPath(new URL('../src/api/', import.meta.url))
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const dependencyAliases = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
})
  .filter((name) => name !== 'vite')
  .map((name) => ({ find: name, replacement: join(appRoot, 'node_modules', name) }))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/App\.jsx$/, replacement: fileURLToPath(new URL('../src/api/utils/App.jsx', import.meta.url)) },
      { find: /^@\/index\.css$/, replacement: fileURLToPath(new URL('../src/api/utils/index.css', import.meta.url)) },
      { find: /^@\/components(\/.*)?$/, replacement: `${frontendRoot}componentes$1` },
      { find: '@/api', replacement: frontendRoot },
      { find: '@', replacement: frontendRoot },
      ...dependencyAliases,
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [appRoot, frontendRoot],
    },
  },
});
