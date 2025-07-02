// Configuración base para las peticiones HTTP al backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log("🔧 API configurada para:", API_BASE_URL);

// Función helper para obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Función helper para manejar respuestas HTTP
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));

    // Manejar específicamente el error de usuario con retiros
    if (error.error === "USUARIO_CON_RETIROS") {
      const customError = new Error("USUARIO_CON_RETIROS") as any;
      customError.type = "USUARIO_CON_RETIROS";
      customError.withdrawalCount = error.withdrawalCount || error.count || 0;
      customError.userName =
        error.userName || error.user || error.name || "Usuario";
      customError.details = error;

      console.log("🔍 Error personalizado creado:", customError);
      throw customError;
    }

    // Manejar error de nombre duplicado
    if (error.code === "DUPLICATE_NAME") {
      const duplicateError = new Error(error.error) as any;
      duplicateError.type = "DUPLICATE_NAME";
      throw duplicateError;
    }

    // Manejar credenciales inválidas (login)
    if (
      error.error &&
      (error.error.toLowerCase().includes("credenciales inválidas") ||
        error.error.toLowerCase().includes("credenciales invalidas") ||
        error.error.toLowerCase().includes("invalid credentials"))
    ) {
      // Devuelve el error como objeto para que la UI lo maneje
      return error;
    }

    // Manejar token inválido o expirado
    if (error.error && error.error.toLowerCase().includes("token")) {
      localStorage.removeItem("authToken");
      // Si tienes acceso al router, puedes redirigir al login aquí
      // window.location.href = "/login";
    }

    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Función helper para crear headers con autenticación
const createAuthHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Función helper para crear headers con autenticación para FormData
const createAuthHeadersForFormData = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// =====================================================
// AUTENTICACIÓN API
// =====================================================

export const authAPI = {
  // Iniciar sesión
  login: async (employeeCode: string, password: string) => {
    console.log(
      "🌐 API: Enviando petición de login a:",
      `${API_BASE_URL}/api/auth/login`
    );
    console.log("📤 Datos enviados:", { employeeCode, password: "***" });

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employeeCode, password }),
    });

    console.log("📥 Respuesta recibida - Status:", response.status);
    return handleResponse(response);
  },

  // Cambiar contraseña
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  // Actualizar perfil del usuario actual
  updateProfile: async (profileData: {
    name: string;
    email: string;
    section: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Subir foto de perfil
  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    const response = await fetch(`${API_BASE_URL}/api/auth/upload-profile-photo`, {
      method: "POST",
      headers: createAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse(response);
  },

  // Eliminar foto de perfil
  deleteProfilePhoto: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/delete-profile-photo`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener información del usuario actual
  getMe: async () => {
    console.log("🔍 API: Verificando usuario actual...");
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Verificar token
  verifyToken: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      method: "POST",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Función helper para obtener URL de foto de perfil
export const getProfilePhotoUrl = (
  filename: string | null | undefined
): string | null => {
  if (!filename) return null;
  // Elimina '/api' si está presente para evitar duplicidad en la URL
  const baseUrl = API_BASE_URL?.replace(/\/api$/, "");
  return `${baseUrl}/uploads/profile-photos/${filename}`;
};

// =====================================================
// USUARIOS API (NUEVO)
// =====================================================

export const usersAPI = {
  // Obtener todos los usuarios (solo admin)
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener un usuario específico (solo admin)
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Crear nuevo usuario (solo admin)
  create: async (userData: {
    name: string;
    email: string;
    employeeCode: string;
    password: string;
    role: "admin" | "user";
    section: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Actualizar usuario (solo admin)
  update: async (
    id: number,
    userData: {
      name: string;
      email: string;
      employeeCode: string;
      role: "admin" | "user";
      section: string;
      isActive: boolean;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Eliminar usuario (solo admin)
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Verificar si un usuario tiene retiros asociados
  checkUserWithdrawals: async (id: number) => {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${id}/check-withdrawals`,
      {
        headers: createAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  // Activar/desactivar usuario (solo admin)
  toggleStatus: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}/toggle-status`, {
      method: "PATCH",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// CATEGORÍAS API
// =====================================================

export const categoriesAPI = {
  // Obtener todas las categorías
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Crear nueva categoría
  create: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  // Actualizar categoría
  update: async (id: number, name: string) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  // Eliminar categoría
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// PRODUCTOS API
// =====================================================

export const productsAPI = {
  // Obtener todos los productos
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener un producto específico
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Crear nuevo producto
  create: async (productData: {
    name: string;
    description?: string;
    categoryId: number;
    stock: number;
    minStock: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  // Actualizar producto
  update: async (
    id: number,
    productData: {
      name: string;
      description?: string;
      categoryId: number;
      stock: number;
      minStock: number;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  // Actualizar solo el stock de un producto
  updateStock: async (id: number, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
      method: "PATCH",
      headers: createAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
  },

  // Eliminar producto
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Importación masiva de productos
  bulkImport: async (
    products: Array<{
      name: string;
      description?: string;
      categoryId: number;
      stock: number;
      minStock: number;
    }>
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/products/bulk-import`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ products }),
    });
    return handleResponse(response);
  },

  // Obtener productos inactivos (desactivados)
  getInactive: async () => {
    const response = await fetch(`${API_BASE_URL}/api/products/inactive`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Desactivar producto (soft delete)
  deactivate: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/deactivate`, {
      method: "PATCH",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Reactivar producto
  activate: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/activate`, {
      method: "PATCH",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// RETIROS API
// =====================================================

export const withdrawalsAPI = {
  // Obtener todos los retiros
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener un retiro específico
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals/${id}`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Crear nuevo retiro
  create: async (withdrawalData: {
    userId: number;
    userName: string;
    userSection: string;
    withdrawerName: string;
    withdrawerSection: string;
    notes?: string;
    items: Array<{
      productId: number;
      quantity: number;
      product: any;
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(withdrawalData),
    });
    return handleResponse(response);
  },

  // Eliminar retiro
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals/${id}`, {
      method: "DELETE",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// HEALTH CHECK (para probar conexión)
// =====================================================

export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse(response);
  },
};
