const BASE_URL = "http://192.168.4.23:3000/api";
const BASE_AUTH_URL = "http://192.168.4.23:3000/api/usuarios";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetchJson(url, options = {}) {
  const headers = { ...getAuthHeaders(), ...options.headers };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Error ${response.status}: ${errorData.message || response.statusText}`,
    );
  }

  if (
    response.status === 204 ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return null;
  }
  return response.json();
}

export const apiService = {
  // --- AUTENTICACIÓN ---
  login: async (credentials) => {
    const response = await fetch(`${BASE_AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok || data.message !== "Login exitoso") {
      throw new Error(data.message || "Credenciales incorrectas");
    }
    return data;
  },

  // --- USUARIOS ---

  registerUser: (userData) => {
    return fetchJson(`${BASE_URL}/usuarios/crear`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getUsers: () => {
    return fetchJson(`${BASE_URL}/usuarios`, {
      method: "GET",
    });
  },

  updateUser: (id, userData) => {
    return fetchJson(`${BASE_URL}/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  deleteUser: (id) => {
    return fetchJson(`${BASE_URL}/usuarios/${id}`, {
      method: "DELETE",
    });
  },

  getSegmentos: () => {
    return fetchJson(`${BASE_URL}/usuarios/segmentos`);
  },

  // --- BITRIX & CLIENTES ---

  getBitrixCompanies: (start = 0, segmentos = []) => {
    return fetchJson(`${BASE_URL}/clientes/companies`, {
      method: "POST",
      body: JSON.stringify({ start, segmentos }),
    });
  },

  getAllCompanies: (segmentos = []) => {
    return fetchJson(`${BASE_URL}/clientes/companies`, {
      method: "POST",
      body: JSON.stringify({ start: 0, segmentos }),
    });
  },

  // --- MATRIZ Y AUDITORÍA ---

  saveMatrix: (payload) => {
    return fetchJson(`${BASE_URL}/matrix/matrix`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getGeoAudit: (offset = 0) => {
    return fetchJson(`${BASE_URL}/profit-bitrix?start=${offset}`);
  },

  getMatrix: () => {
    return fetchJson(`${BASE_URL}/matrix`, {
      method: "GET",
    });
  },

  getPlanificacion: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/planificacion${queryString ? `?${queryString}` : ""}`;
    return fetchJson(url, {
      method: "GET",
    });
  },

  ratePlanificacion: (idPlanificacion, stars, userName) => {
    return fetchJson(`${BASE_URL}/planificacion/${idPlanificacion}/rating`, {
      method: "PATCH",
      body: JSON.stringify({ rating_star: stars, rating_user: userName }),
    });
  },

  savePlanificacion: (payload) => {
    return fetchJson(`${BASE_URL}/planificacion/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  uploadExcel: (data) => {
    return fetchJson(`${BASE_URL}/matrix/upload`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getVendedoresApp: () => {
    return fetchJson(`${BASE_URL}/usuarios/vendedores-app`, {
      method: "GET",
    });
  },

  // --- OBSERVACIONES ---

  getObservaciones: () => {
    return fetchJson(`${BASE_URL}/observaciones`, {
      method: "GET",
    });
  },

  crearObservacionManual: (payload) => {
    return fetchJson(`${BASE_URL}/observaciones/manual`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  guardarObservacionesAuto: (payload) => {
    return fetchJson(`${BASE_URL}/observaciones/automaticas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  resolverAlertaAuditor: (id, payload) => {
    return fetchJson(`${BASE_URL}/observaciones/${id}/resolver`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  aprobacionGerencial: (id, aprobado) => {
    return fetchJson(`${BASE_URL}/observaciones/${id}/aprobacion`, {
      method: "PUT",
      body: JSON.stringify({ aprobado }),
    });
  },

  // --- SUBIDA DE ARCHIVOS ---
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("authToken");
    // IMPORTANTE: Al subir archivos con FormData, NO debemos poner el "Content-Type" a mano,
    // el navegador lo pone automáticamente con un "boundary" especial.
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.message || "Error al subir el archivo");
    }
    return data; // Retorna { status: true, message: "...", url: "/uploads/..." }
  },
};
