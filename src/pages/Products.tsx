"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaBoxes,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTags,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaFileImport,
} from "react-icons/fa";
import { useProducts, type Product } from "../context/ProductContext";
import { useWithdrawal } from "../context/WithdrawalContext";
import ProductForm from "../components/products/ProductForm";
import CategoriesList from "../components/categories/CategoriesList";
import { Tooltip } from "../components/ui/Tooltip";
import StockManagementForm from "../components/products/StockManagementForm";
import ProductImportModal from "../components/products/ProductImportModal";

const Products = () => {
  const { products, categories, deleteProduct } = useProducts();
  const { addToCart } = useWithdrawal();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoriesList, setShowCategoriesList] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<"name" | "stock" | "category">(
    "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [quantityInputs, setQuantityInputs] = useState<Record<number, number>>(
    {}
  );
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showStockManagementForm, setShowStockManagementForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Inicializar cantidades
  useEffect(() => {
    const initialQuantities: Record<number, number> = {};
    products.forEach((product) => {
      initialQuantities[product.id] = 1;
    });
    setQuantityInputs(initialQuantities);
  }, [products]);

  // Función para cambiar cantidad
  const handleQuantityChange = (id: number, value: number) => {
    if (value < 1) value = 1;
    setQuantityInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Función para abrir modal de edición
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = (id: number) => {
    setConfirmDelete(id);
  };

  // Función para eliminar producto
  const handleDelete = (id: number) => {
    deleteProduct(id);
    setConfirmDelete(null);
  };

  // Función para agregar al carrito
  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  // Función para cambiar el ordenamiento
  const handleSort = (field: "name" | "stock" | "category") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Función para abrir modal de gestión de stock
  const handleManageStock = (product: Product) => {
    setSelectedProduct(product);
    setShowStockManagementForm(true);
  };

  // Filtrar y ordenar productos
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Remover esta línea que busca en la descripción:
      // || product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "stock") {
        return sortDirection === "asc" ? a.stock - b.stock : b.stock - a.stock;
      } else if (sortField === "category") {
        return sortDirection === "asc"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Gestión de Productos
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-state-success text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            <FaFileImport className="mr-2" />
            Cargar Productos
          </button>
          <button
            onClick={() => setShowCategoriesList(true)}
            className="inline-flex items-center px-4 py-2 bg-accent text-neutral-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            <FaTags className="mr-2" />
            Gestionar Categorías
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-primary text-neutral-white rounded-md hover:bg-primary-light transition-colors"
          >
            <FaPlus className="mr-2" />
            Nuevo Producto
          </button>
        </div>
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

        <div className="w-full md:w-1/2 flex gap-2">
          <div className="relative flex-1">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden max-h-[70vh] flex flex-col"
        >
          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead className="bg-primary-lightest">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center focus:outline-none"
                    >
                      Producto
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1 text-primary" />
                        ) : (
                          <FaSortAmountDown className="ml-1 text-primary" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center focus:outline-none"
                    >
                      Categoría
                      {sortField === "category" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1 text-primary" />
                        ) : (
                          <FaSortAmountDown className="ml-1 text-primary" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("stock")}
                      className="flex items-center focus:outline-none"
                    >
                      Stock
                      {sortField === "stock" &&
                        (sortDirection === "asc" ? (
                          <FaSortAmountUp className="ml-1 text-primary" />
                        ) : (
                          <FaSortAmountDown className="ml-1 text-primary" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-white divide-y divide-neutral-light">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-primary-lightest hover:bg-opacity-30 ${
                      product.stock <= product.minStock
                        ? "bg-state-error bg-opacity-10"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-medium text-neutral-dark">
                            {product.name}
                          </div>
                          <div className="text-sm text-neutral-medium max-w-xs truncate">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-lightest text-primary">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          product.stock <= product.minStock
                            ? "text-state-error"
                            : product.stock <= product.minStock * 2
                            ? "text-state-warning"
                            : "text-state-success"
                        }`}
                      >
                        {product.stock} unidades
                      </div>
                      {product.stock <= product.minStock && (
                        <div className="text-xs text-state-error">
                          Stock bajo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-6">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                product.id,
                                Math.max(
                                  1,
                                  (quantityInputs[product.id] || 1) - 1
                                )
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-neutral-light rounded-l-md hover:bg-primary hover:text-neutral-white transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantityInputs[product.id] || 1}
                            onChange={(e) =>
                              handleQuantityChange(
                                product.id,
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 h-8 text-center border-t border-b border-neutral-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-primary focus:ring-primary"
                            style={{ textAlign: "center" }}
                          />
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                product.id,
                                (quantityInputs[product.id] || 1) + 1
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-neutral-light rounded-r-md hover:bg-primary hover:text-neutral-white transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Tooltip content="Añadir al carrito" position="top">
                            <button
                              onClick={() =>
                                handleAddToCart(
                                  product,
                                  quantityInputs[product.id] || 1
                                )
                              }
                              className="text-primary-lighter hover:bg-primary-lighter hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                              disabled={product.stock <= 0}
                            >
                              <FaShoppingCart size={16} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Gestionar stock" position="top">
                            <button
                              onClick={() => handleManageStock(product)}
                              className="text-state-success hover:bg-state-success hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8 group"
                            >
                              <div className="flex items-center">
                                <FaArrowUp
                                  size={13}
                                  className="text-state-success group-hover:text-neutral-white"
                                />
                                <FaArrowDown
                                  size={13}
                                  className="text-state-error group-hover:text-neutral-white ml-0"
                                />
                              </div>
                            </button>
                          </Tooltip>

                          <Tooltip content="Editar producto" position="top">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-state-info hover:bg-state-info hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                            >
                              <FaEdit size={16} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Eliminar producto" position="top">
                            <button
                              onClick={() => handleDeleteConfirm(product.id)}
                              className="text-state-error hover:bg-state-error hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                            >
                              <FaTrash size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="bg-neutral-white rounded-lg shadow-md p-8 text-center">
          <FaBoxes className="mx-auto text-neutral-medium text-5xl mb-4" />
          <h3 className="text-lg font-medium text-neutral-dark mb-1">
            No se encontraron productos
          </h3>
          <p className="text-neutral-medium">
            {searchTerm || selectedCategory !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza agregando tu primer producto"}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showProductForm && (
          <ProductForm
            product={selectedProduct || undefined}
            onClose={() => {
              setShowProductForm(false);
              setSelectedProduct(null);
            }}
            isVisible={showProductForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoriesList && (
          <CategoriesList onClose={() => setShowCategoriesList(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0, marginTop: 0 }}
            animate={{ opacity: 1, marginTop: 0 }}
            exit={{ opacity: 0, marginTop: 0 }}
            className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-50 px-4 pb-4 !mt-0"
            style={{ marginTop: "0px !important" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-neutral-dark mb-3">
                Confirmar eliminación
              </h3>
              <p className="text-neutral-medium mb-6">
                ¿Estás seguro de que deseas eliminar este producto? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-state-error text-neutral-white rounded-md hover:bg-opacity-90"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStockManagementForm && selectedProduct && (
          <StockManagementForm
            product={selectedProduct}
            onClose={() => {
              setShowStockManagementForm(false);
              setSelectedProduct(null);
            }}
            isVisible={showStockManagementForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <ProductImportModal
            onClose={() => setShowImportModal(false)}
            isVisible={showImportModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
