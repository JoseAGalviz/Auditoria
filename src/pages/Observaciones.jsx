/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  FileText,
  RefreshCw,
  Download,
  Search,
  Calendar,
} from "lucide-react";
import { useBaseDatosBitrix } from "../hooks/useBaseDatosBitrix";
import { useTableroVendedores } from "../hooks/useTableroVendedores";
import { toast } from "sonner";
import { apiService } from "../services/apiService";
import { generateAuditoriaExcel } from "../utils/AuditoriaExcelExporter";

// Importa tus componentes
import ObservacionCard from "../components/ObservcionCard";
import AlertaVendedorCard from "../components/AlertaVendedorCard";
import ModalRevisionAlerta from "../components/ModalRevisionAlerta";
import ModalCrearObservacion from "../components/ModalCrearObservacion";
import ModalVerObservacion from "../components/ModalVerObservacion";

const AUTO_SAVE_HOUR = 18; // Hora a la que se generan las automáticas (5:00 PM)
const LAST_SAVE_KEY = "auditoria_auto_obs_last_save"; // Este sí se queda en localStorage como "testigo"

const camposOptions = [
  {
    label: "Auditoría",
    value: "auditoria",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    label: "Geolocalización",
    value: "geolocalizacion",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    label: "Rendimiento",
    value: "rendimiento",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    label: "Planificaciones",
    value: "planificaciones",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    label: "Base de Datos Bitrix",
    value: "base_datos_bitrix",
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
];

// ── Helpers de tiempo ──
const timeStrToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  return hh * 60 + mm;
};

const minutesToAmPm = (totalMin) => {
  if (totalMin === null) return "--";
  const hh = Math.floor(totalMin / 60) % 12 || 12;
  const mm = String(totalMin % 60).padStart(2, "0");
  const ampm = Math.floor(totalMin / 60) >= 12 ? "PM" : "AM";
  return `${hh}:${mm} ${ampm}`;
};

// --- HELPER DE RANGO DE FECHAS ---
// --- HELPER DE RANGO DE FECHAS (VERSIÓN SIMPLIFICADA) ---
const estaEnRango = (fechaString, inicio, fin) => {
  if (!fechaString) return false;

  // Cortamos solo los primeros 10 caracteres (YYYY-MM-DD)
  const soloFecha = fechaString.substring(0, 10);

  // Comparamos los textos directamente
  return soloFecha >= inicio && soloFecha <= fin;
};

const LIMITE_SALIDA_MIN = 8 * 60 + 45; // 8:45 AM
const LIMITE_LLEGADA_MIN = 18 * 60; // 6:00 PM

const computeAutoObservaciones = (tab) => {
  if (!tab || tab.length === 0) return [];
  const grupos = {};

  console.log("computeAutoObservaciones - Datos de vendedores:", tab);

  tab.forEach((v) => {
    console.log(`Procesando vendedor: ${v.vendedor}, reportesEstablecidos: ${v.reportesEstablecidos}, reportesLogrados: ${v.reportesLogrados}, hora_1_ven: ${v.hora_1_ven}, hora_2_ven: ${v.hora_2_ven}, negociaciones: ${v.negociaciones}, gestionesEfectivas: ${v.gestionesEfectivas}`);

    const addAlerta = (alerta) => {
      if (!grupos[v.vendedor]) {
        grupos[v.vendedor] = { vendedor: v.vendedor, alertas: [] };
      }
      grupos[v.vendedor].alertas.push(alerta);
    };

    const salidaMin = timeStrToMinutes(v.hora_1_ven);
    if (salidaMin !== null && salidaMin > LIMITE_SALIDA_MIN) {
      console.log(`Alerta salida: ${v.vendedor} - salidaMin: ${salidaMin} > ${LIMITE_SALIDA_MIN}`);
      addAlerta({
        campo: "auditoria",
        descripcion: `Primera actividad registrada a las ${minutesToAmPm(salidaMin)}, superando el límite de 8:45 AM.`,
        severidad: "warning",
      });
    }

    const llegadaMin = timeStrToMinutes(v.hora_2_ven);
    if (llegadaMin !== null && llegadaMin < LIMITE_LLEGADA_MIN) {
      console.log(`Alerta llegada: ${v.vendedor} - llegadaMin: ${llegadaMin} < ${LIMITE_LLEGADA_MIN}`);
      addAlerta({
        campo: "auditoria",
        descripcion: `Último registro a las ${minutesToAmPm(llegadaMin)}, antes de las 5:00 PM de cierre.`,
        severidad: "warning",
      });
    }

    if (v.reportesLogrados === 0) {
      console.log(`Alerta reportes: ${v.vendedor} - reportesLogrados: 0`);
      addAlerta({
        campo: "rendimiento",
        descripcion: `No realizó ningún reporte establecido.`,
        severidad: "error",
      });
    } else if (
      v.reportesEstablecidos > 0 &&
      v.reportesLogrados < v.reportesEstablecidos
    ) {
      console.log(`Alerta reportes: ${v.vendedor} - reportesLogrados: ${v.reportesLogrados} < ${v.reportesEstablecidos}`);
      let razon = "";
      if (v.reportesLogrados === 0) {
        razon = " No realizó ningún reporte. Posible razón: Falta de actividad registrada, problemas técnicos o ausencia del vendedor.";
      } else {
        razon = ` Completó solo ${v.reportesLogrados} de ${v.reportesEstablecidos}. Posible razón: Tiempo insuficiente, interrupciones en la jornada o gestiones incompletas.`;
      }
      addAlerta({
        campo: "rendimiento",
        descripcion: `Reportes incompletos: Completó ${v.reportesLogrados} de ${v.reportesEstablecidos} reportes establecidos.${razon}`,
        severidad: "error",
      });
    }

    const percEfectividad =
      v.reportesLogrados > 0
        ? (v.gestionesEfectivas / v.reportesLogrados) * 100
        : 0;
    if (v.reportesLogrados > 0 && percEfectividad < 70) {
      console.log(`Alerta efectividad: ${v.vendedor} - percEfectividad: ${percEfectividad.toFixed(1)}% < 70%`);
      addAlerta({
        campo: "planificaciones",
        descripcion: `Porcentaje de efectividad bajo: ${percEfectividad.toFixed(1)}% (mínimo requerido: 70%).`,
        severidad: "error",
      });
    }

    if ((v.negociaciones ?? 0) < 1) {
      console.log(`Alerta negociaciones: ${v.vendedor} - negociaciones: ${v.negociaciones} < 1`);
      addAlerta({
        campo: "rendimiento",
        descripcion: `Sin negociaciones registradas el día de hoy.`,
        severidad: "warning",
      });
    }
  });

  console.log("Alertas generadas:", Object.values(grupos));
  return Object.values(grupos);
};

export default function Observaciones() {
  const { vendedores } = useBaseDatosBitrix();

  // ESTADO DE RANGO DE FECHAS
  const [rango, setRango] = useState({
    inicio: new Date().toISOString().split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });

  // Pasamos el rango al hook
  const { vendedores: vendedoresTab, loading: loadingVendedores } =
    useTableroVendedores(rango);

  const [observacionesBackend, setObservacionesBackend] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [selectedObservacion, setSelectedObservacion] = useState(null);
  const [grupoARevisar, setGrupoARevisar] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchObservaciones = async () => {
    setLoading(true);
    try {
      const response = await apiService.getObservaciones();
      if (response && response.data) {
        setObservacionesBackend(response.data);
      }
    } catch (error) {
      toast.error("Error de conexión", {
        description: "No se pudieron cargar las observaciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservaciones();
  }, []);

  // 2. Disparador Automático a las 6:00 PM
  useEffect(() => {
    if (loadingVendedores || !vendedoresTab || vendedoresTab.length === 0) {
      console.log("useEffect auto: loading o no data", { loadingVendedores, vendedoresTabLength: vendedoresTab?.length });
      return;
    }

    // SEGURO: Solo generar automáticas si el filtro actual es el día de "HOY"
    const isHoy =
      rango.inicio === new Date().toISOString().split("T")[0] &&
      rango.fin === new Date().toISOString().split("T")[0];
    console.log("useEffect auto: isHoy", isHoy, "rango:", rango);
    if (!isHoy) return;

    const currentHour = new Date().getHours();
    const todayString = new Date().toDateString();
    const lastSaveDate = localStorage.getItem(LAST_SAVE_KEY);

    console.log("useEffect auto: currentHour", currentHour, "AUTO_SAVE_HOUR", AUTO_SAVE_HOUR, "lastSaveDate", lastSaveDate, "todayString", todayString);

    // Si pasaron las 6 PM y no hemos guardado hoy...
    if (currentHour >= AUTO_SAVE_HOUR && lastSaveDate !== todayString) {
      const computedAlerts = computeAutoObservaciones(vendedoresTab);

      if (computedAlerts.length > 0) {
        console.log("Guardando alertas:", computedAlerts);
        apiService
          .guardarObservacionesAuto(computedAlerts)
          .then(() => {
            localStorage.setItem(LAST_SAVE_KEY, todayString);
            toast.info("Alertas Automáticas", {
              description:
                "Se han detectado y registrado las incidencias del día a las 5:00 PM.",
            });
            fetchObservaciones();
          })
          .catch((err) => console.error("Error guardando alertas:", err));
      } else {
        console.log("No hay alertas para guardar");
        localStorage.setItem(LAST_SAVE_KEY, todayString);
      }
    }
  }, [loadingVendedores, vendedoresTab, rango]); // Se reevalúa si cambian las fechas o los datos

  const handleExportExcel = () => {
    // Exportamos SOLO las que vemos en el rango seleccionado
    if (filtradasPorRango.length === 0) {
      toast.error("Sin datos", {
        description:
          "No hay observaciones en este rango de fechas para exportar.",
      });
      return;
    }
    toast.loading("Generando Excel...", { id: "excel" });
    try {
      generateAuditoriaExcel(filtradasPorRango, vendedores, camposOptions);
      toast.success("Excel descargado correctamente", { id: "excel" });
    } catch (error) {
      toast.error("Error al exportar", {
        id: "excel",
        description: "Hubo un problema al crear el archivo.",
      });
    }
  };

  const marcarResuelta = async (datosRevision) => {
    try {
      let urlImagenSubida = null;
      let urlAudioSubido = null;
      toast.loading("Guardando resolución...", { id: "guardando-obs" });

      if (datosRevision.imagenFile) {
        const imgRes = await apiService.uploadFile(datosRevision.imagenFile);
        urlImagenSubida = imgRes.url;
      }
      if (datosRevision.audioFile) {
        const audioRes = await apiService.uploadFile(datosRevision.audioFile);
        urlAudioSubido = audioRes.url;
      }

      await apiService.resolverAlertaAuditor(datosRevision.grupoId, {
        comentarioAuditor: datosRevision.comentarioAuditor,
        imagen_url: urlImagenSubida,
        audio_url: urlAudioSubido,
      });

      toast.success("Enviado al gerente", {
        id: "guardando-obs",
        description: "La justificación y los archivos se guardaron.",
      });
      setGrupoARevisar(null);
      fetchObservaciones();
    } catch (error) {
      toast.error("Error al guardar", {
        id: "guardando-obs",
        description: error.message || "No se pudo procesar la alerta.",
      });
    }
  };

  const handleGuardarObservacion = async (formData, resetForm) => {
    if (
      !formData.titulo ||
      !formData.campo ||
      !formData.vendedor ||
      !formData.descripcion
    ) {
      toast.error("Error de validación", {
        description: "Complete todos los campos obligatorios.",
      });
      return;
    }
    try {
      const payload = {
        vendedor: formData.vendedor,
        titulo: formData.titulo,
        campo: formData.campo,
        descripcion: formData.descripcion,
        imagen_url: formData.imagen
          ? URL.createObjectURL(formData.imagen)
          : null,
      };

      await apiService.crearObservacionManual(payload);
      toast.success("Observación creada", {
        description: "Registrada en el sistema exitosamente.",
      });
      resetForm();
      setIsModalCrearOpen(false);
      fetchObservaciones();
    } catch (error) {
      toast.error("Error al guardar", {
        description: "Hubo un problema comunicándose con el servidor.",
      });
    }
  };

  // 5. FILTRAMOS LAS OBSERVACIONES POR EL RANGO SELECCIONADO
  const filtradasPorRango = observacionesBackend.filter((obs) => {
    // Usamos fecha_gestion si ya fue tocada, sino su fecha de creación
    const fechaComparar = obs.fecha || obs.created_at;
    return estaEnRango(fechaComparar, rango.inicio, rango.fin);
  });

  const autoObservaciones = filtradasPorRango.filter(
    (o) => o.tipo === "automatica" && o.estado === "pendiente",
  );
  const observacionesManuales = filtradasPorRango.filter(
    (o) => o.tipo === "manual",
  );
  const hasNoData =
    autoObservaciones.length === 0 && observacionesManuales.length === 0;

  const getCampoBadgeColor = (campoValue) => {
    const campo = camposOptions.find((c) => c.value === campoValue);
    return campo
      ? campo.color
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  if (loading || loadingVendedores) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#1a9888] animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Cargando datos del sistema...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 bg-white dark:dark:bg-[#0b1120] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="bg-teal-50 dark:bg-teal-900/40 p-3.5 rounded-2xl ring-1 ring-teal-100 dark:ring-teal-800">
              <FileText
                size={28}
                className="text-[#1a9888] dark:text-teal-400"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                Observaciones
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Gestión y seguimiento de anotaciones por vendedor
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* NUEVOS CALENDARIOS DE FILTRO */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 w-full xl:w-auto">
              <div className="flex items-center gap-2 w-full">
                <input
                  type="date"
                  value={rango.inicio}
                  onChange={(e) =>
                    setRango({ ...rango, inicio: e.target.value })
                  }
                  className="bg-transparent text-sm font-medium dark:text-white outline-none w-full"
                />
                <span className="text-gray-400 text-xs font-bold uppercase">
                  A
                </span>
                <input
                  type="date"
                  value={rango.fin}
                  onChange={(e) => setRango({ ...rango, fin: e.target.value })}
                  className="bg-transparent text-sm font-medium dark:text-white outline-none w-full"
                />
              </div>
            </div>

            <div className="relative w-full xl:w-60">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#1a9888]/50 focus:border-[#1a9888] dark:text-white text-sm font-medium transition-all"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  setSearchTerm("");
                  fetchObservaciones();
                  toast.success("Datos sincronizados.");
                }}
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 hover:text-[#1a9888]"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleExportExcel}
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 hover:text-[#1a9888]"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setIsModalCrearOpen(true)}
                className="flex items-center gap-2 bg-[#1a9888] text-white px-5 py-2.5 rounded-xl"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nueva</span>
              </button>
            </div>
          </div>
        </div>

        {/* Renderizado de Alertas Automáticas (Pendientes) */}
        {autoObservaciones.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Alertas automáticas pendientes de revisión —{" "}
              {autoObservaciones.length} vendedores
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {autoObservaciones
                .filter(
                  (g) =>
                    !searchTerm.trim() ||
                    g.vendedor.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((grupo) => (
                  <AlertaVendedorCard
                    key={grupo.id}
                    grupo={{ ...grupo, alertas: grupo.alertas_detalle }}
                    fecha={grupo.fecha}
                    onRevisar={(g) => setGrupoARevisar(g)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Renderizado de Observaciones Manuales */}
        {observacionesManuales.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
              Observaciones manuales
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {observacionesManuales
                .filter(
                  (obs) =>
                    !searchTerm.trim() ||
                    `${obs.titulo} ${obs.descripcion}`
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                )
                .map((obs) => (
                  <ObservacionCard
                    key={obs.id}
                    observacion={obs}
                    vendedores={vendedores}
                    camposOptions={camposOptions}
                    getCampoBadgeColor={getCampoBadgeColor}
                    onViewClick={setSelectedObservacion}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {hasNoData && (
          <div className="text-center py-20 bg-white dark:bg-[#0b1120] rounded-2xl border border-gray-100 dark:border-gray-700 shadow mt-6">
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              No hay observaciones registradas en esta fecha
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Aquí se mostrarán las observaciones automáticas del día y las que
              crees manualmente.
            </p>
            <button
              onClick={() => setIsModalCrearOpen(true)}
              className="mt-4 bg-[#1a9888] text-white px-6 py-3 rounded-xl"
            >
              Crear primera observación
            </button>
          </div>
        )}
      </div>

      <ModalCrearObservacion
        isOpen={isModalCrearOpen}
        onClose={() => setIsModalCrearOpen(false)}
        onSave={handleGuardarObservacion}
        vendedores={vendedores}
        camposOptions={camposOptions}
      />
      <ModalVerObservacion
        isOpen={!!selectedObservacion}
        onClose={() => setSelectedObservacion(null)}
        observacion={selectedObservacion}
        vendedores={vendedores}
        camposOptions={camposOptions}
        getCampoBadgeColor={getCampoBadgeColor}
      />
      <ModalRevisionAlerta
        isOpen={!!grupoARevisar}
        grupo={grupoARevisar}
        onClose={() => setGrupoARevisar(null)}
        onResolver={marcarResuelta}
      />
    </div>
  );
}
