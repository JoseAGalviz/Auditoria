/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useBaseDatosBitrix } from "../hooks/useBaseDatosBitrix";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../components/ui/Tabla";
import {
  RefreshCw,
  Database,
  MapPin,
  AlertTriangle,
  Edit3,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
  Search,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  Columns,
  FileText,
  Loader,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { FilterMultiSelect } from "../components/ui/FilterMultiSelect";
import { FilterSingleSelect } from "../components/ui/FilterSingleSelect";
import { generateVendorPDF } from "../utils/pdfGenerator";
import { useToast } from "../components/ui/Toast";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { RoutePreviewModal } from "../components/ui/RoutePreviewModal"; // Importar el modal nuevo

const ErrorAwareCell = React.memo(({ value, isError, icon = false }) => {
  if (isError) {
    return (
      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-1 rounded-md w-fit">
        <AlertTriangle size={14} />
        <span className="font-bold text-xs">{value || "VACÍO"}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
});

const EditableCell = React.memo(({ value, onChange, placeholder = "..." }) => {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const onBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-white dark:bg-[#262626] border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-center outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-[#1a9888] focus:border-transparent dark:text-gray-200"
      />
      <Edit3
        size={12}
        className="absolute right-2 top-2.5 text-gray-400 pointer-events-none opacity-50"
      />
    </div>
  );
});

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

// --- COMPONENTE FILA ---
const CompanyRow = React.memo(
  ({
    row,
    isSelected,
    toggleSelect,
    handleCompanyChange,
    handleSave,
    onTaskDayEdit,
    formatCurrency,
  }) => {
    // --- HELPER PARA RENDERIZAR TEXTO CON COLORES ---
    const renderStyledContent = (textString) => {
      if (!textString) return "-";

      const MAX_LENGTH = 60;
      const parts = textString.split(" / ");

      return (
        <div className="flex flex-col gap-1 items-center text-center">
          {parts.map((part, index) => {
            let colorClass = "text-gray-600 dark:text-gray-400";

            if (part.startsWith("V:")) {
              colorClass = "text-green-700 dark:text-green-400 font-medium";
            } else if (part.startsWith("C:")) {
              colorClass = "text-blue-700 dark:text-blue-400 font-medium";
            }

            const shouldTruncate = part.length > MAX_LENGTH;
            const displayPart = shouldTruncate
              ? part.substring(0, MAX_LENGTH) + "..."
              : part;

            return (
              <span
                key={index}
                title={shouldTruncate ? part : undefined}
                className={`${colorClass} wrap-break-word whitespace-normal leading-tight text-[10px] cursor-help`}
              >
                {displayPart}
              </span>
            );
          })}
        </div>
      );
    };

    // Helper para generar celdas de días
    const renderDayCells = (
      dayPrefix,
      bgColorClass,
      borderClass = "",
      visibility,
    ) => {
      const isVisible = visibility ? visibility[dayPrefix] : true;
      if (!isVisible) return null;

      const onTaskChange = (val) => {
        onTaskDayEdit?.(dayPrefix);
        // 1. Actualiza estado local
        handleCompanyChange(row.id_interno, `${dayPrefix}_tarea`, val);
        // 2. Dispara guardado inmediato para verificar si inhabilita
        const updatedRow = { ...row, [`${dayPrefix}_tarea`]: val };
        handleSave(updatedRow);
      };

      return (
        <>
          {/* TAREA (Editable) - AHORA PRIMERO */}
          <Td
            className={`${bgColorClass} ${borderClass} min-w-37.5 align-middle`}
          >
            <EditableCell
              value={row[`${dayPrefix}_tarea`]}
              onChange={onTaskChange}
              placeholder="Tarea..."
            />
          </Td>

          {/* ACCIÓN (Solo Lectura) */}
          <Td
            className={`${bgColorClass} min-w-37.5 align-middle text-center`}
          >
            <div className="px-2 py-1.5">
              {renderStyledContent(row[`${dayPrefix}_accion`] || "-")}
            </div>
          </Td>

          {/* OBSERVACIÓN (Solo Lectura) */}
          <Td
            className={`${bgColorClass} min-w-37.5 align-middle text-center`}
          >
            <div className="px-2 py-1.5 italic">
              {renderStyledContent(row[`${dayPrefix}_observacion`] || "-")}
            </div>
          </Td>
        </>
      );
    };

    return (
      <Tr
        className={
          /*row.isManagedToday
            ? "bg-gray-100 dark:bg-gray-800/50 opacity-60"
            :*/ isSelected
              ? "bg-teal-50/30 dark:bg-teal-900/10"
              : "hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        }
      >
        {/* Checkbox */}
        <Td className="bg-white dark:bg-[#111827] border-r dark:border-white/5 text-center transition-colors">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#1a9888] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            checked={isSelected}
            // disabled={row.isManagedToday}
            onChange={() => toggleSelect(row.id_interno)}
          />
        </Td>

        {/* Datos Básicos */}
        <Td className="bg-slate-50/50 dark:bg-[#0b1120] text-xs font-mono transition-colors">
          {row.id}
        </Td>
        <Td className="text-left font-semibold bg-white dark:bg-[#111827] border-r dark:border-white/5 shadow-md">
          <div
            className="flex items-center gap-2 truncate max-w-70"
            title={row.nombre}
          >
            {row.nombre}
          </div>
        </Td>

        {/* Celdas Informativas */}
        {row.visibility?.codigo_profit && (
          <Td>
            <ErrorAwareCell
              value={row.codigo_profit}
              isError={!row.codigo_profit || row.codigo_profit === "0"}
            />
          </Td>
        )}
        {row.visibility?.ciudad && <Td>{row.ciudad}</Td>}
        {row.visibility?.segmento && (
          <Td>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-200">
              {row.segmento}
            </span>
          </Td>
        )}
        {row.visibility?.coordenadas && (
          <Td>
            <ErrorAwareCell
              value={row.coordenadas}
              isError={!row.coordenadas || row.coordenadas === "0"}
              icon={<MapPin size={12} />}
            />
          </Td>
        )}
        {row.visibility?.dias_visita && (
          <Td
            className="text-xs truncate max-w-35"
            title={row.dias_visita}
          >
            {row.dias_visita || "-"}
          </Td>
        )}
        {row.visibility?.convenio && <Td>{row.convenio}</Td>}

        {row.visibility?.limite && (
          <Td align="right" className="font-mono text-xs">
            {formatCurrency(row.limite_credito) + "$"}
          </Td>
        )}
        {row.visibility?.transito && (
          <Td align="right" className="font-mono text-xs">
            {formatCurrency(row.saldo_transito) + "$"}
          </Td>
        )}
        {row.visibility?.vencido && (
          <Td
            align="right"
            className={`font-mono text-xs font-bold ${
              row.saldo_vencido > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatCurrency(row.saldo_vencido) + "$"}
          </Td>
        )}
        {row.visibility?.fecha_compra && (
          <Td className="text-xs">{row.fecha_compra}</Td>
        )}
        {row.visibility?.morosidad && (
          <Td
            className="text-xs text-red-500 truncate max-w-30"
            title={row.factura_morosidad}
          >
            {row.factura_morosidad}
          </Td>
        )}

        {row.visibility?.ultimo_cobro && (
          <Td align="right" className="font-mono text-xs">
            {formatCurrency(row.ultimo_cobro) + "$"}
          </Td>
        )}
        {row.visibility?.sku && <Td>{row.sku_mes}</Td>}
        {row.visibility?.clasif && (
          <Td>
            <ClassificationBadge value={row.clasificacion} />
          </Td>
        )}
        {row.visibility?.actual && (
          <Td
            align="right"
            className="font-mono text-xs text-blue-600 bg-gray-50 dark:bg-[#202020]"
          >
            {formatCurrency(row.ventas_actual) + "$"}
          </Td>
        )}
        {row.visibility?.anterior && (
          <Td
            align="right"
            className="font-mono text-xs text-gray-500 bg-gray-50 dark:bg-[#202020]"
          >
            {formatCurrency(row.ventas_anterior) + "$"}
          </Td>
        )}

        {/* --- SECCIÓN GESTIÓN --- */}
        {row.visibility?.bitacora && (
          <Td className="bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-[#333] min-w-75">
            <EditableCell
              value={row.bitacora}
              onChange={(val) =>
                handleCompanyChange(row.id_interno, "bitacora", val)
              }
              placeholder="Bitácora..."
            />
          </Td>
        )}
        {row.visibility?.obs_ejecutiva && (
          <Td className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-[#333] min-w-75">
            <EditableCell
              value={row.obs_ejecutiva}
              onChange={(val) =>
                handleCompanyChange(row.id_interno, "obs_ejecutiva", val)
              }
              placeholder="Observación Ejecutiva..."
            />
          </Td>
        )}

        {/* --- AGENDA SEMANAL --- */}
        {renderDayCells(
          "lunes",
          "bg-indigo-50 dark:bg-indigo-900/20",
          "",
          row.visibility,
        )}
        {renderDayCells(
          "martes",
          "bg-white dark:bg-[#1e1e1e]",
          "",
          row.visibility,
        )}
        {renderDayCells(
          "miercoles",
          "bg-indigo-50 dark:bg-indigo-900/20",
          "",
          row.visibility,
        )}
        {renderDayCells(
          "jueves",
          "bg-white dark:bg-[#1e1e1e]",
          "",
          row.visibility,
        )}
        {renderDayCells(
          "viernes",
          "bg-indigo-50 dark:bg-indigo-900/20",
          "border-r border-gray-200 dark:border-[#333]",
          row.visibility,
        )}

        {/* Guardar */}
      </Tr>
    );
  },
);

// Función auxiliar para obtener la fecha del día de la semana actual
const getFormattedDateForDay = (dayIndex) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  
  // Calcular la diferencia de días para llegar al día deseado (dayIndex: 1=Lunes, ..., 5=Viernes)
  // Ajuste: si hoy es sábado (6) o domingo (0), calculamos respecto al lunes próximo o pasado según lógica de negocio.
  // Asumiremos que se muestra la semana en curso.
  
  // Primero, llevamos la fecha al Lunes de la semana actual
  const monday = new Date(today);
  const dayShift = currentDay === 0 ? -6 : 1 - currentDay; // Si es domingo, restamos 6 para ir al lunes pasado. Si es otro día, restamos (currentDay - 1)
  monday.setDate(today.getDate() + dayShift);

  // Ahora calculamos la fecha del día solicitado
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + (dayIndex - 1));

  // Formato DD-MM
  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

// --- COMPONENTE PRINCIPAL ---
const BaseDatosBitrix = () => {
  const {
    companies,
    allCompanies,
    loading,
    // Filtros del Hook
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
    // Paginación
    page,
    totalPages,
    totalRecords,
    goToPage,
    // Acciones
    handleCompanyChange,
    refresh,
    uniqueSegments,
    user,
  } = useBaseDatosBitrix();

  const { showToast, ToastContainer } = useToast();

  const [jumpPage, setJumpPage] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [lastPlannedDay, setLastPlannedDay] = useState(null);

  const WEEK_DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  const detectLastPlannedDay = useCallback((entities) => {
    for (let i = WEEK_DAYS.length - 1; i >= 0; i -= 1) {
      const dayKey = WEEK_DAYS[i];
      const hasTask = entities.some((entity) => {
        const value = entity?.[`${dayKey}_tarea`];
        return String(value || "").trim().length > 0;
      });
      if (hasTask) return dayKey;
    }
    return null;
  }, []);

  // --- MODAL DE CONFIRMACIÓN ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false); // Estado para el modal de ruta
  const [confirmData, setConfirmData] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // --- COLUMN VISIBILITY STATE ---
  const [columnVisibility, setColumnVisibility] = useState({
    // Bitrix
    codigo_profit: true,
    ciudad: true,
    segmento: true,
    coordenadas: true,
    dias_visita: true,
    convenio: true,
    // Profit
    limite: true,
    transito: true,
    vencido: true,
    fecha_compra: true,
    morosidad: true,
    // Ventas
    ultimo_cobro: true,
    sku: true,
    clasif: true,
    actual: true,
    anterior: true,
    // Gestión
    bitacora: true,
    obs_ejecutiva: true,
    // Agenda (Por días completos)
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target)
      ) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper para calcular colSpan de grupos de headers
  const getGroupColSpan = (keys) => {
    return keys.reduce((acc, key) => acc + (columnVisibility[key] ? 1 : 0), 0);
  };

  // Agenda: cada día tiene 3 columnas fijas. Si el día está visible, colSpan 3, sino 0.
  const getDayColSpan = (dayKey) => (columnVisibility[dayKey] ? 3 : 0);
  const getAgendaTotalColSpan = () => {
    return (
      getDayColSpan("lunes") +
      getDayColSpan("martes") +
      getDayColSpan("miercoles") +
      getDayColSpan("jueves") +
      getDayColSpan("viernes")
    );
  };

  const toggleSelect = useCallback((id_interno) => {
    setSelectedIds((prev) =>
      prev.includes(id_interno)
        ? prev.filter((id) => id !== id_interno)
        : [...prev, id_interno],
    );
  }, []);

  const toggleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        // Seleccionar todos, INCLUYENDO los gestionados hoy
        const availableIds = companies.map((c) => c.id_interno);
        setSelectedIds(availableIds);
      } else {
        setSelectedIds([]);
      }
    },
    [companies],
  );

  // Filtro para mostrar en la tabla:
  // Si "Ver Selec." está activo, mostramos TODOS los seleccionados (de allCompanies).
  // Si no, mostramos la página actual (companies) que viene del hook ya filtrada y ordenada.
  const displayedCompanies = useMemo(() => {
    if (showOnlySelected) {
      let result = allCompanies.filter((c) =>
        selectedIds.includes(c.id_interno),
      );
      // Opcional: Podríamos ordenar aquí los seleccionados si quisiéramos,
      // pero por ahora mantenemos la lógica simple.
      return result;
    }
    return companies;
  }, [showOnlySelected, allCompanies, companies, selectedIds]);

  // Helper para cambiar la dirección al hacer click (actualiza el estado del hook)
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  }, []);

  const resolveVendorName = useCallback(
    (companyData) => {
      const vendorCode = String(companyData?.co_ven || "").trim();
      if (!vendorCode) return "No Identificado";

      const vendorMatch = vendedores.find(
        (v) => String(v.value || "").trim() === vendorCode,
      );

      return vendorMatch?.label || vendorCode;
    },
    [vendedores],
  );

  // Helper para preparar el payload de un cliente
  const preparePayload = useCallback((companyData) => {
    return {
      id_bitrix: companyData.id,
      codigo_profit: companyData.codigo_profit,
      co_ven: companyData.co_ven || "",
      vendedor: resolveVendorName(companyData),
      usuario: user?.nombre || user?.usuario || "Usuario desconocido",
      gestion: {
        bitacora: companyData.bitacora,
        obs_ejecutiva: companyData.obs_ejecutiva,
        semana: {
          lunes: {
            accion: companyData.lunes_accion,
            observacion: companyData.lunes_observacion,
            tarea: companyData.lunes_tarea,
          },
          martes: {
            accion: companyData.martes_accion,
            observacion: companyData.martes_observacion,
            tarea: companyData.martes_tarea,
          },
          miercoles: {
            accion: companyData.miercoles_accion,
            observacion: companyData.miercoles_observacion,
            tarea: companyData.miercoles_tarea,
          },
          jueves: {
            accion: companyData.jueves_accion,
            observacion: companyData.jueves_observacion,
            tarea: companyData.jueves_tarea,
          },
          viernes: {
            accion: companyData.viernes_accion,
            observacion: companyData.viernes_observacion,
            tarea: companyData.viernes_tarea,
          },
        },
      },
      full_data: companyData,
    };
  }, [resolveVendorName, user]);

  const handleSave = useCallback(
    async (companyData) => {
      const payload = preparePayload(companyData);
      try {
        // <--- CAMBIO IMPORTANTE: Endpoint correcto
        const response = await apiService.savePlanificacion(payload);

        if (response) {
          showToast(
            "Tarea guardada.",
            "success",
          );
          return true;
        }
      } catch (error) {
        console.error("Error al guardar:", error);
        return false;
      }
    },
    [refresh, handleCompanyChange, showToast],
  );

  const executeBulkSave = async (selectedEntities, vendor) => {
    setIsBulkSaving(true);
    setShowConfirm(false); // Cerrar cualquier modal previo
    setShowRouteModal(false); // Cerrar modal de ruta
    try {
      // Construir array de payloads
      const bulkPayload = selectedEntities.map((entity) => ({
        ...preparePayload(entity),
        co_ven: vendor.value,
        vendedor: vendor.label,
        usuario: user?.nombre || user?.usuario || "Usuario desconocido",
      }));

      console.log("JSON enviado:", bulkPayload);

      // Enviar una sola petición con el array
      await apiService.savePlanificacion(bulkPayload);

      const dayForPdf = lastPlannedDay || detectLastPlannedDay(selectedEntities);
      generateVendorPDF(vendor.label, selectedEntities, dayForPdf);

      showToast(
        `Proceso completado. ${selectedEntities.length} clientes guardados y PDF generado.`,
      );

      // --- REFRESCAR DATOS PARA ACTUALIZAR isManagedToday ---
      await refresh();

      // --- LIMPIEZA DE FILTROS Y SELECCIÓN ---
      setSelectedIds([]);
      setSelectedVendedor(null);
      setSearchTerm("");
      setFilterZona("");
      setSelectedSegments([]);
      setShowOnlySelected(false);
      setLastPlannedDay(null);
    } catch (error) {
      console.error("Error en proceso masivo:", error);
      showToast(
        `Ocurrió un error durante el guardado masivo: ${error.message}`,
        "error",
      );
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleBulkSaveAndPDF = async () => {
    if (selectedIds.length === 0) {
      alert("Por favor, selecciona al menos un cliente.");
      return;
    }
    if (!selectedVendedor) {
      alert("Por favor, selecciona un vendedor para generar el PDF.");
      return;
    }

    const selectedEntities = allCompanies.filter((c) =>
      selectedIds.includes(c.id_interno),
    );
    const vendor = vendedores.find((v) => v.value === selectedVendedor);

    if (!vendor) {
      console.error("❌ Vendedor no encontrado:", {
        selectedVendedor,
        vendedoresCount: vendedores.length,
      });
      alert(
        "Error: No se pudo encontrar la información del vendedor seleccionado.",
      );
      return;
    }

    // Configurar datos para el modal de ruta en lugar del ConfirmModal simple
    setConfirmData({
        clientData: selectedEntities,
        vendorName: vendor.label,
        onConfirm: () => executeBulkSave(selectedEntities, vendor),
    });
    setShowRouteModal(true); // Mostrar el nuevo modal
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= totalPages) {
      goToPage(p);
      setJumpPage("");
    } else {
      alert(`Página inválida (1-${totalPages})`);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* --- HEADER Y BARRA DE FILTROS --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <Database size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Base de Datos{" "}
              <span className="text-[#1a9888] dark:text-teal-400">Bitrix</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Total: {totalRecords} | Visibles: {displayedCompanies.length} |
              Seleccionados: {selectedIds.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
          {/* BOTÓN GUARDAR Y GENERAR PDF */}
          <button
            onClick={handleBulkSaveAndPDF}
            disabled={
              isBulkSaving || selectedIds.length === 0 || !selectedVendedor
            }
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-md ${
              isBulkSaving || selectedIds.length === 0 || !selectedVendedor
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-teal-600 text-white hover:bg-teal-700 active:scale-95"
            }`}
          >
            {isBulkSaving ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            <span>Guardar y Generar PDF</span>
          </button>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />

          {/* 1. INPUT ZONA (Filtro del Hook) */}
          <div className="relative w-full sm:w-48 group">
            <input
              type="text"
              placeholder="Filtrar Zona..."
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a9888]/50 focus:border-[#1a9888] transition-all"
            />
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#1a9888]"
            />
            {filterZona && (
              <button
                onClick={() => setFilterZona("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. SELECTOR SEGMENTOS (Filtro Backend) */}
          <FilterMultiSelect
            label="Segmentos"
            options={uniqueSegments}
            selected={selectedSegments}
            onChange={setSelectedSegments}
          />

          {/* 3. SELECTOR VENDEDOR (Single Select) */}
          <FilterSingleSelect
            label="Asignar Vendedor"
            options={vendedores}
            selected={selectedVendedor}
            onChange={setSelectedVendedor}
          />

          {/* 4. TOGGLE VENCIDOS (Filtro Hook) */}
          <button
            onClick={() => setOnlyVencidos(!onlyVencidos)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-all shadow-sm ${
              onlyVencidos
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 ring-1 ring-red-200"
                : "bg-white border-gray-300 text-gray-700 dark:bg-[#262626] dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50"
            }`}
          >
            {onlyVencidos ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>Solo Vencidos</span>
          </button>

          {/* 4. BUSCADOR LOCAL (Nombre/ID) */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="Buscar (Nombre/ID/Profit)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a9888]/50 focus:border-[#1a9888] transition-all"
            />
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* FILTRO VER SELECCIONADOS */}
          <button
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 shadow-sm ${
              showOnlySelected
                ? "bg-[#1a9888] text-white border-[#1a9888]"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#1a9888]"
            }`}
          >
            <Filter size={16} />
            {showOnlySelected ? "Ver Todos" : "Ver Selec."}
          </button>

          {/* TOGGLE COLUMNAS */}
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="px-3 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#1a9888] flex items-center gap-2 shadow-sm"
            >
              <Columns size={16} />
              Columnas
              <ChevronDown size={14} />
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Datos Bitrix
                    </h4>
                    <div className="space-y-1">
                      {[
                        "codigo_profit",
                        "ciudad",
                        "segmento",
                        "coordenadas",
                        "dias_visita",
                        "convenio",
                      ].map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded text-[#1a9888]"
                          />
                          <span className="capitalize">
                            {key.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Datos Profit
                    </h4>
                    <div className="space-y-1">
                      {[
                        "limite",
                        "transito",
                        "vencido",
                        "fecha_compra",
                        "morosidad",
                      ].map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded text-[#1a9888]"
                          />
                          <span className="capitalize">
                            {key.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Ventas
                    </h4>
                    <div className="space-y-1">
                      {[
                        "ultimo_cobro",
                        "sku",
                        "clasif",
                        "actual",
                        "anterior",
                      ].map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded text-[#1a9888]"
                          />
                          <span className="capitalize">
                            {key.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Gestión
                    </h4>
                    <div className="space-y-1">
                      {["bitacora", "obs_ejecutiva"].map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded text-[#1a9888]"
                          />
                          <span className="capitalize">
                            {key.replace("_", " ")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Agenda Semanal
                    </h4>
                    <div className="space-y-1">
                      {[
                        "lunes",
                        "martes",
                        "miercoles",
                        "jueves",
                        "viernes",
                      ].map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={columnVisibility[key]}
                            onChange={() => toggleColumn(key)}
                            className="rounded text-[#1a9888]"
                          />
                          <span className="capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REFRESCAR */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-gray-500 bg-white border border-gray-300 hover:text-[#1a9888] hover:border-[#1a9888] hover:bg-teal-50 rounded-lg transition-all shadow-sm"
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin text-[#1a9888]" : ""}
            />
          </button>
        </div>
      </div>

      <TableContainer>
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-gray-500">
            <RefreshCw className="animate-spin w-8 h-8 mb-2 text-[#1a9888]" />
            <span>Cargando página {page}...</span>
          </div>
        ) : (
          <Table>
            <Thead>
              {/* Nivel 1 Header */}
              <Tr className="bg-slate-50 dark:bg-[#0b1120] border-b-0">
                <Th className="bg-white dark:bg-[#111827] w-12 text-center border-r dark:border-white/5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#1a9888] cursor-pointer"
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    checked={
                      companies.length > 0 &&
                      selectedIds.length === companies.length
                    }
                  />
                </Th>
                <Th
                  colSpan={2}
                  className="border-b border-r border-gray-200 dark:border-white/5 text-[#1a9888] bg-white dark:bg-[#111827]"
                >
                  Empresa
                </Th>
                {getGroupColSpan([
                  "codigo_profit",
                  "ciudad",
                  "segmento",
                  "coordenadas",
                  "dias_visita",
                  "convenio",
                ]) > 0 && (
                  <Th
                    colSpan={getGroupColSpan([
                      "codigo_profit",
                      "ciudad",
                      "segmento",
                      "coordenadas",
                      "dias_visita",
                      "convenio",
                    ])}
                    className="border-b border-r border-gray-200 dark:border-[#333] bg-blue-50 dark:bg-blue-900 text-blue-600 text-center"
                  >
                    Datos Bitrix
                  </Th>
                )}
                {getGroupColSpan([
                  "limite",
                  "transito",
                  "vencido",
                  "fecha_compra",
                  "morosidad",
                ]) > 0 && (
                  <Th
                    colSpan={getGroupColSpan([
                      "limite",
                      "transito",
                      "vencido",
                      "fecha_compra",
                      "morosidad",
                    ])}
                    className="border-b border-r border-gray-200 dark:border-[#333] bg-green-50 dark:bg-green-900 text-green-600 text-center"
                  >
                    Datos Profit
                  </Th>
                )}
                {getGroupColSpan([
                  "ultimo_cobro",
                  "sku",
                  "clasif",
                  "actual",
                  "anterior",
                ]) > 0 && (
                  <Th
                    colSpan={getGroupColSpan([
                      "ultimo_cobro",
                      "sku",
                      "clasif",
                      "actual",
                      "anterior",
                    ])}
                    className="border-b border-r border-gray-200 dark:border-[#333] text-purple-600 text-center bg-indigo-200 dark:bg-indigo-800"
                  >
                    Ventas
                  </Th>
                )}
                {getGroupColSpan(["bitacora", "obs_ejecutiva"]) > 0 && (
                  <Th
                    colSpan={getGroupColSpan(["bitacora", "obs_ejecutiva"])}
                    className="border-b border-r border-orange-300 dark:border-[#333] text-orange-600 font-bold bg-orange-200 dark:bg-orange-800 text-center"
                  >
                    Gestión
                  </Th>
                )}
                {getAgendaTotalColSpan() > 0 && (
                  <Th
                    colSpan={getAgendaTotalColSpan()}
                    className="border-b border-r border-gray-200 dark:border-[#333] text-indigo-600 bg-indigo-50 dark:bg-indigo-900 text-center"
                  >
                    Agenda Semanal (Tarea / Acción / Obs)
                  </Th>
                )}
              </Tr>

              {/* Nivel 2 Header */}
              <Tr>
                <Th className="bg-white dark:bg-[#111827] border-r dark:border-white/5"></Th>
                <Th className="min-w-15 bg-white dark:bg-[#111827]">ID</Th>
                <Th className="min-w-50 text-left bg-white dark:bg-[#111827] shadow-md">
                  Nombre
                </Th>
                {columnVisibility.codigo_profit && (
                  <Th className="min-w-30 bg-blue-50 dark:bg-blue-800 font-bold">
                    Cód. Profit
                  </Th>
                )}
                {columnVisibility.ciudad && (
                  <Th className="min-w-35 bg-blue-50 dark:bg-blue-800 font-bold">
                    Ciudad
                  </Th>
                )}
                {columnVisibility.segmento && (
                  <Th className="min-w-35 bg-blue-50 dark:bg-blue-800 font-bold">
                    Segmento
                  </Th>
                )}
                {columnVisibility.coordenadas && (
                  <Th className="min-w-40 bg-blue-50 dark:bg-blue-800 font-bold">
                    Coordenadas
                  </Th>
                )}
                {columnVisibility.dias_visita && (
                  <Th className="min-w-50 bg-blue-50 dark:bg-blue-800 font-bold align-bottom">
                    <div className="flex flex-col gap-1 w-full">
                      <span>Días Visita</span>
                      <select
                        className="w-full text-[10px] p-1 rounded border border-blue-200 bg-white text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={dayFilter}
                        onChange={(e) => setDayFilter(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Evita ordenar si estuviera activo
                      >
                        <option value="">-- Todos --</option>
                        <option value="Diario">Diario</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                      </select>
                    </div>
                  </Th>
                )}
                {columnVisibility.convenio && (
                  <Th className="min-w-25 bg-blue-50 dark:bg-blue-800 font-bold">
                    Convenio
                  </Th>
                )}
                {columnVisibility.limite && (
                  <Th className="min-w-27.5 bg-green-50 dark:bg-green-800 font-bold">
                    Límite
                  </Th>
                )}
                {columnVisibility.transito && (
                  <Th className="min-w-27.5 bg-green-50 dark:bg-green-800 font-bold">
                    Tránsito
                  </Th>
                )}
                {columnVisibility.vencido && (
                  <Th className="min-w-27.5 bg-green-50 dark:bg-green-800 font-bold">
                    Vencido
                  </Th>
                )}
                {columnVisibility.fecha_compra && (
                  <Th
                    className="min-w-30 bg-green-50 dark:bg-green-800 font-bold cursor-pointer hover:bg-green-100 transition-colors select-none group"
                    onClick={() => handleSort("fecha_compra")}
                    title="Click para ordenar"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>F. Compra</span>
                      {sortConfig.key === "fecha_compra" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp size={14} className="text-green-700" />
                        ) : (
                          <ArrowDown size={14} className="text-green-700" />
                        )
                      ) : (
                        <ArrowUpDown
                          size={14}
                          className="text-gray-400 opacity-50 group-hover:opacity-100"
                        />
                      )}
                    </div>
                  </Th>
                )}
                {columnVisibility.morosidad && (
                  <Th className="min-w-50 bg-green-50 dark:bg-green-800 font-bold">
                    F. Morosidad
                  </Th>
                )}
                {columnVisibility.ultimo_cobro && (
                  <Th className="min-w-27.5 bg-indigo-200 dark:bg-indigo-800 font-bold">
                    Últ. Cobro
                  </Th>
                )}
                {columnVisibility.sku && (
                  <Th className="min-w-17.5 bg-indigo-200 dark:bg-indigo-800 font-bold">
                    SKU
                  </Th>
                )}
                {columnVisibility.clasif && (
                  <Th className="min-w-17.5 bg-indigo-200 dark:bg-indigo-800 font-bold">
                    Clasif.
                  </Th>
                )}
                {columnVisibility.actual && (
                  <Th className="min-w-27.5 bg-indigo-200 dark:bg-indigo-800 font-bold">
                    Actual
                  </Th>
                )}
                {columnVisibility.anterior && (
                  <Th className="min-w-27.5 bg-indigo-200 dark:bg-indigo-800 font-bold">
                    Anterior
                  </Th>
                )}

                {/* GESTIÓN */}
                {/* GESTIÓN */}
                {columnVisibility.bitacora && (
                  <Th className="min-w-75 text-orange-600 font-bold bg-orange-200 dark:bg-orange-800">
                    Bitácora
                  </Th>
                )}
                {columnVisibility.obs_ejecutiva && (
                  <Th className="min-w-75 text-orange-600 font-bold bg-orange-200 dark:bg-orange-800">
                    Obs. Ejec.
                  </Th>
                )}

                {/* AGENDA SEMANAL */}
                {/* LUNES */}
                {columnVisibility.lunes && (
                  <>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Lun {getFormattedDateForDay(1)}
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Lun-Acc
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Lun-Obs
                    </Th>
                  </>
                )}

                {/* MARTES */}
                {columnVisibility.martes && (
                  <>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Mar {getFormattedDateForDay(2)}
                    </Th>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Mar-Acc
                    </Th>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Mar-Obs
                    </Th>
                  </>
                )}

                {/* MIERCOLES */}
                {columnVisibility.miercoles && (
                  <>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Mie {getFormattedDateForDay(3)}
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Mie-Acc
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Mie-Obs
                    </Th>
                  </>
                )}

                {/* JUEVES */}
                {columnVisibility.jueves && (
                  <>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Jue {getFormattedDateForDay(4)}
                    </Th>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Jue-Acc
                    </Th>
                    <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e]">
                      Jue-Obs
                    </Th>
                  </>
                )}

                {/* VIERNES */}
                {columnVisibility.viernes && (
                  <>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Vie {getFormattedDateForDay(5)}
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Vie-Acc
                    </Th>
                    <Th className="min-w-37.5 bg-indigo-50 dark:bg-indigo-900">
                      Vie-Obs
                    </Th>
                  </>
                )}
              </Tr>
            </Thead>

            <Tbody>
              {displayedCompanies.length > 0 ? (
                displayedCompanies.map((row) => (
                  <CompanyRow
                    key={row.id_interno}
                    row={{ ...row, visibility: columnVisibility }}
                    isSelected={selectedIds.includes(row.id_interno)}
                    toggleSelect={toggleSelect}
                    handleCompanyChange={handleCompanyChange}
                    handleSave={handleSave}
                    onTaskDayEdit={setLastPlannedDay}
                    formatCurrency={formatCurrency}
                  />
                ))
              ) : (
                <Tr>
                  <Td colSpan={40} className="text-center py-8 text-gray-500">
                    No se encontraron resultados para tu búsqueda.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </TableContainer>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50 dark:bg-[#333] dark:text-gray-200"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-[#1a9888] bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50 dark:bg-[#333] dark:text-gray-200"
          >
            Siguiente <ChevronRight size={16} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ir a:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            className="w-16 px-2 py-1 text-sm border rounded-md dark:bg-[#333] dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs font-bold text-white bg-gray-600 rounded-md"
          >
            IR
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
      />

      {/* MODAL DE RUTA */}
      {showRouteModal && (
        <RoutePreviewModal
          isOpen={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          onConfirm={confirmData.onConfirm}
          clientData={confirmData.clientData}
          vendorName={confirmData.vendorName}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default BaseDatosBitrix;
