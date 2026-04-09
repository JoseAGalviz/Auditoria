/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { generatePlanificacionPDF } from "../utils/pdfGeneratorPlanificacion";
import { apiService } from "../services/apiService";
import {
  Calendar,
  RefreshCw,
  Search,
  MapPin,
  Briefcase,
  ChevronDown,
  User,
  Filter,
  X,
  Download,
  Lock,
  AlertCircle,
} from "lucide-react";
import StarRating from "../components/StarRating";
import { RoutePreviewModal } from "../components/ui/RoutePreviewModal"; // Importar RoutePreviewModal

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

const normalizeGestion = (gestion) => {
  if (!gestion) return [];
  if (Array.isArray(gestion)) return gestion;
  if (typeof gestion === "object" && Object.keys(gestion).length > 0) return [gestion];
  return [];
};

const getGestiones = (item) => {
  const itemGestiones = normalizeGestion(item.gestion);
  const fullDataGestiones = normalizeGestion(item.full_data?.gestion);
  return itemGestiones.length > 0 ? itemGestiones : fullDataGestiones;
};

// --- COMPONENTES UI ---


const PlanificacionHeader = ({
  headerData,
  itemCount,
  isExpanded,
  onClick,
  totalVencido,
  onDownload,
  rating,
  ratingUser,
  onRate,
  disabled,
  cumplimiento,
}) => {
  const user =
    headerData.usuario ||
    headerData.vendedor ||
    headerData.co_ven ||
    headerData.full_data?.co_ven ||
    "No Identificado";

  const vendorDisplay =
    headerData.vendedor || headerData.co_ven || headerData.full_data?.co_ven;

  // Determinar color cumplimiento
  let colorCumplimiento = "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";
  if (cumplimiento?.porcentaje >= 80) {
    colorCumplimiento = "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300";
  } else if (cumplimiento?.porcentaje >= 50) {
    colorCumplimiento = "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300";
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-[#151926] border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1e2436] transition-all group"
    >
      {/* --- SECCIÓN IZQUIERDA: Info del Plan --- */}
      <div className="flex items-center gap-4">
        <button
          className={`p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={16} />
        </button>
        <div>
          <h3 className="font-bold text-slate-700 dark:text-gray-200 text-base sm:text-lg group-hover:text-[#1a9888] transition-colors">
            Planificación del{" "}
            <span className="capitalize">
              {formatDate(headerData.fecha_registro)}
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
              <User size={12} /> {user}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={12} /> {itemCount} Clientes
            </span>
            {headerData.id_planificacion && (
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                ID Plan: {headerData.id_planificacion}
              </span>
            )}
            {vendorDisplay && (
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                {vendorDisplay}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DERECHA: Valoración + Botón Descarga + Total Vencido --- */}
      <div className="mt-4 md:mt-0 flex flex-wrap sm:flex-nowrap items-center gap-3 self-end md:self-auto">
        {/* ZONA DE VALORACIÓN (MEJORADA Y VISIBLE) */}
        <div
          className={`flex flex-col items-center sm:items-end justify-center px-3 py-1.5 rounded-lg border transition-all ${
            disabled
              ? "bg-slate-50 border-slate-200 dark:bg-[#1a1f2e] dark:border-slate-700"
              : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 shadow-sm ring-1 ring-amber-100 dark:ring-amber-900/30"
          }`}
        >
          <StarRating rating={rating} onRate={onRate} disabled={disabled} />
          {ratingUser && rating > 0 ? (
            <div className="flex items-center gap-1 mt-1">
              <Lock size={10} className="text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Por:{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                  {ratingUser}
                </span>
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 leading-none animate-pulse">
              Pendiente de evaluar
            </span>
          )}
        </div>

        {/* LÍNEA DIVISORIA (Opcional, para separar las estrellas de los botones) */}
        <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* BOTÓN DESCARGAR INDIVIDUAL */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400 transition-colors shadow-sm"
          title="Descargar PDF de esta planificación"
        >
          <Download size={18} />
        </button>

        {/* CUMPLIMIENTO (NUEVO) */}
        {cumplimiento && (
          <div
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border shadow-sm ${colorCumplimiento}`}
            title={`Gestiones Realizadas: ${cumplimiento.gestionesRealizadas} / Total Clientes: ${cumplimiento.clientesPlanificados}`}
          >
            <span className="text-[10px] uppercase font-bold opacity-80 leading-none mb-1">
              Cumplimiento
            </span>
            <span className="text-sm font-bold leading-none">
              {cumplimiento.porcentaje}%
            </span>
          </div>
        )}

        {/* TOTAL VENCIDO */}
        {totalVencido > 0 && (
          <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-red-400">
                Total Vencido
              </span>
              <span className="font-bold text-red-600 dark:text-red-400 font-mono text-sm">
                {formatCurrency(totalVencido)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlanificacionTable = ({ items }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead className="bg-white dark:bg-[#1a1f2e] text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800 tracking-wider">
        <tr>
          <th className="p-4 w-1/4">Cliente / Ruta</th>
          <th className="p-4 w-1/4">Estado Financiero</th>
          <th className="p-4 w-1/2">Tarea / Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item) => {
          const gestiones = getGestiones(item);
          const hasGestion = gestiones.length > 0;

          return (
            <tr
              key={item.id}
              className={`transition-colors ${
                !hasGestion
                  ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40"
                  : "hover:bg-gray-50 dark:hover:bg-[#1e2436]/50"
              }`}
            >
              {/* Columna Cliente */}
              <td className="p-4 align-top">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
                      {item.nombre_cliente}
                    </span>
                    {!hasGestion && (
                      <div
                        title="Vendedor no registró visita"
                        className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800"
                      >
                        <AlertCircle size={10} />
                        Sin Visita
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">
                      {item.codigo_profit}
                    </span>
                  </div>
                  {item.full_data?.segmento && (
                    <span className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-medium bg-teal-50 dark:bg-teal-900/20 w-fit px-2 py-0.5 rounded-full">
                      <MapPin size={10} />
                      {item.full_data.segmento}
                    </span>
                  )}
                </div>
              </td>

              {/* Columna Finanzas */}
              <td className="p-4 align-top">
                <div className="flex flex-col gap-2 text-xs">
                  {item.full_data?.saldo_vencido > 0 ? (
                    <div className="flex justify-between items-center p-1.5 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400">
                      <span className="font-semibold">Vencido</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(item.full_data.saldo_vencido)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-[10px]">
                      Sin saldo vencido
                    </span>
                  )}

                  {item.full_data?.saldo_transito > 0 && (
                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 px-1">
                      <span>Tránsito:</span>
                      <span className="font-mono">
                        {formatCurrency(item.full_data.saldo_transito)}
                      </span>
                    </div>
                  )}
                  {item.full_data?.limite_credito && (
                    <div className="flex justify-between items-center text-gray-500 px-1">
                      <span>Límite:</span>
                      <span className="font-mono">
                        {formatCurrency(Number(item.full_data.limite_credito))}
                      </span>
                    </div>
                  )}
                  {item.full_data?.fecha_compra && (
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 px-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span>Últ. Compra:</span>
                      <span className="font-mono text-[10px]">{item.full_data.fecha_compra}</span>
                    </div>
                  )}
                </div>
              </td>

              {/* Columna Tarea / Acción */}
              <td className="p-4 align-top">
                {(() => {
                  const tarea = item.gestion?.tarea || item.full_data?.tarea;
                  const accion = item.gestion?.accion || item.full_data?.accion;
                  const isCobranza = tarea?.toLowerCase().includes("cobranza");

                  return (
                    <div className="flex flex-col gap-2">
                      {tarea || accion ? (
                        <div className={`p-3 rounded-lg border text-xs ${
                          isCobranza
                            ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300"
                            : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                        }`}>
                          {tarea && <p className="font-semibold">{tarea}</p>}
                          {accion && <p className="mt-1 italic opacity-80">{accion}</p>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Sin tarea registrada</span>
                      )}

                      {gestiones.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {gestiones.map((g, gi) => {
                            const tipoGestion = g.venta_tipoGestion || g.cobranza_tipoGestion || g.tipo_gestion || null;
                            const descripcion = g.venta_descripcion || g.cobranza_descripcion || null;
                            const esConcretada = tipoGestion === "concretada";
                            const fechaGestion = g.fecha_registro
                              ? new Date(g.fecha_registro.replace(" ", "T")).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
                              : null;

                            return (
                              <div
                                key={gi}
                                className={`flex flex-col gap-0.5 px-2 py-1.5 rounded text-[10px] border ${
                                  esConcretada
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                                    : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${esConcretada ? "bg-emerald-500" : "bg-gray-400"}`} />
                                  {tipoGestion && (
                                    <span className="font-bold uppercase">{tipoGestion}</span>
                                  )}
                                  {fechaGestion && (
                                    <span className="ml-auto opacity-70">{fechaGestion}</span>
                                  )}
                                </div>
                                {descripcion && (
                                  <p className="pl-3.5 italic opacity-80 leading-snug">{descripcion}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {item.obs_ejecutiva && (
                  <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-2 rounded-lg flex gap-2 items-start">
                    <span className="font-bold">Nota:</span>
                    <span className="italic">"{item.obs_ejecutiva}"</span>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const PlanificacionGroup = memo(({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const initialRating = items[0]?.rating_star || 0;
  const initialRatingUser = items[0]?.rating_user || null;
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [currentRatingUser, setCurrentRatingUser] = useState(initialRatingUser);
  const [showRouteModal, setShowRouteModal] = useState(false); // Estado para el modal del mapa

  const isLocked = currentRating > 0;

  // Todos los hooks ANTES del return condicional
  const headerData = items[0] ?? {};
  const idPlanificacion = headerData.id_planificacion;

  const totalVencido = useMemo(
    () => items.reduce((acc, item) => acc + (item.full_data?.saldo_vencido || 0), 0),
    [items],
  );

  const cumplimientoData = useMemo(() => {
    const clientesPlanificados = items.length;
    const gestionesRealizadas = items.filter((item) => {
      const gestiones = getGestiones(item);
      return gestiones.length > 0;
    }).length;
    const porcentaje = clientesPlanificados > 0
      ? Math.round((gestionesRealizadas / clientesPlanificados) * 100)
      : 0;
    return { gestionesRealizadas, clientesPlanificados, porcentaje };
  }, [items]);

  const handleDownload = useCallback(() => {
    setShowRouteModal(true);
  }, []);

  const handleConfirmDownload = useCallback(() => {
    setShowRouteModal(false);
    generatePlanificacionPDF(items, new Date(headerData.fecha_registro));
  }, [items, headerData.fecha_registro]);

  const handleRate = useCallback(async (newRating) => {
    let evaluadorActual = "Usuario";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        evaluadorActual = userObj.usuario || "Usuario";
      }
    } catch (error) {
      evaluadorActual = localStorage.getItem("user") || "Usuario";
    }

    setCurrentRating(newRating);
    setCurrentRatingUser(evaluadorActual);

    try {
      await apiService.ratePlanificacion(idPlanificacion, newRating, evaluadorActual);
    } catch (error) {
      console.error("Error al valorar:", error);
      setCurrentRating(initialRating);
      setCurrentRatingUser(initialRatingUser);
    }
  }, [idPlanificacion, initialRating, initialRatingUser]);

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <PlanificacionHeader
        headerData={headerData}
        itemCount={items.length}
        isExpanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        totalVencido={totalVencido}
        onDownload={handleDownload}
        rating={currentRating}
        ratingUser={currentRatingUser}
        onRate={handleRate}
        disabled={isLocked}
        cumplimiento={cumplimientoData} // Pasando la prop
      />
      {isExpanded && <PlanificacionTable items={items} />}
      
      {/* Modal de Mapa */}
      {showRouteModal && (
        <RoutePreviewModal
          isOpen={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          onConfirm={handleConfirmDownload}
          clientData={items.map((item) => ({
            ...item,
            nombre: item.nombre_cliente,
            coordenadas: item.full_data?.coordenadas, // Asegurarse de tener las coordenadas aquí
          }))}
          vendorName={headerData.vendedor || "Vendedor"}
        />
      )}
    </div>
  );
});

// --- COMPONENTE PRINCIPAL ---

const Planificaciones = () => {
  // Estado
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRutas, setSelectedRutas] = useState([]);
  const todayISO = new Date().toLocaleDateString("en-CA");
  const [filterDate, setFilterDate] = useState(todayISO);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [rutaSearchTerm, setRutaSearchTerm] = useState("");

  // Ref para cerrar el menú al hacer click fuera
  const menuRef = useRef(null);

  // Carga de datos — se re-ejecuta cuando cambia la fecha del filtro
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fecha = filterDate || todayISO;
        const response = await apiService.getPlanificacion({ fecha });
        const cleanData = Array.isArray(response)
          ? response
          : response?.data || [];
        setData(cleanData);
      } catch (error) {
        console.error("Error cargando planificaciones:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterDate]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de Rutas (Memoizada)
  const uniqueRutas = useMemo(() => {
    const rutas = new Set();
    data.forEach((item) => {
      if (item.full_data?.segmento) rutas.add(item.full_data.segmento);
    });
    return Array.from(rutas).sort();
  }, [data]);

  const filteredUniqueRutas = useMemo(
    () =>
      uniqueRutas.filter((ruta) =>
        ruta.toLowerCase().includes(rutaSearchTerm.toLowerCase()),
      ),
    [uniqueRutas, rutaSearchTerm],
  );

  // Filtrado y Agrupamiento Principal (Memoizado)
  const groupedData = useMemo(() => {

    // --- 2. FILTRADO ---
    const filtered = data.filter((item) => {
      const matchesSearch =
        item.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo_profit?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRuta =
        selectedRutas.length === 0 ||
        selectedRutas.includes(item.full_data?.segmento);

      return matchesSearch && matchesRuta;
    });

    // --- 3. AGRUPAMIENTO ---
    const groups = filtered.reduce((acc, item) => {
      const rawId = String(item.id_planificacion || "").trim();
      const groupId = rawId ? `id-${rawId}` : "sin-id";

      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(item);
      return acc;
    }, {});

    // --- 4. ORDENAMIENTO (Guardamos en variable, no retornamos todavía) ---
    const sortedGroups = Object.entries(groups).sort(
      ([, itemsA], [, itemsB]) => {
        const fechaA = itemsA[0]?.fecha_registro;
        const fechaB = itemsB[0]?.fecha_registro;
        const timeA = fechaA ? new Date(fechaA).getTime() : 0;
        const timeB = fechaB ? new Date(fechaB).getTime() : 0;
        return timeB - timeA;
      },
    );

    // --- 6. RETORNO FINAL ---
    return sortedGroups;
  }, [data, searchTerm, selectedRutas]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#1a9888] animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            Sincronizando planificaciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl shadow-sm border border-teal-100 dark:border-teal-900/30">
            <Calendar size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Registros{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Guardados
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Gestión y seguimiento de visitas semanales
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#1a9888]">
              <Calendar size={18} />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a9888] focus:border-transparent transition-all shadow-sm cursor-pointer"
            />
            {/* Botón X pequeña para limpiar fecha si está seleccionada */}
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 rounded-full p-1 transition-colors"
                title="Limpiar fecha"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {/* 1. Buscador de Texto */}
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#1a9888] transition-colors" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a9888] focus:border-transparent transition-all shadow-sm"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 2. Selector Rutas Custom */}
          <div className="relative w-full md:w-72" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-between w-full pl-3 pr-3 py-2.5 border rounded-xl bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-white transition-all shadow-sm ${
                isMenuOpen || selectedRutas.length > 0
                  ? "border-[#1a9888] ring-1 ring-[#1a9888]"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Filter
                  size={18}
                  className={`shrink-0 ${
                    selectedRutas.length > 0
                      ? "text-[#1a9888]"
                      : "text-gray-400"
                  }`}
                />
                <span className="text-sm truncate font-medium block text-left">
                  {selectedRutas.length === 0
                    ? "Todas las rutas"
                    : `${selectedRutas.length} seleccionadas`}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Menú Desplegable */}
            {isMenuOpen && (
              <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 md:max-h-96 flex flex-col overflow-hidden animation-fade-in-down">
                <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151926] shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-7 pr-7 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-[#0b1120] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1a9888]"
                      placeholder="Filtrar..."
                      value={rutaSearchTerm}
                      onChange={(e) => setRutaSearchTerm(e.target.value)}
                    />
                    {rutaSearchTerm && (
                      <button
                        onClick={() => setRutaSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {selectedRutas.length > 0 && (
                    <button
                      onClick={() => setSelectedRutas([])}
                      className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase w-full text-center hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded transition-colors"
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
                <div className="p-1 overflow-y-auto custom-scrollbar">
                  {filteredUniqueRutas.length > 0 ? (
                    filteredUniqueRutas.map((ruta) => (
                      <div
                        key={ruta}
                        onClick={() => {
                          setSelectedRutas((prev) =>
                            prev.includes(ruta)
                              ? prev.filter((r) => r !== ruta)
                              : [...prev, ruta]
                          );
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer group transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex shrink-0 items-center justify-center transition-colors ${
                            selectedRutas.includes(ruta)
                              ? "bg-[#1a9888] border-[#1a9888]"
                              : "border-gray-300 dark:border-gray-600 group-hover:border-[#1a9888]"
                          }`}
                        >
                          {selectedRutas.includes(ruta) && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium truncate ${
                            selectedRutas.includes(ruta)
                              ? "text-[#1a9888]"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {ruta}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400 italic">
                      No hay resultados
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listado de Grupos */}
      <div className="space-y-6">
        {groupedData.map(([id, items]) => (
          <PlanificacionGroup key={id} id_planificacion={id} items={items} />
        ))}

        {!loading && groupedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-[#151926] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
              <Search size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center">
              Intenta ajustar los términos de búsqueda o limpiar los filtros de
              ruta.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRutas([]);
                setFilterDate("");
              }}
              className="mt-6 text-sm font-medium text-[#1a9888] hover:text-[#158072] hover:underline"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Planificaciones;
