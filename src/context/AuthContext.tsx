"use client";

import { createContext, useState, useContext, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario de muestra para desarrollo
const sampleUser: User = {
  id: 1,
  name: "Admin Usuario",
  email: "admin@example.com",
  employeeCode: "123456a", // Código de funcionario: 6 dígitos + 1 letra minúscula
  role: "admin",
  section: "IT",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  // Función para iniciar sesión
  const login = async (employeeCode: string, password: string) => {
    try {
      // Simulación de autenticación
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Obtener la contraseña almacenada o usar la predeterminada
      const storedPassword = localStorage.getItem("userPassword") || "password";

      // En una aplicación real, aquí se verificarían las credenciales con el backend
      if (employeeCode === "123456a" && password === storedPassword) {
        setUser(sampleUser);
        localStorage.setItem("user", JSON.stringify(sampleUser));
        toast.success("Inicio de sesión exitoso");
        navigate("/dashboard");
      } else {
        toast.error("Credenciales incorrectas");
      }
    } catch (error) {
      toast.error("Error al iniciar sesión");
      console.error("Login error:", error);
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      // Simulación de tiempo de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Obtener la contraseña almacenada o usar la predeterminada
      const storedPassword = localStorage.getItem("userPassword") || "password";

      // Verificar que la contraseña actual sea correcta
      if (currentPassword !== storedPassword) {
        toast.error("La contraseña actual es incorrecta");
        return false;
      }

      // Almacenar la nueva contraseña
      localStorage.setItem("userPassword", newPassword);
      toast.success("Contraseña actualizada correctamente");
      return true;
    } catch (error) {
      toast.error("Error al cambiar la contraseña");
      console.error("Change password error:", error);
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, changePassword, isAuthenticated }}
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
