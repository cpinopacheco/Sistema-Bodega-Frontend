"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaChartBar,
  FaChartPie,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";
import { FaBan } from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { useWithdrawal } from "../context/WithdrawalContext";

const Statistics = () => {
  const { products, inactiveProducts } = useProducts();
  const { withdrawals } = useWithdrawal();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [showBars, setShowBars] = useState(false);
  const [key, setKey] = useState(0); // Clave para forzar el re-renderizado completo

  // Efecto para animar las barras al entrar a la vista
  useEffect(() => {
    // Delay más largo para la carga inicial
    const timer = setTimeout(() => {
      setShowBars(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Reiniciar la animación cuando cambia el período
  useEffect(() => {
    // Resetear completamente las barras
    setShowBars(false);
    setKey((prev) => prev + 1); // Forzar re-renderizado para asegurar que todas las barras se reseteen

    // Delay más largo para el cambio de filtro
    const timer = setTimeout(() => {
      setShowBars(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [period]);

  // Función para filtrar datos según el período seleccionado
  const filterDataByPeriod = (date: string) => {
    const currentDate = new Date();
    const itemDate = new Date(date);

    switch (period) {
      case "week":
        // Filtrar por la última semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);
        return itemDate >= oneWeekAgo;
      case "month":
        // Filtrar por el último mes
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(currentDate.getMonth() - 1);
        return itemDate >= oneMonthAgo;
      case "year":
        // Filtrar por el último año
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
        return itemDate >= oneYearAgo;
      default:
        return true;
    }
  };

  // Filtrar retiros según el período
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((withdrawal) =>
      filterDataByPeriod(withdrawal.createdAt)
    );
  }, [withdrawals, period]);

  // Para estadísticas de retiros y productos retirados, usamos los datos filtrados por período
  // Para estadísticas generales de productos y categorías, usamos todos los productos

  // Calcular estadísticas por categoría con TODOS los productos (sin filtrar por fecha)
  const categoryStats = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Obtener categorías ordenadas por cantidad de productos
  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calcular total de productos
  const totalProducts = products.length;

  // Calcular productos con stock bajo
  const lowStockProducts = products.filter(
    (product) => product.stock <= product.minStock
  );

  // Calcular estadísticas de retiros filtrados por período
  const totalWithdrawals = filteredWithdrawals.length;
  const totalItemsWithdrawn = filteredWithdrawals.reduce(
    (sum, withdrawal) => sum + withdrawal.totalItems,
    0
  );

  // Productos más retirados (filtrados por período)
  const productWithdrawalStats: Record<number, number> = {};
  filteredWithdrawals.forEach((withdrawal) => {
    withdrawal.items.forEach((item) => {
      productWithdrawalStats[item.productId] =
        (productWithdrawalStats[item.productId] || 0) + item.quantity;
    });
  });

  // Obtener productos más retirados
  const topWithdrawnProducts = Object.entries(productWithdrawalStats)
    .sort(
      (a, b) =>
        Number.parseInt(b[1].toString()) - Number.parseInt(a[1].toString())
    )
    .slice(0, 5)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === Number.parseInt(productId));
      const inactiveProduct = inactiveProducts.find(
        (p) => p.id === Number.parseInt(productId)
      );
      if (product) {
        return {
          id: productId,
          name: product.name,
          isActive: true,
          quantity,
        };
      } else if (inactiveProduct) {
        return {
          id: productId,
          name: inactiveProduct.name,
          isActive: false,
          quantity,
        };
      } else {
        return {
          id: productId,
          name: "Producto desconocido",
          isActive: null,
          quantity,
        };
      }
    });

  // Estadísticas por sección (filtradas por período)
  const sectionStats = filteredWithdrawals.reduce((acc, withdrawal) => {
    acc[withdrawal.withdrawerSection] =
      (acc[withdrawal.withdrawerSection] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Obtener secciones ordenadas por cantidad de retiros
  const sortedSections = Object.entries(sectionStats).sort(
    (a, b) => b[1] - a[1]
  );

  // Función para obtener el texto del período seleccionado
  const getPeriodText = () => {
    switch (period) {
      case "week":
        return "última semana";
      case "month":
        return "último mes";
      case "year":
        return "último año";
      default:
        return "período seleccionado";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-dark">Estadísticas</h1>
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              period === "week"
                ? "bg-primary text-neutral-white"
                : "bg-neutral-white text-neutral-dark hover:bg-primary-lightest"
            } border border-neutral-light`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 text-sm font-medium ${
              period === "month"
                ? "bg-primary text-neutral-white"
                : "bg-neutral-white text-neutral-dark hover:bg-primary-lightest"
            } border-t border-b border-neutral-light`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              period === "year"
                ? "bg-primary text-neutral-white"
                : "bg-neutral-white text-neutral-dark hover:bg-primary-lightest"
            } border border-neutral-light`}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="bg-primary-lightest p-4 rounded-md mb-4">
        <p className="text-sm text-primary">
          Mostrando estadísticas de retiros de la{" "}
          <strong>{getPeriodText()}</strong>. La distribución por categoría
          muestra el estado actual del inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-primary-lightest p-3 mr-4">
              <FaChartBar className="text-primary text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Total Productos</p>
              <p className="text-2xl font-bold text-neutral-dark">
                {totalProducts}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-state-error bg-opacity-10 p-3 mr-4">
              <FaChartLine className="text-state-error text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Stock Bajo</p>
              <p className="text-2xl font-bold text-state-error">
                {lowStockProducts.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-state-success bg-opacity-10 p-3 mr-4">
              <FaChartPie className="text-state-success text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Total Retiros</p>
              <p className="text-2xl font-bold text-state-success">
                {totalWithdrawals}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-accent bg-opacity-10 p-3 mr-4">
              <FaCalendarAlt className="text-accent text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Items Retirados</p>
              <p className="text-2xl font-bold text-accent">
                {totalItemsWithdrawn}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
          key={`categories-${key}`}
        >
          <div className="px-6 py-4 bg-primary-lightest border-b border-primary-lightest">
            <h2 className="text-lg font-semibold text-primary">
              Distribución por Categoría
            </h2>
          </div>
          <div className="p-6">
            {sortedCategories.length > 0 ? (
              <div className="space-y-4">
                {sortedCategories.map(([category, count], index) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-dark">
                        {category}
                      </span>
                      <span className="text-neutral-medium">
                        {count} productos
                      </span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: showBars
                            ? `${(count / sortedCategories[0][1]) * 100}%`
                            : "0%",
                          transition: `width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                          transitionDelay: `${index * 250}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-neutral-medium">
                No hay datos para el período seleccionado
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
          key={`products-${key}`}
        >
          <div className="px-6 py-4 bg-state-success bg-opacity-10 border-b border-state-success border-opacity-10">
            <h2 className="text-lg font-semibold text-primary">
              Productos Más Retirados
            </h2>
          </div>
          <div className="p-6">
            {topWithdrawnProducts.length > 0 ? (
              <div className="space-y-4">
                {topWithdrawnProducts.map(({ id, name, quantity, isActive }, index) => (
                  <div key={id}>
                    <div className="flex justify-between text-sm mb-1 items-center">
                      <span className="font-medium text-neutral-dark flex items-center gap-2">
                        {name}
                        {isActive === false && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-light text-neutral-medium flex items-center gap-1">
                            <FaBan className="text-state-error" /> Inactivo
                          </span>
                        )}
                      </span>
                      <span className="text-neutral-medium">
                        {quantity} unidades
                      </span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2.5">
                      <div
                        className="bg-state-success h-2.5 rounded-full"
                        style={{
                          width:
                            showBars && topWithdrawnProducts.length > 0
                              ? `${(quantity / topWithdrawnProducts[0].quantity) * 100}%`
                              : "0%",
                          transition: `width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                          transitionDelay: `${index * 250}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-neutral-medium">
                No hay retiros para el período seleccionado
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
        key={`sections-${key}`}
      >
        <div className="px-6 py-4 bg-accent-light border-b border-accent-light">
          <h2 className="text-lg font-semibold text-primary">
            Retiros por Sección
          </h2>
        </div>
        <div className="p-6">
          {sortedSections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                {sortedSections.map(([section, count], index) => (
                  <div key={section}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-dark">
                        {section}
                      </span>
                      <span className="text-neutral-medium">
                        {count} {count === 1 ? "retiro" : "retiros"}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-light rounded-full h-2.5">
                      <div
                        className="bg-accent h-2.5 rounded-full"
                        style={{
                          width:
                            showBars && sortedSections.length > 0
                              ? `${(count / sortedSections[0][1]) * 100}%`
                              : "0%",
                          transition: `width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                          transitionDelay: `${index * 250}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-neutral-dark mb-2">
                    {sortedSections.length}
                  </div>
                  <p className="text-sm text-neutral-medium">
                    Secciones Activas
                  </p>
                  <p className="text-sm text-neutral-medium mt-2">
                    Total de retiros: {filteredWithdrawals.length}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-neutral-medium">
              No hay retiros para el período seleccionado
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;
