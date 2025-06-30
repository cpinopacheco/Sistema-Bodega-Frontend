"use client";

import type React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaLock, FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
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
  const [showPassword, setShowPassword] = useState(false);

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

    // Validar formato del código de funcionario
    const validation = validateEmployeeCode(employeeCode);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setError("");
    setLoading(true);
    const result = await login(employeeCode, password);
    if (result && result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-lightest px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-white p-8 rounded-lg shadow-lg max-w-md w-full"
        role="main"
        aria-labelledby="login-title"
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
              alt="Logo de CENPECAR - Centro de Perfeccionamiento de Carabineros"
              className="h-24 w-auto mx-auto"
            />
          </motion.div>
          <h1 id="login-title" className="text-2xl font-bold text-primary">
            Sistema de Inventario
          </h1>
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
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="employeeCode"
              className="block text-sm font-medium text-neutral-dark mb-1"
            >
              Código de Funcionario
              <span
                className="text-state-error ml-1"
                aria-label="campo requerido"
              >
                *
              </span>
            </label>
            <div className="relative">
              <input
                id="employeeCode"
                type="text"
                value={employeeCode}
                onChange={handleEmployeeCodeChange}
                maxLength={7}
                className="w-full pl-10 pr-3 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                placeholder="123456a"
                required
                aria-required="true"
                aria-describedby="employeeCode-help employeeCode-error"
                aria-invalid={error ? "true" : "false"}
                autoComplete="username new-password"
              />
              <div
                className="absolute inset-y-0 left-0 flex items-center pl-3"
                aria-hidden="true"
              >
                <FaUser className="text-neutral-medium" size={14} />
              </div>
            </div>
            <p
              id="employeeCode-help"
              className="mt-1 text-xs text-neutral-medium"
            >
              6 dígitos seguidos de una letra (ejemplo: 123456a)
            </p>
            {error && error.includes("código") && (
              <p
                id="employeeCode-error"
                className="mt-1 text-xs text-state-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-dark mb-1"
            >
              Contraseña
              <span
                className="text-state-error ml-1"
                aria-label="campo requerido"
              >
                *
              </span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Limpiar error cuando el usuario empiece a escribir
                  if (error) {
                    setError("");
                  }
                }}
                className="w-full pl-10 pr-10 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="••••••••"
                required
                aria-required="true"
                aria-describedby="password-error"
                aria-invalid={error ? "true" : "false"}
                autoComplete="current-password"
              />
              <div
                className="absolute inset-y-0 left-0 flex items-center pl-3"
                aria-hidden="true"
              >
                <FaLock className="text-neutral-medium" size={14} />
              </div>
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <FaEyeSlash className="text-neutral-medium" size={16} />
                ) : (
                  <FaEye className="text-neutral-medium" size={16} />
                )}
              </button>
            </div>
            {error && error.includes("Credenciales") && (
              <p
                id="password-error"
                className="mt-1 text-xs text-state-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-neutral-white font-semibold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby={loading ? "loading-status" : undefined}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-primary hover:text-primary-light text-sm"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {loading && (
            <div id="loading-status" className="sr-only" aria-live="polite">
              Procesando inicio de sesión, por favor espere
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
