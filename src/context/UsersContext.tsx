"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import { usersAPI } from "../services/api";
import { useAuth } from "./AuthContext";

// Definir tipos
export interface User {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  role: "admin" | "user";
  section: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UsersContextType {
  users: User[];
  loading: boolean;
  loadUsers: () => Promise<void>;
  createUser: (userData: {
    name: string;
    email: string;
    employeeCode: string;
    password: string;
    role: "admin" | "user";
    section: string;
  }) => Promise<void>;
  updateUser: (
    id: number,
    userData: {
      name: string;
      email: string;
      employeeCode: string;
      role: "admin" | "user";
      section: string;
      isActive: boolean;
    }
  ) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number) => Promise<void>;
  getUserById: (id: number) => User | undefined;
  checkUserWithdrawals: (
    id: number
  ) => Promise<{ hasWithdrawals: boolean; withdrawalCount: number }>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser, updateCurrentUser } = useAuth();

  // Cargar usuarios desde el backend
  const loadUsers = useCallback(async () => {
    // Solo cargar si el usuario actual es admin
    if (!currentUser || currentUser.role !== "admin") {
      return;
    }

    try {
      setLoading(true);
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      toast.error(error.message || "Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Fixed dependency

  // Cargar usuarios al inicializar el contexto (solo si es admin)
  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [loadUsers, currentUser]); // Fixed dependency

  // Crear nuevo usuario
  const createUser = useCallback(
    async (userData: {
      name: string;
      email: string;
      employeeCode: string;
      password: string;
      role: "admin" | "user";
      section: string;
    }) => {
      try {
        setLoading(true);
        const newUser = await usersAPI.create(userData);
        setUsers((prev) => [newUser, ...prev]);
        toast.success("Usuario creado correctamente");
      } catch (error: any) {
        console.error("Error creando usuario:", error);
        toast.error(error.message || "Error al crear el usuario");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar usuario
  const updateUser = useCallback(
    async (
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
      try {
        setLoading(true);
        const updatedUser = await usersAPI.update(id, userData);
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? updatedUser : user))
        );

        // Solo actualizar el contexto de auth si realmente cambió algo importante
        if (currentUser && currentUser.id === id) {
          const hasChanges =
            currentUser.name !== updatedUser.name ||
            currentUser.email !== updatedUser.email ||
            currentUser.employeeCode !== updatedUser.employee_code ||
            currentUser.role !== updatedUser.role ||
            currentUser.section !== updatedUser.section;

          if (hasChanges) {
            updateCurrentUser({
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              employeeCode: updatedUser.employee_code,
              role: updatedUser.role,
              section: updatedUser.section,
            });
          }
        }

        toast.success("Usuario actualizado correctamente");
      } catch (error: any) {
        console.error("Error actualizando usuario:", error);
        toast.error(error.message || "Error al actualizar el usuario");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, updateCurrentUser]
  );

  // Eliminar usuario
  const deleteUser = useCallback(async (id: number) => {
    try {
      setLoading(true);
      await usersAPI.delete(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("Usuario eliminado correctamente");
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);

      // Si el error es porque el usuario tiene retiros, re-lanzar el error sin mostrar toast
      if (
        error.message === "USUARIO_CON_RETIROS" ||
        error.type === "USUARIO_CON_RETIROS"
      ) {
        throw error;
      }

      toast.error(error.message || "Error al eliminar el usuario");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Activar/desactivar usuario
  const toggleUserStatus = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const result = await usersAPI.toggleStatus(id);
      setUsers((prev) =>
        prev.map((user) => (user.id === id ? result.user : user))
      );
      toast.success(result.message);
    } catch (error: any) {
      console.error("Error cambiando estado del usuario:", error);
      toast.error(error.message || "Error al cambiar el estado del usuario");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener usuario por ID
  const getUserById = useCallback(
    (id: number) => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  // Verificar si un usuario tiene retiros
  const checkUserWithdrawals = useCallback(async (id: number) => {
    try {
      const result = await usersAPI.checkUserWithdrawals(id);
      return result;
    } catch (error: any) {
      console.error("Error verificando retiros del usuario:", error);
      // En caso de error, asumir que no tiene retiros para permitir continuar
      return { hasWithdrawals: false, withdrawalCount: 0 };
    }
  }, []);

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        loadUsers,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        getUserById,
        checkUserWithdrawals,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

// Hook personalizado
export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers debe usarse dentro de un UsersProvider");
  }
  return context;
};
