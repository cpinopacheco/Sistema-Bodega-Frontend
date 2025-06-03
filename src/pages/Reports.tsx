"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileExcel,
  FaChartPie,
  FaBoxes,
  FaClipboardList,
} from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { useWithdrawal } from "../context/WithdrawalContext";
import { ExportToExcel } from "../utils/ExcelExport";
import { formatDate } from "../utils/DateUtils";

const Reports = () => {
  const { products } = useProducts();
  const { withdrawals } = useWithdrawal();

  const [activeTab, setActiveTab] = useState<"stock" | "withdrawals">("stock");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("all");

  // Filtrar retiros por fecha - USANDO LA MISMA LÓGICA EXACTA DE LA PÁGINA DE RETIROS
  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    if (!startDate && !endDate) return true;

    const withdrawalDate = new Date(withdrawal.createdAt);
    const withdrawalDateString = withdrawalDate.toISOString().split("T")[0];

    if (startDate && endDate) {
      return (
        withdrawalDateString >= startDate && withdrawalDateString <= endDate
      );
    } else if (startDate) {
      return withdrawalDateString >= startDate;
    } else if (endDate) {
      return withdrawalDateString <= endDate;
    }

    return true;
  });

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

  // Exportar reporte de stock a Excel
  const exportStockReport = () => {
    const stockData = filteredProducts.map((product) => ({
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

  // Exportar reporte de retiros a Excel
  const exportWithdrawalsReport = () => {
    let allWithdrawalItems: any[] = [];

    filteredWithdrawals.forEach((withdrawal) => {
      const items = withdrawal.items.map((item) => ({
        "ID Retiro": withdrawal.id,
        Fecha: formatDate(withdrawal.createdAt),
        Hora: formatDate(withdrawal.createdAt, "time"),
        "Usuario que registra": withdrawal.userName,
        "Sección que registra": withdrawal.userSection,
        "Persona que retira": withdrawal.withdrawerName,
        "Sección que retira": withdrawal.withdrawerSection,
        Producto: item.product.name,
        Categoría: item.product.category,
        Cantidad: item.quantity,
        Notas: withdrawal.notes || "N/A",
      }));

      allWithdrawalItems = [...allWithdrawalItems, ...items];
    });

    ExportToExcel(
      allWithdrawalItems,
      `Reporte_Retiros_${formatDate(new Date().toISOString(), "simple")}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark">Reportes</h1>
      </div>

      <div className="bg-neutral-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-neutral-light">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("stock")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === "stock"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-medium hover:text-neutral-dark hover:border-neutral-light"
              }`}
            >
              <FaBoxes className="mr-2" />
              Reporte de Stock
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                activeTab === "withdrawals"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-medium hover:text-neutral-dark hover:border-neutral-light"
              }`}
            >
              <FaClipboardList className="mr-2" />
              Reporte de Retiros
            </button>
          </nav>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "stock" ? (
            <motion.div
              key="stock"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
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

              <div className="bg-primary-lightest p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium text-primary mb-2">
                  Resumen
                </h3>
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

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-light">
                  <thead className="bg-primary-lightest">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                        Stock Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                        Stock Mínimo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                        Última Actualización
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-white divide-y divide-neutral-light">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-primary-lightest ${
                          product.stock <= product.minStock
                            ? "bg-state-error bg-opacity-10"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-dark">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-medium">
                            {product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${
                              product.stock <= product.minStock
                                ? "text-state-error"
                                : "text-state-success"
                            }`}
                          >
                            {product.stock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-medium">
                            {product.minStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-medium">
                            {formatDate(product.updatedAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="withdrawals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      id="end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={exportWithdrawalsReport}
                  className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  <FaFileExcel className="mr-2" />
                  Exportar a Excel
                </button>
              </div>

              <div className="bg-accent-light p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium text-primary mb-2">
                  Resumen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                    <p className="text-sm text-neutral-medium">Total retiros</p>
                    <p className="text-2xl font-bold text-neutral-dark">
                      {filteredWithdrawals.length}
                    </p>
                  </div>
                  <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                    <p className="text-sm text-neutral-medium">
                      Total items retirados
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {filteredWithdrawals.reduce(
                        (sum, w) => sum + w.totalItems,
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                    <p className="text-sm text-neutral-medium">
                      Usuarios distintos
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {
                        new Set(
                          filteredWithdrawals.map((w) => w.withdrawerName)
                        ).size
                      }
                    </p>
                  </div>
                </div>
              </div>

              {filteredWithdrawals.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-light">
                      <thead className="bg-primary-lightest">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            Persona que retira
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            Sección
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            Items
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-neutral-white divide-y divide-neutral-light">
                        {filteredWithdrawals.map((withdrawal) => (
                          <tr
                            key={withdrawal.id}
                            className="hover:bg-primary-lightest"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-neutral-dark">
                                #{withdrawal.id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-medium">
                                {formatDate(withdrawal.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-dark">
                                {withdrawal.withdrawerName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-medium">
                                {withdrawal.withdrawerSection}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-dark">
                                {withdrawal.totalItems}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaChartPie className="mx-auto text-neutral-medium text-5xl mb-4" />
                  <h3 className="text-lg font-medium text-neutral-dark mb-1">
                    No hay datos para mostrar
                  </h3>
                  <p className="text-neutral-medium">
                    No hay retiros que coincidan con los filtros seleccionados
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;
