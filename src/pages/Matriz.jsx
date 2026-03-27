/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiService } from "../services/apiService";
import { useAuditoria } from "../hooks/useAuditoria";
import { useAuth } from "../hooks/useAuth";
import {
  Save,
  Edit3,
  Search,
  XCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle,
  Loader,
  Lock,
  Download,
} from "lucide-react";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../components/ui/Tabla";
import { FilterMultiSelect } from "../components/ui/FilterMultiSelect";
import { generateDailyAuditExcel } from "../utils/ExcelExporterMatriz";
import { useToast } from "../components/ui/Toast";

// --- COMPONENTES AUXILIARES (MODIFICADOS SOLO VISUALMENTE PARA EL HEADER) ---

// 1. StatBadge: Rediseñado para el estilo "Clean" (Tarjetas)
const StatBadge = React.memo(({ label, value, colorClass }) => (
  <div
    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${colorClass} min-w-22.5 shadow-sm`}
  >
    <span className="text-[10px] uppercase font-bold opacity-80 leading-none mb-1 text-center">
      {label}
    </span>
    <span className="text-xl font-black leading-none">{value}</span>
  </div>
));

// Los demás componentes auxiliares se mantienen IGUALES
const ClassificationBadge = React.memo(({ value }) => {
  const letter = (value || "").toString().toUpperCase().charAt(0);

  const colorMap = {
    A: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    B: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    C: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
    D: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    E: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
    Z: "bg-red-200 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  };

  const colorClass =
    colorMap[letter] ||
    "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800";

  return (
    <div className="flex justify-center">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${colorClass} transition-colors`}
      >
        {letter || "-"}
      </span>
    </div>
  );
});

const formatCurrency = (val) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(
    val,
  );

// --- HELPER PARA FECHAS ---
const isWithinCurrentWeek = (dateInput) => {
  if (!dateInput) return false;

  try {
    let dateStr = String(dateInput).trim();
    if (dateStr === "—" || dateStr === "-" || !dateStr) return false;

    // Limpiar hora si existe
    if (dateStr.includes(" ")) {
      dateStr = dateStr.split(" ")[0];
    }

    let date;
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map((n) => parseInt(n, 10));
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split("-").map((n) => parseInt(n, 10));
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
      date = new Date(dateStr);
    }

    if (!date || isNaN(date.getTime())) return false;

    // Normalizamos a la fecha de hoy local
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // Lunes = 1, Domingo = 7

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  } catch (e) {
    return false;
  }
};

// --- HELPER PARA FECHAS (Ventana 30 días) ---
const isWithinLast30Days = (dateInput) => {
  if (!dateInput) return false;

  try {
    let dateStr = String(dateInput).trim();
    if (dateStr === "—" || dateStr === "-" || !dateStr) return false;

    if (dateStr.includes(" ")) {
      dateStr = dateStr.split(" ")[0];
    }

    let date;
    // Parseo robusto (igual que tu función anterior)
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/").map((n) => parseInt(n, 10));
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split("-").map((n) => parseInt(n, 10));
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    } else {
      date = new Date(dateStr);
    }

    if (!date || isNaN(date.getTime())) return false;

    const now = new Date();
    // Reseteamos horas para comparar solo fechas
    now.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // La fecha debe ser mayor o igual a hace 30 días y menor o igual a hoy
    return date >= thirtyDaysAgo && date <= now;
  } catch (e) {
    return false;
  }
};

const TableCheckbox = React.memo(
  ({ checked, onChange, colorClass, onKeyDown, disabled }) => (
    <div className="flex justify-center">
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        onKeyDown={onKeyDown}
        className={`w-4 h-4 rounded border-gray-300 focus:ring-2 cursor-pointer disabled:cursor-not-allowed ${colorClass}`}
      />
    </div>
  ),
);

const HeaderCountInput = React.memo(({ value }) => (
  <div>
    <input
      type="text"
      readOnly
      value={value}
      className="w-full text-center text-[12px] font-bold text-gray-700"
    />
  </div>
));

const EditableCell = React.memo(
  ({ value, onChange, placeholder = "...", onEnter, disabled }) => {
    const [localValue, setLocalValue] = useState(value || "");

    useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    const onBlur = () => {
      if (!disabled && localValue !== value) {
        onChange(localValue);
      }
    };

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={localValue}
          readOnly={disabled} // <--- Bloqueo
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) {
              onBlur();
              if (onEnter) onEnter(localValue);
            }
          }}
          placeholder={disabled ? "" : placeholder}
          className={`w-full min-w-30 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm outline-none ${
            disabled
              ? "text-gray-500 cursor-not-allowed bg-gray-50/50 dark:bg-slate-900/50"
              : "focus:ring-2 focus:ring-[#1a9888] dark:text-gray-200"
          }`}
        />
        {!disabled && (
          <Edit3
            size={12}
            className="absolute right-2 top-2.5 text-gray-400 pointer-events-none opacity-50"
          />
        )}
      </div>
    );
  },
);

// --- COMPONENTE FILA ---
const AuditRow = React.memo(
  ({
    row,
    selectedDay,
    handleExclusiveChange,
    handleAuditChange,
    getDynamicBackground,
    handleSaveRow,
    isEditable,
  }) => {
    const auditData = row.auditoria?.[selectedDay];
    const [isSaving, setIsSaving] = useState(false);

    // Colores dinámicos
    const bgAccionVenta = getDynamicBackground(
      auditData?.accion_venta,
      "bg-blue-50/20 dark:bg-blue-900/5",
    );
    const bgAccionCobranza = getDynamicBackground(
      auditData?.accion_cobranza,
      "bg-blue-50/20 dark:bg-blue-900/5",
    );
    const bgLlamadaVenta = getDynamicBackground(
      auditData?.llamadas_venta,
      "bg-orange-50/20 dark:bg-orange-900/5",
    );
    const bgLlamadaCobranza = getDynamicBackground(
      auditData?.llamadas_cobranza,
      "bg-orange-50/20 dark:bg-orange-900/5",
    );

    const handleEnter = (e) => {
      if (e.key === "Enter" && isEditable) {
        e.preventDefault();
        handleSaveRow(row);
      }
    };

    // --- 1. DATOS EXTERNOS ---
    const logDelDia = useMemo(() => {
      if (Array.isArray(row.gestion)) {
        return row.gestion.find((g) => {
          if (!g.dia_semana) return false;
          const diaApi = g.dia_semana
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const diaSelect = selectedDay
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          // Validar que sea el día correcto Y de la semana actual
          return diaApi === diaSelect && isWithinCurrentWeek(g.fecha_registro);
        });
      }
      return null;
    }, [row.gestion, selectedDay]);

    const assignedTask = useMemo(() => {
      const s = row.semana || {};
      const dayKey = selectedDay
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return s[dayKey]?.tarea || "";
    }, [row.semana, selectedDay]);

    // --- CÁLCULO DE DISTANCIA (CORREGIDO) ---
    const { distanciaTxt, esLejos } = useMemo(() => {
      const planificada = row.coordenadas;
      const real = logDelDia?.ubicacion;

      if (planificada && real && row.calculateDistance) {
        const mts = row.calculateDistance(planificada, real);

        if (mts !== null) {
          // 1. Definir si está lejos (Umbral de ejemplo: 200 metros)
          // Si mts > 200, se marca en ROJO. Ajusta el 200 a tu gusto.
          const isFar = mts > 200;

          // 2. Formatear el texto
          const txt = mts > 1000 ? `${(mts / 1000).toFixed(2)} km` : `${mts} m`;

          return { distanciaTxt: txt, esLejos: isFar };
        }
      }
      // Valor por defecto
      return { distanciaTxt: "-", esLejos: false };
    }, [row.coordenadas, logDelDia, row.calculateDistance]);

    // --- 2. CÁLCULOS LÓGICOS DE LA FILA ---

    // A. PLANIFICACIÓN (Puestas): ¿Tiene Tarea en la semana?
    const hasPlanning = useMemo(() => {
      const s = row.semana || {};
      const dayKey = selectedDay
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const dailyTask = s[dayKey]?.tarea;
      return dailyTask && dailyTask.toString().trim().length > 0;
    }, [row.semana, selectedDay]);

    // B. LÓGICA 'De N-P a E'
    const deNpAE = useMemo(() => {
      if (!auditData) return false;

      // 1. ¿Tiene marcadas Proceso o Negativa?
      const isNP =
        auditData.accion_venta?.p ||
        auditData.accion_venta?.n ||
        auditData.accion_cobranza?.p ||
        auditData.accion_cobranza?.n ||
        auditData.llamadas_venta?.p ||
        auditData.llamadas_venta?.n ||
        auditData.llamadas_cobranza?.p ||
        auditData.llamadas_cobranza?.n;

      if (!isNP) return false;

      // 2. ¿Fecha Últ. Compra y Fecha Últ. Cobro en la semana actual?
      const compraEnSemana = isWithinCurrentWeek(row.fecha_ultima_compra);
      const cobroEnSemana = isWithinCurrentWeek(
        row.fecha_ultimo_cobro || row.ultimo_cobro,
      );

      return compraEnSemana && cobroEnSemana;
    }, [
      auditData,
      row.fecha_ultima_compra,
      row.fecha_ultimo_cobro,
      row.ultimo_cobro,
    ]);

    // C. LÓGICA 'CON GESTION'
    const conGestion = useMemo(() => {
      // Solo mostrar gestión si estamos viendo el día actual (reutilizamos lógica de día)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const dayMap = {
        0: "lunes",
        1: "lunes",
        2: "martes",
        3: "miercoles",
        4: "jueves",
        5: "viernes",
        6: "sábado",
      };
      const currentDayName = dayMap[dayOfWeek];
      if (selectedDay !== currentDayName) return false;

      // 1. Filtro: Año >= 2024 y Posee Código Profit
      let purchaseYear = 0;
      if (row.fecha_ultima_compra) {
        if (row.fecha_ultima_compra.includes("/")) {
          purchaseYear = parseInt(row.fecha_ultima_compra.split("/")[2]);
        } else if (row.fecha_ultima_compra.includes("-")) {
          const parts = row.fecha_ultima_compra.split("-");
          purchaseYear =
            parts[0] > 1000 ? parseInt(parts[0]) : parseInt(parts[2]);
        }
      }

      const hasProfitCode = row.codigo && row.codigo !== "—";
      if (purchaseYear < 2024 || !hasProfitCode) return false;

      // 2. Verificar gestiones VÁLIDAS (Sólamente Venta por llamada o Cobranza por WhatsApp)
      const hasCobranzaWhatsApp =
        auditData?.inicio_whatsapp?.e || auditData?.inicio_whatsapp?.c;

      const hasVentaPorLlamada =
        auditData?.llamadas_venta?.e ||
        auditData?.llamadas_venta?.p ||
        auditData?.llamadas_venta?.n;

      return !!(hasCobranzaWhatsApp || hasVentaPorLlamada);
    }, [row, auditData, selectedDay]);

    // D. LÓGICA 'RECUPERACIÓN / EFECTIVIDAD 30 DÍAS'
    const efectividad30d = useMemo(() => {
      if (!auditData) return false;

      // 1. REPLICAMOS LA CONDICIÓN DE "RECUPERACIÓN" (Igual que en el contador)
      // Para que cuente como "Recuperado", debe haber tenido una gestión N o P.
      const isNP =
        auditData.accion_venta?.p ||
        auditData.accion_venta?.n ||
        auditData.accion_cobranza?.p ||
        auditData.accion_cobranza?.n ||
        auditData.llamadas_venta?.p ||
        auditData.llamadas_venta?.n ||
        auditData.llamadas_cobranza?.p ||
        auditData.llamadas_cobranza?.n;

      if (!isNP) return false; // Si fue un cliente "fácil" (Directo a Efectivo), no mostramos la etiqueta de recuperación.

      // 2. Verificamos fechas (Ventana 30 días)
      const compraReciente = isWithinLast30Days(row.fecha_ultima_compra);
      const cobroReciente = isWithinLast30Days(
        row.ultimo_cobro || row.fecha_ultimo_cobro,
      );

      return compraReciente && cobroReciente;
    }, [
      auditData,
      row.fecha_ultima_compra,
      row.ultimo_cobro,
      row.fecha_ultimo_cobro,
    ]);

    return (
      <Tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
        {/* BITRIX */}
        <Td
          stickyLeft={false}
          className="font-bold border-r text-xs max-w-45 truncate bg-white dark:bg-slate-900 z-10"
          title={row.nombre}
        >
          {row.nombre}
        </Td>
        <Td className="text-xs text-gray-500">{row.id_bitrix}</Td>
        <Td className="text-xs font-mono">{row.codigo}</Td>
        <Td className="text-xs truncate max-w-30" title={row.zona}>
          {row.zona}
        </Td>
        <Td className="text-xs truncate max-w-30" title={row.diasVisita}>
          {row.diasVisita}
        </Td>
        {/* PROFIT */}
        <Td className="text-right text-xs text-blue-700">
          {formatCurrency(row.limite_credito)}
        </Td>
        <Td className="text-right text-xs">
          {formatCurrency(row.saldo_transito)}
        </Td>
        <Td
          className={`text-right text-xs ${row.saldo_vencido > 0 ? "text-red-500 font-bold" : ""}`}
        >
          {formatCurrency(row.saldo_vencido)}
        </Td>
        <Td className="text-center text-xs whitespace-nowrap">
          {row.fecha_ultima_compra}
        </Td>
        <Td className="text-xs text-center">{row.factura_morosidad}</Td>
        <Td className="text-right text-xs whitespace-nowrap">
          {row.ultimo_cobro}
        </Td>
        <Td className="text-center text-xs">
          <ClassificationBadge value={row.horario_caja} />
        </Td>
        <Td className="text-center text-xs">{row.posee_convenio}</Td>
        <Td className="text-right text-xs font-semibold bg-blue-50/50 dark:bg-blue-900/10">
          {formatCurrency(row.venta_mes_actual)}
        </Td>
        <Td className="text-right text-xs text-gray-500 border-r border-gray-200 dark:border-slate-800">
          {formatCurrency(row.venta_mes_pasado)}
        </Td>

        {/* --- CHECKBOXES --- */}
        <Td className="bg-green-50/20 dark:bg-emerald-900/10 border-l border-green-100 dark:border-emerald-900/30 p-0 text-center">
          <TableCheckbox
            checked={auditData?.inicio_whatsapp?.e}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "inicio_whatsapp", "e", val, [
                "e",
                "c",
              ])
            }
            onKeyDown={handleEnter}
            colorClass="text-green-600 focus:ring-green-500"
          />
        </Td>
        <Td className="bg-green-50/20 dark:bg-emerald-900/10 border-r border-green-100 dark:border-emerald-900/30 p-0 text-center">
          <TableCheckbox
            checked={auditData?.inicio_whatsapp?.c}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "inicio_whatsapp", "c", val, [
                "e",
                "c",
              ])
            }
            onKeyDown={handleEnter}
            colorClass="text-green-600 focus:ring-green-500"
          />
        </Td>
        <Td
          className={`${bgAccionVenta} border-l border-blue-100 dark:border-blue-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.accion_venta?.e}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_venta", "e", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-blue-600 focus:ring-blue-500"
          />
        </Td>
        <Td className={`${bgAccionVenta} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.accion_venta?.p}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_venta", "p", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-blue-600 focus:ring-blue-500"
          />
        </Td>
        <Td
          className={`${bgAccionVenta} border-r border-blue-100 dark:border-blue-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.accion_venta?.n}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_venta", "n", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-red-600 focus:ring-red-500"
          />
        </Td>
        <Td className={`${bgAccionCobranza} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.accion_cobranza?.e}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_cobranza", "e", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-blue-600 focus:ring-blue-500"
          />
        </Td>
        <Td className={`${bgAccionCobranza} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.accion_cobranza?.p}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_cobranza", "p", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-blue-600 focus:ring-blue-500"
          />
        </Td>
        <Td
          className={`${bgAccionCobranza} border-r border-blue-100 dark:border-blue-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.accion_cobranza?.n}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "accion_cobranza", "n", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-red-600 focus:ring-red-500"
          />
        </Td>
        <Td className="bg-slate-300 dark:bg-slate-800 border-r border-gray-300 dark:border-slate-700 p-0 text-center">
          <TableCheckbox
            checked={auditData?.cp || false}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) => handleAuditChange(row.id, "cp", val)}
            onKeyDown={handleEnter}
            colorClass="text-purple-600 focus:ring-purple-500"
          />
        </Td>
        <Td
          className={`${bgLlamadaVenta} border-l border-orange-100 dark:border-orange-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.llamadas_venta?.e}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_venta", "e", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-orange-600 focus:ring-orange-500"
          />
        </Td>
        <Td className={`${bgLlamadaVenta} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.llamadas_venta?.p}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_venta", "p", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-orange-600 focus:ring-orange-500"
          />
        </Td>
        <Td
          className={`${bgLlamadaVenta} border-r border-orange-100 dark:border-orange-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.llamadas_venta?.n}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_venta", "n", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-red-600 focus:ring-red-500"
          />
        </Td>
        <Td className={`${bgLlamadaCobranza} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.llamadas_cobranza?.e}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_cobranza", "e", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-orange-600 focus:ring-orange-500"
          />
        </Td>
        <Td className={`${bgLlamadaCobranza} p-0 text-center`}>
          <TableCheckbox
            checked={auditData?.llamadas_cobranza?.p}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_cobranza", "p", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-orange-600 focus:ring-orange-500"
          />
        </Td>
        <Td
          className={`${bgLlamadaCobranza} border-r border-orange-100 dark:border-orange-900/30 p-0 text-center`}
        >
          <TableCheckbox
            checked={auditData?.llamadas_cobranza?.n}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) =>
              handleExclusiveChange(row.id, "llamadas_cobranza", "n", val)
            }
            onKeyDown={handleEnter}
            colorClass="text-red-600 focus:ring-red-500"
          />
        </Td>

        {/* --- ICONO PLANIFICACIÓN (Visual) --- */}
        <Td className="text-center text-xs whitespace-nowrap border-l border-gray-200 dark:border-slate-800">
          {hasPlanning && (
            <div className="flex justify-center items-center h-full w-full">
              <CheckCircle
                size={18}
                className="text-green-500 drop-shadow-sm"
              />
            </div>
          )}
        </Td>

        {/* --- ACCIÓN (TAREA) --- */}
        <Td className="text-xs text-center p-2 border-r border-gray-200 dark:border-slate-800">
          <span className="text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight block max-w-37.5 mx-auto">
            {assignedTask || "-"}
          </span>
        </Td>

        {/* --- DIFERENCIA COORDENADAS --- */}
        <Td
          className={`text-center text-xs whitespace-nowrap font-medium ${
            distanciaTxt !== "-" && esLejos
              ? "text-red-500 font-bold"
              : "text-green-600"
          }`}
        >
          {distanciaTxt}
        </Td>
        <Td className="text-center text-xs">
          {!logDelDia?.venta_descripcion && !logDelDia?.cobranza_descripcion ? (
            "-"
          ) : (
            <div className="flex flex-col gap-1">
              {logDelDia?.venta_descripcion && (
                <span
                  className="text-green-600 block truncate max-w-45"
                  title={logDelDia.venta_descripcion}
                >
                  V: {logDelDia.venta_descripcion}
                </span>
              )}
              {logDelDia?.cobranza_descripcion && (
                <span
                  className="text-blue-600 block truncate max-w-45"
                  title={logDelDia.cobranza_descripcion}
                >
                  C: {logDelDia.cobranza_descripcion}
                </span>
              )}
            </div>
          )}
        </Td>

        <Td className="text-center text-xs whitespace-nowrap">
          {logDelDia?.fecha_registro}
        </Td>
        <Td className="text-xs text-center">{logDelDia?.venta_tipoGestion}</Td>
        <Td className="text-right text-xs whitespace-nowrap">
          {logDelDia?.cobranza_tipoGestion}
        </Td>
        <Td className="text-center text-xs">
          {!logDelDia?.venta_descripcion && !logDelDia?.cobranza_descripcion ? (
            "-"
          ) : (
            <div className="flex flex-col gap-1">
              {logDelDia?.venta_descripcion && (
                <span
                  className="text-green-600 block truncate max-w-45"
                  title={logDelDia.venta_descripcion}
                >
                  V: {logDelDia.venta_descripcion}
                </span>
              )}
              {logDelDia?.cobranza_descripcion && (
                <span
                  className="text-blue-600 block truncate max-w-45"
                  title={logDelDia.cobranza_descripcion}
                >
                  C: {logDelDia.cobranza_descripcion}
                </span>
              )}
            </div>
          )}
        </Td>
        <Td className="min-w-87.5">
          <EditableCell
            value={auditData?.observacion || ""}
            disabled={!isEditable} // <--- CAMBIO
            onChange={(val) => handleAuditChange(row.id, "observacion", val)}
            placeholder="Escribe la observación del día..."
            onEnter={(newValue) => {
              const updatedRow = { ...row };
              const updatedAuditoria = { ...updatedRow.auditoria };
              const updatedDayData = { ...updatedAuditoria[selectedDay] };

              updatedDayData.observacion = newValue;
              updatedAuditoria[selectedDay] = updatedDayData;
              updatedRow.auditoria = updatedAuditoria;

              handleSaveRow(updatedRow);
            }}
          />
        </Td>
        {/* BOTÓN GUARDAR */}
        <Td className="text-center p-2 border-l border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
          <button
            onClick={async () => {
              setIsSaving(true);
              await handleSaveRow(row);
              setIsSaving(false);
            }}
            disabled={!isEditable || isSaving}
            className="p-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 flex mx-auto"
          >
            {isSaving ? (
              <Loader size={16} className="animate-spin" />
            ) : !isEditable ? (
              <Lock size={16} /> // <--- CAMBIO: Icono candado si está bloqueado
            ) : (
              <Save size={16} />
            )}
          </button>
        </Td>
        {/* DE N-P A E */}
        <Td className="text-center p-2 border-l border-gray-200 dark:border-slate-800">
          <span
            className={`font-bold text-xs px-2 py-1 rounded ${deNpAE ? "bg-green-100 text-green-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-rose-900/40 dark:text-rose-400"}`}
          >
            {deNpAE ? "SÍ" : "NO"}
          </span>
        </Td>
        {/* CON GESTION */}
        <Td className="text-center p-2 border-l border-gray-200 dark:border-slate-800">
          <span
            className={`font-bold text-xs px-2 py-1 rounded ${conGestion ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400" : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"}`}
          >
            {conGestion ? "SÍ" : "NO"}
          </span>
        </Td>

        {/* --- NUEVA COLUMNA: EFECTIVIDAD 30 DIAS --- */}
        <Td className="text-center p-2 border-l border-gray-200 dark:border-slate-800 border-r">
          <span
            className={`font-bold text-xs px-2 py-1 rounded ${
              efectividad30d
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                : "bg-gray-50 text-gray-300 dark:bg-slate-800 dark:text-slate-600"
            }`}
          >
            {efectividad30d ? "30D" : "-"}
          </span>
        </Td>
      </Tr>
    );
  },
);

// --- COMPONENTE PRINCIPAL (MODIFICADO HEADER, MATRIZ INTACTA) ---
const Matriz = () => {
  const { data, loading, error, handleAuditoriaChange } = useAuditoria();
  const actualCurrentDay = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    const map = {
      0: "domingo", // Domingo -> Lunes
      1: "lunes",
      2: "martes",
      3: "miercoles",
      4: "jueves",
      5: "viernes",
      6: "sábado", // Sábado -> Lunes
    };
    return map[dayOfWeek] || "lunes";
  }, []);

  const [selectedDay, setSelectedDay] = useState(actualCurrentDay);
  const { user } = useAuth();

  // --- CAMBIO: Variable para controlar si se puede editar
  const isEditable = useMemo(() => {
    const role = user?.role?.toLowerCase().trim();
    const p = user?.permisos;

    // Si es ejecutiva, bloqueamos edición siempre (como pidió el usuario)
    if (role === "ejecutiva") return false;

    // Verificación de permisos de gestión (Auditor o Administrador)
    const canManage =
      p?.gestion_matrix || p?.acceso_total || p?.editar_usuarios;

    // Solo se permite editar si es el día actual Y tiene permisos de gestión
    return selectedDay === actualCurrentDay && canManage;
  }, [selectedDay, actualCurrentDay, user?.role, user?.permisos]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZonas, setSelectedZonas] = useState([]); // Nuevo estado para filtro de Zonas
  const [selectedRutas, setSelectedRutas] = useState([]); // Nuevo estado para filtro de Rutas
  // --- CAMBIO 1: Estado para el filtro de gestión (Array en lugar de string)
  const [selectedGestion, setSelectedGestion] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const { showToast, ToastContainer } = useToast();

  // --- FILTRO DE ZONAS (FRONTEND) ---
  // Obtener lista única de zonas basado en la data cargada
  const uniqueZonas = useMemo(() => {
    if (!data) return [];
    const zonas = data.map((item) => item.zona).filter((z) => z && z !== "—");
    return [...new Set(zonas)].sort();
  }, [data]);

  // Obtener lista única de Rutas (usando el campo segmento)
  const uniqueRutas = useMemo(() => {
    if (!data) return [];
    const rutas = data
      .map((item) => item.segmento)
      .filter((r) => r && r !== "—");
    return [...new Set(rutas)].sort();
  }, [data]);

  // --- CAMBIO 2: Opciones para el filtro de gestión
  const gestionOptions = ["Con Gestión", "Sin Gestión"];

  // --- FUNCIÓN PARA GUARDAR FILA ---
  const handleSaveRow = useCallback(
    async (row) => {
      try {
        const payload = {
          id_bitrix: row.id_bitrix,
          codigo_profit: row.codigo,
          gestion: {
            bitacora: row.bitacora,
            obs_ejecutiva: row.obs_ejecutiva,
            semana: row.semana,
            auditoria_matriz: row.auditoria,
          },
          full_data: { nombre: row.nombre },
        };

        await apiService.saveMatrix(payload);

        showToast("Guardado correctamente", "success");
      } catch (err) {
        console.error(err);
        showToast("Error al guardar", "error");
      }
    },
    [showToast],
  );
  const getDynamicBackground = useCallback((categoryData, defaultColor) => {
    if (categoryData?.e)
      return "bg-green-200 dark:bg-emerald-900/40 transition-colors duration-300";
    if (categoryData?.p)
      return "bg-orange-200 dark:bg-amber-900/40 transition-colors duration-300";
    if (categoryData?.n)
      return "bg-red-200 dark:bg-rose-900/40 transition-colors duration-300";
    return defaultColor;
  }, []);

  const handleExclusiveChange = useCallback(
    (rowId, category, field, newValue, customGroup = null) => {
      // Bloqueo de seguridad adicional en la función lógica
      if (!isEditable) return;

      handleAuditoriaChange(rowId, selectedDay, category, field, newValue);
      if (newValue === true) {
        const siblings = customGroup || ["e", "p", "n"];
        siblings.forEach((sibling) => {
          if (sibling !== field) {
            handleAuditoriaChange(rowId, selectedDay, category, sibling, false);
          }
        });
      }
    },
    [handleAuditoriaChange, selectedDay, isEditable],
  );

  const handleAuditChange = useCallback(
    (rowId, category, newValue) => {
      if (!isEditable) return; // Bloqueo de seguridad
      handleAuditoriaChange(rowId, selectedDay, category, newValue);
    },
    [handleAuditoriaChange, selectedDay, isEditable],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedZonas, selectedRutas, selectedGestion]); // CAMBIO: Dependencia actualizada

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // ... (Lógica de searchTerm, Zonas y Rutas se queda IGUAL) ...
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nombre = item.nombre?.toLowerCase() || "";
        const codigo = item.codigo?.toString().toLowerCase() || "";
        if (!nombre.includes(term) && !codigo.includes(term)) return false;
      }
      if (selectedZonas.length > 0) {
        if (!selectedZonas.includes(item.zona)) return false;
      }
      if (selectedRutas.length > 0) {
        if (!selectedRutas.includes(item.segmento)) return false;
      }

      // CAMBIO: Nueva lógica para el Select de Gestión (Semanal)
      if (selectedGestion.length > 0) {
        const isConGestionSelected = selectedGestion.includes("Con Gestión");
        const isSinGestionSelected = selectedGestion.includes("Sin Gestión");

        if (isConGestionSelected !== isSinGestionSelected) {
          // Revisar TODA la semana, no solo el día seleccionado
          const dias = [
            "lunes",
            "martes",
            "miercoles",
            "jueves",
            "viernes",
            "sabado",
          ];
          const hasManagementThisWeek = dias.some((d) => {
            const day = item.auditoria?.[d];
            if (!day) return false;
            const hasCheck =
              day.inicio_whatsapp?.e ||
              day.inicio_whatsapp?.c ||
              day.accion_venta?.e ||
              day.accion_venta?.p ||
              day.accion_venta?.n ||
              day.accion_cobranza?.e ||
              day.accion_cobranza?.p ||
              day.accion_cobranza?.n ||
              day.llamadas_venta?.e ||
              day.llamadas_venta?.p ||
              day.llamadas_venta?.n ||
              day.llamadas_cobranza?.e ||
              day.llamadas_cobranza?.p ||
              day.llamadas_cobranza?.n;
            const hasObs =
              day.observacion && day.observacion.toString().trim().length > 0;
            return hasCheck || hasObs;
          });

          if (isSinGestionSelected && hasManagementThisWeek) return false;
          if (isConGestionSelected && !hasManagementThisWeek) return false;
        }
      }

      return true;
    });
  }, [
    data,
    searchTerm,
    selectedZonas,
    selectedRutas,
    selectedGestion, // CAMBIO: Dependencia actualizada
    selectedDay,
  ]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  // --- CÁLCULO DE TOTALES PARA EL HEADER (LÓGICA POR DÍA) ---
  const headerCounts = useMemo(() => {
    const counts = {
      inicio_whatsapp: { e: 0, c: 0 },
      accion_venta: { e: 0, p: 0, n: 0 },
      accion_cobranza: { e: 0, p: 0, n: 0 },
      cp: 0,
      llamadas_venta: { e: 0, p: 0, n: 0 },
      llamadas_cobranza: { e: 0, p: 0, n: 0 },
      puestas_total: 0,
      cumplidos_total: 0,
      visitas_dia_total: 0,
      deNpAE_total: 0,
      efectividad_30d_total: 0, // <--- Tu variable nueva
      percent_avg: 0,
    };

    if (!data.length) return counts;

    const dayKey = selectedDay
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    filteredData.forEach((row) => {
      const day = row.auditoria?.[selectedDay];
      if (!day) return;

      // --- Contadores de Checkboxes ---
      if (day.inicio_whatsapp?.e) counts.inicio_whatsapp.e++;
      if (day.inicio_whatsapp?.c) counts.inicio_whatsapp.c++;
      ["e", "p", "n"].forEach((f) => {
        if (day.accion_venta?.[f]) counts.accion_venta[f]++;
        if (day.accion_cobranza?.[f]) counts.accion_cobranza[f]++;
        if (day.llamadas_venta?.[f]) counts.llamadas_venta[f]++;
        if (day.llamadas_cobranza?.[f]) counts.llamadas_cobranza[f]++;
      });

      if (day.cp) counts.cp++;

      // --- Lógica de Puestas y Cumplidos ---
      const s = row.semana || {};
      const dailyTask = s[dayKey]?.tarea;
      const isPuesta = dailyTask && dailyTask.toString().trim().length > 0;

      if (isPuesta) counts.puestas_total++;

      const log = Array.isArray(row.gestion)
        ? row.gestion.find((g) => {
            if (!g.dia_semana) return false;
            return (
              g.dia_semana
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") === dayKey
            );
          })
        : null;

      const hasObs =
        (day.observacion && day.observacion.toString().trim().length > 0) ||
        (log && (log.venta_descripcion || log.cobranza_descripcion));

      if (isPuesta && hasObs) counts.cumplidos_total++;
      if (hasObs) counts.visitas_dia_total++;

      // --- Detección de Negativo o En Proceso (N/P) ---
      const isNP =
        day.accion_venta?.p ||
        day.accion_venta?.n ||
        day.accion_cobranza?.p ||
        day.accion_cobranza?.n ||
        day.llamadas_venta?.p ||
        day.llamadas_venta?.n ||
        day.llamadas_cobranza?.p ||
        day.llamadas_cobranza?.n;

      if (isNP) {
        // 1. Condición Semanal (De N-P a E semana actual)
        const compraSemana = isWithinCurrentWeek(row.fecha_ultima_compra);
        const cobroSemana = isWithinCurrentWeek(
          row.fecha_ultimo_cobro || row.ultimo_cobro,
        );
        if (compraSemana && cobroSemana) counts.deNpAE_total++;

        // 2. Condición 30 Días (De N-P a E ventana 30 días) <--- AGREGADO AQUÍ
        // Requisito: "pasa de negativo o en proceso a efectivo... con un calculo de 30 dias"
        const compra30d = isWithinLast30Days(row.fecha_ultima_compra);
        const cobro30d = isWithinLast30Days(
          row.fecha_ultimo_cobro || row.ultimo_cobro,
        );

        if (compra30d && cobro30d) {
          counts.efectividad_30d_total++;
        }
      }
    });

    if (counts.puestas_total > 0) {
      counts.percent_avg = (
        (counts.cumplidos_total / counts.puestas_total) *
        100
      ).toFixed(0);
    }

    return counts;
  }, [filteredData, selectedDay, data]);

  const stats = useMemo(() => {
    return {
      efectivas: filteredData.reduce((acc, row) => {
        const day = row.auditoria?.[selectedDay];
        if (!day) return acc;
        const hasE =
          day.accion_venta?.e ||
          day.accion_cobranza?.e ||
          day.llamadas_venta?.e ||
          day.llamadas_cobranza?.e;
        return hasE ? acc + 1 : acc;
      }, 0),
      ventaProceso: filteredData.reduce((acc, row) => {
        const day = row.auditoria?.[selectedDay];
        if (!day) return acc;
        return day.accion_venta?.p || day.llamadas_venta?.p ? acc + 1 : acc;
      }, 0),
      cobranzaProceso: filteredData.reduce((acc, row) => {
        const day = row.auditoria?.[selectedDay];
        if (!day) return acc;
        return day.accion_cobranza?.p || day.llamadas_cobranza?.p
          ? acc + 1
          : acc;
      }, 0),
      // Sin Gestión SEMANAL: sin ninguna actividad en toda la semana
      sinGestion: filteredData.reduce((acc, row) => {
        const dias = [
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
        ];
        const hasAnyActivity = dias.some((d) => {
          const day = row.auditoria?.[d];
          if (!day) return false;
          const hasCheck =
            day.inicio_whatsapp?.e ||
            day.inicio_whatsapp?.c ||
            day.accion_venta?.e ||
            day.accion_venta?.p ||
            day.accion_venta?.n ||
            day.accion_cobranza?.e ||
            day.accion_cobranza?.p ||
            day.accion_cobranza?.n ||
            day.llamadas_venta?.e ||
            day.llamadas_venta?.p ||
            day.llamadas_venta?.n ||
            day.llamadas_cobranza?.e ||
            day.llamadas_cobranza?.p ||
            day.llamadas_cobranza?.n;
          const hasObs =
            day.observacion && day.observacion.toString().trim().length > 0;
          return hasCheck || hasObs;
        });
        return !hasAnyActivity ? acc + 1 : acc;
      }, 0),
    };
  }, [filteredData, selectedDay]);

  if (error)
    return (
      <div className="p-8 text-center text-red-500">Error: {error.message}</div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* --- HEADER REDISEÑADO (CLEAN/TEAL) --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <Save size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Auditoría de{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Conversaciones
              </span>
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Total:{" "}
                <b className="text-slate-900 dark:text-white">{data.length}</b>
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>
                Visibles:{" "}
                <b className="text-slate-900 dark:text-white">
                  {filteredData.length}
                </b>
              </span>
              {!isEditable && (
                <span className="ml-2 flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <Lock size={10} /> SOLO LECTURA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS DE FILTRO */}
        <div className="flex flex-col xl:flex-row gap-3 w-full xl:w-auto items-center">
          {" "}
          {/* Cambio: items-center */}
          {/* Selector Día (Estilo Pills) */}
          <div className="flex bg-gray-100 dark:bg-[#1a2333] p-1 rounded-xl overflow-x-auto border border-gray-200 dark:border-gray-700 shrink-0">
            {[
              "lunes",
              "martes",
              "miercoles",
              "jueves",
              "viernes",
              "sábado",
            ].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-xs font-bold rounded-lg capitalize whitespace-nowrap transition-all ${
                  selectedDay === day
                    ? "bg-[#1a9888] text-white shadow-md shadow-teal-500/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {/* Inputs Filtros, Buscador y Excel */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto items-center justify-center sm:justify-end">
            <FilterMultiSelect
              label="Zonas"
              options={uniqueZonas}
              selected={selectedZonas}
              onChange={setSelectedZonas}
            />
            <FilterMultiSelect
              label="Rutas"
              options={uniqueRutas}
              selected={selectedRutas}
              onChange={setSelectedRutas}
            />
            <FilterMultiSelect
              label="Gestión"
              options={gestionOptions}
              selected={selectedGestion}
              onChange={setSelectedGestion}
            />

            {/* Buscador */}
            <div className="relative group w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a9888] transition-colors"
              />
              <input
                type="text"
                placeholder="Buscar cliente, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#1a9888]/50 dark:text-white text-sm font-medium transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            {/* Botón Excel (FUERA del div relative del buscador) */}
            <button
              onClick={() => {
                if (!filteredData.length) {
                  showToast("No hay datos filtrados para exportar", "error");
                  return;
                }
                generateDailyAuditExcel(filteredData, selectedDay);
                showToast("Excel generado con éxito", "success");
              }}
              className="px-4 py-3 bg-[#1a9888] text-white rounded-xl hover:bg-[#158072] transition-all shadow-lg shadow-teal-900/20 flex items-center gap-2"
              title="Descargar Excel"
            >
              <Download size={18} />
              <span className="hidden sm:inline font-bold">Excel</span>
            </button>

            {/* Refresh */}
            {/* <button
              onClick={refresh}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <RefreshCw size={20} />
            </button> */}
          </div>
        </div>
      </div>

      {/* BARRA DE ESTADISTICAS (KPIs - Estilo Tarjetas) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatBadge
          label="Efectivas"
          value={stats.efectivas}
          colorClass="bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
        />
        <StatBadge
          label="Venta (P)"
          value={stats.ventaProceso}
          colorClass="bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
        />
        <StatBadge
          label="Cobro (P)"
          value={stats.cobranzaProceso}
          colorClass="bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
        />
        <StatBadge
          label="Sin Gestión"
          value={stats.sinGestion}
          colorClass="bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        />
        <StatBadge
          label="Recuperados"
          value={headerCounts.deNpAE_total}
          colorClass="bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400"
        />
      </div>

      {/* --- AQUÍ COMIENZA LA MATRIZ (INTACTA) --- */}
      <TableContainer className="max-h-[85vh]">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-gray-500">
            <RefreshCw className="animate-spin w-8 h-8 mb-2 text-[#1a9888]" />
            <span>Cargando página 1...</span>
          </div>
        ) : (
          <Table>
            <Thead>
              {/* Nivel 1 Header */}
              <Tr>
                <Th
                  colSpan={5}
                  stickyTop
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-100 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={10}
                  stickyTop
                  className="p-0 border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 h-1"
                ></Th>
                <Th
                  colSpan={19}
                  stickyTop
                  className={`text-center border-r z-20 ${isEditable ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900" : "bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400"}`}
                >
                  GESTIÓN DIARIA:{" "}
                  <span className="uppercase font-bold">{selectedDay}</span>
                  {!isEditable && " (SOLO LECTURA)"}
                </Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-gray-200 dark:border-slate-800 bg-gray-200 dark:bg-slate-900 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-pink-200 dark:border-rose-900 bg-pink-200 dark:bg-rose-950 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-950 border-gray-200"
                ></Th>
              </Tr>
              {/* Nivel 2 Header */}
              <Tr>
                <Th
                  colSpan={5}
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-100 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={10}
                  className="p-0 border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 h-1"
                ></Th>
                <Th
                  colSpan={2}
                  className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950/30 border-r border-yellow-200 dark:border-amber-900 text-gray-500 dark:text-amber-300"
                >
                  Inicios
                </Th>
                <Th
                  colSpan={6}
                  className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950/30 border-r border-yellow-200 dark:border-amber-900 text-gray-500 dark:text-amber-300"
                >
                  Acción Realizada
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-green-300 dark:border-slate-700 bg-slate-300 dark:bg-slate-800 h-1"
                ></Th>
                <Th
                  colSpan={6}
                  className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950/30 border-r border-yellow-200 dark:border-amber-900 text-gray-500 dark:text-amber-300"
                >
                  Llamadas
                </Th>
                <Th
                  colSpan={4}
                  className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950/30 border-r border-yellow-200 dark:border-amber-900 text-gray-500 dark:text-amber-300"
                >
                  Visitas Asesor de Venta
                </Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-gray-200 dark:border-slate-800 bg-gray-200 dark:bg-slate-900 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-pink-200 dark:border-rose-900 bg-pink-200 dark:bg-rose-950 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
              </Tr>
              {/* Nivel 3 Header */}
              <Tr>
                <Th
                  colSpan={5}
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-100 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={10}
                  className="p-0 border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 h-1"
                ></Th>
                <Th
                  colSpan={2}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                ></Th>
                <Th
                  colSpan={6}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-green-300 dark:border-slate-700 bg-slate-300 dark:bg-slate-800 h-1"
                ></Th>
                <Th
                  colSpan={6}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                >
                  Puestas
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                >
                  Cumplidos
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                >
                  Visitas del dia
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                >
                  % de Planificación
                </Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-gray-200 dark:border-slate-800 bg-gray-200 dark:bg-slate-900 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-pink-200 dark:border-rose-900 bg-pink-200 dark:bg-rose-950 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-l dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
              </Tr>

              {/* --- HEADER NIVEL 4 (INPUTS Y TOTALES) --- */}
              <Tr>
                <Th
                  colSpan={5}
                  className=" bg-green-100 text-green-800 dark:bg-emerald-950 dark:text-emerald-300 text-center border-r border-green-200 dark:border-emerald-900 z-20 text-[15px]"
                >
                  DATOS DEL CLIENTE (BITRIX)
                </Th>
                <Th
                  colSpan={10}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-center border-r border-blue-200 dark:border-blue-900 z-20 text-[15px]"
                >
                  DATOS FINANCIEROS (PROFIT)
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.inicio_whatsapp.e} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.inicio_whatsapp.c} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_venta.e} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_venta.p} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_venta.n} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_cobranza.e} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_cobranza.p} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.accion_cobranza.n} />
                </Th>
                <Th className="min-w-7.5 bg-slate-300 dark:bg-slate-800 p-0 border-l border-white dark:border-slate-700">
                  <HeaderCountInput value={headerCounts.cp} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_venta.e} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_venta.p} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_venta.n} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_cobranza.e} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_cobranza.p} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.llamadas_cobranza.n} />
                </Th>

                {/* --- 4 CELDAS DE TOTALES (Reemplazan a las de llamadas repetidas) --- */}
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.puestas_total} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.cumplidos_total} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={headerCounts.visitas_dia_total} />
                </Th>
                <Th className="min-w-7.5 bg-white dark:bg-slate-900 p-0 border-l border-white dark:border-slate-800">
                  <HeaderCountInput value={`${headerCounts.percent_avg}%`} />
                </Th>

                <Th
                  colSpan={4}
                  className="text-center text-[15px] uppercase bg-gray-200 dark:bg-slate-900 border-r dark:border-slate-800 border-gray-200 text-gray-700 dark:text-slate-200"
                >
                  Vendedores
                </Th>
                <Th
                  colSpan={1}
                  className="text-center text-[10px] uppercase bg-pink-200 dark:bg-rose-950 border-r dark:border-rose-900 border-pink-200 text-pink-700 dark:text-rose-200"
                >
                  Observación
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] uppercase font-bold text-center dark:text-slate-300">
                  Guardar
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] uppercase font-bold text-center dark:text-slate-300">
                  De N-P a E
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] uppercase font-bold text-center dark:text-slate-300">
                  CON GESTIÓN
                </Th>
                <Th className="min-w-10 bg-white dark:bg-slate-900 p-0 border-l border-r border-white dark:border-slate-800">
                  <HeaderCountInput
                    value={headerCounts.efectividad_30d_total}
                  />
                </Th>
              </Tr>

              {/* Nivel 5, 6, 7 (Headers de etiquetas - Iguales) */}
              <Tr>
                <Th
                  colSpan={5}
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-100 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={10}
                  className="p-0 border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 h-1"
                ></Th>
                <Th
                  colSpan={2}
                  className="text-center text-[10px] uppercase bg-green-50 dark:bg-emerald-950 border-r dark:border-emerald-900 border-green-200 text-green-700 dark:text-emerald-300"
                >
                  Inicio WhatsApp
                </Th>
                <Th
                  colSpan={6}
                  className="text-center text-[10px] uppercase bg-blue-50 dark:bg-blue-950 border-r dark:border-blue-900 border-blue-200 text-blue-700 dark:text-blue-300"
                >
                  Acción Realizada
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-green-300 dark:border-emerald-800 bg-slate-300 dark:bg-slate-800 h-1"
                ></Th>
                <Th
                  colSpan={6}
                  className="text-center text-[10px] uppercase bg-teal-50 dark:bg-teal-950 border-r dark:border-teal-900 border-teal-200 text-teal-700 dark:text-teal-300"
                >
                  Llamadas
                </Th>
                <Th
                  colSpan={4}
                  className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950/30 border-r border-yellow-200 dark:border-amber-900 text-yellow-700 dark:text-amber-300"
                >
                  Visitas Asesor de Venta
                </Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-gray-200 dark:border-slate-800 bg-gray-200 dark:bg-slate-900 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-pink-200 dark:border-rose-900 bg-pink-200 dark:bg-rose-950 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
              </Tr>
              <Tr>
                <Th
                  colSpan={5}
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-100 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={10}
                  className="p-0 border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-950 h-1"
                ></Th>
                <Th
                  colSpan={2}
                  className="p-0 border-r border-green-200 dark:border-emerald-800 bg-green-50 dark:bg-emerald-950 h-1"
                ></Th>
                <Th
                  colSpan={3}
                  className="text-center text-[10px] uppercase bg-blue-50 dark:bg-blue-950/40 border-r border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                >
                  Venta
                </Th>
                <Th
                  colSpan={3}
                  className="text-center text-[10px] uppercase bg-blue-50 dark:bg-blue-950/40 border-r border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                >
                  Cobranza
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-green-300 dark:border-emerald-800 bg-slate-300 dark:bg-slate-800 h-1"
                ></Th>
                <Th
                  colSpan={3}
                  className="text-center text-[10px] uppercase bg-teal-50 dark:bg-teal-950/40 border-r border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300"
                >
                  Venta
                </Th>
                <Th
                  colSpan={3}
                  className="text-center text-[10px] uppercase bg-teal-50 dark:bg-teal-950/40 border-r border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300"
                >
                  Cobranza
                </Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-yellow-200 dark:border-amber-900 bg-yellow-50 dark:bg-amber-950/20 h-1"
                ></Th>
                <Th
                  colSpan={4}
                  className="p-0 border-r border-gray-200 dark:border-slate-800 bg-gray-200 dark:bg-slate-900 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-pink-200 dark:border-rose-900 bg-pink-200 dark:bg-rose-950 h-1"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
                <Th
                  colSpan={1}
                  className="bg-white border-r dark:border-slate-800 dark:bg-slate-900 border-gray-200"
                ></Th>
              </Tr>
              <Tr>
                <Th
                  stickyLeft={false}
                  className="min-w-45 w-45 bg-white dark:bg-slate-900 z-20 shadow-md border-t dark:border-slate-800 dark:text-slate-200"
                >
                  Cliente
                </Th>
                <Th className="min-w-15 bg-white dark:bg-slate-900 text-xs border-t dark:border-slate-800 dark:text-slate-200">
                  Compañia ID
                </Th>
                <Th className="min-w-20 bg-white dark:bg-slate-900 text-xs border-t dark:border-slate-800 dark:text-slate-200">
                  Código
                </Th>
                <Th className="min-w-30 bg-white dark:bg-slate-900 text-xs border-t dark:border-slate-800 dark:text-slate-200">
                  Zona
                </Th>
                <Th className="min-w-30 bg-white dark:bg-slate-900 text-xs border-t dark:border-slate-800 dark:text-slate-200">
                  Días
                </Th>
                <Th className="min-w-25 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Límite Créd.
                </Th>
                <Th className="min-w-25 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Saldo Tránsito
                </Th>
                <Th className="min-w-25 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Saldo Vencido
                </Th>
                <Th className="min-w-22.5 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Fecha Últ. Compra
                </Th>
                <Th className="min-w-27.5 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Fact. Mayor Morosidad
                </Th>
                <Th className="min-w-22.5 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Fecha Últ. Cobro
                </Th>
                <Th className="min-w-17.5 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Clasif.
                </Th>
                <Th className="min-w-20 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Posee Convenio
                </Th>
                <Th className="min-w-25 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Venta Mes Actual
                </Th>
                <Th className="min-w-25 text-xs border-t dark:border-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  Venta Mes Anterior
                </Th>

                <Th
                  className="min-w-7.5 font-bold text-center bg-green-50 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] border-l border-green-200 dark:border-emerald-800"
                  title="Enviado"
                >
                  EJECUTIVA
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-green-50 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] border-r border-green-200 dark:border-emerald-800"
                  title="Contestado"
                >
                  CLIENTE
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] border-l border-blue-200 dark:border-blue-900"
                  title="Venta Enviado"
                >
                  E
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] dark:border-blue-900"
                  title="Venta Pendiente"
                >
                  P
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] border-r border-blue-200 dark:border-blue-900"
                  title="Venta Negada"
                >
                  N
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] dark:border-blue-900"
                  title="Cobranza Enviado"
                >
                  E
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] dark:border-blue-900"
                  title="Cobranza Pendiente"
                >
                  P
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-blue-50 dark:bg-blue-950 dark:text-blue-300 text-[10px] border-r border-blue-200 dark:border-blue-900"
                  title="Cobranza Negada"
                >
                  N
                </Th>
                <Th
                  colSpan={1}
                  className="p-0 border-r border-green-300 dark:border-emerald-800 bg-slate-300 dark:bg-slate-800 h-1"
                >
                  CP
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] border-l border-teal-200 dark:border-teal-900"
                  title="Llamada Venta E"
                >
                  E
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] dark:border-teal-900"
                  title="Llamada Venta P"
                >
                  P
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] border-r border-teal-200 dark:border-teal-900"
                  title="Llamada Venta N"
                >
                  N
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] dark:border-teal-900"
                  title="Llamada Cobranza E"
                >
                  E
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] dark:border-teal-900"
                  title="Llamada Cobranza P"
                >
                  P
                </Th>
                <Th
                  className="min-w-7.5 font-bold text-center bg-teal-50 dark:bg-teal-950 dark:text-teal-300 text-[10px] dark:border-teal-900"
                  title="Llamada Cobranza N"
                >
                  N
                </Th>
                <Th className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950 border-r border-yellow-200 dark:border-amber-900 text-yellow-700 dark:text-amber-300">
                  Planificación
                </Th>
                <Th className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950 border-r border-yellow-200 dark:border-amber-900 text-yellow-700 dark:text-amber-300">
                  Acción del Dia
                </Th>
                <Th className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950 border-r border-yellow-200 dark:border-amber-900 text-yellow-700 dark:text-amber-300">
                  Diferencia de Coordenadas
                </Th>
                <Th className="text-center text-[10px] uppercase bg-yellow-50 dark:bg-amber-950 border-r border-yellow-200 dark:border-amber-900 text-yellow-700 dark:text-amber-300">
                  Observación del vendedor
                </Th>
                <Th className="text-center text-[10px] uppercase bg-gray-200 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                  Fecha de Registro
                </Th>
                <Th className="text-center text-[10px] uppercase bg-gray-200 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                  Tipo de gestión de ventas
                </Th>
                <Th className="text-center text-[10px] uppercase bg-gray-200 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                  Tipo de gestión de cobranza
                </Th>
                <Th className="text-center text-[10px] uppercase bg-gray-200 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                  Descripción de ambos conceptos
                </Th>
                <Th className="text-center text-[10px] uppercase bg-pink-200 dark:bg-rose-950 border-r border-pink-200 dark:border-rose-900 text-pink-700 dark:text-rose-200">
                  Observaciones
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] text-center uppercase font-bold dark:text-slate-300">
                  Guardar
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] text-center uppercase font-bold dark:text-slate-300">
                  De N-P a E
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l dark:border-slate-800 border-gray-200 text-[10px] text-center uppercase font-bold text-purple-700 dark:text-purple-300">
                  CON GESTIÓN
                </Th>
                <Th className="bg-white dark:bg-slate-900 border-l border-r dark:border-slate-800 border-gray-200 text-[10px] text-center uppercase font-bold text-teal-700 dark:text-teal-300">
                  EFECT. (30D)
                </Th>
              </Tr>
            </Thead>

            <Tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <AuditRow
                    key={row.id}
                    row={row}
                    selectedDay={selectedDay}
                    handleExclusiveChange={handleExclusiveChange}
                    handleAuditChange={handleAuditChange}
                    getDynamicBackground={getDynamicBackground}
                    handleSaveRow={handleSaveRow}
                    isEditable={isEditable}
                  />
                ))
              ) : (
                <Tr>
                  <Td colSpan={41} className="text-center py-8 text-gray-500">
                    No se encontraron resultados para "{searchTerm}"
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </TableContainer>

      {/* --- PAGINACIÓN --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-[#333] dark:text-gray-200 dark:border-gray-600"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-[#1a9888] bg-teal-50 rounded-lg border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800">
            Página {page} de {totalPages || 1}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-[#333] dark:text-gray-200 dark:border-gray-600"
          >
            Siguiente <ChevronRight size={16} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const p = parseInt(e.target.pageInput.value);
            if (p >= 1 && p <= totalPages) {
              goToPage(p);
              e.target.pageInput.value = "";
            } else {
              alert(`Página inválida (1-${totalPages})`);
            }
          }}
          className="flex items-center gap-2"
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ir a pág:
          </span>
          <input
            name="pageInput"
            type="number"
            min="1"
            max={totalPages}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a9888] dark:bg-[#333] dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            IR
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Matriz;
