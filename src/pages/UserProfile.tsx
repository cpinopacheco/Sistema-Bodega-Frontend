"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FaArrowLeft,
  FaTimes,
  FaSave,
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaIdCard,
  FaShieldAlt,
  FaCamera,
  FaTrash,
} from "react-icons/fa";
import UserAvatar from "../components/ui/UserAvatar";
import ConfirmModal from "../components/ui/ConfirmModal";
import { SECTIONS } from "../constants/sections";

const UserProfile = () => {
  const {
    user,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    loading,
  } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    section: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Inicializar el formulario con los datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        section: user.section,
      });
    }
  }, [user]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (user) {
      const hasChanged =
        formData.name !== user.name ||
        formData.email !== user.email ||
        formData.section !== user.section;
      setHasChanges(hasChanged);
    }
  }, [formData, user]);

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

    if (!formData.section.trim()) {
      newErrors.section = "La sección es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      const success = await updateProfile(formData);

      if (success) {
        setHasChanges(false);
        // Opcional: redirigir después de un tiempo
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await uploadProfilePhoto(file);
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsUploadingPhoto(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await deleteProfilePhoto();
      setShowDeleteModal(false);
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhotoClick = () => {
    setShowDeleteModal(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelModal(true);
    } else {
      navigate(-1);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        section: user.section,
      });
      setErrors({});
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-neutral-medium">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="bg-neutral-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary-lightest px-6 py-4 border-b border-primary-lightest">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-primary hover:text-primary-light rounded-full hover:bg-primary-lightest transition-colors"
                aria-label="Volver"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-2xl font-bold text-primary">Mi Perfil</h1>
            </div>
            <div className="flex items-center">
              <UserAvatar user={user} size="lg" showRole className="mr-3" />
              <div>
                <p className="text-sm font-medium text-primary">{user.name}</p>
                <p className="text-xs text-neutral-medium">
                  {user.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de foto de perfil */}
        <div className="px-6 py-4 bg-accent-light border-b border-neutral-light">
          <h3 className="text-lg font-medium text-primary mb-3">
            Foto de Perfil
          </h3>
          <div className="flex items-center space-x-4">
            <UserAvatar user={user} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex items-center px-3 py-2 bg-primary text-neutral-white rounded hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  whileHover={{ scale: !isUploadingPhoto ? 1.02 : 1 }}
                  whileTap={{ scale: !isUploadingPhoto ? 0.98 : 1 }}
                >
                  {isUploadingPhoto ? (
                    "Subiendo..."
                  ) : (
                    <>
                      <FaCamera className="mr-2" />
                      {user.profilePhoto ? "Cambiar Foto" : "Subir Foto"}
                    </>
                  )}
                </motion.button>

                {user.profilePhoto && (
                  <motion.button
                    type="button"
                    onClick={handleDeletePhotoClick}
                    disabled={isUploadingPhoto}
                    className="flex items-center px-3 py-2 bg-state-error text-neutral-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    whileHover={{ scale: !isUploadingPhoto ? 1.02 : 1 }}
                    whileTap={{ scale: !isUploadingPhoto ? 0.98 : 1 }}
                  >
                    <FaTrash className="mr-2" />
                    Eliminar
                  </motion.button>
                )}
              </div>
              <p className="text-xs text-neutral-medium mt-2">
                Formatos permitidos: JPEG, PNG, GIF, WebP. Tamaño máximo: 5MB.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* Información no editable */}
        <div className="px-6 py-4 bg-accent-light border-b border-neutral-light">
          <h3 className="text-lg font-medium text-primary mb-3">
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <FaIdCard className="text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-neutral-dark">
                  Código de Empleado
                </p>
                <p className="text-sm text-neutral-medium">
                  {user.employeeCode}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FaShieldAlt className="text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-neutral-dark">Rol</p>
                <p className="text-sm text-neutral-medium">
                  {user.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-neutral-medium">
            * Estos campos solo pueden ser modificados por un administrador
          </div>
        </div>

        {/* Formulario editable */}
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-medium text-primary mb-4">
            Información Personal
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                <FaUser className="inline mr-2 text-primary" />
                Nombre Completo <span className="text-state-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  errors.name ? "border-state-error" : "border-neutral-light"
                }`}
                placeholder="Ingrese su nombre completo"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-state-error">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                <FaEnvelope className="inline mr-2 text-primary" />
                Correo Electrónico <span className="text-state-error">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  errors.email ? "border-state-error" : "border-neutral-light"
                }`}
                placeholder="Ingrese su correo electrónico"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-state-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="section"
                className="block text-sm font-medium text-neutral-dark mb-1"
              >
                <FaBuilding className="inline mr-2 text-primary" />
                Sección/Departamento <span className="text-state-error">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  errors.section ? "border-state-error" : "border-neutral-light"
                }`}
                required
              >
                <option value="">Seleccione una sección</option>
                {SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
              {errors.section && (
                <p className="mt-1 text-sm text-state-error">
                  {errors.section}
                </p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-neutral-light">
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={handleCancel}
                className="flex items-center px-4 py-2 border border-neutral-light rounded bg-neutral-white text-neutral-dark hover:bg-neutral-light transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaTimes className="mr-2" /> Cancelar
              </motion.button>

              {hasChanges && (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center px-4 py-2 border border-neutral-light rounded bg-neutral-white text-neutral-medium hover:bg-neutral-light transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Restablecer
                </motion.button>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting || !hasChanges || loading}
              className="flex items-center px-6 py-2 bg-primary text-neutral-white rounded hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: hasChanges && !isSubmitting ? 1.02 : 1 }}
              whileTap={{ scale: hasChanges && !isSubmitting ? 0.98 : 1 }}
            >
              {isSubmitting ? (
                "Guardando..."
              ) : (
                <>
                  <FaSave className="mr-2" /> Guardar Cambios
                </>
              )}
            </motion.button>
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 bg-state-warning bg-opacity-10 border border-state-warning rounded-md"
            >
              <p className="text-sm text-state-warning">
                ⚠️ Tienes cambios sin guardar. No olvides hacer clic en "Guardar
                Cambios" para aplicarlos.
              </p>
            </motion.div>
          )}
        </form>
      </div>
      {/* Modal de confirmación para eliminar foto */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePhoto}
        title="Eliminar Foto de Perfil"
        message="¿Estás seguro de que quieres eliminar tu foto de perfil? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={isUploadingPhoto}
      />
      {/* Modal de confirmación para cancelar cambios */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancelar Cambios"
        message="¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados."
        confirmText="Sí, cancelar"
        cancelText="No, continuar editando"
        type="warning"
        isLoading={false}
      />
    </motion.div>
  );
};

export default UserProfile;
