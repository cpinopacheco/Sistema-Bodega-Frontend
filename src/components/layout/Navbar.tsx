"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaSignOutAlt, FaKey, FaUserEdit } from "react-icons/fa";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { useWithdrawal } from "../../context/WithdrawalContext";
import UserAvatar from "../ui/UserAvatar";

interface NavbarProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Navbar = ({ toggleSidebar, sidebarOpen }: NavbarProps) => {
  const { user, logout } = useAuth();
  const { cartTotalItems } = useWithdrawal();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useOnClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // Manejar navegación por teclado en el menú de usuario
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!userMenuOpen) return;

      if (e.key === "Escape") {
        setUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [userMenuOpen]);

  // Función para manejar el clic en el icono del carrito
  const handleCartClick = () => {
    // Navegar a la página de retiros y pasar un parámetro de estado para mostrar el carrito
    navigate("/withdrawals", { state: { showCart: true } });
  };

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleMenuItemClick = () => {
    setUserMenuOpen(false);
  };

  return (
    <header
      className="bg-neutral-white border-b border-neutral-light shadow-sm"
      role="banner"
    >
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <motion.button
            ref={userMenuButtonRef}
            onClick={toggleSidebar}
            className="mr-4 text-primary hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-8 h-8 flex items-center justify-center relative rounded"
            aria-label={
              sidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"
            }
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-navigation"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className="absolute w-6 h-0.5 bg-current rounded-full"
              animate={{
                rotate: sidebarOpen ? 45 : 0,
                y: sidebarOpen ? 0 : -6,
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute w-6 h-0.5 bg-current rounded-full"
              animate={{
                opacity: sidebarOpen ? 0 : 1,
                x: sidebarOpen ? -20 : 0,
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute w-6 h-0.5 bg-current rounded-full"
              animate={{
                rotate: sidebarOpen ? -45 : 0,
                y: sidebarOpen ? 0 : 6,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
          <Link
            to="/dashboard"
            className="text-xl font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <span className="sr-only">Ir al </span>Sistema de Inventario
          </Link>
        </div>

        <nav
          className="flex items-center space-x-4"
          role="navigation"
          aria-label="Navegación principal"
        >
          <button
            onClick={handleCartClick}
            className="relative p-2 text-primary hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={`Carrito de retiros${
              cartTotalItems > 0
                ? ` - ${cartTotalItems} ${
                    cartTotalItems === 1 ? "artículo" : "artículos"
                  }`
                : " - vacío"
            }`}
          >
            <HiOutlineShoppingCart size={24} />
            {cartTotalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-state-error text-neutral-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                aria-hidden="true"
              >
                {cartTotalItems}
              </motion.span>
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              ref={userMenuButtonRef}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-80 transition-opacity rounded p-1"
              onClick={handleUserMenuToggle}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={`Menú de usuario - ${user?.name}`}
            >
              {user && <UserAvatar user={user} size="md" />}
              <span className="hidden md:inline text-sm font-medium text-neutral-dark">
                {user?.name}
              </span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-neutral-white rounded-md shadow-lg py-1 z-20 border border-neutral-light"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-2 border-b border-neutral-light">
                    <p className="text-sm font-medium text-neutral-dark">
                      {user?.name}
                    </p>
                    <p className="text-xs text-neutral-medium">{user?.email}</p>
                    <p className="text-xs text-neutral-medium">
                      Sección: {user?.section}
                    </p>
                  </div>

                  <Link
                    to="/user-profile"
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-700 focus:outline-none focus:bg-gray-100"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <FaUserEdit className="mr-2" aria-hidden="true" />
                    Mi Perfil
                  </Link>

                  <Link
                    to="/change-password"
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-700 focus:outline-none focus:bg-gray-100"
                    onClick={handleMenuItemClick}
                    role="menuitem"
                  >
                    <FaKey className="mr-2" aria-hidden="true" />
                    Cambiar Contraseña
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      handleMenuItemClick();
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-neutral-dark hover:bg-neutral-light flex items-center focus:outline-none focus:bg-neutral-light"
                    role="menuitem"
                  >
                    <FaSignOutAlt className="mr-2" aria-hidden="true" />
                    Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
