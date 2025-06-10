"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaSearch,
  FaFileExcel,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { ExportToExcel } from "../utils/ExcelExport";

const LowStock = () => {
  const { getLowStockProducts } = useProducts();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState<
    "code" | "name" | "category" | "stock" | "minStock" | "deficit"
  >("deficit");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Obtener productos con stock bajo
  const lowStockProducts = getLowStockProducts();

  // Categorías únicas de productos con stock bajo
  const categories = [
    "all",
    ...new Set(lowStockProducts.map((product) => product.category)),
  ];

  // Filtrar productos
  const filteredProducts = lowStockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Exportar a Excel
  const exportToExcel = () => {
    const data = sortedProducts.map((product) => ({
      Código: product.code,
      Nombre: product.name,
      Descripción: product.description,
      Categoría: product.category,
      "Stock Actual": product.stock,
      "Stock Mínimo": product.minStock,
      Déficit: product.minStock - product.stock,
    }));

    ExportToExcel(data, "Productos_Stock_Bajo");
  };

  // Función para manejar el ordenamiento
  const handleSort = (
    field: "code" | "name" | "category" | "stock" | "minStock" | "deficit"
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "code":
        aValue = a.code || "";
        bValue = b.code || "";
        break;
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "category":
        aValue = a.category;
        bValue = b.category;
        break;
      case "stock":
        aValue = a.stock;
        bValue = b.stock;
        break;
      case "minStock":
        aValue = a.minStock;
        bValue = b.minStock;
        break;
      case "deficit":
        aValue = a.minStock - a.stock;
        bValue = b.minStock - b.stock;
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Función para renderizar el indicador de ordenamiento
  const renderSortIndicator = (
    field: "code" | "name" | "category" | "stock" | "minStock" | "deficit"
  ) => {
    if (sortField !== field) return null;

    return sortDirection === "asc" ? (
      <FaSortAmountUp className="w-3 h-3" />
    ) : (
      <FaSortAmountDown className="w-3 h-3" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Productos con Stock Bajo
        </h1>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          <FaFileExcel className="mr-2" />
          Exportar a Excel
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="w-full md:w-1/2 relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="all">Todas las categorías</option>
            {categories
              .filter((cat) => cat !== "all")
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </div>
      </div>

      <motion.div
        className="bg-neutral-white rounded-lg shadow-md p-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {sortedProducts.length > 0 && (
          <div className="mb-4 p-4 bg-state-error bg-opacity-10 border-l-4 border-state-error rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-state-error" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-state-error">
                  Alerta de Stock Bajo
                </h3>
                <div className="mt-2 text-sm text-state-error">
                  <p>
                    Se han encontrado {sortedProducts.length} productos con
                    stock por debajo del mínimo requerido. Estos productos
                    necesitan reabastecimiento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedProducts.length > 0 ? (
          !isMobile ? (
            // Vista de escritorio - Tabla con scroll
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-light">
                <thead className="bg-primary-lightest sticky top-0 z-10">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Código</span>
                        {sortField === "code" && (
                          <span className="text-primary">
                            {renderSortIndicator("code")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Producto</span>
                        {sortField === "name" && (
                          <span className="text-primary">
                            {renderSortIndicator("name")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Categoría</span>
                        {sortField === "category" && (
                          <span className="text-primary">
                            {renderSortIndicator("category")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("stock")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Stock Actual</span>
                        {sortField === "stock" && (
                          <span className="text-primary">
                            {renderSortIndicator("stock")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("minStock")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Stock Mínimo</span>
                        {sortField === "minStock" && (
                          <span className="text-primary">
                            {renderSortIndicator("minStock")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("deficit")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Déficit</span>
                        {sortField === "deficit" && (
                          <span className="text-primary">
                            {renderSortIndicator("deficit")}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-white divide-y divide-neutral-light">
                  {sortedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-primary-lightest hover:bg-opacity-30"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono bg-neutral-light bg-opacity-50 px-2 py-1 rounded">
                          {product.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-dark">
                          {product.name}
                        </div>
                        <div className="text-xs text-neutral-medium max-w-xs truncate">
                          {product.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-lightest text-primary">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-state-error">
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          {product.minStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-state-error">
                          {product.minStock - product.stock}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Vista móvil - Tarjetas sin scroll interno
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-neutral-white rounded-lg shadow border border-state-error border-opacity-30 overflow-hidden"
                >
                  <div className="bg-state-error bg-opacity-10 px-4 py-2 border-l-4 border-state-error">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-neutral-dark">
                        {product.name}
                      </h3>
                    </div>
                    <div className="text-xs text-neutral-medium mt-1 truncate">
                      {product.description}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono bg-neutral-light bg-opacity-50 px-2 py-1 rounded">
                        {product.code || "---"}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-lightest text-primary">
                        {product.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="bg-neutral-lightest p-2 rounded">
                        <p className="text-xs text-neutral-medium">
                          Stock Actual
                        </p>
                        <p className="text-sm font-bold text-state-error">
                          {product.stock}
                        </p>
                      </div>
                      <div className="bg-neutral-lightest p-2 rounded">
                        <p className="text-xs text-neutral-medium">
                          Stock Mínimo
                        </p>
                        <p className="text-sm font-medium text-neutral-dark">
                          {product.minStock}
                        </p>
                      </div>
                      <div className="bg-state-error bg-opacity-10 p-2 rounded">
                        <p className="text-xs text-state-error">Déficit</p>
                        <p className="text-sm font-bold text-state-error">
                          {product.minStock - product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center">
                      <FaExclamationTriangle className="text-state-error mr-2" />
                      <span className="text-xs text-state-error">
                        Requiere reabastecimiento inmediato
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FaExclamationTriangle className="mx-auto text-neutral-medium text-5xl mb-4" />
              <h3 className="text-lg font-medium text-neutral-dark mb-1">
                No se encontraron productos
              </h3>
              <p className="text-neutral-medium">
                {searchTerm || selectedCategory !== "all"
                  ? "No hay productos que coincidan con los filtros seleccionados."
                  : "No hay productos con stock bajo. ¡Todo está en orden!"}
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LowStock;
