"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FaArrowLeft,
  FaTimes,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaSignOutAlt,
} from "react-icons/fa";

const ChangePassword = () => {
  const { changePassword, user, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Redirigir al usuario si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Si el usuario tiene una contraseña temporal, mostrar un mensaje
  const isTempPassword = user?.isTempPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(false);

    // Validaciones básicas
    const validationErrors: Record<string, string> = {};

    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      validationErrors["general"] = "Todos los campos son obligatorios";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      validationErrors["confirmPassword"] =
        "Las contraseñas nuevas no coinciden";
    }

    if (formData.newPassword.length < 6) {
      validationErrors["newPassword"] =
        "La nueva contraseña debe tener al menos 6 caracteres";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result) {
        // Si era una contraseña temporal, actualizar el usuario
        if (user?.isTempPassword) {
          updateCurrentUser({
            ...user,
            isTempPassword: false,
          });
        }

        setPasswordChanged(true);

        // Redirigir inmediatamente sin delay
        navigate("/dashboard");
      } else {
        setErrors({ currentPassword: "La contraseña actual es incorrecta" });
      }
    } catch (err) {
      setErrors({ general: "Ocurrió un error al cambiar la contraseña" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    if (isTempPassword) {
      setShowExitModal(true);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmExit = () => {
    logout();
  };

  const inputClasses =
    "w-full p-2 border border-neutral-light rounded focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800";

  if (passwordChanged) {
    return (
      <motion.div
        className="min-h-[85vh] flex items-center justify-center bg-primary-lightest p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-neutral-white p-8 rounded-lg shadow-lg max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaSave className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-neutral-medium">Redirigiendo al dashboard...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="min-h-[85vh] flex items-center justify-center bg-primary-lightest p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <motion.div
          className="bg-neutral-white p-8 rounded-lg shadow-lg max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">
              Cambiar Contraseña
            </h1>
            <button
              onClick={handleExit}
              className="p-2 text-neutral-medium hover:text-primary rounded-full"
              aria-label="Volver"
            >
              <FaArrowLeft />
            </button>
          </div>

          {isTempPassword && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex">
                <div className="py-1">
                  <FaExclamationTriangle className="text-red-500 mr-4" />
                </div>
                <div>
                  <p className="font-bold">Contraseña temporal detectada</p>
                  <p className="text-sm">
                    Estás usando una contraseña temporal. Por razones de
                    seguridad, debes cambiarla antes de continuar usando el
                    sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {errors.general}
            </motion.div>
          )}

          {errors.currentPassword && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {errors.currentPassword}
            </motion.div>
          )}

          {errors.newPassword && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {errors.newPassword}
            </motion.div>
          )}

          {errors.confirmPassword && (
            <motion.div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {errors.confirmPassword}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    })
                  }
                  className={inputClasses}
                  style={
                    {
                      "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                    } as React.CSSProperties
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-medium hover:text-primary"
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="mb-4 relative">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newPassword: e.target.value,
                    })
                  }
                  className={inputClasses}
                  style={
                    {
                      "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                    } as React.CSSProperties
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-medium hover:text-primary"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="mb-6 relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={inputClasses}
                  style={
                    {
                      "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                    } as React.CSSProperties
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-medium hover:text-primary"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <motion.button
                type="button"
                onClick={handleExit}
                className="flex items-center px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaTimes className="mr-2" /> Cancelar
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  "Actualizando..."
                ) : (
                  <>
                    <FaSave className="mr-2" /> Actualizar
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Modal de confirmación para salir con contraseña temporal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
              <h3 className="text-lg font-bold text-gray-900">
                Contraseña temporal activa
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tienes una contraseña temporal que debe ser cambiada por
              seguridad. Si sales sin cambiarla, no podrás acceder a ninguna
              funcionalidad del sistema hasta que la cambies. Podrás volver a
              iniciar sesión con la misma contraseña temporal.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Continuar aquí
              </button>
              <button
                onClick={handleConfirmExit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
              >
                <FaSignOutAlt className="mr-2" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ChangePassword;
