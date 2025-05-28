"use client";

import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  isLoading = false,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "text-state-error",
          confirmButton: "bg-state-error hover:bg-red-600",
          iconBg: "bg-red-50",
        };
      case "warning":
        return {
          icon: "text-state-warning",
          confirmButton: "bg-state-warning hover:bg-yellow-600",
          iconBg: "bg-yellow-50",
        };
      default:
        return {
          icon: "text-primary",
          confirmButton: "bg-primary hover:bg-primary-light",
          iconBg: "bg-primary-lightest",
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-neutral-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-light">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}
              >
                <FaExclamationTriangle className={`text-lg ${styles.icon}`} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-dark">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-neutral-medium hover:text-neutral-dark rounded-full hover:bg-neutral-light transition-colors"
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-neutral-medium leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 bg-neutral-lightest border-t border-neutral-light">
            <motion.button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-light rounded bg-neutral-white text-neutral-dark hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {cancelText}
            </motion.button>
            <motion.button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-neutral-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${styles.confirmButton}`}
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {isLoading ? "Procesando..." : confirmText}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
