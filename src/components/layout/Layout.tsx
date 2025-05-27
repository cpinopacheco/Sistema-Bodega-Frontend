"use client"

import { Outlet } from "react-router-dom"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const sidebarWidth = 256 // 64 * 4 = 256px (w-64)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Return a simple loading state or null during server-side rendering
  if (!isMounted) {
    return <div className="h-screen bg-gray-100 flex items-center justify-center">Cargando...</div>
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
            className="fixed top-0 left-0 z-10 h-screen"
            style={{ width: sidebarWidth }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex flex-col flex-1 min-h-screen"
        animate={{
          marginLeft: sidebarOpen ? sidebarWidth : 0,
          width: `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px)`,
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
  )
}

export default Layout
