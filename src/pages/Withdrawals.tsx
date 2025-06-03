"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShoppingCart,
  FaTrash,
  FaTimes,
  FaCheck,
  FaFileExcel,
  FaClipboardList,
  FaUser,
  FaBuilding,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { useWithdrawal } from "../context/WithdrawalContext";
import { Tooltip } from "../components/ui/Tooltip";
import { ExportToExcel } from "../utils/ExcelExport";
import { useNavigate } from "react-router-dom";
import { SECTIONS } from "../constants/sections";

const Withdrawals = () => {
  const {
    cart,
    withdrawals,
    removeFromCart,
    updateCartItemQuantity,
    confirmWithdrawal,
  } = useWithdrawal();
  const [notes, setNotes] = useState("");
  const [withdrawerName, setWithdrawerName] = useState("");
  const [withdrawerSection, setWithdrawerSection] = useState("");
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<number | null>(
    null
  );
  const navigate = useNavigate();

  // Agregar estos estados al inicio del componente (después de los estados existentes)
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Estados para ordenamiento
  const [sortField, setSortField] = useState<
    "date" | "id" | "items" | "section"
  >("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // desc = más recientes primero por defecto

  // Calcular el total de items en el carrito
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Manejar cambio de cantidad
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    updateCartItemQuantity(productId, newQuantity);
  };

  // Manejar confirmación de retiro
  const handleConfirmWithdrawal = () => {
    confirmWithdrawal(withdrawerName, withdrawerSection, notes);
    setNotes("");
    setWithdrawerName("");
    setWithdrawerSection("");
  };

  // Manejar exportación a Excel
  const handleExportToExcel = (withdrawalId: number) => {
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) return;

    const withdrawalData = withdrawal.items.map((item) => ({
      Producto: item.product.name,
      Categoría: item.product.category,
      Cantidad: item.quantity,
      "Fecha de retiro": new Date(withdrawal.createdAt).toLocaleDateString(),
      "Hora de retiro": new Date(withdrawal.createdAt).toLocaleTimeString(),
      "Usuario que registra": withdrawal.userName,
      "Sección que registra": withdrawal.userSection,
      "Persona que retira": withdrawal.withdrawerName,
      "Sección que retira": withdrawal.withdrawerSection,
      Notas: withdrawal.notes || "N/A",
    }));

    ExportToExcel(
      withdrawalData,
      `Retiro-${withdrawalId}-${new Date(
        withdrawal.createdAt
      ).toLocaleDateString()}`
    );
  };

  // Filtrar y ordenar retiros
  const filteredAndSortedWithdrawals = withdrawals
    .filter((withdrawal) => {
      // Filtro por término de búsqueda
      const matchesSearch =
        searchTerm === "" ||
        withdrawal.withdrawerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        withdrawal.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.withdrawerSection
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        withdrawal.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.id.toString().includes(searchTerm);

      // Filtro por fecha de inicio
      const matchesStartDate =
        startDate === "" ||
        new Date(withdrawal.createdAt) >= new Date(startDate);

      // Filtro por fecha de fin
      const matchesEndDate =
        endDate === "" ||
        new Date(withdrawal.createdAt) <= new Date(endDate + "T23:59:59");

      // Filtro por sección
      const matchesSection =
        selectedSection === "" ||
        withdrawal.withdrawerSection === selectedSection;

      return (
        matchesSearch && matchesStartDate && matchesEndDate && matchesSection
      );
    })
    .sort((a, b) => {
      // Ordenamiento según el campo seleccionado
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "id":
          comparison = a.id - b.id;
          break;
        case "items":
          comparison = a.totalItems - b.totalItems;
          break;
        case "section":
          comparison = a.withdrawerSection.localeCompare(b.withdrawerSection);
          break;
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      // Aplicar dirección del ordenamiento
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedSection("");
  };

  // Función para renderizar el indicador de ordenamiento
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;

    return sortDirection === "asc" ? (
      <FaSortAmountUp className="ml-1 text-primary" />
    ) : (
      <FaSortAmountDown className="ml-1 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Gestión de Retiros
        </h1>
        <button
          onClick={() => setShowWithdrawalHistory(!showWithdrawalHistory)}
          className="px-4 py-2 rounded-md bg-primary text-neutral-white hover:bg-primary-light transition-colors"
        >
          {showWithdrawalHistory
            ? "Volver a Retiros"
            : "Ver Historial de Retiros"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showWithdrawalHistory ? (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-neutral-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary flex items-center">
                  <FaShoppingCart className="mr-2 text-primary" />
                  Carrito de Retiro
                </h2>
                <span className="px-3 py-1 bg-primary-lightest text-primary rounded-full text-sm font-medium">
                  {cartTotalItems} {cartTotalItems === 1 ? "ítem" : "ítems"}
                </span>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-light">
                      <colgroup>
                        <col className="w-[75%]" />
                        <col className="w-[15%]" />
                        <col className="w-[10%]" />
                      </colgroup>
                      <thead className="bg-primary-lightest">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-neutral-white divide-y divide-neutral-light">
                        {cart.map((item) => (
                          <tr
                            key={item.productId}
                            className="hover:bg-primary-lightest hover:bg-opacity-30"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-0">
                                  <div className="text-sm font-medium text-neutral-dark">
                                    {item.product.name}
                                  </div>
                                  <div className="text-sm text-neutral-medium">
                                    {item.product.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex justify-center">
                                <div className="inline-flex items-center">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.productId,
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center bg-neutral-light rounded-l-md hover:bg-primary hover:text-neutral-white transition-colors"
                                    aria-label="Disminuir cantidad"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        item.productId,
                                        Number.parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-10 h-7 text-center border-t border-b border-neutral-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-primary focus:ring-primary"
                                  />
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.productId,
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-7 h-7 flex items-center justify-center bg-neutral-light rounded-r-md hover:bg-primary hover:text-neutral-white transition-colors"
                                    aria-label="Aumentar cantidad"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex justify-center">
                                <Tooltip
                                  content="Eliminar del carrito"
                                  position="top"
                                >
                                  <button
                                    onClick={() =>
                                      removeFromCart(item.productId)
                                    }
                                    className="text-state-error hover:bg-state-error hover:text-neutral-white p-1.5 rounded-full transition-colors flex items-center justify-center w-7 h-7"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-light pt-4">
                    <div>
                      <label
                        htmlFor="withdrawerName"
                        className="block text-sm font-medium text-neutral-dark mb-2"
                      >
                        <FaUser className="inline mr-1 text-primary" /> Nombre
                        de quien retira{" "}
                        <span className="text-state-error">*</span>
                      </label>
                      <input
                        id="withdrawerName"
                        type="text"
                        value={withdrawerName}
                        onChange={(e) => setWithdrawerName(e.target.value)}
                        className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                        placeholder="Ingrese el nombre de la persona que retira"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="withdrawerSection"
                        className="block text-sm font-medium text-neutral-dark mb-2"
                      >
                        <FaBuilding className="inline mr-1 text-primary" />{" "}
                        Sección <span className="text-state-error">*</span>
                      </label>
                      <select
                        id="withdrawerSection"
                        value={withdrawerSection}
                        onChange={(e) => setWithdrawerSection(e.target.value)}
                        className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                        required
                      >
                        <option value="">Seleccione una sección</option>
                        {SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-neutral-light pt-4">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-neutral-dark mb-2"
                    >
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="Añade notas adicionales sobre este retiro..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleConfirmWithdrawal}
                      disabled={
                        !withdrawerName.trim() || !withdrawerSection.trim()
                      }
                      className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheck className="mr-2" />
                      Confirmar Retiro
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaShoppingCart className="mx-auto text-neutral-medium text-5xl mb-4" />
                  <h3 className="text-lg font-medium text-neutral-dark mb-1">
                    El carrito está vacío
                  </h3>
                  <p className="text-neutral-medium mb-4">
                    Agrega productos desde la sección de Productos para iniciar
                    un retiro
                  </p>
                  <button
                    onClick={() => navigate("/products")}
                    className="inline-flex items-center px-4 py-2 bg-primary text-neutral-white rounded-md hover:bg-primary-light transition-colors"
                  >
                    Ir a Productos
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-neutral-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-primary-lightest px-6 py-4 border-b border-primary-lightest">
                <h2 className="text-xl font-semibold text-primary">
                  Historial de Retiros
                </h2>
              </div>

              {/* Panel de Filtros */}
              <div className="bg-primary-lightest p-4 rounded-lg mb-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  {/* Búsqueda por texto */}
                  <div className="flex-1 min-w-[250px]">
                    <label
                      htmlFor="search"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Buscar retiros
                    </label>
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, sección, ID o notas..."
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {/* Filtro por sección */}
                  <div className="min-w-[200px]">
                    <label
                      htmlFor="sectionFilter"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Sección
                    </label>
                    <select
                      id="sectionFilter"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="">Todas las secciones</option>
                      {SECTIONS.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                  {/* Fecha desde */}
                  <div className="min-w-[150px]">
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Desde
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {/* Fecha hasta */}
                  <div className="min-w-[150px]">
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-neutral-dark mb-1"
                    >
                      Hasta
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {/* Botón limpiar filtros */}
                  <div>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-neutral-medium text-neutral-white rounded-md hover:bg-neutral-dark transition-colors"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </div>

                {/* Contador de resultados */}
                <div className="text-sm text-neutral-medium">
                  Mostrando {filteredAndSortedWithdrawals.length} de{" "}
                  {withdrawals.length} retiros
                </div>

                {/* Ordenamiento */}
                <div className="flex flex-wrap gap-4 items-center border-t border-neutral-light pt-3">
                  <div className="text-sm font-medium text-neutral-dark">
                    Ordenar por:
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSortField("date");
                        setSortDirection(
                          sortField === "date" && sortDirection === "desc"
                            ? "asc"
                            : "desc"
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                        sortField === "date"
                          ? "bg-primary text-neutral-white"
                          : "bg-neutral-light text-neutral-dark hover:bg-primary-lightest"
                      }`}
                    >
                      Fecha
                      {sortField === "date" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1" />
                        ) : (
                          <FaSortAmountDown className="ml-1" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        setSortField("id");
                        setSortDirection(
                          sortField === "id" && sortDirection === "desc"
                            ? "asc"
                            : "desc"
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                        sortField === "id"
                          ? "bg-primary text-neutral-white"
                          : "bg-neutral-light text-neutral-dark hover:bg-primary-lightest"
                      }`}
                    >
                      ID
                      {sortField === "id" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1" />
                        ) : (
                          <FaSortAmountDown className="ml-1" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        setSortField("items");
                        setSortDirection(
                          sortField === "items" && sortDirection === "desc"
                            ? "asc"
                            : "desc"
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                        sortField === "items"
                          ? "bg-primary text-neutral-white"
                          : "bg-neutral-light text-neutral-dark hover:bg-primary-lightest"
                      }`}
                    >
                      Cantidad
                      {sortField === "items" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1" />
                        ) : (
                          <FaSortAmountDown className="ml-1" />
                        ))}
                    </button>

                    <button
                      onClick={() => {
                        setSortField("section");
                        setSortDirection(
                          sortField === "section" && sortDirection === "desc"
                            ? "asc"
                            : "desc"
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                        sortField === "section"
                          ? "bg-primary text-neutral-white"
                          : "bg-neutral-light text-neutral-dark hover:bg-primary-lightest"
                      }`}
                    >
                      Sección
                      {sortField === "section" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1" />
                        ) : (
                          <FaSortAmountDown className="ml-1" />
                        ))}
                    </button>
                  </div>
                </div>
              </div>

              {filteredAndSortedWithdrawals.length > 0 ? (
                <div className="divide-y divide-neutral-light">
                  {filteredAndSortedWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium text-neutral-dark">
                          Retiro #{withdrawal.id} - {withdrawal.withdrawerName}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <Tooltip content="Exportar a Excel" position="top">
                            <button
                              onClick={() => handleExportToExcel(withdrawal.id)}
                              className="flex items-center justify-center w-9 h-9 text-state-success hover:bg-state-success hover:text-neutral-white rounded-full transition-colors p-2"
                              aria-label="Exportar a Excel"
                            >
                              <FaFileExcel size={18} />
                            </button>
                          </Tooltip>
                          <Tooltip
                            content={
                              selectedWithdrawal === withdrawal.id
                                ? "Ocultar detalles"
                                : "Ver detalles"
                            }
                            position="top"
                          >
                            <button
                              onClick={() =>
                                setSelectedWithdrawal(
                                  selectedWithdrawal === withdrawal.id
                                    ? null
                                    : withdrawal.id
                                )
                              }
                              className="flex items-center justify-center w-9 h-9 text-primary hover:bg-primary hover:text-neutral-white rounded-full transition-colors p-2"
                              aria-label={
                                selectedWithdrawal === withdrawal.id
                                  ? "Ocultar detalles"
                                  : "Ver detalles"
                              }
                            >
                              {selectedWithdrawal === withdrawal.id ? (
                                <FaTimes size={18} />
                              ) : (
                                <FaClipboardList size={18} />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-medium mb-2">
                        <div>
                          <strong>Fecha:</strong>{" "}
                          {new Date(withdrawal.createdAt).toLocaleDateString()}{" "}
                          {new Date(withdrawal.createdAt).toLocaleTimeString()}
                        </div>
                        <div>
                          <strong>Retirado por:</strong>{" "}
                          {withdrawal.withdrawerName} -{" "}
                          <strong>Sección:</strong>{" "}
                          {withdrawal.withdrawerSection}
                        </div>
                        <div>
                          <strong>Registrado por:</strong> {withdrawal.userName}{" "}
                          - <strong>Items:</strong> {withdrawal.totalItems}
                        </div>
                      </div>

                      {withdrawal.notes && (
                        <div className="text-sm text-neutral-medium mb-2 italic">
                          "{withdrawal.notes}"
                        </div>
                      )}

                      <AnimatePresence>
                        {selectedWithdrawal === withdrawal.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 overflow-hidden"
                          >
                            <h4 className="text-sm font-medium text-primary mb-2">
                              Detalle de productos:
                            </h4>
                            <div className="bg-primary-lightest rounded-md overflow-x-auto">
                              <table className="min-w-full divide-y divide-neutral-light">
                                <colgroup>
                                  <col className="w-[75%]" />
                                  <col className="w-[15%]" />
                                  <col className="w-[10%]" />
                                </colgroup>
                                <thead className="bg-primary-lightest">
                                  <tr>
                                    <th className="px-6 py-2 text-left text-xs font-medium text-primary uppercase tracking-wider">
                                      Producto
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-medium text-primary uppercase tracking-wider">
                                      Categoría
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-medium text-primary uppercase tracking-wider">
                                      Cantidad
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-neutral-white divide-y divide-neutral-light">
                                  {withdrawal.items.map((item) => (
                                    <tr
                                      key={item.productId}
                                      className="hover:bg-primary-lightest"
                                    >
                                      <td className="px-6 py-2 whitespace-nowrap text-sm text-neutral-dark">
                                        {item.product.name}
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap text-sm text-neutral-medium text-center">
                                        {item.product.category}
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap text-sm text-neutral-dark text-center">
                                        {item.quantity}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaClipboardList className="mx-auto text-neutral-medium text-5xl mb-4" />
                  <h3 className="text-lg font-medium text-neutral-dark mb-1">
                    No hay retiros registrados
                  </h3>
                  <p className="text-neutral-medium">
                    Aún no se han realizado retiros de productos del inventario
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Withdrawals;
