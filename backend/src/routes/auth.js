const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../config/database")
const { uploadProfilePhoto, deleteOldProfilePhoto } = require("../middleware/upload")
require("dotenv").config()

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

// Ruta para registrar un nuevo usuario
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, role } = req.body

        // Verificar si el usuario ya existe
        const userExistsQuery = "SELECT * FROM users WHERE username = $1 OR email = $2"
        const userExistsResult = await pool.query(userExistsQuery, [username, email])

        if (userExistsResult.rows.length > 0) {
            return res.status(400).json({ error: "El usuario o el correo electrónico ya están registrados" })
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Insertar el nuevo usuario en la base de datos
        const insertQuery =
            "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role"
        const result = await pool.query(insertQuery, [username, email, hashedPassword, role])

        const user = result.rows[0]

        res.status(201).json({
            message: "Usuario registrado correctamente",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        })
    } catch (error) {
        console.error("Error al registrar usuario:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

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

        // Buscar usuario por código de empleado (incluir profile_photo)
        const result = await pool.query(
            "SELECT id, name, email, employee_code, password_hash, role, section, is_active, profile_photo, is_temp_password FROM users WHERE employee_code = $1",
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
                profilePhoto: user.profile_photo,
                isTempPassword: user.is_temp_password || false,
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
        const userResult = await pool.query("SELECT password_hash, is_temp_password FROM users WHERE id = $1", [userId])

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        const user = userResult.rows[0]

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash)
        if (!validPassword) {
            return res.status(400).json({ error: "La contraseña actual es incorrecta" })
        }

        // Generar hash de la nueva contraseña
        const saltRounds = 10
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

        // Actualizar contraseña en la base de datos
        await pool.query("UPDATE users SET password_hash = $1, is_temp_password = FALSE WHERE id = $2", [
            newPasswordHash,
            userId,
        ])

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
      RETURNING id, name, email, employee_code, role, section, is_active, profile_photo, created_at, updated_at
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
                profilePhoto: updatedUser.profile_photo,
            },
        })
    } catch (error) {
        console.error("Error actualizando perfil:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/auth/upload-profile-photo - Subir foto de perfil
router.post("/upload-profile-photo", authenticateToken, uploadProfilePhoto, async (req, res) => {
    try {
        const userId = req.user.id

        if (!req.uploadedFile) {
            return res.status(400).json({ error: "No se ha enviado ningún archivo" })
        }

        // Obtener la foto anterior para eliminarla
        const currentUser = await pool.query("SELECT profile_photo FROM users WHERE id = $1", [userId])
        const oldPhoto = currentUser.rows[0]?.profile_photo

        // Actualizar la base de datos con la nueva foto
        const filename = req.uploadedFile.filename
        const result = await pool.query(
            `
      UPDATE users 
      SET profile_photo = $1
      WHERE id = $2 
      RETURNING id, name, email, employee_code, role, section, profile_photo
    `,
            [filename, userId],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Eliminar la foto anterior si existe
        if (oldPhoto) {
            deleteOldProfilePhoto(oldPhoto)
        }

        const updatedUser = result.rows[0]
        res.json({
            message: "Foto de perfil actualizada correctamente",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                employeeCode: updatedUser.employee_code,
                role: updatedUser.role,
                section: updatedUser.section,
                profilePhoto: updatedUser.profile_photo,
            },
        })
    } catch (error) {
        console.error("Error subiendo foto de perfil:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// DELETE /api/auth/delete-profile-photo - Eliminar foto de perfil
router.delete("/delete-profile-photo", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id

        // Obtener la foto actual para eliminarla
        const currentUser = await pool.query("SELECT profile_photo FROM users WHERE id = $1", [userId])
        const currentPhoto = currentUser.rows[0]?.profile_photo

        if (!currentPhoto) {
            return res.status(400).json({ error: "El usuario no tiene foto de perfil" })
        }

        // Actualizar la base de datos para remover la foto
        const result = await pool.query(
            `
      UPDATE users 
      SET profile_photo = NULL
      WHERE id = $1 
      RETURNING id, name, email, employee_code, role, section, profile_photo
    `,
            [userId],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        // Eliminar el archivo físico
        deleteOldProfilePhoto(currentPhoto)

        const updatedUser = result.rows[0]
        res.json({
            message: "Foto de perfil eliminada correctamente",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                employeeCode: updatedUser.employee_code,
                role: updatedUser.role,
                section: updatedUser.section,
                profilePhoto: updatedUser.profile_photo,
            },
        })
    } catch (error) {
        console.error("Error eliminando foto de perfil:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/auth/me - Obtener información del usuario actual
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id

        const result = await pool.query(
            "SELECT id, name, email, employee_code, role, section, profile_photo, is_temp_password FROM users WHERE id = $1",
            [userId],
        )

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
            profilePhoto: user.profile_photo,
            isTempPassword: user.is_temp_password,
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

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
router.post("/forgot-password", async (req, res) => {
    try {
        const { employeeCode } = req.body

        if (!employeeCode) {
            return res.status(400).json({ error: "El código de empleado es requerido" })
        }

        // Buscar usuario por código de empleado
        const userResult = await pool.query(
            "SELECT id, name, email, employee_code, is_active FROM users WHERE employee_code = $1",
            [employeeCode],
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" })
        }

        const user = userResult.rows[0]

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(400).json({ error: "El usuario está desactivado" })
        }

        // Verificar si ya existe una solicitud pendiente para este usuario
        const pendingRequestResult = await pool.query(
            "SELECT id FROM password_recovery_requests WHERE user_id = $1 AND status = 'pending'",
            [user.id],
        )

        if (pendingRequestResult.rows.length > 0) {
            return res.status(400).json({ error: "Ya existe una solicitud pendiente para este usuario" })
        }

        // Crear nueva solicitud de recuperación
        await pool.query(
            "INSERT INTO password_recovery_requests (user_id, status, expires_at) VALUES ($1, 'pending', NOW() + INTERVAL '24 hours')",
            [user.id],
        )

        res.json({
            message: "Solicitud de recuperación de contraseña enviada correctamente",
            userName: user.name,
        })
    } catch (error) {
        console.error("Error en solicitud de recuperación de contraseña:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/auth/password-recovery-requests - Obtener solicitudes de recuperación (solo admin)
router.get("/password-recovery-requests", authenticateToken, async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "No autorizado" })
        }

        // Obtener solicitudes pendientes y procesadas con información del usuario
        const result = await pool.query(
            `SELECT pr.id, pr.user_id, pr.requested_at, pr.status, pr.expires_at, pr.processed_at,
              u.name, u.email, u.employee_code, u.section
       FROM password_recovery_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE (pr.status = 'pending' OR pr.status = 'processed') AND pr.expires_at > NOW()
       ORDER BY pr.status ASC, pr.requested_at DESC`,
        )

        res.json(result.rows)
    } catch (error) {
        console.error("Error obteniendo solicitudes de recuperación:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/auth/temp-password/:requestId - Obtener contraseña temporal de solicitud procesada (solo admin)
router.get("/temp-password/:requestId", authenticateToken, async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "No autorizado" })
        }

        const { requestId } = req.params

        // Obtener la solicitud procesada con la contraseña temporal
        const result = await pool.query(
            `SELECT pr.temp_password_hash, u.name, u.employee_code
       FROM password_recovery_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.id = $1 AND pr.status = 'processed'`,
            [requestId],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Solicitud no encontrada o no procesada" })
        }

        const request = result.rows[0]

        // Nota: En un caso real, deberías almacenar la contraseña temporal de forma segura
        // Por ahora, generaremos una nueva cada vez (esto es una limitación del diseño actual)
        res.json({
            userName: request.name,
            employeeCode: request.employee_code,
            message: "Solicitud procesada - contraseña temporal ya generada",
        })
    } catch (error) {
        console.error("Error obteniendo contraseña temporal:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/auth/generate-temp-password/:requestId - Generar contraseña temporal (solo admin)
router.post("/generate-temp-password/:requestId", authenticateToken, async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "No autorizado" })
        }

        const { requestId } = req.params
        const adminId = req.user.id

        // Obtener la solicitud y verificar que esté pendiente
        const requestResult = await pool.query(
            "SELECT id, user_id, status, expires_at FROM password_recovery_requests WHERE id = $1",
            [requestId],
        )

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: "Solicitud no encontrada" })
        }

        const request = requestResult.rows[0]

        if (request.status !== "pending") {
            return res.status(400).json({ error: "La solicitud ya ha sido procesada" })
        }

        if (new Date(request.expires_at) < new Date()) {
            return res.status(400).json({ error: "La solicitud ha expirado" })
        }

        // Generar contraseña temporal aleatoria
        const tempPassword = generateTempPassword()
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        // Iniciar una transacción
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            // Actualizar la solicitud
            await client.query(
                `UPDATE password_recovery_requests 
         SET status = 'processed', processed_at = NOW(), processed_by_admin_id = $1, temp_password_hash = $2
         WHERE id = $3`,
                [adminId, hashedPassword, requestId],
            )

            // Actualizar la contraseña del usuario y marcarla como temporal
            await client.query("UPDATE users SET password_hash = $1, is_temp_password = TRUE WHERE id = $2", [
                hashedPassword,
                request.user_id,
            ])

            await client.query("COMMIT")

            // Obtener información del usuario para la respuesta
            const userResult = await pool.query("SELECT name, employee_code FROM users WHERE id = $1", [request.user_id])

            const user = userResult.rows[0]

            res.json({
                message: "Contraseña temporal generada correctamente",
                tempPassword,
                userName: user.name,
                employeeCode: user.employee_code,
            })
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Error generando contraseña temporal:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// DELETE /api/auth/archive-request/:requestId - Archivar solicitud procesada (solo admin)
router.delete("/archive-request/:requestId", authenticateToken, async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "No autorizado" })
        }

        const { requestId } = req.params

        // Actualizar el estado de la solicitud a 'archived'
        const result = await pool.query(
            "UPDATE password_recovery_requests SET status = 'archived' WHERE id = $1 AND status = 'processed'",
            [requestId],
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Solicitud no encontrada o no puede ser archivada" })
        }

        res.json({ message: "Solicitud archivada correctamente" })
    } catch (error) {
        console.error("Error archivando solicitud:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// Función para generar contraseña temporal
function generateTempPassword() {
    const length = 6
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let password = ""

    // Asegurar al menos una mayúscula, una minúscula y un número
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    password += "0123456789"[Math.floor(Math.random() * 10)]

    // Completar el resto de la contraseña (3 caracteres más)
    for (let i = 3; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Mezclar los caracteres para que no siempre tenga el mismo patrón
    return password
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("")
}

module.exports = { router, authenticateToken }
