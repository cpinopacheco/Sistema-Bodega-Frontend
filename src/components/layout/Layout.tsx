"use client";

import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sidebarWidth = 256; // 64 * 4 = 256px (w-64)

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Return a simple loading state or null during server-side rendering
  if (!isMounted) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -sidebarWidth }}
            animate={{ x: 0 }}
            exit={{ x: -sidebarWidth }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed top-0 left-0 h-screen ${
              isMobile ? "z-50" : "z-10"
            }`}
            style={{ width: sidebarWidth }}
          >
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar sidebar en móviles */}
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.div
        className="flex flex-col flex-1 min-h-screen"
        animate={{
          marginLeft: !isMobile && sidebarOpen ? sidebarWidth : 0,
          width: !isMobile
            ? `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px)`
            : "100%",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;
