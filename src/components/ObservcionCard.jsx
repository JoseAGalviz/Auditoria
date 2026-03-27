import React from "react";
import { Eye, User, Calendar } from "lucide-react";

// Colores más vibrantes y modernos para los badges de porcentaje
const percentBadge = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  }

  const n = Number(value);
  if (n < 50) {
    return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
  }
  if (n < 80) {
    return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
  }
  return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
};

export default function ObservacionCard({
  observacion,
  vendedores,
  camposOptions,
  getCampoBadgeColor,
  onViewClick,
}) {
  // Condiciones: Solo mostramos si el porcentaje asociado a la métrica está por debajo de 80
  const mostrarAlertaMeta =
    observacion.percMeta != null && Number(observacion.percMeta) < 80;
  const mostrarAlertaPlanif =
    observacion.percPlanif != null && Number(observacion.percPlanif) < 80;
  // NUEVO: Agregamos la condición para las visitas
  const mostrarAlertaVisitas =
    observacion.percVisitas != null && Number(observacion.percVisitas) < 80;

  // Actualizamos para que cualquiera de las tres active la zona de "Atención Requerida"
  const requiereAtencion =
    mostrarAlertaMeta || mostrarAlertaPlanif || mostrarAlertaVisitas;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden relative">
      {/* Línea superior decorativa */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#1a9888] via-teal-400 to-[#23c5b3]" />

      <div className="p-5 flex-1 flex flex-col">
        {/* CABECERA: Título */}
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#1a9888] transition-colors line-clamp-1">
            {observacion.titulo}
          </h3>
        </div>

        {/* METADATOS: Vendedor, Fecha y Campo */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <User size={14} className="text-[#1a9888]" />
            <span className="truncate max-w-30">
              {vendedores.find((v) => v.value === observacion.vendedor)
                ?.label ||
                observacion.vendedor ||
                "Desconocido"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Calendar size={14} />
            {new Date(observacion.fecha).toLocaleDateString("es-ES")}
          </div>
          <span
            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider ${getCampoBadgeColor(
              observacion.campo,
            )}`}
          >
            {camposOptions.find((c) => c.value === observacion.campo)?.label ||
              "Sin Campo"}
          </span>
        </div>

        {/* DESCRIPCIÓN */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 line-clamp-2 flex-1">
          {observacion.descripcion}
        </p>

        {/* ALERTAS DE RENDIMIENTO */}
        {requiereAtencion && (
          <div className="mt-4 pt-2">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              Atención Requerida
            </p>

            <div className="flex flex-col gap-3">
              {/* Alerta de Cartera / Meta */}
              {mostrarAlertaMeta && (
                <div className="bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                  {/* Lado izquierdo: Valor de Cartera */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cartera Activa
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {observacion.carteraActiva ?? "-"}
                    </span>
                  </div>
                  {/* Lado derecho: Porcentaje Meta */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cumplimiento
                    </span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${percentBadge(
                        observacion.percMeta,
                      )}`}
                    >
                      {`${Number(observacion.percMeta).toFixed(0)}% Meta`}
                    </span>
                  </div>
                </div>
              )}

              {/* Alerta de Gestiones / Planificación */}
              {mostrarAlertaPlanif && (
                <div className="bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                  {/* Lado izquierdo: Valor de Gestiones */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Gest. Planificadas
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {observacion.gestionesPlanif ?? "-"}
                    </span>
                  </div>
                  {/* Lado derecho: Porcentaje Planif */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Efectividad
                    </span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${percentBadge(
                        observacion.percPlanif,
                      )}`}
                    >
                      {`${Number(observacion.percPlanif).toFixed(0)}% Planif.`}
                    </span>
                  </div>
                </div>
              )}

              {/* NUEVO: Alerta de Visitas */}
              {mostrarAlertaVisitas && (
                <div className="bg-gray-50 dark:bg-gray-900/50 py-2.5 px-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                  {/* Lado izquierdo: Valor de Visitas */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visitas (Log/Est)
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {observacion.visitas ?? "-"}
                    </span>
                  </div>
                  {/* Lado derecho: Porcentaje Visitas */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Efectividad
                    </span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${percentBadge(
                        observacion.percVisitas,
                      )}`}
                    >
                      {`${Number(observacion.percVisitas).toFixed(0)}% Visitas`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTÓN AL FINAL: Centrado y Estilizado */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
          <button
            onClick={() => onViewClick(observacion)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            <Eye size={18} />
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
