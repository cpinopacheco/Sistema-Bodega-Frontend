import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Configuración correcta para el historyApiFallback en Vite
    proxy: undefined,
    open: undefined,
    cors: true,
    middlewareMode: false,
  },
  preview: {
    // Configuración correcta para el preview
    port: 5000,
  },
  // Configuración para el build que asegura que todas las rutas se manejen correctamente
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
