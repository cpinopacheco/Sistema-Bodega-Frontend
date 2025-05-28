const express = require("express")
const bcrypt = require("bcryptjs")
const { pool } = require("../config/database")
const { authenticateToken } = require("./auth")
const router = express.Router()

// Middleware para verificar que el usuario es admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." })
    }
    next()
}

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        employee_code, 
        role, 
        section, 
        is_active, 
        created_at, 
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `)

        res.json(result.rows)
    } catch (error) {
        console.error("Error obteniendo usuarios:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/users/:id - Obtener un usuario específico (solo admin)
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            `
      SELECT 
        id, 
        name, 
        email, 
        employee_code, 
        role, 
        section, 
        is_active, 
        created_at, 
        updated_at
      FROM users 
      WHERE id = $1
    `,
            [id],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error("Error obteniendo usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/users - Crear nuevo usuario (solo admin)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, employeeCode, password, role, section } = req.body

        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "El email es requerido" })
        }

        if (!employeeCode || !employeeCode.trim()) {
            return res.status(400).json({ error: "El código de empleado es requerido" })
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" })
        }

        if (!role || !["admin", "user"].includes(role)) {
            return res.status(400).json({ error: "El rol debe ser 'admin' o 'user'" })
        }

        if (!section || !section.trim()) {
            return res.status(400).json({ error: "La sección es requerida" })
        }

        // Verificar que el email no esté en uso
        const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()])
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "El email ya está en uso" })
        }

        // Verificar que el código de empleado no esté en uso
        const employeeCodeCheck = await pool.query("SELECT id FROM users WHERE employee_code = $1", [employeeCode.trim()])
        if (employeeCodeCheck.rows.length > 0) {
            return res.status(400).json({ error: "El código de empleado ya está en uso" })
        }

        // Generar hash de la contraseña
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // Crear el usuario
        const result = await pool.query(
            `
      INSERT INTO users (name, email, employee_code, password_hash, role, section, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, name, email, employee_code, role, section, is_active, created_at, updated_at
    `,
            [name.trim(), email.trim().toLowerCase(), employeeCode.trim(), passwordHash, role, section.trim(), true],
        )

        const newUser = result.rows[0]
        res.status(201).json(newUser)
    } catch (error) {
        console.error("Error creando usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, employeeCode, role, section, isActive } = req.body

        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ error: "El email es requerido" })
        }

        if (!employeeCode || !employeeCode.trim()) {
            return res.status(400).json({ error: "El código de empleado es requerido" })
        }

        if (!role || !["admin", "user"].includes(role)) {
            return res.status(400).json({ error: "El rol debe ser 'admin' o 'user'" })
        }

        if (!section || !section.trim()) {
            return res.status(400).json({ error: "La sección es requerida" })
        }

        // Verificar que el usuario existe
        const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [id])
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Verificar que el email no esté en uso por otro usuario
        const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [
            email.trim().toLowerCase(),
            id,
        ])
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "El email ya está en uso por otro usuario" })
        }

        // Verificar que el código de empleado no esté en uso por otro usuario
        const employeeCodeCheck = await pool.query("SELECT id FROM users WHERE employee_code = $1 AND id != $2", [
            employeeCode.trim(),
            id,
        ])
        if (employeeCodeCheck.rows.length > 0) {
            return res.status(400).json({ error: "El código de empleado ya está en uso por otro usuario" })
        }

        // Actualizar el usuario
        const result = await pool.query(
            `
      UPDATE users 
      SET name = $1, email = $2, employee_code = $3, role = $4, section = $5, is_active = $6
      WHERE id = $7 
      RETURNING id, name, email, employee_code, role, section, is_active, created_at, updated_at
    `,
            [name.trim(), email.trim().toLowerCase(), employeeCode.trim(), role, section.trim(), isActive, id],
        )

        res.json(result.rows[0])
    } catch (error) {
        console.error("Error actualizando usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params

        // Verificar que el usuario existe
        const userCheck = await pool.query("SELECT id, role FROM users WHERE id = $1", [id])
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Prevenir que el admin se elimine a sí mismo
        if (Number.parseInt(id) === req.user.id) {
            return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" })
        }

        // Eliminar el usuario
        await pool.query("DELETE FROM users WHERE id = $1", [id])

        res.json({ message: "Usuario eliminado correctamente" })
    } catch (error) {
        console.error("Error eliminando usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// PATCH /api/users/:id/toggle-status - Activar/desactivar usuario (solo admin)
router.patch("/:id/toggle-status", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params

        // Verificar que el usuario existe
        const userCheck = await pool.query("SELECT id, is_active FROM users WHERE id = $1", [id])
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Prevenir que el admin se desactive a sí mismo
        if (Number.parseInt(id) === req.user.id) {
            return res.status(400).json({ error: "No puedes desactivar tu propia cuenta" })
        }

        const currentStatus = userCheck.rows[0].is_active
        const newStatus = !currentStatus

        // Actualizar el estado
        const result = await pool.query(
            `
      UPDATE users 
      SET is_active = $1
      WHERE id = $2 
      RETURNING id, name, email, employee_code, role, section, is_active, created_at, updated_at
    `,
            [newStatus, id],
        )

        res.json({
            user: result.rows[0],
            message: `Usuario ${newStatus ? "activado" : "desactivado"} correctamente`,
        })
    } catch (error) {
        console.error("Error cambiando estado del usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// Verificar si un usuario tiene retiros asociados
router.get("/:id/check-withdrawals", authenticateToken, async (req, res) => {
    try {
        const userId = Number.parseInt(req.params.id)

        if (isNaN(userId)) {
            return res.status(400).json({ error: "ID de usuario inválido" })
        }

        // Verificar si el usuario existe
        const userResult = await pool.query("SELECT id, name FROM users WHERE id = $1", [userId])

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Contar retiros del usuario
        const withdrawalsResult = await pool.query("SELECT COUNT(*) as count FROM withdrawals WHERE user_id = $1", [userId])

        const withdrawalCount = Number.parseInt(withdrawalsResult.rows[0].count)
        const hasWithdrawals = withdrawalCount > 0

        res.json({
            hasWithdrawals,
            withdrawalCount,
            userName: userResult.rows[0].name,
        })
    } catch (error) {
        console.error("Error verificando retiros del usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

module.exports = router
