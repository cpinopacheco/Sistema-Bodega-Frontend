"use client";

import type React from "react";

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUser, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  validateEmployeeCode,
  formatEmployeeCodeInput,
} from "../utils/employeeCodeValidation";

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");

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

    if (!employeeCode.trim()) {
      setError("Por favor, ingrese su código de funcionario");
      return;
    }

    // Validar el formato del código de funcionario
    const validation = validateEmployeeCode(employeeCode);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const name = await forgotPassword(employeeCode);
      setUserName(name);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || "Error al procesar la solicitud");
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
        role="main"
        aria-labelledby="forgot-password-title"
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
          <h1
            id="forgot-password-title"
            className="text-2xl font-bold text-primary"
          >
            Recuperar Contraseña
          </h1>
          <p className="text-neutral-medium mt-1">
            {success
              ? "Solicitud enviada correctamente"
              : "Ingresa tu código de funcionario para recuperar tu contraseña"}
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

        {success ? (
          <div className="text-center">
            <div className="bg-state-success bg-opacity-10 border border-state-success text-state-success px-4 py-3 rounded mb-6">
              <p className="font-medium">Solicitud enviada correctamente</p>
              <p className="mt-2">
                Hola <span className="font-semibold">{userName}</span>, tu
                solicitud ha sido registrada.
              </p>
              <p className="mt-2">
                Por favor, contacta a un administrador del sistema para
                completar el proceso de recuperación de contraseña.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center text-primary hover:text-primary-light transition-colors"
            >
              <FaArrowLeft className="mr-2" /> Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
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
                  autoComplete="username"
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

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-light text-neutral-white font-semibold py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby={loading ? "loading-status" : undefined}
              >
                {loading ? "Enviando solicitud..." : "Enviar Solicitud"}
              </button>

              <Link
                to="/login"
                className="text-center text-primary hover:text-primary-light transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>

            {loading && (
              <div id="loading-status" className="sr-only" aria-live="polite">
                Procesando solicitud, por favor espere
              </div>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
