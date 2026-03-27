/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

export const useGestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Intentamos obtener datos reales del Backend
      const data = await apiService.getUsers();

      // Ajuste por si el backend devuelve un array directo o un objeto { data: [...] }
      const usersList = Array.isArray(data) ? data : data.data || [];

      // Normalizamos los datos
      const normalizedUsers = usersList.map((u) => ({
        ...u,
        segmentos: Array.isArray(u.segmentos) ? u.segmentos : [], // Asegurar array
        status: u.status !== undefined ? Number(u.status) : 1, // Asegurar número
        role: u.role || "",
      }));

      setUsuarios(normalizedUsers);
    } catch (err) {
      console.warn(
        "⚠️ Falló la conexión con el Backend (Error 500/Network). Cargando datos simulados..."
      );
      setError("Modo Offline: Usando datos de prueba.");

      // 2. DATOS SIMULADOS (MOCK DATA)
      // Se activan automáticamente si el backend falla
      setUsuarios([
        {
          id: 1,
          usuario: "admin_test",
          segmentos: ["CARACAS"],
          contraseña: "123",
          status: 1,
          role: "administrador",
        },
        {
          id: 2,
          usuario: "vendedor_andes",
          segmentos: ["MERIDA"],
          contraseña: "abc",
          status: 1,
          role: "vendedor",
        },
        {
          id: 3,
          usuario: "ejecutiva_central",
          segmentos: ["TRUJILLO"],
          contraseña: "***",
          status: 0,
          role: "ejecutiva",
        },
        {
          id: 4,
          usuario: "auditor_global",
          segmentos: [],
          contraseña: "password",
          status: 1,
          role: "auditor",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado local al escribir en los inputs (Edición en línea)
  const handleUserChange = (id, field, value) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  // Guardar cambios (Intenta Backend, si falla, simula éxito visual)
  const saveUserChanges = async (id) => {
    const userToUpdate = usuarios.find((u) => u.id === id);
    if (!userToUpdate) return;

    // Reconstruimos el objeto permisos según el rol
    const permisosMap = {
      ejecutiva: {
        ver_dashboard: true,
        ver_rutas: true,
        editar_usuarios: false,
      },
      vendedor: {
        ver_dashboard: true,
        ver_segmentos_asignados: true,
        editar_usuarios: false,
      },
      auditor: {
        ver_dashboard: true,
        ver_rutas: true,
        gestion_matrix: true,
        crear_usuario: false,
      },
      administrador: {
        ver_dashboard: true,
        editar_usuarios: true,
        acceso_total: true,
      },
    };

    const payload = {
      ...userToUpdate,
      permisos: permisosMap[userToUpdate.role] || {},
    };

    try {
      await apiService.updateUser(id, payload);
      alert(
        `✅ Usuario "${userToUpdate.usuario}" actualizado en la base de datos.`
      );
    } catch (err) {
      console.error("Error al guardar en backend:", err);
      alert(
        `⚠️ Backend no disponible. Simulación: Cambios guardados localmente para "${userToUpdate.usuario}".`
      );
    }
  };

  // Eliminar usuario (Intenta Backend, si falla, elimina visualmente)
  const deleteUser = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?"))
      return;

    try {
      await apiService.deleteUser(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      alert("🗑️ Usuario eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar en backend:", err);
      // Si falla el backend, lo eliminamos de la tabla visualmente para probar la UI
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      alert(
        "⚠️ Backend no disponible. Simulación: Usuario eliminado de la vista."
      );
    }
  };

  return {
    usuarios,
    loading,
    error,
    handleUserChange,
    saveUserChanges,
    deleteUser,
    fetchUsers, // Exportamos por si queremos un botón de recargar manual
  };
};
