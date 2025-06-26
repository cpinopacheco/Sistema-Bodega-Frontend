"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaFileExcel,
  FaSortAmountDown,
  FaSortAmountUp,
  FaInfoCircle,
} from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { ExportToExcel } from "../utils/ExcelExport";
import { formatDate } from "../utils/DateUtils";

const Inventory = () => {
  const { products } = useProducts();
  const [category, setCategory] = useState("all");
  const [productSortField, setProductSortField] = useState<string>("code");
  const [productSortDirection, setProductSortDirection] = useState<
    "asc" | "desc"
  >("asc");
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

  // Filtrar productos por categoría
  const filteredProducts =
    category === "all"
      ? products
      : products.filter((product) => product.category === category);

  // Categorías únicas
  const categories = [
    "all",
    ...new Set(products.map((product) => product.category)),
  ];

  // Exportar a Excel
  const exportStockReport = () => {
    const stockData = sortedProducts.map((product) => ({
      Código: product.code || "---",
      Nombre: product.name,
      Descripción: product.description,
      Categoría: product.category,
      Stock: product.stock,
      "Stock Mínimo": product.minStock,
      "Stock Bajo": product.stock <= product.minStock ? "Sí" : "No",
      "Última Actualización": formatDate(product.updatedAt),
    }));

    ExportToExcel(
      stockData,
      `Reporte_Stock_${formatDate(new Date().toISOString(), "simple")}`
    );
  };

  // Función para manejar el ordenamiento
  const handleSort = (field: string) => {
    if (productSortField === field) {
      setProductSortDirection(productSortDirection === "asc" ? "desc" : "asc");
    } else {
      setProductSortField(field);
      setProductSortDirection("asc");
    }
  };

  // Función para renderizar el indicador de ordenamiento
  const renderSortIndicator = (field: string) => {
    const currentField = productSortField;
    const currentDirection = productSortDirection;

    if (currentField !== field) return null;

    return currentDirection === "asc" ? (
      <FaSortAmountUp className="ml-1 text-primary" />
    ) : (
      <FaSortAmountDown className="ml-1 text-primary" />
    );
  };

  // Ordenar los productos filtrados
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (productSortField === "name") {
      return productSortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (productSortField === "code") {
      return productSortDirection === "asc"
        ? (a.code || "").localeCompare(b.code || "")
        : (b.code || "").localeCompare(a.code || "");
    } else if (productSortField === "category") {
      return productSortDirection === "asc"
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    } else if (productSortField === "stock") {
      return productSortDirection === "asc"
        ? a.stock - b.stock
        : b.stock - a.stock;
    } else if (productSortField === "minStock") {
      return productSortDirection === "asc"
        ? a.minStock - b.minStock
        : b.minStock - a.minStock;
    } else if (productSortField === "updatedAt") {
      return productSortDirection === "asc"
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  // Función para determinar el color del stock
  const getStockColor = (stock: number, minStock: number) => {
    if (stock <= minStock) return "text-state-error";
    if (stock <= minStock * 2) return "text-state-warning";
    return "text-state-success";
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Reporte de Stock
        </h1>
      </div>

      <div className="bg-neutral-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {/* Resumen arriba en móvil */}
          <div className="block sm:hidden mb-4">
            <div className="bg-primary-lightest p-4 rounded-md">
              <h3 className="text-lg font-medium text-primary mb-2">Resumen</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">
                    Total de productos
                  </p>
                  <p className="text-2xl font-bold text-neutral-dark">
                    {filteredProducts.length}
                  </p>
                </div>
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">Stock bajo</p>
                  <p className="text-2xl font-bold text-state-error">
                    {
                      filteredProducts.filter((p) => p.stock <= p.minStock)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">Stock normal</p>
                  <p className="text-2xl font-bold text-state-success">
                    {
                      filteredProducts.filter((p) => p.stock > p.minStock)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">Categorías</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Set(filteredProducts.map((p) => p.category)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Filtros y exportar - siempre visibles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="w-full sm:w-auto">
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                Filtrar por categoría
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full sm:w-auto rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="all">Todas las categorías</option>
                {categories
                  .filter((cat) => cat !== "all")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={exportStockReport}
              className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              <FaFileExcel className="mr-2" />
              Exportar a Excel
            </button>
          </div>
          {/* Resumen en escritorio */}
          <div className="hidden sm:block bg-primary-lightest p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-primary mb-2">Resumen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                <p className="text-sm text-neutral-medium">
                  Total de productos
                </p>
                <p className="text-2xl font-bold text-neutral-dark">
                  {filteredProducts.length}
                </p>
              </div>
              <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                <p className="text-sm text-neutral-medium">Stock bajo</p>
                <p className="text-2xl font-bold text-state-error">
                  {filteredProducts.filter((p) => p.stock <= p.minStock).length}
                </p>
              </div>
              <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                <p className="text-sm text-neutral-medium">Stock normal</p>
                <p className="text-2xl font-bold text-state-success">
                  {filteredProducts.filter((p) => p.stock > p.minStock).length}
                </p>
              </div>
              <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                <p className="text-sm text-neutral-medium">Categorías</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(filteredProducts.map((p) => p.category)).size}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-medium mb-2">
            {isMobile
              ? "Desliza para ver más información"
              : "Haz clic en los encabezados de la tabla para ordenar los productos."}
          </p>

          <div className="overflow-hidden rounded-lg border border-neutral-light">
            {!isMobile ? (
              // Vista de escritorio - Tabla con scroll
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-neutral-light table-fixed">
                    <thead className="bg-primary-lightest sticky top-0 z-10">
                      <tr>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[15%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("code")}
                        >
                          <div className="flex items-center">
                            CÓDIGO
                            {renderSortIndicator("code")}
                          </div>
                        </th>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[25%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            PRODUCTO
                            {renderSortIndicator("name")}
                          </div>
                        </th>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[25%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center">
                            CATEGORÍA
                            {renderSortIndicator("category")}
                          </div>
                        </th>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[15%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("stock")}
                        >
                          <div className="flex items-center">
                            STOCK
                            {renderSortIndicator("stock")}
                          </div>
                        </th>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[15%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("minStock")}
                        >
                          <div className="flex items-center">
                            STOCK MÍNIMO
                            {renderSortIndicator("minStock")}
                          </div>
                        </th>
                        <th
                          className="px-6 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer w-[20%] hover:bg-[#e9e9e9] transition-colors duration-200"
                          style={{ height: "40.5px" }}
                          onClick={() => handleSort("updatedAt")}
                        >
                          <div className="flex items-center">
                            ÚLTIMA ACTUALIZACIÓN
                            {renderSortIndicator("updatedAt")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-neutral-white divide-y divide-neutral-light">
                      {sortedProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={`hover:bg-primary-lightest hover:bg-opacity-30 ${
                            product.stock <= product.minStock
                              ? "bg-state-error bg-opacity-10"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                            <span className="text-sm font-mono bg-neutral-light bg-opacity-50 px-2 py-1 rounded">
                              {product.code || "---"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                            <div className="text-sm font-medium text-neutral-dark">
                              {product.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-lightest text-primary">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                            <div
                              className={`text-sm font-medium ${getStockColor(
                                product.stock,
                                product.minStock
                              )}`}
                            >
                              {product.stock} unidades
                            </div>
                            {product.stock <= product.minStock && (
                              <div className="text-xs text-state-error">
                                Stock bajo
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                            <div className="text-sm text-neutral-medium">
                              {product.minStock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[20%]">
                            <div className="text-sm text-neutral-medium">
                              {formatDate(product.updatedAt)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Vista móvil - Tarjetas sin scroll interno
              <div className="p-4 space-y-4">
                {sortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-neutral-white rounded-lg shadow p-4 border-l-4 ${
                      product.stock <= product.minStock
                        ? "border-state-error"
                        : product.stock <= product.minStock * 2
                        ? "border-state-warning"
                        : "border-state-success"
                    }`}
                  >
                    <div className="mb-3">
                      {/* Nombre del producto y código en la misma línea */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-neutral-dark flex-1 pr-2">
                          {product.name}
                        </h3>
                        <span className="text-xs font-mono bg-neutral-light bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
                          {product.code || "---"}
                        </span>
                      </div>

                      {/* Badge de categoría en su propia línea */}
                      <div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-lightest text-primary">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-neutral-lightest p-2 rounded">
                        <p className="text-xs text-neutral-medium">
                          Stock Actual
                        </p>
                        <div
                          className={`text-sm font-bold ${getStockColor(
                            product.stock,
                            product.minStock
                          )}`}
                        >
                          <div>{product.stock} unidades</div>
                          {product.stock <= product.minStock && (
                            <div className="mt-1">
                              <span className="text-xs bg-state-error bg-opacity-20 text-state-error px-2 py-1 rounded whitespace-nowrap">
                                ¡Stock bajo!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-neutral-lightest p-2 rounded">
                        <p className="text-xs text-neutral-medium">
                          Stock Mínimo
                        </p>
                        <p className="text-sm font-medium text-neutral-dark">
                          {product.minStock} unidades
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-neutral-medium flex items-center">
                      <FaInfoCircle className="mr-1" />
                      Actualizado: {formatDate(product.updatedAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FaInfoCircle className="mx-auto text-neutral-medium text-5xl mb-4" />
                <h3 className="text-lg font-medium text-neutral-dark mb-1">
                  No se encontraron productos
                </h3>
                <p className="text-neutral-medium">
                  {category !== "all"
                    ? "No hay productos en la categoría seleccionada."
                    : "No hay productos registrados en el sistema."}
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Inventory;
