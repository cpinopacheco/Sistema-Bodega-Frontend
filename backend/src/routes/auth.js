const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../config/database")
const router = express.Router()

console.log("🔐 Archivo auth.js cargado correctamente")

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({ error: "Token de acceso requerido" })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido" })
        }
        req.user = user
        next()
    })
}

// POST /api/auth/login - Iniciar sesión
router.post("/login", async (req, res) => {
    console.log("🚀 POST /api/auth/login - Intento de login recibido")
    console.log("📝 Body recibido:", req.body)

    try {
        const { employeeCode, password } = req.body
        console.log("👤 Código de empleado:", employeeCode)

        // Validaciones
        if (!employeeCode || !password) {
            return res.status(400).json({ error: "Código de empleado y contraseña son requeridos" })
        }

        // Buscar usuario por código de empleado
        const result = await pool.query(
            "SELECT id, name, email, employee_code, password_hash, role, section, is_active FROM users WHERE employee_code = $1",
            [employeeCode],
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" })
        }

        const user = result.rows[0]

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(401).json({ error: "Usuario desactivado" })
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
            return res.status(401).json({ error: "Credenciales inválidas" })
        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: user.id,
                employeeCode: user.employee_code,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
        )

        // Respuesta exitosa (sin incluir password_hash)
        res.json({
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeCode: user.employee_code,
                role: user.role,
                section: user.section,
            },
        })
    } catch (error) {
        console.error("❌ Error en login:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/auth/change-password - Cambiar contraseña
router.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const userId = req.user.id

        // Validaciones
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Contraseña actual y nueva contraseña son requeridas" })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" })
        }

        // Obtener usuario actual
        const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId])

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)
        if (!validPassword) {
            return res.status(400).json({ error: "La contraseña actual es incorrecta" })
        }

        // Generar hash de la nueva contraseña
        const saltRounds = 10
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

        // Actualizar contraseña en la base de datos
        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newPasswordHash, userId])

        res.json({ message: "Contraseña actualizada correctamente" })
    } catch (error) {
        console.error("Error cambiando contraseña:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// PUT /api/auth/profile - Actualizar perfil del usuario actual
router.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { name, email, section } = req.body
        const userId = req.user.id

        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "El email es requerido" })
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: "El email no es válido" })
        }

        if (!section || !section.trim()) {
            return res.status(400).json({ error: "La sección es requerida" })
        }

        // Verificar que el email no esté en uso por otro usuario
        const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [
            email.trim().toLowerCase(),
            userId,
        ])
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "El email ya está en uso por otro usuario" })
        }

        // Actualizar el perfil del usuario
        const result = await pool.query(
            `
      UPDATE users 
      SET name = $1, email = $2, section = $3
      WHERE id = $4 
      RETURNING id, name, email, employee_code, role, section, is_active, created_at, updated_at
    `,
            [name.trim(), email.trim().toLowerCase(), section.trim(), userId],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        const updatedUser = result.rows[0]
        res.json({
            message: "Perfil actualizado correctamente",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                employeeCode: updatedUser.employee_code,
                role: updatedUser.role,
                section: updatedUser.section,
            },
        })
    } catch (error) {
        console.error("Error actualizando perfil:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/auth/me - Obtener información del usuario actual
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id

        const result = await pool.query("SELECT id, name, email, employee_code, role, section FROM users WHERE id = $1", [
            userId,
        ])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        const user = result.rows[0]
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            employeeCode: user.employee_code,
            role: user.role,
            section: user.section,
        })
    } catch (error) {
        console.error("Error obteniendo información del usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/auth/verify-token - Verificar si un token es válido
router.post("/verify-token", authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user })
})

module.exports = { router, authenticateToken }
