"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaFileUpload,
  FaDownload,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";

interface ProductImportModalProps {
  onClose: () => void;
  isVisible: boolean;
}

interface ImportProduct {
  name: string;
  description: string;
  category: string;
  stock: number | null;
  minStock: number | null;
  isValid: boolean;
  errors: string[];
}

const ProductImportModal = ({
  onClose,
  isVisible,
}: ProductImportModalProps) => {
  const { categories, products, addProduct, loadProducts } = useProducts();
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingProductNames, setExistingProductNames] = useState<string[]>(
    []
  );

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

  // Cargar nombres de productos existentes
  useEffect(() => {
    if (products && products.length > 0) {
      const names = products.map((product) => product.name.toLowerCase());
      setExistingProductNames(names);
    }
  }, [products]);

  // Función para descargar plantilla
  const downloadTemplate = () => {
    const templateData = [
      {
        nombre: "Ejemplo Producto 1",
        descripcion: "Descripción del producto",
        categoria:
          categories.length > 0 ? categories[0].name : "Categoria Ejemplo",
        stock: 100,
        stockMinimo: 10,
      },
      {
        nombre: "Ejemplo Producto 2",
        descripcion: "Otra descripción",
        categoria:
          categories.length > 1 ? categories[1].name : "Categoria Ejemplo",
        stock: 50,
        stockMinimo: 5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    // Ajustar anchos de columna
    worksheet["!cols"] = [
      { width: 25 }, // nombre
      { width: 40 }, // descripcion
      { width: 20 }, // categoria
      { width: 10 }, // stock
      { width: 15 }, // stockMinimo
    ];

    XLSX.writeFile(workbook, "plantilla_productos.xlsx");
    toast.success("Plantilla descargada correctamente");
  };

  // Función para validar un producto
  const validateProduct = (product: any): ImportProduct => {
    const errors: string[] = [];
    let isValid = true;

    // Validar nombre
    if (
      !product.nombre ||
      typeof product.nombre !== "string" ||
      !product.nombre.trim()
    ) {
      errors.push("Nombre es requerido");
      isValid = false;
    } else {
      // Verificar si el nombre ya existe
      if (existingProductNames.includes(product.nombre.toLowerCase())) {
        errors.push(`Ya existe un producto con el nombre "${product.nombre}"`);
        isValid = false;
      }
    }

    // Validar categoría
    if (!product.categoria || typeof product.categoria !== "string") {
      errors.push("Categoría es requerida");
      isValid = false;
    } else {
      const categoryExists = categories.some(
        (cat) => cat.name.toLowerCase() === product.categoria.toLowerCase()
      );
      if (!categoryExists) {
        errors.push(`Categoría "${product.categoria}" no existe`);
        isValid = false;
      }
    }

    // Validar stock
    if (
      product.stock === undefined ||
      product.stock === null ||
      product.stock === ""
    ) {
      errors.push("Stock es requerido");
      isValid = false;
    } else if (typeof product.stock !== "number" || product.stock < 0) {
      errors.push("Stock debe ser un número mayor o igual a 0");
      isValid = false;
    }

    // Validar stock mínimo
    if (
      product.stockMinimo === undefined ||
      product.stockMinimo === null ||
      product.stockMinimo === ""
    ) {
      errors.push("Stock mínimo es requerido");
      isValid = false;
    } else if (
      typeof product.stockMinimo !== "number" ||
      product.stockMinimo < 0
    ) {
      errors.push("Stock mínimo debe ser un número mayor o igual a 0");
      isValid = false;
    }

    return {
      name: product.nombre || "",
      description: product.descripcion || "",
      category: product.categoria || "",
      stock:
        product.stock !== undefined &&
        product.stock !== null &&
        product.stock !== ""
          ? product.stock
          : null,
      minStock:
        product.stockMinimo !== undefined &&
        product.stockMinimo !== null &&
        product.stockMinimo !== ""
          ? product.stockMinimo
          : null,
      isValid,
      errors,
    };
  };

  // Función para procesar archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("El archivo está vacío");
          return;
        }

        // Validar y procesar datos
        const processedData = jsonData.map((row: any) => validateProduct(row));
        setImportData(processedData);
        setShowPreview(true);

        const validCount = processedData.filter((item) => item.isValid).length;
        const invalidCount = processedData.length - validCount;

        if (invalidCount > 0) {
          toast.error(
            `${invalidCount} productos tienen errores. Revisa la vista previa.`
          );
        } else {
          toast.success(`${validCount} productos listos para importar`);
        }
      } catch (error) {
        console.error("Error procesando archivo:", error);
        toast.error("Error al procesar el archivo. Verifica el formato.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Función para obtener el ID de la categoría por nombre
  const getCategoryIdByName = (categoryName: string): number | null => {
    const category = categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category ? category.id : null;
  };

  // Función para importar productos
  const handleImport = async () => {
    const validProducts = importData.filter((product) => product.isValid);

    if (validProducts.length === 0) {
      toast.error("No hay productos válidos para importar");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    let errorDetails: string[] = [];

    try {
      // Obtener la función addProductSilent del contexto si existe, o crear una versión silenciosa
      const addProductSilent = async (productData: any) => {
        try {
          const API_URL = "http://localhost:3001";
          const response = await fetch(`${API_URL}/api/products`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ error: "Error desconocido" }));

            // Manejar errores específicos
            if (
              response.status === 409 &&
              errorData.code === "DUPLICATE_NAME"
            ) {
              throw new Error(
                `Ya existe un producto con el nombre "${productData.name}"`
              );
            } else if (response.status === 400) {
              throw new Error(
                `Error de validación: ${errorData.error || "Datos inválidos"}`
              );
            } else if (response.status === 401) {
              throw new Error("No tienes permisos para crear productos");
            } else if (response.status === 404) {
              throw new Error(
                "La categoría especificada no existe en el sistema"
              );
            } else {
              throw new Error(
                errorData.error || `Error del servidor (${response.status})`
              );
            }
          }

          return await response.json();
        } catch (error) {
          console.error("Error al crear producto:", error);
          throw error;
        }
      };

      // Procesar todos los productos válidos sin mostrar toasts individuales
      const promises = validProducts.map(async (product, index) => {
        try {
          await addProductSilent({
            name: product.name,
            description: product.description,
            categoryId: getCategoryIdByName(product.category),
            stock: product.stock,
            minStock: product.minStock,
          });
          return { success: true, product: product.name };
        } catch (error: any) {
          console.error(`Error importando ${product.name}:`, error);
          return {
            success: false,
            product: product.name,
            error: error.message || "Error desconocido",
          };
        }
      });

      // Esperar a que todas las promesas se resuelvan
      const results = await Promise.all(promises);

      // Contar éxitos y errores
      successCount = results.filter((r) => r.success).length;
      errorCount = results.filter((r) => !r.success).length;

      // Obtener detalles de errores para mostrar
      errorDetails = results
        .filter((r) => !r.success)
        .map((r) => `• ${r.product}: ${r.error}`);

      // Recargar productos
      await loadProducts();

      // Mostrar mensajes más descriptivos
      if (successCount > 0 && errorCount > 0) {
        toast.success(
          `Importación parcial: ${successCount} productos importados correctamente.`,
          { duration: 5000 }
        );
        toast.error(
          `${errorCount} productos con errores. Revisa la vista previa.`,
          { duration: 5000 }
        );
      } else if (successCount > 0) {
        toast.success(`✅ ${successCount} productos importados correctamente`);
        onClose();
      } else if (errorCount > 0) {
        toast.error(
          `No se pudo importar ningún producto. Revisa la vista previa.`,
          { duration: 5000 }
        );
      }

      // Si hay errores, actualizar la vista previa para mostrarlos
      if (errorCount > 0) {
        // Actualizar los datos de importación con los errores
        const updatedImportData = [...importData];
        results.forEach((result) => {
          if (!result.success) {
            const index = updatedImportData.findIndex(
              (item) => item.name === result.product
            );
            if (index !== -1) {
              updatedImportData[index].isValid = false;
              updatedImportData[index].errors = [result.error];
            }
          }
        });
        setImportData(updatedImportData);
      }
    } catch (error) {
      console.error("Error en importación masiva:", error);
      toast.error("Error durante la importación");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-[9000] !mt-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className={`bg-neutral-white rounded-lg shadow-xl w-full ${
          showPreview ? "max-w-6xl" : "max-w-4xl"
        } max-h-[90vh] overflow-hidden mx-4`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-light">
          <h2 className="text-xl font-semibold text-primary">
            Importar Productos desde Excel
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <AnimatePresence mode="wait">
            {!showPreview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Instrucciones */}
                <div className="bg-primary-lightest p-4 rounded-lg">
                  <h3 className="font-medium text-primary mb-2">
                    Instrucciones:
                  </h3>
                  <ul className="text-sm text-neutral-dark space-y-1">
                    <li>
                      • El archivo debe tener las columnas: nombre, descripcion,
                      categoria, stock, stockMinimo
                    </li>
                    <li>
                      • Las categorías deben existir previamente en el sistema
                    </li>
                    <li>• Los nombres de productos deben ser únicos</li>
                    <li>• Stock y stock mínimo deben ser números positivos</li>
                  </ul>
                </div>

                {/* Descargar plantilla */}
                <div className="text-center">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-4 py-2 bg-accent text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    <FaDownload className="mr-2" />
                    Descargar Plantilla Excel
                  </button>
                </div>

                {/* Subir archivo */}
                <div className="border-2 border-dashed border-neutral-light rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FaFileUpload className="mx-auto text-neutral-medium text-4xl mb-4" />
                  <p className="text-neutral-dark mb-2">
                    {file ? file.name : "Selecciona un archivo Excel"}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-primary text-neutral-white rounded-md hover:bg-primary-light transition-colors"
                  >
                    <FaFileUpload className="mr-2" />
                    Seleccionar Archivo
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Resumen */}
                <div className="bg-neutral-light p-4 rounded-lg">
                  <h3 className="font-medium text-neutral-dark mb-2">
                    Resumen de Importación:
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-state-success">
                      ✓ Válidos:{" "}
                      {importData.filter((item) => item.isValid).length}
                    </span>
                    <span className="text-state-error">
                      ✗ Con errores:{" "}
                      {importData.filter((item) => !item.isValid).length}
                    </span>
                  </div>
                </div>

                {/* Vista previa */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed divide-y divide-neutral-light">
                    <thead className="bg-primary-lightest">
                      <tr>
                        <th className="w-16 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Estado
                        </th>
                        <th className="w-48 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Nombre
                        </th>
                        <th className="w-40 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Categoría
                        </th>
                        <th className="w-20 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Stock
                        </th>
                        <th className="w-24 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Stock Mín.
                        </th>
                        <th className="w-80 px-4 py-2 text-left text-xs font-medium text-primary uppercase">
                          Errores
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-neutral-white divide-y divide-neutral-light">
                      {importData.map((product, index) => (
                        <tr
                          key={index}
                          className={
                            product.isValid
                              ? ""
                              : "bg-state-error bg-opacity-10"
                          }
                        >
                          <td className="px-4 py-2">
                            {product.isValid ? (
                              <FaCheck className="text-state-success" />
                            ) : (
                              <FaExclamationTriangle className="text-state-error" />
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-neutral-dark">
                            {product.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-neutral-dark">
                            {product.category}
                          </td>
                          <td className="px-4 py-2 text-sm text-neutral-dark">
                            {product.stock !== null ? product.stock : "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-neutral-dark">
                            {product.minStock !== null ? product.minStock : "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-state-error">
                            {product.errors.length > 0 && (
                              <ul className="list-disc list-inside space-y-1">
                                {product.errors.map((error, errorIndex) => (
                                  <li
                                    key={errorIndex}
                                    className="text-xs leading-relaxed"
                                  >
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setImportData([]);
                      setFile(null);
                    }}
                    className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={
                      isProcessing ||
                      importData.filter((item) => item.isValid).length === 0
                    }
                    className="px-4 py-2 bg-primary text-neutral-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing
                      ? "Importando..."
                      : "Importar Productos Válidos"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductImportModal;
