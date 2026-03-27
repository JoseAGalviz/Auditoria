/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  XCircle,
  Inbox,
  Archive,
  RefreshCw,
  Image as ImageIcon,
  FileAudio,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/apiService";

// Ajusta esta IP si tu servidor backend cambia de dirección
const SERVER_URL = "http://192.168.4.23:3000";

// --- HELPER DE RANGO DE FECHAS (SIMPLIFICADO) ---
const estaEnRango = (fechaString, inicio, fin) => {
  if (!fechaString) return false;
  // Cortamos solo los primeros 10 caracteres (YYYY-MM-DD)
  const soloFecha = fechaString.substring(0, 10);
  // Comparamos los textos directamente
  return soloFecha >= inicio && soloFecha <= fin;
};

export default function PanelAprobaciones() {
  const [activeTab, setActiveTab] = useState("pendientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESTADO DE RANGO DE FECHAS
  const [rango, setRango] = useState({
    inicio: new Date().toISOString().split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });

  const fetchObservaciones = async () => {
    setLoading(true);
    try {
      const response = await apiService.getObservaciones();
      if (response && response.data) {
        setObservaciones(response.data);
      }
    } catch (error) {
      toast.error("Error de conexión", {
        description:
          "No se pudieron cargar las aprobaciones de la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservaciones();
  }, []);

  const handleAprobacionFinal = async (alerta, isApproved) => {
    try {
      await apiService.aprobacionGerencial(alerta.id, isApproved);

      const nuevoEstado = isApproved ? "aprobada_cierre" : "rechazada";

      setObservaciones((prev) =>
        prev.map((obs) =>
          obs.id === alerta.id
            ? {
                ...obs,
                estado: nuevoEstado,
                fecha_gestion: new Date().toISOString(),
              }
            : obs,
        ),
      );

      if (isApproved) {
        toast.success("Revisión Aprobada", {
          description: "El caso ha sido cerrado correctamente.",
        });
      } else {
        toast.error("Revisión Rechazada", {
          description: "Movida al historial procesado.",
        });
      }
    } catch (error) {
      toast.error("Error al procesar", {
        description: "Hubo un problema comunicándose con el servidor.",
      });
    }
  };

  // 1. FILTRAMOS TODAS LAS OBSERVACIONES POR RANGO DE FECHA
  const filtradasPorRango = observaciones.filter((obs) => {
    // Usamos fecha_gestion si ya fue gestionada, sino su fecha de creación
    const fechaComparar = obs.fecha_gestion || obs.fecha || obs.created_at;
    return estaEnRango(fechaComparar, rango.inicio, rango.fin);
  });

  // 2. LUEGO LAS SEPARAMOS POR TABS
  const alertasPendientes = filtradasPorRango.filter(
    (o) => o.estado === "resuelta_auditor",
  );
  const historialAlertas = filtradasPorRango.filter(
    (o) => o.estado === "aprobada_cierre" || o.estado === "rechazada",
  );

  const dataToShow =
    activeTab === "pendientes" ? alertasPendientes : historialAlertas;

  // 3. FINALMENTE APLICAMOS EL FILTRO DE BÚSQUEDA
  const filteredData = dataToShow.filter(
    (a) =>
      !searchTerm.trim() ||
      (a.vendedor &&
        a.vendedor.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Helper para armar la URL completa de la imagen/audio
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Cargando bandeja de aprobación...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-[#0b1120]">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6 bg-white dark:bg-[#111827] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/40 p-3.5 rounded-2xl ring-1 ring-indigo-100 dark:ring-indigo-800">
              <ShieldCheck
                size={28}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                Aprobación Gerencial
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Supervisa y da cierre a las revisiones de auditoría.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* NUEVO: CALENDARIOS DE FILTRO */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 w-full xl:w-auto">
              <Calendar size={18} className="text-slate-400 shrink-0" />
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

            <div className="relative w-full xl:w-72">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:text-white text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* TABS (PESTAÑAS) */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("pendientes")}
            className={`pb-3 flex items-center gap-2 font-bold text-sm transition-colors relative ${
              activeTab === "pendientes"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Inbox size={18} />
            Bandeja de Entrada
            {alertasPendientes.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {alertasPendientes.length}
              </span>
            )}
            {activeTab === "pendientes" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("historial")}
            className={`pb-3 flex items-center gap-2 font-bold text-sm transition-colors relative ${
              activeTab === "historial"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Archive size={18} />
            Historial Procesado
            {activeTab === "historial" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
            )}
          </button>
        </div>

        {/* LISTADO DE TARJETAS */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {filteredData.map((alerta) => (
              <div
                key={alerta.id}
                className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md"
              >
                {/* Etiqueta de Estado */}
                {activeTab === "pendientes" ? (
                  <div className="absolute top-0 right-0 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                    <Clock size={12} /> Esperando Aprobación
                  </div>
                ) : (
                  <div
                    className={`absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l flex items-center gap-1 ${
                      alerta.estado === "aprobada_cierre"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50"
                        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800/50"
                    }`}
                  >
                    {alerta.estado === "aprobada_cierre" ? (
                      <CheckCircle size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {alerta.estado === "aprobada_cierre"
                      ? "Aprobada"
                      : "Rechazada"}
                  </div>
                )}

                <div className="flex justify-between items-start mt-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">
                      {alerta.vendedor || "Vendedor Desconocido"}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <FileText size={12} />
                      {activeTab === "pendientes"
                        ? `Auditado: ${new Date(alerta.fecha_gestion).toLocaleDateString()} a las ${new Date(alerta.fecha_gestion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : `Procesado: ${new Date(alerta.fecha_gestion).toLocaleDateString()} a las ${new Date(alerta.fecha_gestion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Justificación del Auditor
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    "
                    {alerta.descripcion ||
                      "Sin comentarios adicionales por parte del auditor."}
                    "
                  </p>
                </div>

                {/* --- SECCIÓN DE EVIDENCIAS --- */}
                {(alerta.imagen_url || alerta.audio_url) && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      Evidencias Adjuntas
                    </p>
                    <div className="flex flex-col gap-3">
                      {/* Evidencia: Imagen */}
                      {alerta.imagen_url && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-1.5 relative group cursor-pointer">
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10 pointer-events-none">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                              Ver Evidencia
                            </span>
                          </div>
                          <img
                            src={getFullUrl(alerta.imagen_url)}
                            alt="Evidencia adjunta"
                            onClick={() =>
                              window.open(
                                getFullUrl(alerta.imagen_url),
                                "_blank",
                              )
                            }
                            className="w-full h-auto max-h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Evidencia: Audio */}
                      {alerta.audio_url && (
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl border border-teal-100 dark:border-teal-800/50 flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
                            <FileAudio size={14} /> Reproducir Nota de Audio
                          </div>
                          <audio
                            controls
                            src={getFullUrl(alerta.audio_url)}
                            className="w-full h-10 outline-none"
                          >
                            Tu navegador no soporta el elemento de audio.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* --- FIN SECCIÓN EVIDENCIAS --- */}

                {alerta.alertas_detalle &&
                  alerta.alertas_detalle.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Alertas Originales ({alerta.alertas_detalle.length})
                      </p>
                      <ul className="space-y-2">
                        {alerta.alertas_detalle.map((infraction, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                          >
                            <span
                              className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${infraction.severidad === "error" ? "bg-rose-500" : "bg-amber-500"}`}
                            />
                            {infraction.descripcion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {activeTab === "pendientes" && (
                  <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleAprobacionFinal(alerta, false)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors"
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobacionFinal(alerta, true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
                    >
                      <CheckCircle size={18} /> Aprobar Cierre
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6 animate-in fade-in">
            <div className="flex justify-center mb-4">
              <div
                className={`${activeTab === "pendientes" ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800"} p-4 rounded-full`}
              >
                {activeTab === "pendientes" ? (
                  <ShieldCheck size={48} className="text-green-500" />
                ) : (
                  <Archive size={48} className="text-gray-400" />
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              {activeTab === "pendientes" ? "Todo al día" : "Historial vacío"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeTab === "pendientes"
                ? "No hay revisiones pendientes de aprobación para estas fechas. ¡Buen trabajo!"
                : "Aún no has procesado ninguna revisión en estas fechas. Las alertas que apruebes o rechaces aparecerán aquí."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
