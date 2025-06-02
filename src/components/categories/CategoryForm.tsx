"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { useProducts, type Category } from "../../context/ProductContext";

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
  isVisible: boolean;
}

const CategoryForm = ({ category, onClose, isVisible }: CategoryFormProps) => {
  const { addCategory, updateCategory } = useProducts();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName("");
    }
  }, [category]);

  const validateForm = () => {
    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (category) {
      updateCategory(category.id, name);
    } else {
      addCategory(name);
    }

    onClose();
  };

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      window.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isVisible, onClose]);

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2 } },
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 !m-0 !p-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-[9000]"
      style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // Cerrar al hacer clic en el overlay
        if (e.target === e.currentTarget) {
          onClose();
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
          <h2 className="text-xl font-semibold text-primary">
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
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
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-dark"
              >
                Nombre <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  error ? "border-state-error" : ""
                }`}
                required
              />
              {error && (
                <p className="mt-1 text-sm text-state-error">{error}</p>
              )}
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
              {category ? (
                <>
                  <FaSave className="mr-2 -ml-1 h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <FaPlus className="mr-2 -ml-1 h-4 w-4" />
                  Crear Categoría
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CategoryForm;
