"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaBoxes, FaExclamationTriangle } from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { Tooltip } from "../components/ui/Tooltip";

const InactiveProducts = () => {
  const { inactiveProducts, activateProduct, loadInactiveProducts, loading } =
    useProducts();
  const [confirmActivate, setConfirmActivate] = useState<number | null>(null);

  // Cargar productos inactivos al montar el componente
  useEffect(() => {
    loadInactiveProducts();
  }, [loadInactiveProducts]);

  // Función para confirmar reactivación
  const handleActivateConfirm = (id: number) => {
    setConfirmActivate(id);
  };

  // Función para reactivar producto
  const handleActivate = async (id: number) => {
    try {
      await activateProduct(id);
      setConfirmActivate(null);
    } catch (error) {
      console.error("Error reactivando producto:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">
            Productos Desactivados
          </h1>
          <p className="text-neutral-medium mt-1">
            Gestiona productos que han sido desactivados para preservar el
            historial de retiros
          </p>
        </div>
        <div className="bg-state-warning bg-opacity-10 px-4 py-2 rounded-lg">
          <span className="text-state-warning font-medium">
            {inactiveProducts.length} productos desactivados
          </span>
        </div>
      </div>

      {/* Información sobre productos desactivados */}
      <div className="bg-accent-light p-4 rounded-lg border-l-4 border-accent">
        <div className="flex items-start">
          <FaExclamationTriangle className="text-accent mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-neutral-dark">
              ¿Por qué se desactivan los productos?
            </h3>
            <p className="text-sm text-neutral-medium mt-1">
              Los productos se desactivan automáticamente cuando intentas
              eliminarlos pero tienen retiros asociados. Esto preserva la
              integridad del historial mientras evita que aparezcan en nuevos
              retiros.
            </p>
          </div>
        </div>
      </div>

      {inactiveProducts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead className="bg-neutral-lightest">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Retiros
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-white divide-y divide-neutral-light">
                {inactiveProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-neutral-lightest hover:bg-opacity-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono bg-neutral-light bg-opacity-50 px-2 py-1 rounded">
                        {product.code || "---"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-dark">
                          {product.name}
                        </div>
                        <div className="text-sm text-neutral-medium max-w-xs truncate">
                          {product.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-light text-neutral-dark">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-dark">
                        {product.stock} unidades
                      </div>
                      <div className="text-xs text-neutral-medium">
                        Mín: {product.minStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="text-state-warning mr-2" />
                        <span className="text-sm font-medium text-state-warning">
                          {product.withdrawalCount || 0}{" "}
                          {(product.withdrawalCount || 0) === 1
                            ? "retiro"
                            : "retiros"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Tooltip content="Reactivar producto" position="top">
                          <button
                            onClick={() => handleActivateConfirm(product.id)}
                            className="text-state-success hover:bg-state-success hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                          >
                            <FaCheck size={16} />
                          </button>
                        </Tooltip>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-neutral-white rounded-lg shadow-md p-8 text-center"
        >
          <FaBoxes className="mx-auto text-neutral-medium text-5xl mb-4" />
          <h3 className="text-lg font-medium text-neutral-dark mb-1">
            No hay productos desactivados
          </h3>
          <p className="text-neutral-medium">
            Todos los productos están activos. Los productos se desactivan
            automáticamente cuando tienen retiros asociados y intentas
            eliminarlos.
          </p>
        </motion.div>
      )}

      {/* Modal de confirmación para reactivar */}
      {confirmActivate !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setConfirmActivate(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-neutral-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-state-success bg-opacity-10 flex items-center justify-center mr-3">
                <FaCheck className="text-state-success" />
              </div>
              <h3 className="text-lg font-medium text-neutral-dark">
                Reactivar Producto
              </h3>
            </div>
            <p className="text-neutral-medium mb-6">
              ¿Estás seguro de que deseas reactivar este producto? Volverá a
              estar disponible para nuevos retiros.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmActivate(null)}
                className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleActivate(confirmActivate)}
                className="px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Reactivar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default InactiveProducts;
