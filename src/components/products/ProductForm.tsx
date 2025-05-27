"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FaPlus, FaSave, FaTimes } from "react-icons/fa"
import { type Product, useProducts } from "../../context/ProductContext"

interface ProductFormProps {
  product?: Product
  onClose: () => void
  isVisible: boolean
}

const ProductForm = ({ product, onClose, isVisible }: ProductFormProps) => {
  const { addProduct, updateProduct, categories } = useProducts()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    stock: 0,
    minStock: 0,
  })
  const [errors, setErrors] = useState({
    name: "",
    category: "",
    stock: "",
    minStock: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        stock: product.stock,
        minStock: product.minStock,
      })
    } else {
      // Set default category if available
      if (categories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          category: categories[0].name,
        }))
      }
    }
  }, [product, categories])

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      name: "",
      category: "",
      stock: "",
      minStock: "",
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    }

    if (!formData.category) {
      newErrors.category = "La categoría es obligatoria"
      isValid = false
    }

    if (formData.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo"
      isValid = false
    }

    if (formData.minStock < 0) {
      newErrors.minStock = "El stock mínimo no puede ser negativo"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" || name === "minStock" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (product) {
      updateProduct(product.id, formData)
    } else {
      addProduct(formData)
    }

    onClose()
  }

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose()
      }
    }

    if (isVisible) {
      window.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      window.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isVisible, onClose])

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2 } },
  }

  if (!isVisible) return null

  return (
    <motion.div
      className="fixed inset-0 !m-0 !p-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // Cerrar al hacer clic en el overlay
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <motion.div
        className="bg-neutral-white rounded-lg shadow-xl w-full max-w-md"
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-light">
          <h2 className="text-xl font-semibold text-primary">{product ? "Editar Producto" : "Nuevo Producto"}</h2>
          <button
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-dark">
                Nombre <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.name ? "border-state-error" : ""
                }`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-state-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-dark">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-dark">
                Categoría <span className="text-state-error">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.category ? "border-state-error" : ""
                }`}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-state-error">{errors.category}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-neutral-dark">
                  Stock <span className="text-state-error">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.stock ? "border-state-error" : ""
                  }`}
                  required
                />
                {errors.stock && <p className="mt-1 text-sm text-state-error">{errors.stock}</p>}
              </div>

              <div>
                <label htmlFor="minStock" className="block text-sm font-medium text-neutral-dark">
                  Stock Mínimo <span className="text-state-error">*</span>
                </label>
                <input
                  type="number"
                  id="minStock"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  min="0"
                  className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.minStock ? "border-state-error" : ""
                  }`}
                  required
                />
                {errors.minStock && <p className="mt-1 text-sm text-state-error">{errors.minStock}</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-neutral-light rounded-md shadow-sm text-sm font-medium text-neutral-dark bg-neutral-white hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FaTimes className="mr-2 -ml-1 h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {product ? (
                <>
                  <FaSave className="mr-2 -ml-1 h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <FaPlus className="mr-2 -ml-1 h-4 w-4" />
                  Crear Producto
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ProductForm
