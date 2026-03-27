/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "./useAuth";

// --- HELPER DE FECHAS (Hora Local) ---
const isWithinCurrentWeek = (dateInput) => {
  if (!dateInput) return false;

  try {
    // Convertir a string de forma segura y limpiar espacios
    let dateStr = String(dateInput).trim();
    if (dateStr === "—" || dateStr === "-" || !dateStr) return false;

    // Si viene con hora (ej: "2024-05-12 14:30:00"), nos quedamos solo con la fecha
    if (dateStr.includes(" ")) {
      dateStr = dateStr.split(" ")[0];
    }

    let date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map((n) => parseInt(n, 10));
      // DD/MM/YYYY
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split("-").map((n) => parseInt(n, 10)); // Convertir a enteros para evitar NaN por espacios
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          // YYYY-MM-DD
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    } else {
      // Intento final constructor estándar
      date = new Date(dateStr);
    }

    if (!date || isNaN(date.getTime())) return false;

    // Normalizar a semana actual
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Lunes = 1
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  } catch (err) {
    // Si falla el parseo, asumimos false para no romper la app
    return false;
  }
};

// --- HELPER PARA GESTIÓN SEMANAL ---
// Función para obtener el número de semana del año (ISO 8601)
const getWeekNumber = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// Función para obtener el identificador de semana (año-semana)
const getCurrentWeekId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

// --- CREAR AUDITORIA DIARIA ---
const createDailyAudit = () => ({
  inicio_whatsapp: { e: false, c: false },
  accion_venta: { e: false, p: false, n: false },
  accion_cobranza: { e: false, p: false, n: false },
  llamadas_venta: { e: false, p: false, n: false },
  llamadas_cobranza: { e: false, p: false, n: false },
  cp: false,
  observacion: "",
});

// --- FUNCIÓN DE CÁLCULO DE DISTANCIA (Haversine Formula) ---
// Retorna distancia en METROS
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;

  try {
    const [lat1, lon1] = coord1.split(",").map((s) => parseFloat(s.trim()));
    const [lat2, lon2] = coord2.split(",").map((s) => parseFloat(s.trim()));

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;

    const R = 6371e3; // Radio de la tierra en metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon1 - lon2) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // en metros
    return Math.round(distance); // Retornamos entero
  } catch (e) {
    return null;
  }
};

export const useAuditoria = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const userSegments = user?.segmentos || [];

        const [rawData, matrixData, planificacionData] = await Promise.all([
          apiService.getAllCompanies(userSegments),
          apiService.getMatrix(),
          apiService.getPlanificacion(),
        ]);

        let companies = [];
        if (Array.isArray(rawData)) {
          companies = rawData;
        } else if (rawData && Array.isArray(rawData.data)) {
          companies = rawData.data;
        } else if (rawData && typeof rawData === "object") {
          companies = Object.values(rawData);
        }

        const matrixMap = new Map();
        let matrixArray = matrixData?.data || matrixData || [];

        // --- LÓGICA DE LIMPIEZA SEMANAL ---
        const savedWeekId = localStorage.getItem("matrixWeekId");
        const currentWeekId = getCurrentWeekId();

        // Si es una nueva semana, no cargamos los registros antiguos en el mapa visual
        // Pero se mantienen en el log histórico del backend.
        if (savedWeekId !== currentWeekId) {
          console.log(
            `[Matrix] Nueva semana detectada: ${currentWeekId}. Iniciando matriz limpia.`,
          );
          localStorage.setItem("matrixWeekId", currentWeekId);
          // Al no poblar matrixMap, los clientes aparecerán con auditoría por defecto (vacía)
        } else {
          if (Array.isArray(matrixArray)) {
            // El backend devuelve ORDER BY fecha_registro DESC.
            // Tomamos el primero (más reciente) para cada id_bitrix.
            matrixArray.forEach((item) => {
              if (item.id_bitrix) {
                const idStr = item.id_bitrix.toString();
                if (!matrixMap.has(idStr)) {
                  matrixMap.set(idStr, item);
                }
              }
            });
          }
        }

        const planificacionMap = new Map();
        const planArray = planificacionData?.data || planificacionData || [];
        if (Array.isArray(planArray)) {
          planArray.forEach((p) => {
            if (p.id_bitrix) {
              const idStr = p.id_bitrix.toString();
              if (!planificacionMap.has(idStr)) {
                planificacionMap.set(idStr, p);
              }
            }
          });
        }

        const processedData = companies
          .map((item) => {
            try {
              if (!item) return null;

              const b = item.bitrix || {};
              const p = item.profit || {};

              // Buscar datos registrados para este cliente en el Map
              // Usamos toString() seguro
              const bId = b.ID ? String(b.ID) : null;
              const registered = bId ? matrixMap.get(bId) : null;

              // Historial de gestiones (Profit/Bitrix)
              const g = Array.isArray(item.gestion) ? item.gestion : [];

              // VALIDACIÓN DE FECHA PARA AUDITORÍA (CHECKBOXES)
              // Logica:
              // 1. Siempre cargamos 'semana' (Planificación), 'bitacora', etc. del registro guardado.
              // 2. Solo cargamos 'auditoria' (Checkboxes) si el registro pertenece a la semana actual.

              let auditoriaData = null;
              if (registered) {
                const recordDate =
                  registered.updated_at ||
                  registered.created_at ||
                  registered.fecha_registro;

                if (isWithinCurrentWeek(recordDate)) {
                  auditoriaData = registered.auditoria_matriz;
                }
              }

              // Si no corresponde cargar auditoría (es de sem pasada) o no existe, iniciamos limpia.
              if (!auditoriaData) {
                auditoriaData = {
                  lunes: createDailyAudit(),
                  martes: createDailyAudit(),
                  miercoles: createDailyAudit(),
                  jueves: createDailyAudit(),
                  viernes: createDailyAudit(),
                  sabado: createDailyAudit(),
                };
              }

              // PERSISTENCIA DE DATOS (Planificación, Bitácora, Acción del Día)
              // Se cargan siempre del registro encontrado, sin importar la fecha.
              const planRecord = bId ? planificacionMap.get(bId) : null;
              const semanaFromPlan =
                planRecord?.gestion?.semana || planRecord?.semana || {};

              const semanaMerged = {
                ...(item.semana || {}),
                ...(registered?.semana || {}),
                ...semanaFromPlan, // La planificación de la ejecutiva manda sobre tareas
              };

              return {
                id: b.ID || Math.random(),
                id_bitrix: b.ID || "—",
                etapa: "",
                nombre: b.TITLE || "Sin Nombre",
                codigo: b.UF_CRM_1634787828 || "—",
                zona: b.UF_CRM_1635903069 || "—",
                segmento: b.UF_CRM_1638457710 || "—",
                coordenadas: b.UF_CRM_1651251237102 || null,
                diasVisita: Array.isArray(b.UF_CRM_1686015739936)
                  ? b.UF_CRM_1686015739936.join(", ")
                  : b.UF_CRM_1686015739936
                    ? "Sí"
                    : "No",
                limite_credito: parseFloat(p.login) || 0,
                saldo_transito: parseFloat(p.saldo_trancito) || 0,
                saldo_vencido: parseFloat(p.saldo_vencido) || 0,
                fecha_ultima_compra: p.fecha_ultima_compra || "—",
                factura_morosidad: p.factura_mayor_morosidad || "—",
                ultimo_cobro: p.ultimo_cobro || "—",
                sku_mes: parseFloat(p.sku_mes) || 0,
                horario_caja: p.horar_caja || "—",
                posee_convenio: "—",
                venta_mes_actual: parseFloat(p.ventas_mes_actual) || 0,
                venta_mes_pasado: parseFloat(p.ventas_mes_pasado) || 0,
                ventas_anterior_1: parseFloat(p.ventas_mes_pasado) || 0,
                ventas_anterior_2: 0,
                fecha_ultimo_cobro: p.ultimo_cobro || "—",
                clasificacion: p.horar_caja || "—",
                gestion: g,

                bitacora:
                  registered?.bitacora ||
                  planRecord?.gestion?.bitacora ||
                  planRecord?.bitacora ||
                  item.bitacora ||
                  "",
                obs_ejecutiva:
                  registered?.obs_ejecutiva ||
                  planRecord?.gestion?.obs_ejecutiva ||
                  planRecord?.obs_ejecutiva ||
                  item.obs_ejecutiva ||
                  "",
                semana: semanaMerged,

                // CHECKBOXES (Auditoría) -> Filtro de semana aplicado arriba
                auditoria: auditoriaData,

                calculateDistance: calculateDistance,
                isWithinCurrentWeek: isWithinCurrentWeek,
              };
            } catch (errItem) {
              console.warn("Error procesando fila en Matriz:", errItem);
              return null;
            }
          })
          .filter(Boolean);

        setData(processedData);
      } catch (err) {
        console.error("Error en useAuditoria:", err);
        setError(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user?.segmentos],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAuditoriaChange = useCallback(
    (id, day, category, fieldOrValue, value) => {
      setData((prevData) =>
        prevData.map((row) => {
          if (row.id !== id) return row;
          const newAuditoria = { ...row.auditoria };
          const dayData = { ...newAuditoria[day] };

          if (value === undefined) {
            dayData[category] = fieldOrValue;
          } else {
            dayData[category] = {
              ...dayData[category],
              [fieldOrValue]: value,
            };
          }

          newAuditoria[day] = dayData;
          return { ...row, auditoria: newAuditoria };
        }),
      );
    },
    [],
  );

  return { data, loading, error, handleAuditoriaChange, refresh };
};
