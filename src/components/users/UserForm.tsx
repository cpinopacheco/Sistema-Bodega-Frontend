"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaSave, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import type { User } from "../../context/UsersContext";

interface UserFormProps {
  user?: User;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  isVisible: boolean;
}

const UserForm = ({ user, onClose, onSubmit, isVisible }: UserFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeCode: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    section: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        employeeCode: user.employee_code,
        password: "",
        confirmPassword: "",
        role: user.role,
        section: user.section,
        isActive: user.is_active,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        employeeCode: "",
        password: "",
        confirmPassword: "",
        role: "user",
        section: "",
        isActive: true,
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = "El código de empleado es obligatorio";
    }

    if (!user) {
      // Solo validar contraseña para usuarios nuevos
      if (!formData.password) {
        newErrors.password = "La contraseña es obligatoria";
      } else if (formData.password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    if (!formData.section.trim()) {
      newErrors.section = "La sección es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (user) {
        // Actualizar usuario existente (sin contraseña)
        await onSubmit({
          name: formData.name,
          email: formData.email,
          employeeCode: formData.employeeCode,
          role: formData.role,
          section: formData.section,
          isActive: formData.isActive,
        });
      } else {
        // Crear nuevo usuario
        await onSubmit({
          name: formData.name,
          email: formData.email,
          employeeCode: formData.employeeCode,
          password: formData.password,
          role: formData.role,
          section: formData.section,
        });
      }

      onClose();
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      window.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isVisible, onClose]);

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2 } },
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 !m-0 !p-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{ margin: 0, padding: 0, width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="bg-neutral-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-light">
          <h2 className="text-xl font-semibold text-primary">
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-medium hover:text-neutral-dark focus:outline-none"
            aria-label="Cerrar"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-dark"
              >
                Nombre <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.name ? "border-state-error" : ""
                }`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-state-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-dark"
              >
                Email <span className="text-state-error">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.email ? "border-state-error" : ""
                }`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-state-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="employeeCode"
                className="block text-sm font-medium text-neutral-dark"
              >
                Código de Empleado <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="employeeCode"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.employeeCode ? "border-state-error" : ""
                }`}
                required
              />
              {errors.employeeCode && (
                <p className="mt-1 text-sm text-state-error">
                  {errors.employeeCode}
                </p>
              )}
            </div>

            {!user && (
              <>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-dark"
                  >
                    Contraseña <span className="text-state-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm pr-10 ${
                        errors.password ? "border-state-error" : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-neutral-medium" />
                      ) : (
                        <FaEye className="text-neutral-medium" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-state-error">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-neutral-dark"
                  >
                    Confirmar Contraseña{" "}
                    <span className="text-state-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm pr-10 ${
                        errors.confirmPassword ? "border-state-error" : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="text-neutral-medium" />
                      ) : (
                        <FaEye className="text-neutral-medium" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-state-error">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-neutral-dark"
              >
                Rol <span className="text-state-error">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium text-neutral-dark"
              >
                Sección <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-neutral-light shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                  errors.section ? "border-state-error" : ""
                }`}
                required
              />
              {errors.section && (
                <p className="mt-1 text-sm text-state-error">
                  {errors.section}
                </p>
              )}
            </div>

            {user && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-light rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-neutral-dark"
                >
                  Usuario activo
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-neutral-light rounded-md shadow-sm text-sm font-medium text-neutral-dark bg-neutral-white hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              <FaTimes className="mr-2 -ml-1 h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-neutral-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                "Guardando..."
              ) : user ? (
                <>
                  <FaSave className="mr-2 -ml-1 h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <FaPlus className="mr-2 -ml-1 h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserForm;
