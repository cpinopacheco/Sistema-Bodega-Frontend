const express = require("express")
const cors = require("cors")
require("dotenv").config()

const { testConnection } = require("./src/config/database")

console.log("🔄 Importando rutas...")
const categoriesRoutes = require("./src/routes/categories")
const productsRoutes = require("./src/routes/products")
const withdrawalsRoutes = require("./src/routes/withdrawals")
const { router: authRoutes } = require("./src/routes/auth")
console.log("✅ Rutas importadas correctamente")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"], // Puertos comunes de React/Vite
        credentials: true,
    }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rutas
console.log("📋 Registrando rutas...")
app.use("/api/auth", authRoutes)
console.log("🔐 Ruta /api/auth registrada")
app.use("/api/categories", categoriesRoutes)
app.use("/api/products", productsRoutes)
app.use("/api/withdrawals", withdrawalsRoutes)
console.log("✅ Todas las rutas registradas")

// Ruta de prueba
app.get("/api/health", (req, res) => {
    res.json({
        message: "Backend funcionando correctamente",
        timestamp: new Date().toISOString(),
    })
})

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" })
})

// Iniciar servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        await testConnection()

        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
        })
    } catch (error) {
        console.error("❌ Error iniciando el servidor:", error)
        process.exit(1)
    }
}

startServer()
