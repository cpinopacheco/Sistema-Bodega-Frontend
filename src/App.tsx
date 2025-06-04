"use client";

import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { WithdrawalProvider } from "./context/WithdrawalContext";
import { UsersProvider } from "./context/UsersContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Withdrawals from "./pages/Withdrawals";
import Inventory from "./pages/Inventory";
import LowStock from "./pages/LowStock";
import Statistics from "./pages/Statistics";
import ChangePassword from "./pages/ChangePassword";
import UserManagement from "./pages/UserManagement";
import UserProfile from "./pages/UserProfile";
import { useEffect, useState } from "react";

function App() {
  // Add client-side only rendering to prevent "document is not defined" error
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return null during server-side rendering
  if (!isMounted) {
    return null;
  }

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AuthProvider>
          <UsersProvider>
            <ProductProvider>
              <WithdrawalProvider>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "#013A1A",
                      color: "#fff",
                      zIndex: 99999, // Valor muy alto para asegurar que esté por encima de todo
                    },
                    success: {
                      style: {
                        background: "#0B7A40",
                      },
                    },
                    error: {
                      style: {
                        background: "#D64045",
                      },
                    },
                  }}
                  containerStyle={{
                    zIndex: 99999, // Aseguramos que el contenedor también tenga un z-index alto
                  }}
                />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="withdrawals" element={<Withdrawals />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="low-stock" element={<LowStock />} />
                    <Route path="statistics" element={<Statistics />} />
                    <Route
                      path="change-password"
                      element={<ChangePassword />}
                    />
                    <Route
                      path="user-management"
                      element={<UserManagement />}
                    />
                    <Route path="user-profile" element={<UserProfile />} />
                  </Route>
                </Routes>
              </WithdrawalProvider>
            </ProductProvider>
          </UsersProvider>
        </AuthProvider>
      </HashRouter>
    </MotionConfig>
  );
}

export default App;
