"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
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
  FaSearch,
  FaFilter,
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
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<number | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Estados para ordenamiento
  const [sortField, setSortField] = useState<
    "date" | "id" | "items" | "section" | "withdrawer" | "registeredBy"
  >("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // desc = más recientes primero por defecto

  // Efecto para verificar si se debe mostrar el carrito basado en el estado de navegación
  useEffect(() => {
    // Verificar si hay un estado en la navegación que indique mostrar el carrito
    if (location.state && location.state.showCart) {
      setShowWithdrawalHistory(false);
      // Limpiar el estado para evitar comportamientos inesperados en futuras navegaciones
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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

  // Manejar exportación masiva a Excel
  const handleMassExportToExcel = () => {
    let allWithdrawalItems: any[] = [];

    filteredAndSortedWithdrawals.forEach((withdrawal) => {
      const items = withdrawal.items.map((item) => ({
        "ID Retiro": withdrawal.id,
        Fecha: new Date(withdrawal.createdAt).toLocaleDateString(),
        Hora: new Date(withdrawal.createdAt).toLocaleTimeString(),
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

    const dateRange =
      startDate && endDate
        ? `_${startDate}_${endDate}`
        : startDate
        ? `_desde_${startDate}`
        : endDate
        ? `_hasta_${endDate}`
        : "";
    ExportToExcel(
      allWithdrawalItems,
      `Reporte_Retiros${dateRange}_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "-")}`
    );
  };

  // Manejar ordenamiento
  const handleSort = (
    field: "date" | "id" | "items" | "section" | "withdrawer" | "registeredBy"
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Por defecto, ordenar descendente al cambiar de campo
    }
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
        case "withdrawer":
          comparison = a.withdrawerName.localeCompare(b.withdrawerName);
          break;
        case "registeredBy":
          comparison = a.userName.localeCompare(b.userName);
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
      <FaSortAmountUp className="ml-1 inline-block" />
    ) : (
      <FaSortAmountDown className="ml-1 inline-block" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark flex items-center">
          {showWithdrawalHistory ? (
            "Historial de Retiros"
          ) : (
            <>
              <FaShoppingCart className="mr-2 text-primary" />
              Carrito de Retiro
            </>
          )}
        </h1>
        <button
          onClick={() => setShowWithdrawalHistory(!showWithdrawalHistory)}
          className="px-4 py-2 rounded-md bg-primary text-neutral-white hover:bg-primary-light transition-colors"
        >
          {showWithdrawalHistory
            ? "Ver Carrito de Retiro"
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
              <div className="flex items-center justify-end mb-6">
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
            {/* Sección de filtros - Separada de la tabla */}
            <div className="bg-neutral-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <FaFilter className="text-primary mr-2" />
                <h3 className="text-lg font-medium text-neutral-dark">
                  Filtros
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda por texto */}
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-neutral-dark mb-2"
                  >
                    Buscar retiros
                  </label>
                  <div className="relative">
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, sección, ID o notas..."
                      className="w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary pl-10"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium" />
                  </div>
                </div>

                {/* Filtro por sección */}
                <div>
                  <label
                    htmlFor="sectionFilter"
                    className="block text-sm font-medium text-neutral-dark mb-2"
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

                {/* Fecha desde */}
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-neutral-dark mb-2"
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
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-neutral-dark mb-2"
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
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-neutral-medium">
                  Mostrando {filteredAndSortedWithdrawals.length} de{" "}
                  {withdrawals.length} retiros
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-neutral-medium text-neutral-white rounded-md hover:bg-neutral-dark transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Sección de resumen */}
            <div className="bg-primary-lightest p-4 rounded-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-primary">Resumen</h3>
                <button
                  onClick={handleMassExportToExcel}
                  className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  <FaFileExcel className="mr-2" />
                  Exportar a Excel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">Total retiros</p>
                  <p className="text-2xl font-bold text-neutral-dark">
                    {filteredAndSortedWithdrawals.length}
                  </p>
                </div>
                <div className="bg-neutral-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-neutral-medium">
                    Total items retirados
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {filteredAndSortedWithdrawals.reduce(
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
                        filteredAndSortedWithdrawals.map(
                          (w) => w.withdrawerName
                        )
                      ).size
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Sección de tabla - Separada de los filtros */}
            <div className="bg-neutral-white rounded-lg shadow-md overflow-hidden">
              {filteredAndSortedWithdrawals.length > 0 ? (
                <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
                  <table className="min-w-full divide-y divide-neutral-light">
                    <thead className="bg-primary-lightest sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("id")}
                        >
                          ID {renderSortIndicator("id")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("date")}
                        >
                          Fecha {renderSortIndicator("date")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("withdrawer")}
                        >
                          Retirado por {renderSortIndicator("withdrawer")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("section")}
                        >
                          Sección {renderSortIndicator("section")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("registeredBy")}
                        >
                          Registrado por {renderSortIndicator("registeredBy")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-[#e9e9e9]"
                          onClick={() => handleSort("items")}
                        >
                          Items {renderSortIndicator("items")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-primary uppercase tracking-wider"
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-neutral-white divide-y divide-neutral-light">
                      {filteredAndSortedWithdrawals.map((withdrawal) => (
                        <>
                          <tr
                            key={withdrawal.id}
                            className={`hover:bg-primary-lightest hover:bg-opacity-30 cursor-pointer ${
                              selectedWithdrawal === withdrawal.id
                                ? "bg-primary-lightest"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedWithdrawal(
                                selectedWithdrawal === withdrawal.id
                                  ? null
                                  : withdrawal.id
                              )
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-dark">
                              #{withdrawal.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium">
                              {new Date(
                                withdrawal.createdAt
                              ).toLocaleDateString()}{" "}
                              {new Date(
                                withdrawal.createdAt
                              ).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
                              {withdrawal.withdrawerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium">
                              {withdrawal.withdrawerSection}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-medium">
                              {withdrawal.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark text-center">
                              {withdrawal.totalItems}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-center space-x-2">
                                <Tooltip
                                  content="Exportar a Excel"
                                  position="top"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportToExcel(withdrawal.id);
                                    }}
                                    className="flex items-center justify-center w-8 h-8 text-state-success hover:bg-state-success hover:text-neutral-white rounded-full transition-colors p-2"
                                    aria-label="Exportar a Excel"
                                  >
                                    <FaFileExcel size={16} />
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedWithdrawal(
                                        selectedWithdrawal === withdrawal.id
                                          ? null
                                          : withdrawal.id
                                      );
                                    }}
                                    className="flex items-center justify-center w-8 h-8 text-primary hover:bg-primary hover:text-neutral-white rounded-full transition-colors p-2"
                                    aria-label={
                                      selectedWithdrawal === withdrawal.id
                                        ? "Ocultar detalles"
                                        : "Ver detalles"
                                    }
                                  >
                                    {selectedWithdrawal === withdrawal.id ? (
                                      <FaTimes size={16} />
                                    ) : (
                                      <FaClipboardList size={16} />
                                    )}
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                          {selectedWithdrawal === withdrawal.id && (
                            <tr>
                              <td colSpan={7} className="px-0 py-0 border-t-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    opacity: { duration: 0.6 },
                                    height: {
                                      duration: 0.3,
                                      ease: [0.25, 0.46, 0.45, 0.94],
                                    },
                                  }}
                                  className="bg-primary-lightest bg-opacity-30 px-6 py-4"
                                >
                                  {withdrawal.notes && (
                                    <div className="text-sm text-neutral-medium mb-4 p-3 bg-neutral-white rounded-md italic">
                                      <strong>Notas:</strong> {withdrawal.notes}
                                    </div>
                                  )}
                                  <h4 className="text-sm font-medium text-primary mb-2">
                                    Detalle de productos:
                                  </h4>
                                  <div className="bg-neutral-white rounded-md overflow-x-auto">
                                    <table className="min-w-full divide-y divide-neutral-light">
                                      <thead className="bg-primary-lightest">
                                        <tr>
                                          <th className="px-6 py-2 text-left text-xs font-medium text-primary uppercase tracking-wider">
                                            Producto
                                          </th>
                                          <th className="px-2 py-2 text-left text-xs font-medium text-primary uppercase tracking-wider">
                                            Categoría
                                          </th>
                                          <th className="px-2 py-2 text-left text-xs font-medium text-primary uppercase tracking-wider">
                                            Cantidad
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-neutral-white divide-y divide-neutral-light">
                                        {withdrawal.items.map((item) => (
                                          <tr
                                            key={item.productId}
                                            className="hover:bg-primary-lightest hover:bg-opacity-30"
                                          >
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-neutral-dark">
                                              {item.product.name}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm text-neutral-medium text-left">
                                              {item.product.category}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm text-neutral-dark text-left">
                                              {item.quantity}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
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
