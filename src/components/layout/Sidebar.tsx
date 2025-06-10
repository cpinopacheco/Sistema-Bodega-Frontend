"use client";

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHome,
  FaBoxes,
  FaClipboardList,
  FaWarehouse,
  FaExclamationTriangle,
  FaChartBar,
  FaUsers,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  const navLinks = [
    {
      to: "/dashboard",
      icon: <FaHome />,
      label: "Dashboard",
      description: "Página principal del sistema",
    },
    {
      to: "/products",
      icon: <FaBoxes />,
      label: "Productos",
      description: "Gestión de productos del inventario",
    },
    {
      to: "/withdrawals",
      icon: <FaClipboardList />,
      label: "Retiros",
      description: "Registro y historial de retiros",
    },
    {
      to: "/inventory",
      icon: <FaWarehouse />,
      label: "Inventario",
      description: "Reportes de inventario",
    },
    {
      to: "/low-stock",
      icon: <FaExclamationTriangle />,
      label: "Stock Bajo",
      description: "Productos con stock bajo",
    },
    {
      to: "/statistics",
      icon: <FaChartBar />,
      label: "Estadísticas",
      description: "Estadísticas del sistema",
    },
    {
      to: "/inactive-products",
      icon: <FaEyeSlash />,
      label: "Productos Inactivos",
      description: "Productos desactivados",
    },
  ];

  // Agregar gestión de usuarios solo para admins
  if (user?.role === "admin") {
    navLinks.push({
      to: "/password-recovery-requests",
      icon: <FaKey />,
      label: "Recuperación de Contraseñas",
      description: "Gestión de solicitudes de recuperación de contraseñas",
    });

    navLinks.push({
      to: "/user-management",
      icon: <FaUsers />,
      label: "Gestión de Usuarios",
      description: "Administración de usuarios del sistema",
    });
  }

  return (
    <aside
      className="w-full h-full bg-primary text-neutral-white flex flex-col"
      role="navigation"
      aria-label="Navegación principal"
      id="sidebar-navigation"
    >
      <div className="p-4 border-b border-primary-light flex justify-center items-center">
        <img
          src="/cenpecar-logo.png"
          alt="Logo de CENPECAR"
          style={{ width: "75px", height: "auto" }}
        />
      </div>

      <nav className="mt-6 flex-1" aria-label="Menú principal">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className="px-4 py-2">
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary ${
                    isActive
                      ? "bg-primary-lighter text-neutral-white"
                      : "text-neutral-light hover:bg-primary-light"
                  }`
                }
                aria-label={link.description}
              >
                {({ isActive }) => (
                  <>
                    <span className="mr-3 text-xl" aria-hidden="true">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 bg-accent w-1 h-8 rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
