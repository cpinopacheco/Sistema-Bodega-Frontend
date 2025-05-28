const { formidable } = require("formidable")
const path = require("path")
const fs = require("fs")
const crypto = require("crypto")

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "../../uploads/profile-photos")
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware para subir foto de perfil
const uploadProfilePhoto = (req, res, next) => {
    const form = formidable({
        uploadDir: uploadsDir,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB máximo
        maxFiles: 1,
        filter: ({ name, originalFilename, mimetype }) => {
            // Solo permitir imágenes
            return mimetype && mimetype.includes("image")
        },
    })

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error al procesar archivo:", err)
            return res.status(400).json({
                error: "Error al procesar el archivo",
            })
        }

        // En formidable 3.5.4, los archivos vienen en un objeto
        const fileArray = files.profilePhoto
        if (!fileArray || fileArray.length === 0) {
            return res.status(400).json({
                error: "No se ha enviado ningún archivo",
            })
        }

        const file = fileArray[0]

        // Validar tipo de archivo
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if (!allowedTypes.includes(file.mimetype)) {
            // Eliminar archivo no válido
            if (fs.existsSync(file.filepath)) {
                fs.unlinkSync(file.filepath)
            }
            return res.status(400).json({
                error: "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)",
            })
        }

        // Generar nombre único para el archivo
        const fileExtension = path.extname(file.originalFilename || ".jpg")
        const uniqueName = `profile_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${fileExtension}`
        const newPath = path.join(uploadsDir, uniqueName)

        try {
            // Mover archivo a la ubicación final
            fs.renameSync(file.filepath, newPath)

            // Agregar información del archivo al request
            req.uploadedFile = {
                filename: uniqueName,
                originalName: file.originalFilename,
                mimetype: file.mimetype,
                size: file.size,
                path: newPath,
            }

            next()
        } catch (error) {
            console.error("Error moviendo archivo:", error)
            return res.status(500).json({
                error: "Error procesando el archivo",
            })
        }
    })
}

// Función para eliminar foto anterior
const deleteOldProfilePhoto = (filename) => {
    if (!filename) return

    const filePath = path.join(uploadsDir, filename)
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath)
            console.log(`Foto anterior eliminada: ${filename}`)
        } catch (error) {
            console.error(`Error eliminando foto anterior: ${error.message}`)
        }
    }
}

module.exports = {
    uploadProfilePhoto,
    deleteOldProfilePhoto,
}
