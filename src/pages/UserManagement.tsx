"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

  // Función para abrir modal de edición
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = (id: number) => {
    setConfirmDelete(id);
  };

  // Función para eliminar usuario
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      setConfirmDelete(null);
    } catch (error) {
      // El error ya se maneja en el contexto
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

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
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
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
      ) : filteredUsers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead className="bg-primary-lightest">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Sección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-primary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-white divide-y divide-neutral-light">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-primary-lightest hover:bg-opacity-30 ${
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
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            className={`p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8 ${
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
                            className="text-state-info hover:bg-state-info hover:text-neutral-white p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
                          >
                            <FaEdit size={16} />
                          </button>
                        </Tooltip>

                        <Tooltip content="Eliminar usuario" position="top">
                          <button
                            onClick={() => handleDeleteConfirm(user.id)}
                            disabled={user.id === currentUser.id}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8 ${
                              user.id === currentUser.id
                                ? "text-neutral-light cursor-not-allowed"
                                : "text-state-error hover:bg-state-error hover:text-neutral-white"
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
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-dark bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
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
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-state-error text-neutral-white rounded-md hover:bg-opacity-90"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
