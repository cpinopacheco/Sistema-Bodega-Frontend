"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onEscape?: () => void;
  trapFocus?: boolean;
}

export const useKeyboardNavigation = ({
  isOpen,
  onClose,
  onEscape,
  trapFocus = true,
}: UseKeyboardNavigationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar el elemento activo anterior
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onEscape) {
          onEscape();
        } else {
          onClose();
        }
        return;
      }

      if (!trapFocus || !containerRef.current) return;

      // Trap focus dentro del contenedor
      if (e.key === "Tab") {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus en el primer elemento focuseable cuando se abre
    if (trapFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      firstFocusable?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restaurar focus al elemento anterior cuando se cierra
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, onEscape, trapFocus]);

  return containerRef;
};
