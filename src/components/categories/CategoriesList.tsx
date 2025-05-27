"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa"
import { useProducts, type Category } from "../../context/ProductContext"
import CategoryForm from "./CategoryForm"
import { Tooltip } from "../ui/Tooltip"

interface CategoriesListProps {
  onClose: () => void
}

const CategoriesList = ({ onClose }: CategoriesListProps) => {
  const { categories, deleteCategory } = useProducts()
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // Función para abrir modal de edición
  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setShowCategoryForm(true)
  }

  // Función para confirmar eliminación
  const handleDeleteConfirm = (id: number) => {
    setConfirmDelete(id)
  }

  // Función para eliminar categoría
  const handleDelete = (id: number) => {
    deleteCategory(id)
    setConfirmDelete(null)
  }

  return (
    <div
      className="fixed inset-0 !m-0 !p-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-neutral-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-light">
          <h2 className="text-xl font-semibold text-primary">Gestión de Categorías</h2>
          <button
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-neutral-medium">
              Total: <span className="font-semibold">{categories.length} categorías</span>
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null)
                setShowCategoryForm(true)
              }}
              className="inline-flex items-center px-3 py-1.5 bg-primary text-neutral-white rounded-md hover:bg-primary-light transition-colors text-sm"
            >
              <FaPlus className="mr-1" />
              Nueva Categoría
            </button>
          </div>

          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-light">
                <thead className="bg-primary-lightest">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-white divide-y divide-neutral-light">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-primary-lightest hover:bg-opacity-30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium">{category.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-dark">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Tooltip content="Editar" position="top">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-state-info hover:bg-state-info hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                            >
                              <FaEdit size={16} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Eliminar" position="top">
                            <button
                              onClick={() => handleDeleteConfirm(category.id)}
                              className="text-state-error hover:bg-state-error hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                            >
                              <FaTrash size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-medium">No hay categorías disponibles</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-light flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-light text-neutral-dark rounded-md hover:bg-neutral-medium hover:text-neutral-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCategoryForm && (
          <CategoryForm
            category={selectedCategory || undefined}
            onClose={() => {
              setShowCategoryForm(false)
              setSelectedCategory(null)
            }}
            isVisible={showCategoryForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-neutral-dark mb-3">Confirmar eliminación</h3>
              <p className="text-neutral-medium mb-6">
                ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-state-error text-neutral-white rounded-md hover:bg-opacity-90"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategoriesList
