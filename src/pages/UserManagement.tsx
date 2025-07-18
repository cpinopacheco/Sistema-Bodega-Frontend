"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUsers,
  FaUserCheck,
  FaShieldAlt,
  FaUser,
  FaToggleOn,
  FaToggleOff,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { useUsers, type User } from "../context/UsersContext";
import { useAuth } from "../context/AuthContext";
import UserForm from "../components/users/UserForm";
import { Tooltip } from "../components/ui/Tooltip";
import { formatDate } from "../utils/DateUtils";

const UserManagement = () => {
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    checkUserWithdrawals,
  } = useUsers();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<"all" | "admin" | "user">(
    "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number | null;
    userName: string;
    hasWithdrawals: boolean;
    withdrawalCount: number;
  } | null>(null);
  // Estado para controlar si la animación ya se ejecutó
  const [hasAnimated, setHasAnimated] = useState(false);
  const [sortField, setSortField] = useState<
    "name" | "employee_code" | "role" | "section" | "is_active" | "created_at"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Función para abrir modal de edición
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      // Verificar si el usuario tiene retiros antes de mostrar el modal
      const { hasWithdrawals, withdrawalCount } = await checkUserWithdrawals(
        id
      );

      setConfirmDelete({
        id,
        userName: user.name,
        hasWithdrawals,
        withdrawalCount,
      });
    } catch (error) {
      console.error("Error verificando retiros:", error);
      // En caso de error, mostrar modal de eliminación normal
      setConfirmDelete({
        id,
        userName: user.name,
        hasWithdrawals: false,
        withdrawalCount: 0,
      });
    }
  };

  // Función para eliminar usuario
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      setConfirmDelete(null);
    } catch (error: any) {
      console.log("❌ Error capturado:", error);

      if (
        error.type === "USUARIO_CON_RETIROS" ||
        error.message === "USUARIO_CON_RETIROS"
      ) {
        // Actualizar el modal para mostrar información de retiros
        setConfirmDelete((prev) =>
          prev
            ? {
                ...prev,
                hasWithdrawals: true,
                withdrawalCount: error.withdrawalCount || 0,
              }
            : null
        );
        return; // No cerrar el modal
      }

      setConfirmDelete(null);
    }
  };

  // Función para cambiar estado del usuario
  const handleToggleStatus = async (id: number) => {
    try {
      await toggleUserStatus(id);
    } catch (error) {
      // El error ya se maneja en el contexto
    }
  };

  // Función para manejar envío del formulario
  const handleFormSubmit = async (userData: any) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, userData);
    } else {
      await createUser(userData);
    }
  };

  // Función para desactivar usuario
  const handleDeactivate = async () => {
    if (!confirmDelete?.id) return;

    try {
      console.log("🔄 Desactivando usuario:", confirmDelete.id);

      // Obtener el usuario actual
      const user = users.find((u) => u.id === confirmDelete.id);

      // Si el usuario ya está inactivo, simplemente cerrar el modal
      if (user && !user.is_active) {
        setConfirmDelete(null);
        return;
      }

      // Si está activo, desactivarlo
      await toggleUserStatus(confirmDelete.id);
      setConfirmDelete(null);
    } catch (error) {
      console.log("❌ Error desactivando usuario:", error);
    }
  };

  // Función para manejar el ordenamiento
  const handleSort = (
    field:
      | "name"
      | "employee_code"
      | "role"
      | "section"
      | "is_active"
      | "created_at"
  ) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Ordenar usuarios
  let sortedUsers: User[];
  let filteredUsers: User[];

  if (users) {
    filteredUsers = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.section.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && user.is_active) ||
        (selectedStatus === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    sortedUsers = [...filteredUsers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "employee_code":
          aValue = a.employee_code;
          bValue = b.employee_code;
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "section":
          aValue = a.section;
          bValue = b.section;
          break;
        case "is_active":
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  } else {
    filteredUsers = [];
    sortedUsers = [];
  }

  // Controlar cuándo debe ejecutarse la animación inicial
  useEffect(() => {
    if (!hasAnimated && users.length > 0) {
      setHasAnimated(true);
    }
  }, [users.length, hasAnimated]);

  // Manejar cierre con tecla Escape para modales
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDelete !== null) {
          setConfirmDelete(null);
        }
      }
    };

    if (confirmDelete !== null) {
      window.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [confirmDelete]);

  // Verificar que el usuario actual es admin
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaShieldAlt className="mx-auto text-neutral-medium text-5xl mb-4" />
          <h3 className="text-lg font-medium text-neutral-dark mb-1">
            Acceso Denegado
          </h3>
          <p className="text-neutral-medium">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  // Estadísticas
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-dark">
          Gestión de Usuarios
        </h1>
        <button
          onClick={() => {
            setSelectedUser(null);
            setShowUserForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary text-neutral-white rounded-md hover:bg-primary-light transition-colors"
        >
          <FaPlus className="mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-primary-lightest p-3 mr-4">
              <FaUsers className="text-primary text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Total Usuarios</p>
              <p className="text-2xl font-bold text-neutral-dark">
                {totalUsers}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-state-success bg-opacity-10 p-3 mr-4">
              <FaUserCheck className="text-state-success text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Usuarios Activos</p>
              <p className="text-2xl font-bold text-state-success">
                {activeUsers}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
          className="bg-neutral-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-accent bg-opacity-10 p-3 mr-4">
              <FaShieldAlt className="text-accent text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-medium">Administradores</p>
              <p className="text-2xl font-bold text-accent">{adminUsers}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuarios..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="w-full md:w-1/3">
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as "all" | "admin" | "user")
            }
            className="w-full px-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as "all" | "active" | "inactive")
            }
            className="w-full px-4 py-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-neutral-medium">Cargando usuarios...</div>
        </div>
      ) : sortedUsers.length > 0 ? (
        <motion.div
          key={`users-${users.length}-${filteredUsers.length}`}
          initial={hasAnimated ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
        >
          {!isMobile ? (
            /* Vista de escritorio - Tabla */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-light">
                <thead className="bg-primary-lightest">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Usuario</span>
                        {sortField === "name" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("employee_code")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Código</span>
                        {sortField === "employee_code" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Rol</span>
                        {sortField === "role" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("section")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Sección</span>
                        {sortField === "section" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("is_active")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Estado</span>
                        {sortField === "is_active" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-primary-light hover:bg-opacity-20 transition-colors"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Creado</span>
                        {sortField === "created_at" && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? (
                              <FaSortAmountUp className="w-3 h-3" />
                            ) : (
                              <FaSortAmountDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-white divide-y divide-neutral-light">
                  {sortedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-primary-lightest hover:bg-opacity-30 transition-colors duration-200 ${
                        !user.is_active ? "bg-neutral-light bg-opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-lightest flex items-center justify-center">
                              {user.role === "admin" ? (
                                <FaShieldAlt className="text-primary" />
                              ) : (
                                <FaUser className="text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-dark">
                              {user.name}
                            </div>
                            <div className="text-sm text-neutral-medium">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          {user.employee_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-200 ${
                            user.role === "admin"
                              ? "bg-accent bg-opacity-10 text-accent"
                              : "bg-primary-lightest text-primary"
                          }`}
                        >
                          {user.role === "admin" ? "Administrador" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          {user.section}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-200 ${
                            user.is_active
                              ? "bg-state-success bg-opacity-10 text-state-success"
                              : "bg-state-error bg-opacity-10 text-state-error"
                          }`}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-medium">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Tooltip
                            content={
                              user.is_active
                                ? "Desactivar usuario"
                                : "Activar usuario"
                            }
                            position="top"
                          >
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              disabled={user.id === currentUser.id}
                              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                                user.id === currentUser.id
                                  ? "text-neutral-light cursor-not-allowed"
                                  : user.is_active
                                  ? "text-state-warning hover:bg-state-warning hover:text-neutral-white hover:scale-110"
                                  : "text-state-success hover:bg-state-success hover:text-neutral-white hover:scale-110"
                              }`}
                            >
                              {user.is_active ? (
                                <FaToggleOn size={16} />
                              ) : (
                                <FaToggleOff size={16} />
                              )}
                            </button>
                          </Tooltip>

                          <Tooltip content="Editar usuario" position="top">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-state-info hover:bg-state-info hover:text-neutral-white p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 hover:scale-110"
                            >
                              <FaEdit size={16} />
                            </button>
                          </Tooltip>

                          <Tooltip content="Eliminar usuario" position="top">
                            <button
                              onClick={() => handleDeleteConfirm(user.id)}
                              disabled={user.id === currentUser.id}
                              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                                user.id === currentUser.id
                                  ? "text-neutral-light cursor-not-allowed"
                                  : "text-state-error hover:bg-state-error hover:text-neutral-white hover:scale-110"
                              }`}
                            >
                              <FaTrash size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Vista móvil - Tarjetas */
            <div className="p-4 space-y-4">
              {sortedUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-neutral-white border rounded-lg p-4 shadow-sm ${
                    !user.is_active
                      ? "border-neutral-medium bg-neutral-light bg-opacity-20"
                      : "border-neutral-light"
                  }`}
                >
                  <div className="flex items-center flex-1 mb-6">
                    <div className="flex-shrink-0 h-10 w-10 mr-3">
                      <div className="h-10 w-10 rounded-full bg-primary-lightest flex items-center justify-center">
                        {user.role === "admin" ? (
                          <FaShieldAlt className="text-primary" />
                        ) : (
                          <FaUser className="text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-base font-bold text-neutral-dark">
                            {user.name}
                          </div>
                          <div className="text-sm text-neutral-medium break-all">
                            {user.email}
                          </div>
                        </div>
                        {/* Tags: debajo en mobile, a la derecha en sm+ */}
                        <div className="flex flex-row gap-2 mt-2 sm:mt-0 sm:ml-2 sm:justify-end">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent bg-opacity-10 text-accent">
                            {user.role === "admin" ? "Admin" : "Usuario"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              user.is_active
                                ? "bg-state-success bg-opacity-10 text-state-success"
                                : "bg-state-error bg-opacity-10 text-state-error"
                            }`}
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Datos de usuario: Código, Sección, Creado */}
                  <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-0 sm:mb-2">
                    <div className="sm:border-r sm:border-neutral-light sm:pr-4">
                      <span className="text-sm text-neutral-medium">
                        Código:
                      </span>
                      <div className="text-sm text-neutral-dark">
                        {user.employee_code}
                      </div>
                    </div>
                    <div className="sm:border-r sm:border-neutral-light sm:px-4">
                      <span className="text-sm text-neutral-medium">
                        Sección:
                      </span>
                      <div className="text-sm text-neutral-dark">
                        {user.section}
                      </div>
                    </div>
                    <div className="sm:pl-4 mt-2 sm:mt-0">
                      <span className="text-sm text-neutral-medium">
                        Creado:
                      </span>
                      <div className="text-sm text-neutral-dark">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-light">
                    <div className="flex items-center space-x-2">
                      <Tooltip
                        content={
                          user.is_active
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                        position="top"
                      >
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={user.id === currentUser.id}
                          className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                            user.id === currentUser.id
                              ? "text-neutral-light cursor-not-allowed"
                              : user.is_active
                              ? "text-state-warning hover:bg-state-warning hover:text-neutral-white"
                              : "text-state-success hover:bg-state-success hover:text-neutral-white"
                          }`}
                        >
                          {user.is_active ? (
                            <FaToggleOn size={16} />
                          ) : (
                            <FaToggleOff size={16} />
                          )}
                        </button>
                      </Tooltip>

                      <Tooltip content="Editar usuario" position="top">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-state-info hover:bg-state-info hover:text-neutral-white p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8"
                        >
                          <FaEdit size={16} />
                        </button>
                      </Tooltip>

                      <Tooltip content="Eliminar usuario" position="top">
                        <button
                          onClick={() => handleDeleteConfirm(user.id)}
                          disabled={user.id === currentUser.id}
                          className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                            user.id === currentUser.id
                              ? "text-neutral-light cursor-not-allowed"
                              : "text-state-error hover:bg-state-error hover:text-neutral-white"
                          }`}
                        >
                          <FaTrash size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-neutral-white rounded-lg shadow-md p-8 text-center">
          <FaUsers className="mx-auto text-neutral-medium text-5xl mb-4" />
          <h3 className="text-lg font-medium text-neutral-dark mb-1">
            No se encontraron usuarios
          </h3>
          <p className="text-neutral-medium">
            {searchTerm || selectedRole !== "all" || selectedStatus !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza agregando tu primer usuario"}
          </p>
        </div>
      )}

      {/* Modal de formulario */}

      {showUserForm && (
        <UserForm
          user={selectedUser || undefined}
          onClose={() => {
            setShowUserForm(false);
            setSelectedUser(null);
          }}
          onSubmit={handleFormSubmit}
          isVisible={showUserForm}
        />
      )}

      {/* Modal de confirmación de eliminación */}

      {confirmDelete !== null && (
        <motion.div
          initial={{ opacity: 0, marginTop: 0 }}
          animate={{ opacity: 1, marginTop: 0 }}
          exit={{ opacity: 0, marginTop: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-50 px-4 pb-4 !mt-0"
          style={{ marginTop: "0px !important" }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setConfirmDelete(null);
            }
          }}
          tabIndex={-1}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-neutral-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmDelete.hasWithdrawals ? (
              <>
                <div className="flex items-center mb-4">
                  <div className="text-amber-500 mr-2 text-2xl">⚠️</div>
                  <h3 className="text-lg font-medium text-neutral-dark">
                    No se puede eliminar el usuario
                  </h3>
                </div>
                <p className="text-neutral-medium mb-4">
                  El usuario <strong>{confirmDelete.userName}</strong> no puede
                  ser eliminado porque tiene{" "}
                  <strong className="text-amber-500">
                    retiros registrados
                  </strong>{" "}
                  en el sistema.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-blue-800 font-medium mb-1">
                    ¿Por qué no se puede eliminar?
                  </p>
                  <p className="text-blue-700 text-sm">
                    Eliminar este usuario afectaría la integridad de los datos
                    históricos y los reportes del sistema de inventario.
                  </p>
                </div>
                <p className="text-neutral-medium mb-6">
                  {(() => {
                    const user = users.find((u) => u.id === confirmDelete.id);
                    return user?.is_active ? (
                      <>
                        <strong>Alternativa recomendada:</strong> Puedes
                        desactivar el usuario para que no pueda acceder al
                        sistema, pero manteniendo el historial de retiros
                        intacto.
                      </>
                    ) : (
                      <>
                        <strong>Estado actual:</strong> Este usuario ya está
                        desactivado y no puede acceder al sistema. El historial
                        de retiros se mantiene intacto.
                      </>
                    );
                  })()}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  {/* Solo mostrar botón de desactivar si el usuario está activo */}
                  {(() => {
                    const user = users.find((u) => u.id === confirmDelete.id);
                    return user?.is_active ? (
                      <button
                        onClick={handleDeactivate}
                        className="px-4 py-2 bg-amber-500 text-neutral-white rounded-md hover:bg-amber-600"
                        disabled={loading}
                      >
                        {loading ? "Procesando..." : "Desactivar Usuario"}
                      </button>
                    ) : null;
                  })()}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-neutral-dark mb-3">
                  Confirmar eliminación
                </h3>
                <p className="text-neutral-medium mb-6">
                  ¿Estás seguro de que deseas eliminar este usuario? Esta acción
                  no se puede deshacer.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-4 py-2 border border-neutral-light rounded-md text-neutral-dark hover:bg-neutral-light"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete.id && handleDelete(confirmDelete.id)
                    }
                    className="px-4 py-2 bg-state-error text-neutral-white rounded-md hover:bg-opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserManagement;
