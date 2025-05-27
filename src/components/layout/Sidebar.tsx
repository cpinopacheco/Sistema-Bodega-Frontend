"use client"

import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import { FaHome, FaBoxes, FaClipboardList, FaFileAlt, FaExclamationTriangle, FaChartBar } from "react-icons/fa"

const Sidebar = () => {
  const navLinks = [
    { to: "/dashboard", icon: <FaHome />, label: "Dashboard" },
    { to: "/products", icon: <FaBoxes />, label: "Productos" },
    { to: "/withdrawals", icon: <FaClipboardList />, label: "Retiros" },
    { to: "/reports", icon: <FaFileAlt />, label: "Reportes" },
    { to: "/low-stock", icon: <FaExclamationTriangle />, label: "Stock Bajo" },
    { to: "/statistics", icon: <FaChartBar />, label: "Estadísticas" },
  ]

  return (
    <div className="w-full h-full bg-primary text-neutral-white flex flex-col">
      <div className="p-4 border-b border-primary-light flex justify-center items-center">
        <img src="/cenpecar-logo.png" alt="CENPECAR Logo" style={{ width: "75px", height: "auto" }} />
      </div>
      <nav className="mt-6 flex-1">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to} className="px-4 py-2">
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md transition-all ${
                    isActive ? "bg-primary-lighter text-neutral-white" : "text-neutral-light hover:bg-primary-light"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="mr-3 text-xl">{link.icon}</span>
                    <span>{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 bg-accent w-1 h-8 rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
