const express = require("express")
const { pool } = require("../config/database")
const router = express.Router()

// GET /api/withdrawals - Obtener todos los retiros
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        w.id,
        w.user_id,
        w.user_name,
        w.user_section,
        w.withdrawer_name,
        w.withdrawer_section,
        w.notes,
        w.total_items,
        w.created_at,
        json_agg(
          json_build_object(
            'productId', wi.product_id,
            'quantity', wi.quantity,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'category', c.name,
              'stock', p.stock,
              'minStock', p.min_stock
            )
          )
        ) as items
      FROM withdrawals w
      LEFT JOIN withdrawal_items wi ON w.id = wi.withdrawal_id
      LEFT JOIN products p ON wi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY w.id, w.user_id, w.user_name, w.user_section, w.withdrawer_name, w.withdrawer_section, w.notes, w.total_items, w.created_at
      ORDER BY w.created_at DESC
    `)

        // Transformar los datos para que coincidan con el formato del frontend
        const withdrawals = result.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userSection: row.user_section,
            withdrawerName: row.withdrawer_name,
            withdrawerSection: row.withdrawer_section,
            notes: row.notes,
            totalItems: row.total_items,
            createdAt: row.created_at,
            items: row.items.filter((item) => item.productId !== null), // Filtrar items nulos
        }))

        res.json(withdrawals)
    } catch (error) {
        console.error("Error obteniendo retiros:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// GET /api/withdrawals/:id - Obtener un retiro específico
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params

        const withdrawalResult = await pool.query(
            `
      SELECT 
        w.id,
        w.user_id,
        w.user_name,
        w.user_section,
        w.withdrawer_name,
        w.withdrawer_section,
        w.notes,
        w.total_items,
        w.created_at
      FROM withdrawals w
      WHERE w.id = $1
    `,
            [id],
        )

        if (withdrawalResult.rows.length === 0) {
            return res.status(404).json({ error: "Retiro no encontrado" })
        }

        const itemsResult = await pool.query(
            `
      SELECT 
        wi.product_id,
        wi.quantity,
        p.id,
        p.name,
        p.description,
        p.stock,
        p.min_stock,
        c.name as category_name
      FROM withdrawal_items wi
      JOIN products p ON wi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE wi.withdrawal_id = $1
    `,
            [id],
        )

        const withdrawal = withdrawalResult.rows[0]
        const items = itemsResult.rows.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            product: {
                id: item.id,
                name: item.name,
                description: item.description,
                category: item.category_name,
                stock: item.stock,
                minStock: item.min_stock,
            },
        }))

        const response = {
            id: withdrawal.id,
            userId: withdrawal.user_id,
            userName: withdrawal.user_name,
            userSection: withdrawal.user_section,
            withdrawerName: withdrawal.withdrawer_name,
            withdrawerSection: withdrawal.withdrawer_section,
            notes: withdrawal.notes,
            totalItems: withdrawal.total_items,
            createdAt: withdrawal.created_at,
            items,
        }

        res.json(response)
    } catch (error) {
        console.error("Error obteniendo retiro:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    }
})

// POST /api/withdrawals - Crear nuevo retiro
router.post("/", async (req, res) => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const { userId, userName, userSection, withdrawerName, withdrawerSection, notes, items } = req.body

        // Validaciones
        if (!userId || !userName || !userSection || !withdrawerName || !withdrawerSection) {
            return res.status(400).json({ error: "Todos los campos obligatorios deben ser proporcionados" })
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Debe incluir al menos un item en el retiro" })
        }

        // Verificar stock disponible para todos los productos
        for (const item of items) {
            const stockCheck = await client.query("SELECT stock FROM products WHERE id = $1", [item.productId])

            if (stockCheck.rows.length === 0) {
                await client.query("ROLLBACK")
                return res.status(400).json({ error: `Producto con ID ${item.productId} no encontrado` })
            }

            if (stockCheck.rows[0].stock < item.quantity) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    error: `Stock insuficiente para el producto ID ${item.productId}. Stock disponible: ${stockCheck.rows[0].stock}`,
                })
            }
        }

        // Calcular total de items
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

        // Crear el retiro
        const withdrawalResult = await client.query(
            `
      INSERT INTO withdrawals (
        user_id, user_name, user_section, withdrawer_name, withdrawer_section, notes, total_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `,
            [userId, userName, userSection, withdrawerName, withdrawerSection, notes || null, totalItems],
        )

        const withdrawalId = withdrawalResult.rows[0].id
        const createdAt = withdrawalResult.rows[0].created_at

        // Crear los items del retiro y actualizar stock
        for (const item of items) {
            // Obtener información completa del producto para incluir nombre y categoría
            const productInfo = await client.query(
                `
    SELECT p.name, c.name as category_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id 
    WHERE p.id = $1
  `,
                [item.productId],
            )

            // Insertar item del retiro
            await client.query(
                `
    INSERT INTO withdrawal_items (withdrawal_id, product_id, product_name, product_category, quantity)
    VALUES ($1, $2, $3, $4, $5)
  `,
                [withdrawalId, item.productId, productInfo.rows[0].name, productInfo.rows[0].category_name, item.quantity],
            )

            // Actualizar stock del producto
            await client.query(
                `
        UPDATE products 
        SET stock = stock - $1
        WHERE id = $2
      `,
                [item.quantity, item.productId],
            )
        }

        await client.query("COMMIT")

        // Obtener el retiro completo para la respuesta
        const completeWithdrawal = await pool.query(
            `
      SELECT 
        w.id,
        w.user_id,
        w.user_name,
        w.user_section,
        w.withdrawer_name,
        w.withdrawer_section,
        w.notes,
        w.total_items,
        w.created_at
      FROM withdrawals w
      WHERE w.id = $1
    `,
            [withdrawalId],
        )

        const response = {
            id: withdrawalId,
            userId,
            userName,
            userSection,
            withdrawerName,
            withdrawerSection,
            notes: notes || null,
            totalItems,
            createdAt,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                product: item.product,
            })),
        }

        res.status(201).json(response)
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Error creando retiro:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    } finally {
        client.release()
    }
})

// DELETE /api/withdrawals/:id - Eliminar retiro (solo para casos especiales)
router.delete("/:id", async (req, res) => {
    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const { id } = req.params

        // Verificar que el retiro existe
        const withdrawalCheck = await client.query("SELECT id FROM withdrawals WHERE id = $1", [id])

        if (withdrawalCheck.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ error: "Retiro no encontrado" })
        }

        // Obtener los items del retiro para restaurar el stock
        const itemsResult = await client.query(
            `
      SELECT product_id, quantity 
      FROM withdrawal_items 
      WHERE withdrawal_id = $1
    `,
            [id],
        )

        // Restaurar el stock de cada producto
        for (const item of itemsResult.rows) {
            await client.query(
                `
        UPDATE products 
        SET stock = stock + $1
        WHERE id = $2
      `,
                [item.quantity, item.product_id],
            )
        }

        // Eliminar los items del retiro
        await client.query("DELETE FROM withdrawal_items WHERE withdrawal_id = $1", [id])

        // Eliminar el retiro
        await client.query("DELETE FROM withdrawals WHERE id = $1", [id])

        await client.query("COMMIT")

        res.json({ message: "Retiro eliminado correctamente y stock restaurado" })
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Error eliminando retiro:", error)
        res.status(500).json({ error: "Error interno del servidor" })
    } finally {
        client.release()
    }
})

module.exports = router
