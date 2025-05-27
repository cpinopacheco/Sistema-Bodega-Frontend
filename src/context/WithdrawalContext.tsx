"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useProducts, type Product } from "./ProductContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { withdrawalsAPI } from "../services/api";

// Definir tipos
interface WithdrawalItem {
  productId: number;
  quantity: number;
  product: Product;
}

export interface Withdrawal {
  id: number;
  items: WithdrawalItem[];
  totalItems: number;
  userId: number;
  userName: string;
  userSection: string;
  withdrawerName: string; // Nombre de quien retira
  withdrawerSection: string; // Sección de quien retira
  notes?: string;
  createdAt: string;
}

interface WithdrawalContextType {
  cart: WithdrawalItem[];
  withdrawals: Withdrawal[];
  loading: boolean;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  confirmWithdrawal: (
    withdrawerName: string,
    withdrawerSection: string,
    notes?: string
  ) => Promise<void>;
  cartTotalItems: number;
  loadWithdrawals: () => Promise<void>;
}

const WithdrawalContext = createContext<WithdrawalContextType | undefined>(
  undefined
);

export const WithdrawalProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<WithdrawalItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const { updateStock, getProduct, loadProducts } = useProducts(); // Agregamos loadProducts
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Cargar retiros desde el backend
  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const withdrawalsData = await withdrawalsAPI.getAll();
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error("Error cargando retiros:", error);
      toast.error("Error al cargar los retiros");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar retiros al inicializar el contexto
  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  // Añadir producto al carrito
  const addToCart = useCallback((product: Product, quantity: number) => {
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (quantity > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        // Si el producto ya está en el carrito, actualizar la cantidad
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          toast.error(
            `No puede exceder el stock disponible (${product.stock})`
          );
          return prevCart;
        }

        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Si no está en el carrito, añadirlo
        return [...prevCart, { productId: product.id, quantity, product }];
      }
    });

    toast.success(`${product.name} añadido al carrito`);
  }, []);

  // Eliminar producto del carrito
  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
    toast.success("Producto eliminado del carrito");
  }, []);

  // Actualizar cantidad de un producto en el carrito
  const updateCartItemQuantity = useCallback(
    (productId: number, quantity: number) => {
      const product = getProduct(productId);

      if (!product) {
        toast.error("Producto no encontrado");
        return;
      }

      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      if (quantity > product.stock) {
        toast.error(`Solo hay ${product.stock} unidades disponibles`);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    },
    [getProduct, removeFromCart]
  );

  // Limpiar el carrito
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Confirmar retiro de productos
  const confirmWithdrawal = useCallback(
    async (
      withdrawerName: string,
      withdrawerSection: string,
      notes?: string
    ) => {
      if (!user) {
        toast.error("Debe iniciar sesión para confirmar un retiro");
        return;
      }

      if (cart.length === 0) {
        toast.error("El carrito está vacío");
        return;
      }

      if (!withdrawerName.trim()) {
        toast.error("Debe ingresar el nombre de quien retira");
        return;
      }

      if (!withdrawerSection.trim()) {
        toast.error("Debe ingresar la sección de quien retira");
        return;
      }

      try {
        setLoading(true);

        // Preparar los datos para el backend
        const withdrawalData = {
          userId: user.id,
          userName: user.name,
          userSection: user.section,
          withdrawerName,
          withdrawerSection,
          notes,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            product: item.product,
          })),
        };

        // Crear el retiro en el backend
        const newWithdrawal = await withdrawalsAPI.create(withdrawalData);

        // Actualizar la lista de retiros
        setWithdrawals((prev) => [newWithdrawal, ...prev]);

        // Limpiar el carrito
        clearCart();

        // ✅ RECARGAR PRODUCTOS PARA ACTUALIZAR EL STOCK
        await loadProducts();

        toast.success("Retiro confirmado correctamente");
      } catch (error: any) {
        console.error("Error confirmando retiro:", error);
        toast.error(error.message || "Error al confirmar el retiro");
      } finally {
        setLoading(false);
      }
    },
    [cart, user, clearCart, loadProducts] // Agregamos loadProducts a las dependencias
  );

  // Calcular el total de items en el carrito
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <WithdrawalContext.Provider
      value={{
        cart,
        withdrawals,
        loading,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        confirmWithdrawal,
        cartTotalItems,
        loadWithdrawals,
      }}
    >
      {children}
    </WithdrawalContext.Provider>
  );
};

// Hook personalizado
export const useWithdrawal = () => {
  const context = useContext(WithdrawalContext);
  if (context === undefined) {
    throw new Error(
      "useWithdrawal debe usarse dentro de un WithdrawalProvider"
    );
  }
  return context;
};
