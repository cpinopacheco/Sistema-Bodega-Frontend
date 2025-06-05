const express = require("express")
const { pool } = require("../config/database")
const router = express.Router()

// Función para generar código de producto correlativo con 4 dígitos
async function generateProductCode() {
    try {
        // Obtener el último código de producto creado
        const lastCodeResult = await pool.query(
            "SELECT code FROM products WHERE code LIKE 'PROD-%' ORDER BY CAST(SUBSTRING(code FROM 6) AS INTEGER) DESC LIMIT 1",
        )

        let nextNumber = 1
        if (lastCodeResult.rows.length > 0) {
            // Extraer el número del último código
            const lastCode = lastCodeResult.rows[0].code
            const lastNumber = Number.parseInt(lastCode.split("-")[1], 10)
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1
            }
        }

        // Formatear el número con ceros a la izquierda (4 dígitos)
        const formattedNumber = nextNumber.toString().padStart(4, "0")

        return `PROD-${formattedNumber}`
    } catch (error) {
        console.error("Error generando código de producto:", error)
        // Código de respaldo en caso de error
        return `PROD-${Date.now().toString().substring(9).padStart(4, "0")}`
    }
}

// GET /api/products - Obtener todos los productos con información de categoría
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.stock,
        p.min_stock,
        p.code,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.id as category_id
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `)

        // Transformar los datos para que coincidan con el formato del frontend
        const products = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description || "",
            category: row.category_name,
            categoryId: row.category_id,
            stock: row.stock,
            minStock: row.min_stock,
            code: row.code,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }))

        res.json(products)
    } catch (error) {
        console.error("Error obteniendo productos:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/products/:id - Obtener un producto específico
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query(
            `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.stock,
        p.min_stock,
        p.code,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.id as category_id
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `,
            [id],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        const row = result.rows[0]
        const product = {
            id: row.id,
            name: row.name,
            description: row.description || "",
            category: row.category_name,
            categoryId: row.category_id,
            stock: row.stock,
            minStock: row.min_stock,
            code: row.code,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }

        res.json(product)
    } catch (error) {
        console.error("Error obteniendo producto:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/products - Crear nuevo producto
router.post("/", async (req, res) => {
    try {
        const { name, description, categoryId, stock, minStock } = req.body

        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        if (!categoryId) {
            return res.status(400).json({ error: "La categoría es requerida" })
        }

        if (stock < 0) {
            return res.status(400).json({ error: "El stock no puede ser negativo" })
        }

        if (minStock < 0) {
            return res.status(400).json({ error: "El stock mínimo no puede ser negativo" })
        }

        // Verificar si ya existe un producto con el mismo nombre
        const nameCheck = await pool.query("SELECT id FROM products WHERE LOWER(name) = LOWER($1)", [name.trim()])
        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ error: "Ya existe un producto con este nombre", code: "DUPLICATE_NAME" })
        }

        // Verificar que la categoría existe
        const categoryCheck = await pool.query("SELECT id, name FROM categories WHERE id = $1", [categoryId])
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ error: "La categoría especificada no existe" })
        }

        // Generar código único para el producto
        const productCode = await generateProductCode()

        const result = await pool.query(
            `INSERT INTO products (name, description, category_id, stock, min_stock, code) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, description, stock, min_stock, code, created_at, updated_at`,
            [name.trim(), description || "", categoryId, stock || 0, minStock || 0, productCode],
        )

        const newProduct = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description || "",
            category: categoryCheck.rows[0].name,
            categoryId: categoryId,
            stock: result.rows[0].stock,
            minStock: result.rows[0].min_stock,
            code: result.rows[0].code,
            createdAt: result.rows[0].created_at,
            updatedAt: result.rows[0].updated_at,
        }

        res.status(201).json(newProduct)
    } catch (error) {
        console.error("Error creando producto:", error)

        // Verificar si es un error de violación de restricción única
        if (error.code === "23505" && error.constraint === "unique_product_name") {
            return res.status(409).json({ error: "Ya existe un producto con este nombre", code: "DUPLICATE_NAME" })
        }

        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// PUT /api/products/:id - Actualizar producto
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, categoryId, stock, minStock } = req.body

        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "El nombre es requerido" })
        }

        if (!categoryId) {
            return res.status(400).json({ error: "La categoría es requerida" })
        }

        if (stock < 0) {
            return res.status(400).json({ error: "El stock no puede ser negativo" })
        }

        if (minStock < 0) {
            return res.status(400).json({ error: "El stock mínimo no puede ser negativo" })
        }

        // Verificar si ya existe un producto con el mismo nombre (que no sea el mismo producto)
        const nameCheck = await pool.query("SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND id != $2", [
            name.trim(),
            id,
        ])
        if (nameCheck.rows.length > 0) {
            return res.status(409).json({ error: "Ya existe un producto con este nombre", code: "DUPLICATE_NAME" })
        }

        // Verificar que la categoría existe
        const categoryCheck = await pool.query("SELECT id, name FROM categories WHERE id = $1", [categoryId])
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ error: "La categoría especificada no existe" })
        }

        const result = await pool.query(
            `UPDATE products 
       SET name = $1, description = $2, category_id = $3, stock = $4, min_stock = $5
       WHERE id = $6 
       RETURNING id, name, description, stock, min_stock, created_at, updated_at`,
            [name.trim(), description || "", categoryId, stock || 0, minStock || 0, id],
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        const updatedProduct = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description || "",
            category: categoryCheck.rows[0].name,
            categoryId: categoryId,
            stock: result.rows[0].stock,
            minStock: result.rows[0].min_stock,
            createdAt: result.rows[0].created_at,
            updatedAt: result.rows[0].updated_at,
        }

        res.json(updatedProduct)
    } catch (error) {
        console.error("Error actualizando producto:", error)

        // Verificar si es un error de violación de restricción única
        if (error.code === "23505" && error.constraint === "unique_product_name") {
            return res.status(409).json({ error: "Ya existe un producto con este nombre", code: "DUPLICATE_NAME" })
        }

        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// PATCH /api/products/:id/stock - Actualizar solo el stock de un producto
router.patch("/:id/stock", async (req, res) => {
    try {
        const { id } = req.params
        const { quantity } = req.body

        if (typeof quantity !== "number") {
            return res.status(400).json({ error: "La cantidad debe ser un número" })
        }

        // Obtener el stock actual
        const currentProduct = await pool.query("SELECT stock FROM products WHERE id = $1", [id])
        if (currentProduct.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        const newStock = currentProduct.rows[0].stock + quantity

        if (newStock < 0) {
            return res.status(400).json({ error: "El stock no puede ser negativo" })
        }

        const result = await pool.query(
            `UPDATE products 
       SET stock = $1
       WHERE id = $2 
       RETURNING stock`,
            [newStock, id],
        )

        res.json({
            id: Number.parseInt(id),
            stock: result.rows[0].stock,
            message: "Stock actualizado correctamente",
        })
    } catch (error) {
        console.error("Error actualizando stock:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// DELETE /api/products/:id - Eliminar producto
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params

        const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" })
        }

        res.json({ message: "Producto eliminado correctamente" })
    } catch (error) {
        console.error("Error eliminando producto:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/products/bulk-import - Importación masiva de productos
router.post("/bulk-import", async (req, res) => {
    try {
        const { products } = req.body

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Se requiere un array de productos" })
        }

        const results = {
            success: [],
            errors: [],
            total: products.length,
        }

        // Procesar cada producto
        for (let i = 0; i < products.length; i++) {
            const product = products[i]

            try {
                const { name, description, categoryId, stock, minStock } = product

                // Validaciones básicas
                if (!name || !name.trim()) {
                    results.errors.push({
                        index: i + 1,
                        product: product,
                        error: "El nombre es requerido",
                    })
                    continue
                }

                if (!categoryId) {
                    results.errors.push({
                        index: i + 1,
                        product: product,
                        error: "La categoría es requerida",
                    })
                    continue
                }

                if (stock < 0 || minStock < 0) {
                    results.errors.push({
                        index: i + 1,
                        product: product,
                        error: "Stock y stock mínimo no pueden ser negativos",
                    })
                    continue
                }

                // Verificar si ya existe un producto con el mismo nombre
                const nameCheck = await pool.query("SELECT id FROM products WHERE LOWER(name) = LOWER($1)", [name.trim()])
                if (nameCheck.rows.length > 0) {
                    results.errors.push({
                        index: i + 1,
                        product: product,
                        error: "Ya existe un producto con este nombre",
                    })
                    continue
                }

                // Verificar que la categoría existe
                const categoryCheck = await pool.query("SELECT id, name FROM categories WHERE id = $1", [categoryId])
                if (categoryCheck.rows.length === 0) {
                    results.errors.push({
                        index: i + 1,
                        product: product,
                        error: "La categoría especificada no existe",
                    })
                    continue
                }

                // Insertar producto
                const result = await pool.query(
                    `INSERT INTO products (name, description, category_id, stock, min_stock) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, name, description, stock, min_stock, created_at, updated_at`,
                    [name.trim(), description || "", categoryId, stock || 0, minStock || 0],
                )

                const newProduct = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    description: result.rows[0].description || "",
                    category: categoryCheck.rows[0].name,
                    categoryId: categoryId,
                    stock: result.rows[0].stock,
                    minStock: result.rows[0].min_stock,
                    createdAt: result.rows[0].created_at,
                    updatedAt: result.rows[0].updated_at,
                }

                results.success.push({
                    index: i + 1,
                    product: newProduct,
                })
            } catch (error) {
                console.error(`Error procesando producto ${i + 1}:`, error)
                results.errors.push({
                    index: i + 1,
                    product: product,
                    error: error.message || "Error interno del servidor",
                })
            }
        }

        res.json({
            message: "Importación completada",
            results: results,
        })
    } catch (error) {
        console.error("Error en importación masiva:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

module.exports = router
