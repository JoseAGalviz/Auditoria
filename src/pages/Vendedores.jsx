/* eslint-disable react-hooks/set-state-in-effect */
import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Search,
  TrendingUp,
  Target,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { useTableroVendedores } from "../hooks/useTableroVendedores";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../components/ui/Tabla";

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(
    val || 0,
  );

const formatPercent = (val) => `${Number(val || 0).toFixed(0)}%`;

const formatDateLocal = (dateInput = new Date()) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const StatCard = ({ label, value, icon: Icon, colorHex }) => (
  <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
    <div
      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
      style={{ color: colorHex }}
    >
      {Icon && <Icon size={24} />}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-800 dark:text-white leading-none mt-1">
        {value}
      </p>
    </div>
  </div>
);

// --- COMPONENTE DE ALERTA VISUAL (PUNTITO ROJO) ---
const RedDotAlert = () => (
  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm shadow-rose-900/50"></span>
  </span>
);

const ObservacionCell = ({ valorInicial, onGuardar }) => {
  const [valor, setValor] = useState(valorInicial);
  useEffect(() => setValor(valorInicial), [valorInicial]);

  const handleBlur = () => {
    if (valor !== valorInicial) onGuardar(valor);
  };

  return (
    <textarea
      className="w-full h-16 p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#1a9888] focus:border-transparent outline-none resize-none placeholder-gray-300 dark:text-white transition-all"
      placeholder="Nota..."
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) e.target.blur();
      }}
    />
  );
};

const Vendedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));
  // Alertas automáticas: visibles desde las 5:00 PM hasta las 8:00 AM del día siguiente
  const currentHour = new Date().getHours();
  const isAlertTime = currentHour >= 17 || currentHour < 8;

  const timeStrToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length < 2) return null;
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (isNaN(hh) || isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const LIMITE_SALIDA = 8 * 60 + 45; // 8:45 AM
  // 3. LÍMITE DE LLEGADA CAMBIADO A 6:00 PM
  const LIMITE_LLEGADA = 18 * 60; // 6:00 PM

  const { showToast, ToastContainer } = useToast();

  // 4. PASAMOS EL RANGO AL HOOK
  const {
    vendedores: rawData,
    loading,
    actualizarObservacion,
  } = useTableroVendedores(selectedDate);

  const filteredData = useMemo(() => {
    if (!searchTerm) return rawData;
    const term = searchTerm.toLowerCase();
    return rawData.filter((v) => v.vendedor.toLowerCase().includes(term));
  }, [rawData, searchTerm]);

  const totals = useMemo(() => {
    return {
      logrados: filteredData.reduce(
        (acc, curr) => acc + curr.reportesLogrados,
        0,
      ),
      establecidos: filteredData.reduce(
        (acc, curr) => acc + curr.reportesEstablecidos,
        0,
      ),
      cobrado: filteredData.reduce((acc, curr) => acc + curr.cobradoDia, 0),
    };
  }, [filteredData]);

  const totalCumplimiento =
    totals.establecidos > 0 ? (totals.logrados / totals.establecidos) * 100 : 0;

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#1a9888] animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            Sincronizando Profit & Planificación...
          </p>
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <Users size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Tabla de{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Vendedores
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Auditoría Profit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#1a9888]/20 dark:text-white text-sm font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <label
              htmlFor="filtro-dia-vendedores"
              className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap"
            >
              Día
            </label>
            <input
              id="filtro-dia-vendedores"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Visitas Logradas"
          value={totals.logrados}
          icon={CheckCircle2}
          colorHex="#059669"
        />
        <StatCard
          label="% Cumplimiento"
          value={formatPercent(totalCumplimiento)}
          icon={TrendingUp}
          colorHex={totalCumplimiento >= 90 ? "#059669" : "#d97706"}
        />
        <StatCard
          label="Cobrado Hoy"
          value={formatCurrency(totals.cobrado)}
          icon={Target}
          colorHex="#2563eb"
        />
      </div>

      {/* TABLA */}
      <TableContainer className="shadow-none border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#111827]">
        <Table>
          <Thead>
            <tr className="uppercase leading-tight">
              {/* Encabezados de tabla */}
              <Th className="bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 min-w-50 border-b dark:border-gray-700 font-bold">
                Vendedores_P Profit
              </Th>
              <Th className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                Primer Registro del Vendedor
              </Th>
              <Th className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                Ultimo Registro del Vendedor
              </Th>
              <Th className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                Rep. Establecidos
              </Th>
              <Th className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                Rep. Logrados
              </Th>
              <Th className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                % Visitas
              </Th>
              {/* <Th className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b dark:border-gray-700 font-bold">
                Logrado (Resta)
              </Th> */}
              <Th className="bg-indigo-50 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 border-b dark:border-gray-700 font-bold">
                Negoc.
              </Th>
              <Th className="bg-orange-50 dark:bg-orange-900 text-orange-900 dark:text-orange-100 min-w-30 border-b dark:border-gray-700 font-bold">
                Cobrado Día
              </Th>
              <Th className="bg-amber-50 dark:bg-amber-900 text-amber-900 dark:text-amber-100 min-w-30 border-b dark:border-gray-700 font-bold">
                Ventas (Día)
              </Th>
              <Th className="bg-cyan-50 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100 border-b dark:border-gray-700 font-bold">
                Cartera Activa del Mes
              </Th>
              <Th className="bg-cyan-50 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100 border-b dark:border-gray-700 font-bold">
                % Meta
              </Th>
              <Th className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-b dark:border-gray-700 font-bold">
                Nuevos
              </Th>
              <Th className="bg-rose-50 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-b dark:border-gray-700 font-bold">
                Gest. Planif.
              </Th>
              <Th className="bg-rose-50 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-b dark:border-gray-700 font-bold whitespace-nowrap px-2">
                Gest. Planif. Efec
              </Th>
              <Th className="bg-rose-50 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-b dark:border-gray-700 font-bold">
                % Planif.
              </Th>
              <Th className="bg-sky-50 dark:bg-sky-900 text-sky-900 dark:text-sky-100 border-b dark:border-gray-700 font-bold">
                Pedidos Realizados
              </Th>
              <Th className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 min-w-50 border-b dark:border-gray-700 font-bold">
                Observación
              </Th>
            </tr>
          </Thead>

          <Tbody>
            {filteredData.length === 0 ? (
              <Tr>
                <Td colSpan={18} className="py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={40} strokeWidth={1} />
                    <p className="font-medium">No se encontraron vendedores</p>
                  </div>
                </Td>
              </Tr>
            ) : (
              filteredData.map((row) => {
                const percVisitas =
                  row.reportesEstablecidos > 0
                    ? (row.visitasApp / row.reportesEstablecidos) * 100
                    : 0;
                const percMetaMensual =
                  row.metaVentasMensual > 0
                    ? (row.ventas / row.metaVentasMensual) * 100
                    : 0;
                const percPlanificado =
                  row.reportesEstablecidos > 0
                    ? (row.gestionesEfectivas / row.reportesEstablecidos) * 100
                    : 0;

                const carteraPercent =
                  typeof row.carteraActiva === "number" &&
                    row.carteraActiva <= 100
                    ? row.carteraActiva
                    : null;
                const ventasPercent =
                  typeof row.ventas_factura_sum === "number" &&
                    row.ventas_factura_sum <= 100
                    ? row.ventas_factura_sum
                    : null;
                return (
                  <Tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1a2333]"
                  >
                    <Td
                      align="left"
                      className="font-black border-r border-gray-200 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200"
                    >
                      <div className="flex items-center gap-1.5">
                        {row.vendedor}
                        {row.sinKpi && (
                          <span
                            title="Este vendedor no tiene datos cargados en Profit/KPI aún"
                            className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700 uppercase tracking-wide"
                          >
                            Sin KPI
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="relative">
                      {row.horaSalida}
                      {isAlertTime &&
                        timeStrToMinutes(row.hora_1_ven) > LIMITE_SALIDA && (
                          <RedDotAlert />
                        )}
                    </Td>
                    <Td className="relative">
                      {row.horaLlegada}
                      {isAlertTime &&
                        timeStrToMinutes(row.hora_2_ven) < LIMITE_LLEGADA && (
                          <RedDotAlert />
                        )}
                    </Td>
                    <Td className="font-medium text-center relative">
                      {row.reportesEstablecidos}
                      {isAlertTime &&
                        row.reportesEstablecidos > 0 &&
                        row.visitasApp < row.reportesEstablecidos && (
                          <RedDotAlert />
                        )}
                    </Td>
                    <Td className="font-bold text-center text-slate-900 dark:text-white">
                      {row.visitasApp}
                    </Td>

                    {/* CELDA % VISITAS CON ALERTA */}
                    <Td className="text-center relative">
                      <span
                        className={`px-2 py-1 rounded-md text-[11px] font-bold border ${percVisitas >= 80 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"}`}
                      >
                        {formatPercent(percVisitas)}
                      </span>
                      {isAlertTime && percVisitas < 80 && <RedDotAlert />}
                    </Td>

                    <Td className="text-center relative">
                      {row.negociaciones}
                      {isAlertTime && (row.negociaciones ?? 0) < 1 && (
                        <RedDotAlert />
                      )}
                    </Td>
                    <Td className="text-right text-blue-600 dark:text-blue-400 font-bold text-xs">
                      {formatCurrency(row.cobradoDia)}
                    </Td>
                    <Td className="text-right text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {formatCurrency(row.ventas_factura_sum)}
                    </Td>

                    {/* CELDA CARTERA CON ALERTA */}
                    <Td className="text-center relative">
                      {row.carteraActiva}
                      {isAlertTime &&
                        carteraPercent != null &&
                        carteraPercent < 80 && <RedDotAlert />}
                    </Td>

                    {/* CELDA % META CON ALERTA */}
                    <Td className="text-center font-bold relative">
                      {formatPercent(percMetaMensual)}
                      {isAlertTime && percMetaMensual < 80 && <RedDotAlert />}
                    </Td>

                    <Td className="text-center text-blue-500 font-bold">
                      {row.clientesNew}
                    </Td>
                    <Td className="text-center">
                      {row.gestionesPlanificacion}
                    </Td>

                    <Td className="text-center font-bold text-rose-600 dark:text-rose-400">
                      {row.gestionesEfectivas || 0}
                    </Td>

                    {/* CELDA % PLANIFICACIÓN CON ALERTA */}
                    <Td className="text-center font-bold text-rose-600 dark:text-rose-400 relative">
                      {formatPercent(percPlanificado)}
                      {isAlertTime && percPlanificado < 70 && <RedDotAlert />}
                    </Td>
                    <Td className="text-center font-bold text-slate-900 dark:text-white">
                      {row.totalPedidos}
                    </Td>

                    <Td className="p-2 relative">
                      <ObservacionCell
                        valorInicial={row.observacionManual}
                        onGuardar={(nuevoTexto) => {
                          actualizarObservacion(row.vendedor, nuevoTexto);
                          showToast(
                            "Observación guardada correctamente",
                            "success",
                          );
                        }}
                      />
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
      <ToastContainer />
    </div>
  );
};

export default Vendedores;
