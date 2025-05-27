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
}

// Define los tipos para el contexto
interface AuthContextType {
  user: User | null;
  login: (employeeCode: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  isAuthenticated: boolean;
  loading: boolean;
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

    try {
      setLoading(true);

      // COMENTAMOS LA VERIFICACIÓN DE DATOS MOCK PARA FORZAR CONEXIÓN AL BACKEND
      // if (employeeCode === "123456a" && password === "password") {
      //   console.log("⚠️ USANDO DATOS MOCK - NO CONECTANDO AL BACKEND")
      //
      //   // Simular respuesta del backend
      //   const mockUser = {
      //     id: 1,
      //     name: "Usuario Demo",
      //     email: "demo@cenpecar.com",
      //     employeeCode: "123456a",
      //     role: "admin" as const,
      //     section: "Administración",
      //   }
      //
      //   const mockToken = "mock-jwt-token-12345"
      //
      //   // Guardar token mock
      //   localStorage.setItem("authToken", mockToken)
      //   setUser(mockUser)
      //
      //   toast.success("Inicio de sesión exitoso (MODO DEMO)")
      //   navigate("/dashboard")
      //   return
      // }

      console.log("🌐 Intentando conectar con el backend...");
      const response = await authAPI.login(employeeCode, password);
      console.log("✅ Respuesta del backend recibida:", response);

      // Guardar token en localStorage
      localStorage.setItem("authToken", response.token);

      // Establecer usuario en el estado
      setUser(response.user);

      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Error al iniciar sesión");
      throw error;
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

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, changePassword, isAuthenticated, loading }}
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
