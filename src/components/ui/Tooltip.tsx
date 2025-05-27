"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TooltipProps {
  children: ReactNode
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

export const Tooltip = ({ children, content, position = "top" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const childRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Funciones simples para mostrar/ocultar el tooltip
  const showTooltip = () => setIsVisible(true)
  const hideTooltip = () => setIsVisible(false)

  // Calcular la posición del tooltip basado en la posición del elemento padre
  useEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (position) {
        case "right":
          top = childRect.top + childRect.height / 2 - tooltipRect.height / 2
          left = childRect.right + 8
          break
        case "left":
          top = childRect.top + childRect.height / 2 - tooltipRect.height / 2
          left = childRect.left - tooltipRect.width - 8
          break
        case "bottom":
          top = childRect.bottom + 8
          left = childRect.left + childRect.width / 2 - tooltipRect.width / 2
          break
        default: // top
          top = childRect.top - tooltipRect.height - 8
          left = childRect.left + childRect.width / 2 - tooltipRect.width / 2
          break
      }

      // Asegurarse de que el tooltip no se salga de la pantalla
      const padding = 10
      if (left < padding) left = padding
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding
      }
      if (top < padding) top = padding
      if (top + tooltipRect.height > window.innerHeight - padding) {
        top = window.innerHeight - tooltipRect.height - padding
      }

      setTooltipPosition({ top, left })
    }
  }, [isVisible, position])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      setIsVisible(false)
    }
  }, [])

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      ref={childRef}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-[9999] whitespace-nowrap px-3 py-1.5 text-xs font-medium text-neutral-white bg-primary rounded shadow pointer-events-none"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
