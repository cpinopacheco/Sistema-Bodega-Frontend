"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaKey,
  FaExclamationTriangle,
  FaCheck,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaArchive,
  FaClock,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

interface PasswordRecoveryRequest {
  id: number;
  user_id: number;
  requested_at: string;
  status: string;
  expires_at: string;
  processed_at?: string;
  name: string;
  email: string;
  employee_code: string;
  section: string;
}

const PasswordRecoveryRequests = () => {
  const { getPasswordRecoveryRequests, generateTempPassword, archiveRequest } =
    useAuth();
  const [requests, setRequests] = useState<PasswordRecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] =
    useState<PasswordRecoveryRequest | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<number | null>(
    null
  );

  // Almacenar contraseñas temporales generadas en esta sesión
  const [generatedPasswords, setGeneratedPasswords] = useState<{
    [requestId: number]: string;
  }>({});

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setError("");
        const data = await getPasswordRecoveryRequests();
        setRequests(data);
      } catch (error: any) {
        console.error("Error loading requests:", error);
        setError(error.message || "Error al cargar las solicitudes");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setError("");
      const data = await getPasswordRecoveryRequests();
      setRequests(data);
    } catch (error: any) {
      setError(error.message || "Error al cargar las solicitudes");
      console.error(error);
    }
  };

  const handleGeneratePassword = async (request: PasswordRecoveryRequest) => {
    try {
      setProcessingId(request.id);
      setError("");

      const result = await generateTempPassword(request.id);

      // Guardar la contraseña temporal en el estado local
      setGeneratedPasswords((prev) => {
        const newPasswords = {
          ...prev,
          [request.id]: result.tempPassword,
        };
        return newPasswords;
      });

      setTempPassword(result.tempPassword);
      setCurrentRequest(request);

      // Actualizar la solicitud en la lista cambiando su estado a 'processed'
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: "processed",
                processed_at: new Date().toISOString(),
              }
            : r
        )
      );

      toast.success("Contraseña temporal generada correctamente");
    } catch (error: any) {
      setError(error.message || "Error al generar la contraseña temporal");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleShowProcessedPassword = (request: PasswordRecoveryRequest) => {
    // Buscar la contraseña temporal en el estado local
    const storedPassword = generatedPasswords[request.id];

    if (storedPassword) {
      // Si tenemos la contraseña guardada, mostrarla
      setTempPassword(storedPassword);
      setCurrentRequest(request);
    } else {
      // Si no tenemos la contraseña, mostrar mensaje de no disponible
      setCurrentRequest(request);
      setTempPassword("NOT_AVAILABLE");
    }
  };

  const handleArchiveRequest = async (requestId: number) => {
    try {
      setArchivingId(requestId);
      setError("");

      await archiveRequest(requestId);

      // Remover la solicitud de la lista y limpiar la contraseña guardada
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setGeneratedPasswords((prev) => {
        const newPasswords = { ...prev };
        delete newPasswords[requestId];
        return newPasswords;
      });

      toast.success("Solicitud eliminada permanentemente");
      setShowArchiveConfirm(null);
    } catch (error: any) {
      setError(error.message || "Error al archivar la solicitud");
      console.error(error);
    } finally {
      setArchivingId(null);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword && tempPassword !== "NOT_AVAILABLE") {
      navigator.clipboard
        .writeText(tempPassword)
        .then(() => toast.success("Contraseña copiada al portapapeles"))
        .catch(() => toast.error("No se pudo copiar la contraseña"));
    }
  };

  const handleCloseModal = () => {
    setTempPassword(null);
    setCurrentRequest(null);
    setShowPassword(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Solicitudes de Recuperación de Contraseña
          </h1>
          <p className="text-sm text-neutral-medium mt-1">
            Gestiona las solicitudes de recuperación de contraseña de los
            usuarios
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-state-error bg-opacity-10 border border-state-error text-state-error px-4 py-3 rounded mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-neutral-light bg-opacity-50 rounded-lg p-8 text-center"
        >
          <FaCheck className="mx-auto text-4xl text-state-success mb-4" />
          <h2 className="text-xl font-semibold text-neutral-dark mb-2">
            No hay solicitudes pendientes
          </h2>
          <p className="text-neutral-medium">
            Todas las solicitudes de recuperación de contraseña han sido
            procesadas.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Vista de tabla para pantallas grandes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden lg:block bg-white rounded-lg shadow overflow-hidden w-full"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-light">
                <thead className="bg-neutral-light">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/4"
                    >
                      Usuario
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/6"
                    >
                      Código
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/5"
                    >
                      Sección
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/6"
                    >
                      <div className="flex items-center">
                        <FaClock className="mr-1" />
                        Fechas
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/6"
                    >
                      Expira
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider w-1/6"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-light">
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className={`hover:bg-neutral-lightest ${
                        request.status === "processed" ? "bg-green-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-neutral-dark">
                              {request.name}
                            </div>
                            <div className="text-sm text-neutral-medium">
                              {request.email}
                            </div>
                          </div>
                          {request.status === "processed" && (
                            <div className="ml-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FaCheck className="mr-1" />
                                Procesada
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark font-mono">
                          {request.employee_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          {request.section}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          <div className="flex items-center mb-1">
                            <span className="text-xs text-neutral-medium mr-1">
                              Solicitado:
                            </span>
                            {formatDate(request.requested_at)}
                          </div>
                          {request.status === "processed" &&
                            request.processed_at && (
                              <div className="flex items-center text-xs text-green-600">
                                <span className="text-xs text-green-500 mr-1">
                                  Procesada:
                                </span>
                                {formatDate(request.processed_at)}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">
                          {formatDate(request.expires_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {request.status === "pending" ? (
                            <button
                              onClick={() => handleGeneratePassword(request)}
                              disabled={processingId === request.id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:border-primary-dark focus:shadow-outline-primary active:bg-primary-dark transition ease-in-out duration-150"
                            >
                              {processingId === request.id ? (
                                <>
                                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <FaKey className="mr-2" />
                                  Generar Contraseña
                                </>
                              )}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleShowProcessedPassword(request)
                                }
                                className="inline-flex items-center px-3 py-1 border border-green-600 text-sm leading-5 font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:border-green-700 focus:shadow-outline-green transition ease-in-out duration-150"
                              >
                                <FaEye className="mr-2" />
                                Ver Contraseña
                              </button>
                              <button
                                onClick={() =>
                                  setShowArchiveConfirm(request.id)
                                }
                                disabled={archivingId === request.id}
                                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-5 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:border-red-400 focus:shadow-outline-red transition ease-in-out duration-150"
                              >
                                <FaArchive className="mr-2" />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Vista de tarjetas para pantallas pequeñas y medianas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:hidden space-y-4"
          >
            {requests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-lg shadow p-4 border ${
                  request.status === "processed"
                    ? "border-green-200 bg-green-50"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-neutral-dark">
                        {request.name}
                      </h3>
                      {request.status === "processed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheck className="mr-1" />
                          Procesada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-medium mb-1">
                      {request.email}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-neutral-dark">
                          Código:
                        </span>
                        <span className="ml-1 font-mono">
                          {request.employee_code}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-dark">
                          Sección:
                        </span>
                        <span className="ml-1">{request.section}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-neutral-dark">
                      Solicitado:
                    </span>
                    <p className="text-neutral-medium">
                      {formatDate(request.requested_at)}
                    </p>
                  </div>
                  {request.status === "processed" && request.processed_at && (
                    <div>
                      <span className="font-medium text-green-600">
                        Procesada:
                      </span>
                      <p className="text-green-600">
                        {formatDate(request.processed_at)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-neutral-dark">
                      Expira:
                    </span>
                    <p className="text-neutral-medium">
                      {formatDate(request.expires_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {request.status === "pending" ? (
                    <button
                      onClick={() => handleGeneratePassword(request)}
                      disabled={processingId === request.id}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition ease-in-out duration-150"
                    >
                      {processingId === request.id ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FaKey className="mr-2" />
                          Generar Contraseña
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleShowProcessedPassword(request)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ease-in-out duration-150"
                      >
                        <FaEye className="mr-2" />
                        Ver Contraseña
                      </button>
                      <button
                        onClick={() => setShowArchiveConfirm(request.id)}
                        disabled={archivingId === request.id}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition ease-in-out duration-150"
                      >
                        {archivingId === request.id ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <FaArchive className="mr-2" />
                            Eliminar
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </>
      )}

      {/* Modal de confirmación para archivar */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4 text-red-600">
                <div className="bg-red-100 rounded-full p-3">
                  <FaExclamationTriangle className="text-2xl" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">
                Confirmar Eliminación
              </h3>
              <p className="text-neutral-medium text-center mb-4">
                ¿Estás seguro de que quieres eliminar esta solicitud
                permanentemente?
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium">¡Atención!</p>
                    <p className="text-sm mt-1">
                      Esta acción no se puede deshacer. La solicitud se
                      eliminará permanentemente de la base de datos.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setShowArchiveConfirm(null)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleArchiveRequest(showArchiveConfirm)}
                  disabled={archivingId === showArchiveConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {archivingId === showArchiveConfirm ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar Permanentemente"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal para mostrar la contraseña temporal */}
      {tempPassword && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4 text-state-success">
                <div className="bg-state-success bg-opacity-10 rounded-full p-3">
                  <FaCheck className="text-2xl" />
                </div>
              </div>

              {tempPassword === "NOT_AVAILABLE" ? (
                <>
                  <h3 className="text-xl font-bold text-center mb-2">
                    Contraseña No Disponible
                  </h3>
                  <p className="text-neutral-medium text-center mb-4">
                    La contraseña temporal para{" "}
                    <span className="font-semibold">{currentRequest.name}</span>{" "}
                    ya fue generada anteriormente, pero no está disponible en
                    esta sesión.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="mt-0.5 mr-2" />
                      <div>
                        <p className="font-medium">Información:</p>
                        <p className="text-sm mt-1">
                          Esta solicitud fue procesada el{" "}
                          {currentRequest.processed_at
                            ? formatDate(currentRequest.processed_at)
                            : "fecha desconocida"}
                          . La contraseña temporal ya fue comunicada al usuario.
                          Si necesitas generar una nueva contraseña, contacta al
                          administrador del sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-center mb-2">
                    Contraseña Temporal
                  </h3>
                  <p className="text-neutral-medium text-center mb-4">
                    Contraseña temporal para{" "}
                    <span className="font-semibold">{currentRequest.name}</span>
                    {currentRequest.status === "processed" &&
                      currentRequest.processed_at && (
                        <span className="block text-sm text-green-600 mt-1">
                          Generada {formatDate(currentRequest.processed_at)}
                        </span>
                      )}
                  </p>

                  <div className="bg-neutral-lightest p-4 rounded-md mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-medium text-neutral-dark">
                        Contraseña Temporal:
                      </label>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-primary hover:text-primary-light"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={tempPassword}
                        readOnly
                        className="w-full py-2 px-3 border border-neutral-light rounded-md bg-white font-mono text-lg"
                      />
                      <button
                        onClick={handleCopyPassword}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-light"
                        aria-label="Copiar contraseña"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>

                  <div className="bg-primary bg-opacity-10 border border-primary text-primary px-4 py-3 rounded mb-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="mt-0.5 mr-2" />
                      <div>
                        <p className="font-medium">
                          Instrucciones importantes:
                        </p>
                        <ol className="list-decimal ml-5 mt-1 text-sm">
                          <li>
                            Comunique esta contraseña al usuario de forma
                            segura.
                          </li>
                          <li>
                            El usuario deberá cambiar esta contraseña en su
                            primer inicio de sesión.
                          </li>
                          <li>Esta contraseña es válida por 24 horas.</li>
                          <li>
                            Puede volver a ver esta contraseña hasta que elimine
                            la solicitud.
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default PasswordRecoveryRequests;
