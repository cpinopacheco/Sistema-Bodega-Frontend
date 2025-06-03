"use client";

import { useState, useRef } from "react";
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
  const navigate = useNavigate();

  useOnClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // Función para manejar el clic en el icono del carrito
  const handleCartClick = () => {
    // Navegar a la página de retiros y pasar un parámetro de estado para mostrar el carrito
    navigate("/withdrawals", { state: { showCart: true } });
  };

  return (
    <header className="bg-neutral-white border-b border-neutral-light shadow-sm">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <motion.button
            onClick={toggleSidebar}
            className="mr-4 text-primary hover:text-primary-light focus:outline-none w-8 h-8 flex items-center justify-center relative"
            aria-label={
              sidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"
            }
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
          <Link to="/dashboard" className="text-xl font-semibold text-primary">
            Sistema de Inventario
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleCartClick}
            className="relative p-2 text-primary hover:text-primary-light"
            aria-label="Carrito de retiros"
          >
            <HiOutlineShoppingCart size={24} />
            {cartTotalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-state-error text-neutral-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {cartTotalItems}
              </motion.span>
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition-opacity"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
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
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FaUserEdit className="mr-2" /> Mi Perfil
                  </Link>

                  <Link
                    to="/change-password"
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FaKey className="mr-2" /> Cambiar Contraseña
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-sm text-left text-neutral-dark hover:bg-neutral-light flex items-center"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
