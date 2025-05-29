/**
 * Valida y normaliza códigos de empleado
 * Formato esperado: 6 dígitos seguidos de una letra minúscula (ej: 031296m)
 */

export const validateEmployeeCode = (
  code: string
): { isValid: boolean; error?: string } => {
  if (!code || !code.trim()) {
    return { isValid: false, error: "El código de empleado es obligatorio" };
  }

  const trimmedCode = code.trim();

  // Verificar longitud exacta
  if (trimmedCode.length !== 7) {
    return {
      isValid: false,
      error:
        "El código debe tener exactamente 7 caracteres (6 dígitos + 1 letra)",
    };
  }

  // Verificar formato: 6 dígitos seguidos de una letra
  const formatRegex = /^\d{6}[a-zA-Z]$/;
  if (!formatRegex.test(trimmedCode)) {
    return {
      isValid: false,
      error:
        "Formato inválido. Debe ser 6 dígitos seguidos de una letra (ej: 031296m)",
    };
  }

  return { isValid: true };
};

export const normalizeEmployeeCode = (code: string): string => {
  if (!code) return "";

  // Eliminar espacios y convertir la letra a minúscula
  const trimmed = code.trim();
  if (trimmed.length === 7) {
    const digits = trimmed.slice(0, 6);
    const letter = trimmed.slice(6).toLowerCase();
    return digits + letter;
  }

  return trimmed.toLowerCase();
};

export const formatEmployeeCodeInput = (value: string): string => {
  // Remover caracteres no válidos y limitar longitud
  const cleaned = value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 7);

  if (cleaned.length <= 6) {
    // Solo dígitos permitidos en los primeros 6 caracteres
    return cleaned.replace(/[^0-9]/g, "");
  } else {
    // Los primeros 6 deben ser dígitos, el 7mo puede ser letra
    const digits = cleaned.slice(0, 6).replace(/[^0-9]/g, "");
    const letter = cleaned
      .slice(6, 7)
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();
    return digits + letter;
  }
};
