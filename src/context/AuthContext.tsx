"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

// Define los tipos para los usuarios
interface User {
  id: number;
  name: string;
  email: string;
  employeeCode: string; // Código de funcionario
  role: "admin" | "user";
  section: string;
  profilePhoto?: string | null;
  isTempPassword?: boolean;
}

// Define los tipos para el contexto
interface AuthContextType {
  user: User | null;
  login: (
    employeeCode: string,
    password: string
  ) => Promise<{ error?: string }>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  updateProfile: (profileData: {
    name: string;
    email: string;
    section: string;
  }) => Promise<boolean>;
  uploadProfilePhoto: (file: File) => Promise<boolean>;
  deleteProfilePhoto: () => Promise<boolean>;
  updateCurrentUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
  forgotPassword: (employeeCode: string) => Promise<string>;
  getPasswordRecoveryRequests: () => Promise<any[]>;
  generateTempPassword: (requestId: number) => Promise<{
    tempPassword: string;
    userName: string;
    employeeCode: string;
  }>;
  archiveRequest: (requestId: number) => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar si hay un token válido al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Verificando token existente...");
        const userData = await authAPI.getMe();
        setUser(userData);
        console.log("✅ Token válido, usuario autenticado");
      } catch (error) {
        // Token inválido o expirado
        localStorage.removeItem("authToken");
        console.error("❌ Token inválido:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Función para iniciar sesión
  const login = async (employeeCode: string, password: string) => {
    console.log("🚀 AuthContext: Iniciando proceso de login...");
    console.log("👤 Código de empleado:", employeeCode);

    setLoading(true);
    try {
      console.log("🌐 Intentando conectar con el backend...");
      const response = await authAPI.login(employeeCode, password);
      console.log("✅ Respuesta del backend recibida:", response);

      // Si la respuesta tiene error, simplemente la retornamos para que el Login la maneje
      if (response.error) {
        return { error: response.error };
      }

      // Guardar token en localStorage
      localStorage.setItem("authToken", response.token);

      // Establecer usuario en el estado
      setUser(response.user);

      // Si el usuario tiene contraseña temporal, redirigir a cambio de contraseña
      if (response.user && response.user.isTempPassword) {
        toast.success(
          "Inicio de sesión exitoso. Debes cambiar tu contraseña temporal."
        );
        navigate("/change-password");
      } else {
        toast.success("Inicio de sesión exitoso");
        navigate("/dashboard");
      }
      return {};
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      await authAPI.changePassword(currentPassword, newPassword);

      toast.success("Contraseña actualizada correctamente");
      return true;
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error.message || "Error al cambiar la contraseña");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (profileData: {
    name: string;
    email: string;
    section: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await authAPI.updateProfile(profileData);

      // Actualizar el usuario en el estado local
      setUser(response.user);

      toast.success("Perfil actualizado correctamente");
      return true;
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error.message || "Error al actualizar el perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para subir foto de perfil
  const uploadProfilePhoto = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await authAPI.uploadProfilePhoto(file);

      // Actualizar el usuario en el estado local
      setUser(response.user);

      toast.success("Foto de perfil actualizada correctamente");
      return true;
    } catch (error: any) {
      console.error("Upload profile photo error:", error);
      toast.error(error.message || "Error al subir la foto de perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar foto de perfil
  const deleteProfilePhoto = async (): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await authAPI.deleteProfilePhoto();

      // Actualizar el usuario en el estado local
      setUser(response.user);

      toast.success("Foto de perfil eliminada correctamente");
      return true;
    } catch (error: any) {
      console.error("Delete profile photo error:", error);
      toast.error(error.message || "Error al eliminar la foto de perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  // Función para actualizar el usuario actual
  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Función para solicitar recuperación de contraseña
  const forgotPassword = async (employeeCode: string): Promise<string> => {
    try {
      setLoading(true);

      const response = await fetch(
        `${
          process.env.VITE_API_URL || "http://localhost:3001"
        }/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employeeCode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al solicitar recuperación de contraseña"
        );
      }

      const data = await response.json();
      return data.userName;
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(
        error.message || "Error al solicitar recuperación de contraseña"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener solicitudes de recuperación de contraseña (solo admin)
  const getPasswordRecoveryRequests = async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No hay token de autenticación");

      console.log("🔍 Obteniendo solicitudes de recuperación...");
      const apiUrl = process.env.VITE_API_URL || "http://localhost:3001";
      console.log("🌐 API URL:", apiUrl);

      const response = await fetch(
        `${apiUrl}/api/auth/password-recovery-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        throw new Error(
          errorData.error || "Error al obtener solicitudes de recuperación"
        );
      }

      const data = await response.json();
      console.log("✅ Solicitudes obtenidas:", data);
      return data;
    } catch (error: any) {
      console.error("❌ Get password recovery requests error:", error);
      throw error;
    }
  };

  // Función para generar contraseña temporal (solo admin)
  const generateTempPassword = async (
    requestId: number
  ): Promise<{
    tempPassword: string;
    userName: string;
    employeeCode: string;
  }> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${
          process.env.VITE_API_URL || "http://localhost:3001"
        }/api/auth/generate-temp-password/${requestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al generar contraseña temporal"
        );
      }

      const data = await response.json();
      return {
        tempPassword: data.tempPassword,
        userName: data.userName,
        employeeCode: data.employeeCode,
      };
    } catch (error: any) {
      console.error("Generate temp password error:", error);
      throw error;
    }
  };

  // Función para archivar solicitud procesada (solo admin)
  const archiveRequest = async (requestId: number): Promise<void> => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${
          process.env.VITE_API_URL || "http://localhost:3001"
        }/api/auth/archive-request/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al archivar solicitud");
      }
    } catch (error: any) {
      console.error("Archive request error:", error);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        changePassword,
        updateProfile,
        uploadProfilePhoto,
        deleteProfilePhoto,
        updateCurrentUser,
        isAuthenticated,
        loading,
        forgotPassword,
        getPasswordRecoveryRequests,
        generateTempPassword,
        archiveRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
