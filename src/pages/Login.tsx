"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaLock, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  validateEmployeeCode,
  formatEmployeeCodeInput,
} from "../utils/employeeCodeValidation";

const Login = () => {
  const { login } = useAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmployeeCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatEmployeeCodeInput(e.target.value);
    setEmployeeCode(formattedValue);

    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeCode.trim() || !password.trim()) {
      setError("Por favor, ingrese su código de funcionario y contraseña");
      return;
    }

    // Validar el formato del código de funcionario usando la nueva validación
    const validation = validateEmployeeCode(employeeCode);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(employeeCode, password);
    } catch (error) {
      // Mensaje unificado para todos los errores de autenticación
      setError("Credenciales inválidas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-lightest">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-white p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-4 flex justify-center"
          >
            <img
              src="/cenpecar-logo.png"
              alt="CENPECAR Logo"
              className="h-24 w-auto mx-auto"
            />
          </motion.div>
          <h2 className="text-2xl font-bold text-primary">
            Sistema de Inventario
          </h2>
          <p className="text-neutral-medium mt-1">
            Gestión de bódega y control de inventario
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-state-error bg-opacity-10 border border-state-error text-state-error px-4 py-3 rounded mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="employeeCode"
              className="block text-sm font-medium text-neutral-dark mb-1"
            >
              Código de Funcionario
            </label>
            <div className="relative">
              <input
                id="employeeCode"
                type="text"
                value={employeeCode}
                onChange={handleEmployeeCodeChange}
                maxLength={7}
                className="w-full pl-10 pr-3 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="123456a"
                required
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaUser className="text-neutral-medium" size={14} />
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-medium">
              6 dígitos seguidos de una letra (ej: 123456a)
            </p>
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-dark mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Limpiar error cuando el usuario empiece a escribir
                  if (error) {
                    setError("");
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaLock className="text-neutral-medium" size={14} />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-neutral-white font-semibold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
