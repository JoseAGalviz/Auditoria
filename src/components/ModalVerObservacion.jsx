import React from "react";
import {
  X,
  Tag,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  Activity,
} from "lucide-react";

export default function ModalVerObservacion({
  isOpen,
  onClose,
  observacion,
  vendedores,
  camposOptions,
  getCampoBadgeColor,
}) {
  if (!isOpen || !observacion) return null;

  // Función interna para colorear porcentajes dentro del modal
  const getPercentColor = (val) => {
    if (val == null) return "text-gray-500";
    if (val < 50) return "text-rose-600 dark:text-rose-400";
    if (val < 80) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const hasMetrics =
    observacion.percMeta != null ||
    observacion.percPlanif != null ||
    observacion.percVisitas != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white pr-4 line-clamp-1">
            {observacion.titulo}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO SCROLL */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* METADATA GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800/50">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <Tag size={12} /> Tipo / Campo
              </span>
              <span
                className={`inline-flex w-fit px-2.5 py-1 rounded-md text-xs font-bold ${getCampoBadgeColor(observacion.campo)}`}
              >
                {camposOptions.find((c) => c.value === observacion.campo)
                  ?.label || "Sin Campo"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <User size={12} /> Vendedor
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                {vendedores.find((v) => v.value === observacion.vendedor)
                  ?.label || observacion.vendedor}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <Calendar size={12} /> Fecha
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {new Date(observacion.fecha).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* MÉTRICAS (Solo si es auto-generada y tiene datos) */}
          {hasMetrics && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity size={16} className="text-[#1a9888]" /> Resumen de
                Rendimiento
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {observacion.percMeta != null && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                      Efectividad Meta
                    </span>
                    <span
                      className={`text-sm font-bold ${getPercentColor(observacion.percMeta)}`}
                    >
                      {Number(observacion.percMeta).toFixed(0)}%
                    </span>
                  </div>
                )}
                {observacion.percPlanif != null && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                      Planificación
                    </span>
                    <span
                      className={`text-sm font-bold ${getPercentColor(observacion.percPlanif)}`}
                    >
                      {Number(observacion.percPlanif).toFixed(0)}%
                    </span>
                  </div>
                )}
                {observacion.percVisitas != null && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                      Visitas
                    </span>
                    <span
                      className={`text-sm font-bold ${getPercentColor(observacion.percVisitas)}`}
                    >
                      {Number(observacion.percVisitas).toFixed(0)}%
                    </span>
                  </div>
                )}
                {observacion.percCartera != null && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                      Cartera Activa
                    </span>
                    <span
                      className={`text-sm font-bold ${getPercentColor(observacion.percCartera)}`}
                    >
                      {Number(observacion.percCartera).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DESCRIPCIÓN DETALLADA */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#1a9888]" /> Detalle de
              Observación
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {observacion.descripcion}
              </p>
            </div>
          </div>

          {/* IMAGEN / EVIDENCIA */}
          {observacion.imagenUrl && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ImageIcon size={16} className="text-[#1a9888]" /> Evidencia
                Adjunta
              </h4>
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2">
                <img
                  src={observacion.imagenUrl}
                  alt="Evidencia"
                  className="w-full h-auto max-h-80 object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all shadow-sm"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
}
