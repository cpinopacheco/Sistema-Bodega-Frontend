"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import { categoriesAPI, productsAPI } from "../services/api";

// Definir tipos
export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateProduct: (id: number, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  getProduct: (id: number) => Product | undefined;
  searchProducts: (query: string) => Product[];
  filterByCategory: (category: string) => Product[];
  getLowStockProducts: () => Product[];
  updateStock: (id: number, quantity: number) => Promise<void>;
  // Funciones para categorías (ahora conectadas al backend)
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  getCategoryById: (id: number) => Category | undefined;
  loadCategories: () => Promise<void>;
  // Función para productos conectada al backend
  loadProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // FUNCIONES DE CATEGORÍAS (CONECTADAS AL BACKEND)
  // =====================================================

  // Cargar categorías desde el backend
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesData = await categoriesAPI.getAll();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar productos desde el backend
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const productsData = await productsAPI.getAll();
      setProducts(productsData);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar categorías y productos al inicializar el contexto
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  // Añadir una nueva categoría
  const addCategory = useCallback(async (name: string) => {
    try {
      setLoading(true);
      const newCategory = await categoriesAPI.create(name);
      setCategories((prev) => [...prev, newCategory]);
      toast.success("Categoría añadida correctamente");
    } catch (error: any) {
      console.error("Error añadiendo categoría:", error);
      toast.error(error.message || "Error al añadir la categoría");
      throw error; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar una categoría existente
  const updateCategory = useCallback(async (id: number, name: string) => {
    try {
      setLoading(true);
      const updatedCategory = await categoriesAPI.update(id, name);
      setCategories((prev) =>
        prev.map((category) =>
          category.id === id ? updatedCategory : category
        )
      );
      toast.success("Categoría actualizada correctamente");
    } catch (error: any) {
      console.error("Error actualizando categoría:", error);
      toast.error(error.message || "Error al actualizar la categoría");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar una categoría
  const deleteCategory = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await categoriesAPI.delete(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success("Categoría eliminada correctamente");
    } catch (error: any) {
      console.error("Error eliminando categoría:", error);
      toast.error(error.message || "Error al eliminar la categoría");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener una categoría por su ID
  const getCategoryById = useCallback(
    (id: number) => {
      return categories.find((category) => category.id === id);
    },
    [categories]
  );

  // =====================================================
  // FUNCIONES DE PRODUCTOS (TEMPORALES - SIN CAMBIOS)
  // =====================================================

  // Añadir un nuevo producto
  const addProduct = useCallback(
    async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      try {
        setLoading(true);

        // Encontrar el ID de la categoría
        const category = categories.find(
          (cat) => cat.name === product.category
        );
        if (!category) {
          toast.error("Categoría no encontrada");
          return;
        }

        const productData = {
          name: product.name,
          description: product.description,
          categoryId: category.id,
          stock: product.stock,
          minStock: product.minStock,
        };

        const newProduct = await productsAPI.create(productData);
        setProducts((prev) => [...prev, newProduct]);
        toast.success("Producto añadido correctamente");
      } catch (error: any) {
        console.error("Error añadiendo producto:", error);
        toast.error(error.message || "Error al añadir el producto");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [categories]
  );

  // Actualizar un producto existente
  const updateProduct = useCallback(
    async (id: number, productData: Partial<Product>) => {
      try {
        setLoading(true);

        // Obtener el producto actual
        const currentProduct = products.find((p) => p.id === id);
        if (!currentProduct) {
          toast.error("Producto no encontrado");
          return;
        }

        // Preparar los datos para el backend
        const category = categories.find(
          (cat) =>
            cat.name === (productData.category || currentProduct.category)
        );
        if (!category) {
          toast.error("Categoría no encontrada");
          return;
        }

        const updateData = {
          name: productData.name || currentProduct.name,
          description: productData.description || currentProduct.description,
          categoryId: category.id,
          stock:
            productData.stock !== undefined
              ? productData.stock
              : currentProduct.stock,
          minStock:
            productData.minStock !== undefined
              ? productData.minStock
              : currentProduct.minStock,
        };

        const updatedProduct = await productsAPI.update(id, updateData);
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? updatedProduct : product))
        );
        toast.success("Producto actualizado correctamente");
      } catch (error: any) {
        console.error("Error actualizando producto:", error);
        toast.error(error.message || "Error al actualizar el producto");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [products, categories]
  );

  // Eliminar un producto
  const deleteProduct = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success("Producto eliminado correctamente");
    } catch (error: any) {
      console.error("Error eliminando producto:", error);
      toast.error(error.message || "Error al eliminar el producto");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un producto por su ID
  const getProduct = useCallback(
    (id: number) => {
      return products.find((product) => product.id === id);
    },
    [products]
  );

  // Buscar productos por nombre o descripción
  const searchProducts = useCallback(
    (query: string) => {
      if (!query.trim()) return products;

      const lowercaseQuery = query.toLowerCase();
      return products.filter(
        (product) => product.name.toLowerCase().includes(lowercaseQuery)
        // Removemos la búsqueda en description:
        // || product.description.toLowerCase().includes(lowercaseQuery)
      );
    },
    [products]
  );

  // Filtrar productos por categoría
  const filterByCategory = useCallback(
    (category: string) => {
      if (category === "all") return products;
      return products.filter((product) => product.category === category);
    },
    [products]
  );

  // Obtener productos con stock bajo
  const getLowStockProducts = useCallback(() => {
    return products.filter((product) => product.stock <= product.minStock);
  }, [products]);

  // Actualizar el stock de un producto
  const updateStock = useCallback(async (id: number, quantity: number) => {
    try {
      const result = await productsAPI.updateStock(id, quantity);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                stock: result.stock,
                updatedAt: new Date().toISOString(),
              }
            : product
        )
      );
    } catch (error: any) {
      console.error("Error actualizando stock:", error);
      toast.error(error.message || "Error al actualizar el stock");
      throw error;
    }
  }, []);

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
        // Funciones de categorías conectadas al backend
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        loadCategories,
        // Función de productos conectada al backend
        loadProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Hook personalizado
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts debe usarse dentro de un ProductProvider");
  }
  return context;
};
