import React from "react";
import {
  User,
  Calendar,
  AlertTriangle,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";

// Orden y colores por categoría
const CATEGORIA_CONFIG = {
  auditoria: {
    label: "Auditoría",
    order: 1,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  planificaciones: {
    label: "Planificaciones",
    order: 2,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  rendimiento: {
    label: "Rendimiento",
    order: 3,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
};

const SeveridadIcon = ({ severidad }) => {
  if (severidad === "error") {
    return <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />;
  }
  return <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />;
};

export default function AlertaVendedorCard({ grupo, fecha, onRevisar }) {
  const totalAlertas = grupo.alertas.length;
  const tieneError = grupo.alertas.some((a) => a.severidad === "error");

  // Agrupar alertas por categoría y sortear por orden
  const porCategoria = Object.entries(
    grupo.alertas.reduce((acc, alerta) => {
      const cat = alerta.campo || "rendimiento";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(alerta);
      return acc;
    }, {}),
  ).sort(([catA], [catB]) => {
    const orderA = CATEGORIA_CONFIG[catA]?.order ?? 99;
    const orderB = CATEGORIA_CONFIG[catB]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden ${
        tieneError
          ? "border-rose-200 dark:border-rose-900"
          : "border-amber-200 dark:border-amber-900"
      }`}
    >
      {/* Barra superior */}
      <div
        className={`h-1.5 w-full ${
          tieneError
            ? "bg-linear-to-r from-rose-500 to-orange-400"
            : "bg-linear-to-r from-amber-400 to-yellow-300"
        }`}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: vendedor + contador */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                tieneError
                  ? "bg-rose-50 dark:bg-rose-900/20"
                  : "bg-amber-50 dark:bg-amber-900/20"
              }`}
            >
              <User
                size={16}
                className={tieneError ? "text-rose-500" : "text-amber-500"}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vendedor
              </p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                {grupo.vendedor}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                tieneError
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}
            >
              {totalAlertas} {totalAlertas === 1 ? "alerta" : "alertas"}
            </span>
          </div>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
          <Calendar size={12} />
          <span>
            {new Date(fecha).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Alertas agrupadas por categoría */}
        <div className="flex flex-col gap-4">
          {porCategoria.map(([cat, alertas]) => {
            const cfg = CATEGORIA_CONFIG[cat] || {
              label: cat,
              color: "bg-gray-100 text-gray-600",
              border: "border-gray-200",
            };
            return (
              <div key={cat}>
                {/* Badge de categoría */}
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                {/* Lista de alertas de esa categoría */}
                <div
                  className={`flex flex-col gap-2 pl-2 border-l-2 ${cfg.border}`}
                >
                  {alertas.map((alerta, idx) => (
                    <div key={idx} className="flex gap-2">
                      <SeveridadIcon severidad={alerta.severidad} />
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {alerta.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Botón revisar */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onRevisar?.(grupo)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            <ClipboardCheck size={15} />
            Revisar y gestionar
          </button>
        </div>
      </div>
    </div>
  );
}
