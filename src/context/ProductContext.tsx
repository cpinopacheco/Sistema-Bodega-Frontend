"use client"

import { createContext, useState, useContext, type ReactNode, useCallback } from "react"
import toast from "react-hot-toast"
import { sampleProducts, sampleCategories } from "../data/sampleData"

// Definir tipos
export interface Product {
  id: number
  name: string
  description: string
  category: string
  stock: number
  minStock: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
}

interface ProductContextType {
  products: Product[]
  categories: Category[]
  loading: boolean
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: number, productData: Partial<Product>) => void
  deleteProduct: (id: number) => void
  getProduct: (id: number) => Product | undefined
  searchProducts: (query: string) => Product[]
  filterByCategory: (category: string) => Product[]
  getLowStockProducts: () => Product[]
  updateStock: (id: number, quantity: number) => void
  // Nuevas funciones para gestionar categorías
  addCategory: (name: string) => void
  updateCategory: (id: number, name: string) => void
  deleteCategory: (id: number) => void
  getCategoryById: (id: number) => Category | undefined
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(sampleProducts)
  const [categories, setCategories] = useState<Category[]>(sampleCategories)
  const [loading] = useState(false)

  // Añadir un nuevo producto
  const addProduct = useCallback(
    (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const newProduct: Product = {
        ...product,
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setProducts((prev) => [...prev, newProduct])
      toast.success("Producto añadido correctamente")
    },
    [products],
  )

  // Actualizar un producto existente
  const updateProduct = useCallback((id: number, productData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              ...productData,
              updatedAt: new Date().toISOString(),
            }
          : product,
      ),
    )
    toast.success("Producto actualizado correctamente")
  }, [])

  // Eliminar un producto
  const deleteProduct = useCallback((id: number) => {
    setProducts((prev) => prev.filter((product) => product.id !== id))
    toast.success("Producto eliminado correctamente")
  }, [])

  // Obtener un producto por su ID
  const getProduct = useCallback(
    (id: number) => {
      return products.find((product) => product.id === id)
    },
    [products],
  )

  // Buscar productos por nombre o descripción
  const searchProducts = useCallback(
    (query: string) => {
      if (!query.trim()) return products

      const lowercaseQuery = query.toLowerCase()
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery),
      )
    },
    [products],
  )

  // Filtrar productos por categoría
  const filterByCategory = useCallback(
    (category: string) => {
      if (category === "all") return products
      return products.filter((product) => product.category === category)
    },
    [products],
  )

  // Obtener productos con stock bajo
  const getLowStockProducts = useCallback(() => {
    return products.filter((product) => product.stock <= product.minStock)
  }, [products])

  // Actualizar el stock de un producto
  const updateStock = useCallback((id: number, quantity: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: product.stock + quantity,
              updatedAt: new Date().toISOString(),
            }
          : product,
      ),
    )
  }, [])

  // NUEVAS FUNCIONES PARA GESTIONAR CATEGORÍAS

  // Añadir una nueva categoría
  const addCategory = useCallback(
    (name: string) => {
      // Verificar si ya existe una categoría con ese nombre
      if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
        toast.error("Ya existe una categoría con ese nombre")
        return
      }

      const newCategory: Category = {
        id: Math.max(0, ...categories.map((c) => c.id)) + 1,
        name,
      }

      setCategories((prev) => [...prev, newCategory])
      toast.success("Categoría añadida correctamente")
    },
    [categories],
  )

  // Actualizar una categoría existente
  const updateCategory = useCallback(
    (id: number, name: string) => {
      // Verificar si ya existe otra categoría con ese nombre
      if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== id)) {
        toast.error("Ya existe otra categoría con ese nombre")
        return
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === id
            ? {
                ...category,
                name,
              }
            : category,
        ),
      )
      toast.success("Categoría actualizada correctamente")
    },
    [categories],
  )

  // Eliminar una categoría
  const deleteCategory = useCallback(
    (id: number) => {
      // Verificar si hay productos que usan esta categoría
      const categoryToDelete = categories.find((cat) => cat.id === id)
      if (!categoryToDelete) return

      const productsUsingCategory = products.filter((product) => product.category === categoryToDelete.name)

      if (productsUsingCategory.length > 0) {
        toast.error(
          `No se puede eliminar la categoría porque está siendo utilizada por ${productsUsingCategory.length} productos`,
        )
        return
      }

      setCategories((prev) => prev.filter((category) => category.id !== id))
      toast.success("Categoría eliminada correctamente")
    },
    [categories, products],
  )

  // Obtener una categoría por su ID
  const getCategoryById = useCallback(
    (id: number) => {
      return categories.find((category) => category.id === id)
    },
    [categories],
  )

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        searchProducts,
        filterByCategory,
        getLowStockProducts,
        updateStock,
        // Nuevas funciones para categorías
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

// Hook personalizado
export const useProducts = () => {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error("useProducts debe usarse dentro de un ProductProvider")
  }
  return context
}
