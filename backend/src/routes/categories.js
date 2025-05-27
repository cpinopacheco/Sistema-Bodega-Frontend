const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET /api/categories - Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/categories - Crear nueva categoría
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Violación de unicidad
            res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        } else {
            console.error('Error creando categoría:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        } else {
            console.error('Error actualizando categoría:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si hay productos usando esta categoría
        const productsCheck = await pool.query(
            'SELECT COUNT(*) FROM products WHERE category_id = $1',
            [id]
        );

        if (parseInt(productsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;