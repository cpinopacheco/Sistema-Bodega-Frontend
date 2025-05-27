"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../context/AuthContext"
import { FaArrowLeft, FaTimes, FaSave } from "react-icons/fa"

const ChangePassword = () => {
  const { changePassword } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await changePassword(currentPassword, newPassword)

      if (result) {
        setSuccess("Contraseña actualizada correctamente")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        // Opcional: redirigir después de un tiempo
        setTimeout(() => {
          navigate("/dashboard")
        }, 2000)
      } else {
        setError("La contraseña actual es incorrecta")
      }
    } catch (err) {
      setError("Ocurrió un error al cambiar la contraseña")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses =
    "w-full p-2 border border-neutral-light rounded focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800"

  return (
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
          <h1 className="text-2xl font-bold text-primary">Cambiar Contraseña</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-neutral-medium hover:text-primary rounded-full"
            aria-label="Volver"
          >
            <FaArrowLeft />
          </button>
        </div>

        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-dark mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClasses}
              style={
                {
                  "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-dark mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClasses}
              style={
                {
                  "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-dark mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClasses}
              style={
                {
                  "--tw-ring-color": "rgb(1, 58, 26, 0.5)",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <motion.button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaTimes className="mr-2" /> Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700 disabled:opacity-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? (
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
  )
}

export default ChangePassword
