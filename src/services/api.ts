// Configuración base para las peticiones HTTP al backend
const API_BASE_URL = "http://localhost:3001/api";

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

// =====================================================
// AUTENTICACIÓN API
// =====================================================

export const authAPI = {
  // Iniciar sesión
  login: async (employeeCode: string, password: string) => {
    console.log(
      "🌐 API: Enviando petición de login a:",
      `${API_BASE_URL}/auth/login`
    );
    console.log("📤 Datos enviados:", { employeeCode, password: "***" });

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  // Obtener información del usuario actual
  getMe: async () => {
    console.log("🔍 API: Verificando usuario actual...");
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Verificar token
  verifyToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: "POST",
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
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Crear nueva categoría
  create: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  // Actualizar categoría
  update: async (id: number, name: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  // Eliminar categoría
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener un producto específico
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/products`, {
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
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  // Actualizar solo el stock de un producto
  updateStock: async (id: number, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
      method: "PATCH",
      headers: createAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
  },

  // Eliminar producto
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
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
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Obtener un retiro específico
  getById: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/withdrawals/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/withdrawals`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify(withdrawalData),
    });
    return handleResponse(response);
  },

  // Eliminar retiro
  delete: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/withdrawals/${id}`, {
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
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};
