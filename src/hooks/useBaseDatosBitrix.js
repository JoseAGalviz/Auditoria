/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "./useAuth";

// Helper para normalizar strings (quitar acentos, minúsculas)
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const useBaseDatosBitrix = () => {
  const { user } = useAuth();
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTROS ---
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [filterZona, setFilterZona] = useState("");
  const [onlyVencidos, setOnlyVencidos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // --- CATALOGOS ---
  const [vendedores, setVendedores] = useState([]);

  // --- PAGINACIÓN ---
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const vendRes = await apiService.getVendedoresApp();
      if (vendRes && vendRes.data) {
        setVendedores(
          vendRes.data.map((v) => ({
            label: v.nombre,
            value: v.co_ven,
          })),
        );
      }
      await fetchCompanies();
    } catch (err) {
      console.error("Error loading initial data:", err);
      setLoading(false);
    }
  };

  // --- FILTRADO LOCAL ---
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    if (filterZona) {
      const z = filterZona.toLowerCase();
      result = result.filter(
        (c) =>
          (c.ciudad && c.ciudad.toLowerCase().includes(z)) ||
          (c.segmento && c.segmento.toLowerCase().includes(z)),
      );
    }

    if (selectedSegments.length > 0) {
      result = result.filter(
        (c) => c.segmento && selectedSegments.includes(c.segmento),
      );
    }

    if (onlyVencidos) {
      result = result.filter((c) => c.saldo_vencido > 0);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.nombre && c.nombre.toLowerCase().includes(term)) ||
          (c.id && c.id.toString().includes(term)) ||
          (c.codigo_profit && c.codigo_profit.toLowerCase().includes(term)),
      );
    }

    if (dayFilter) {
      const normFilter = normalizeString(dayFilter);
      result = result.filter((c) => {
        if (!c.dias_visita) return false;
        const bitrixDaysRaw = c.dias_visita;
        const normValue = normalizeString(bitrixDaysRaw);
        const individualDays = normValue
          .split(/[,;.\s]+/)
          .map((d) => d.trim())
          .filter(Boolean);
        return individualDays.includes(normFilter);
      });
    }

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "fecha_compra") {
          const parseDate = (dateStr) => {
            if (!dateStr || dateStr === "-" || dateStr === "—") return 0;
            if (dateStr.includes("/")) {
              const [day, month, year] = dateStr.split("/");
              return new Date(`${year}-${month}-${day}`).getTime();
            }
            return new Date(dateStr).getTime();
          };
          aValue = parseDate(aValue);
          bValue = parseDate(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    allCompanies,
    filterZona,
    selectedSegments,
    onlyVencidos,
    searchTerm,
    dayFilter,
    sortConfig,
  ]);

  useEffect(() => {
    setTotalRecords(filteredCompanies.length);
    setPage(1);
  }, [
    filteredCompanies.length,
    filterZona,
    selectedSegments,
    onlyVencidos,
    searchTerm,
    dayFilter,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);

  const companies = useMemo(() => {
    if (filteredCompanies.length === 0) return [];
    const safePage = Math.min(page, Math.max(1, totalPages));
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredCompanies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompanies, page, totalPages]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    const userSegmentos = user?.segmentos || [];

    try {
      const [companiesResponse, planificacionResponse] = await Promise.all([
        apiService.getAllCompanies(userSegmentos),
        apiService.getPlanificacion(),
      ]);

      const rawList = companiesResponse.data || [];
      const planificacionList = planificacionResponse.data || [];

      // Mapear planificación usando String para el ID para asegurar coincidencia
      const planificacionMap = {};
      planificacionList.forEach((m) => {
        if (m.id_bitrix) {
          planificacionMap[String(m.id_bitrix)] = m;
        }
      });

      // --- DETERMINAR DÍA ACTUAL ---
      const todayIndex = new Date().getDay(); // 0: Dom, 1: Lun, ...
      const dayMap = {
        1: "lunes",
        2: "martes",
        3: "miercoles",
        4: "jueves",
        5: "viernes",
      };
      const currentDayKey = dayMap[todayIndex];

      const formattedData = rawList.map((item, index) => {
        const b = item.bitrix || {};
        const p = item.profit || {};
        const gList = Array.isArray(item.gestion) ? item.gestion : [];

        // Buscar datos guardados usando ID como String
        const companyId = b.ID ? String(b.ID) : null;
        const savedData = companyId ? planificacionMap[companyId] : null;

        // --- RECUPERACIÓN ROBUSTA DE DATOS ---
        const semanaData =
          savedData?.gestion?.semana || savedData?.semana || item.semana || {};

        const bitacora =
          savedData?.gestion?.bitacora ||
          savedData?.bitacora ||
          item.bitacora ||
          "";

        const obs_ejecutiva =
          savedData?.gestion?.obs_ejecutiva ||
          savedData?.obs_ejecutiva ||
          item.obs_ejecutiva ||
          "";

        const extractHistoryData = (dayName) => {
          const target = dayName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const log = gList.find((g) => {
            if (!g.dia_semana) return false;
            return (
              g.dia_semana
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") === target
            );
          });

          if (log) {
            let accionParts = [];
            if (log.venta_tipoGestion)
              accionParts.push(`V: ${log.venta_tipoGestion}`);
            if (log.cobranza_tipoGestion)
              accionParts.push(`C: ${log.cobranza_tipoGestion}`);
            let obsParts = [];
            if (log.venta_descripcion)
              obsParts.push(`V: ${log.venta_descripcion}`);
            if (log.cobranza_descripcion)
              obsParts.push(`C: ${log.cobranza_descripcion}`);

            return {
              accion: accionParts.join(" / ") || "",
              observacion: obsParts.join(" / ") || "",
            };
          }
          return { accion: "", observacion: "" };
        };

        // --- LÓGICA DE ESTADO "GESTIONADO/INHABILITADO" ---
        // Solo se inhabilita si hay una Tarea asignada en el día actual.
        let isManagedToday = false;

        if (currentDayKey) {
          const taskForToday = semanaData[currentDayKey]?.tarea;
          // Si hay texto en la tarea del día de hoy, se marca como gestionado
          if (taskForToday && taskForToday.trim().length > 0) {
            isManagedToday = true;
          }
        }

        return {
          id_interno: b.ID ? `bx-${b.ID}` : `idx-${index}-${Date.now()}`,
          id: b.ID || "0",
          nombre: b.TITLE || "Sin Nombre",
          codigo_profit: b.UF_CRM_1634787828 || "",
          ciudad: b.UF_CRM_1635903069 || "",
          segmento: b.UF_CRM_1638457710 || "",
          coordenadas: b.UF_CRM_1651251237102 || "",
          dias_visita: Array.isArray(b.UF_CRM_1686015739936)
            ? b.UF_CRM_1686015739936.join(", ")
            : b.UF_CRM_1686015739936 || "",
          co_ven: p.co_ven || "",

          limite_credito: p.login || 0,
          saldo_transito: parseFloat(p.saldo_trancito) || 0,
          saldo_vencido: parseFloat(p.saldo_vencido) || 0,
          fecha_compra: p.fecha_ultima_compra || "-",
          factura_morosidad: p.factura_mayor_morosidad || "-",
          ultimo_cobro: parseFloat(p.ultimo_cobro) || 0,
          sku_mes: parseInt(p.sku_mes) || 0,
          clasificacion: p.horar_caja || "-",
          ventas_actual: parseFloat(p.ventas_mes_actual) || 0,
          ventas_anterior: parseFloat(p.ventas_mes_pasado) || 0,
          convenio: "N/A",

          gestion: gList,
          bitacora: bitacora,
          obs_ejecutiva: obs_ejecutiva,

          // Mapeo de días
          lunes_accion:
            semanaData.lunes?.accion || extractHistoryData("lunes").accion,
          lunes_observacion:
            semanaData.lunes?.observacion ||
            extractHistoryData("lunes").observacion,
          lunes_tarea: semanaData.lunes?.tarea || "",

          martes_accion:
            semanaData.martes?.accion || extractHistoryData("martes").accion,
          martes_observacion:
            semanaData.martes?.observacion ||
            extractHistoryData("martes").observacion,
          martes_tarea: semanaData.martes?.tarea || "",

          miercoles_accion:
            semanaData.miercoles?.accion ||
            extractHistoryData("miercoles").accion,
          miercoles_observacion:
            semanaData.miercoles?.observacion ||
            extractHistoryData("miercoles").observacion,
          miercoles_tarea: semanaData.miercoles?.tarea || "",

          jueves_accion:
            semanaData.jueves?.accion || extractHistoryData("jueves").accion,
          jueves_observacion:
            semanaData.jueves?.observacion ||
            extractHistoryData("jueves").observacion,
          jueves_tarea: semanaData.jueves?.tarea || "",

          viernes_accion:
            semanaData.viernes?.accion || extractHistoryData("viernes").accion,
          viernes_observacion:
            semanaData.viernes?.observacion ||
            extractHistoryData("viernes").observacion,
          viernes_tarea: semanaData.viernes?.tarea || "",

          isManagedToday: isManagedToday,
        };
      });

      setAllCompanies(formattedData);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setPage(pageNumber);
    }
  };

  const handleCompanyChange = useCallback((id_interno, field, value) => {
    if (field === "bulk_update_managed" && Array.isArray(value)) {
      setAllCompanies((prev) =>
        prev.map((c) =>
          value.includes(c.id_interno) ? { ...c, isManagedToday: true } : c,
        ),
      );
      return;
    }

    setAllCompanies((prev) =>
      prev.map((c) =>
        c.id_interno === id_interno ? { ...c, [field]: value } : c,
      ),
    );
  }, []);

  const refresh = fetchCompanies;

  return {
    companies,
    allCompanies,
    loading,
    error,
    handleCompanyChange,
    page,
    totalPages,
    totalRecords: filteredCompanies.length,
    goToPage,
    selectedSegments,
    setSelectedSegments,
    selectedVendedor,
    setSelectedVendedor,
    vendedores,
    filterZona,
    setFilterZona,
    onlyVencidos,
    setOnlyVencidos,
    searchTerm,
    setSearchTerm,
    dayFilter,
    setDayFilter,
    sortConfig,
    setSortConfig,
    uniqueSegments: useMemo(() => {
      const segments = allCompanies
        .map((c) => c.segmento)
        .filter((s) => s && s.trim() !== "");
      return [...new Set(segments)].sort();
    }, [allCompanies]),
    refresh,
    user,
  };
};
