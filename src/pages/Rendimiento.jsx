/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { generateRendimientoExcel } from "../utils/ExcelExporter";
import { apiService } from "../services/apiService";
import {
  TrendingUp,
  RefreshCw,
  Download,
  Search,
  Users,
  BarChart3,
  CheckCircle2,
  PieChart,
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

// --- HELPERS ---
const formatNumber = (val) => new Intl.NumberFormat("es-ES").format(val || 0);
const formatPercent = (val) => `${Number(val || 0).toFixed(1)}%`;

const parseDateVal = (dateInput) => {
  if (!dateInput) return null;
  let dateStr = String(dateInput).trim();
  if (dateStr === "—" || dateStr === "-" || !dateStr) return null;
  if (dateStr.includes(" ")) dateStr = dateStr.split(" ")[0];

  let date;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/").map((n) => parseInt(n, 10));
    // DD/MM/YYYY local time
    if (parts.length === 3)
      date = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
  } else if (dateStr.includes("-")) {
    const parts = dateStr.split("-").map((n) => parseInt(n, 10));
    if (parts.length === 3) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD local time
        date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      } else {
        date = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
      }
    }
  } else {
    // Falback
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      date = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        12,
        0,
        0,
      );
    }
  }
  if (!date || isNaN(date.getTime())) return null;
  return date;
};

// --- COMPONENTES VISUALES ---

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

const PercentBadge = ({ value }) => {
  const num = parseFloat(value);
  let styles =
    "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";

  if (num >= 80) {
    styles =
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  } else if (num >= 50) {
    styles =
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  }

  return (
    <span
      className={`px-2 py-1 rounded-md text-[11px] font-bold border ${styles}`}
    >
      {formatPercent(value)}
    </span>
  );
};

const Rendimiento = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString(),
  );
  const [selectedWeek, setSelectedWeek] = useState("all");

  const [rawClients, setRawClients] = useState([]);
  const [rawMatrixMap, setRawMatrixMap] = useState(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [clientesRes, matrizRes] = await Promise.all([
        apiService.getAllCompanies(),
        apiService.getMatrix(),
      ]);

      let clients = [];
      if (clientesRes && clientesRes.data && Array.isArray(clientesRes.data)) {
        clients = clientesRes.data;
      } else if (Array.isArray(clientesRes)) {
        clients = clientesRes;
      }
      setRawClients(clients);

      // --- CAMBIO CLAVE AQUÍ ---
      // Ahora guardamos la "fecha_registro" que viene de la base de datos junto con el JSON
      const matrixMap = new Map();
      const rawMatrix = matrizRes.data || matrizRes || [];
      if (Array.isArray(rawMatrix)) {
        rawMatrix.forEach((item) => {
          if (item.id_bitrix) {
            matrixMap.set(String(item.id_bitrix), {
              dataJSON: item.auditoria_matriz,
              fechaRegistro: item.fecha_registro, // Plan B: fecha extraída de la columna de DB
            });
          }
        });
      }
      setRawMatrixMap(matrixMap);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ... (mantenemos los imports y los helpers parseDateVal, StatCard, etc. igual que antes)

  const processData = useCallback(
    (clients, matrixMap) => {
      try {
        // Convertimos el mes seleccionado a número para comparar sin errores
        const selMonthNum =
          selectedMonth !== "all" ? parseInt(selectedMonth, 10) : null;
        const selWeekNum =
          selectedWeek !== "all" ? parseInt(selectedWeek, 10) : null;

        const segmentosUnicos = [
          ...new Set(
            clients
              .map((c) => c.bitrix?.UF_CRM_1638457710)
              .filter((seg) => seg && seg.trim() !== ""),
          ),
        ].sort();

        const processedData = segmentosUnicos.map((segmentoNombre, index) => {
          const clientesDelSegmento = clients.filter(
            (c) => c.bitrix?.UF_CRM_1638457710 === segmentoNombre,
          );

          let exec_efectivos = 0;
          let exec_no_efectivos = 0;
          let vend_efectivos = 0;
          let vend_no_efectivos = 0;
          let gestiones_reales_con_gestion = 0;
          let clientes_sin_gestion = 0;

          clientesDelSegmento.forEach((cliente) => {
            const bitrixID = String(cliente.bitrix?.ID || "");

            // Lógica de Venta 2024+
            let purchaseYear = 0;
            const fCompra = cliente.profit?.fecha_ultima_compra || "";
            if (fCompra) {
              const p = fCompra.includes("-")
                ? fCompra.split("-")
                : fCompra.split("/");
              purchaseYear = parseInt(p[0] > 1000 ? p[0] : p[2]);
            }
            const isEligible =
              purchaseYear >= 2024 &&
              (cliente.bitrix?.UF_CRM_1634787828 || "—") !== "—";

            let cumpleConGestion = false;
            let tieneActividadEnMatriz = false;

            // --- GESTIÓN EJECUTIVA (MATRIZ) ---
            const matrixRecord = matrixMap.get(bitrixID);
            if (matrixRecord) {
              let auditData = null;
              try {
                auditData =
                  typeof matrixRecord.dataJSON === "string"
                    ? JSON.parse(matrixRecord.dataJSON)
                    : matrixRecord.dataJSON;
              } catch (e) {
                auditData = null;
              }

              if (auditData) {
                const dias = [
                  "lunes",
                  "martes",
                  "miercoles",
                  "jueves",
                  "viernes",
                  "sabado",
                ];
                dias.forEach((dia) => {
                  const diaLog = auditData[dia];
                  if (diaLog) {
                    let pasaFiltro = true;

                    // Decidir qué fecha usar: la del check o la del registro general
                    const fechaParaFiltrar =
                      diaLog.fecha || matrixRecord.fechaRegistro;
                    const dDate = parseDateVal(fechaParaFiltrar);

                    if (dDate) {
                      const m = dDate.getMonth();
                      const d = dDate.getDate();
                      const y = dDate.getFullYear();
                      const currentYear = new Date().getFullYear();

                      // 1. Filtro Mes
                      if (selMonthNum !== null) {
                        if (m !== selMonthNum || y !== currentYear)
                          pasaFiltro = false;
                      }

                      // 2. Filtro Semana
                      if (pasaFiltro && selWeekNum !== null) {
                        if (selWeekNum === 1 && d > 7) pasaFiltro = false;
                        else if (selWeekNum === 2 && (d < 8 || d > 14))
                          pasaFiltro = false;
                        else if (selWeekNum === 3 && (d < 15 || d > 21))
                          pasaFiltro = false;
                        else if (selWeekNum === 4 && (d < 22 || d > 28))
                          pasaFiltro = false;
                        else if (selWeekNum === 5 && d < 29) pasaFiltro = false;
                      }
                    } else {
                      // Si no hay fecha en absoluto, solo pasa si no hay filtros activos
                      if (selMonthNum !== null || selWeekNum !== null)
                        pasaFiltro = false;
                    }

                    if (pasaFiltro) {
                      const vOk = diaLog.accion_venta?.e === true;
                      const cOk = diaLog.accion_cobranza?.e === true;
                      if (vOk || cOk) exec_efectivos++;

                      const vFail =
                        diaLog.accion_venta?.n || diaLog.accion_venta?.p;
                      const cFail =
                        diaLog.accion_cobranza?.n || diaLog.accion_cobranza?.p;
                      if ((vFail || cFail) && !vOk && !cOk) exec_no_efectivos++;

                      // Con Gestión (Consolidado)
                      if (isEligible) {
                        const hasWa =
                          diaLog.inicio_whatsapp?.e ||
                          diaLog.inicio_whatsapp?.c;
                        const hasCall =
                          diaLog.llamadas_venta?.e ||
                          diaLog.llamadas_venta?.p ||
                          diaLog.llamadas_venta?.n;
                        if (hasWa || hasCall) cumpleConGestion = true;
                      }
                      tieneActividadEnMatriz = true;
                    }
                  }
                });
              }
            }

            // --- GESTIÓN VENDEDOR ---
            const gestiones = cliente.gestion || [];
            gestiones.forEach((g) => {
              const gDate = parseDateVal(g.fecha_registro || g.fecha_creacion);
              if (!gDate) return;

              let pasaV = true;
              if (selMonthNum !== null) {
                if (
                  gDate.getMonth() !== selMonthNum ||
                  gDate.getFullYear() !== new Date().getFullYear()
                )
                  pasaV = false;
              }
              if (pasaV && selWeekNum !== null) {
                const d = gDate.getDate();
                if (selWeekNum === 1 && d > 7) pasaV = false;
                else if (selWeekNum === 2 && (d < 8 || d > 14)) pasaV = false;
                else if (selWeekNum === 3 && (d < 15 || d > 21)) pasaV = false;
                else if (selWeekNum === 4 && (d < 22 || d > 28)) pasaV = false;
                else if (selWeekNum === 5 && d < 29) pasaV = false;
              }

              if (pasaV) {
                if (
                  g.venta_tipoGestion === "concretada" ||
                  g.cobranza_tipoGestion === "concretada"
                )
                  vend_efectivos++;
                else vend_no_efectivos++;
              }
            });

            if (!tieneActividadEnMatriz) clientes_sin_gestion++;
            if (cumpleConGestion) gestiones_reales_con_gestion++;
          });

          return {
            id: index,
            segmento: segmentoNombre,
            total_clientes: clientesDelSegmento.length,
            ejecutiva: {
              efectivos: exec_efectivos,
              no_efectivos: exec_no_efectivos,
            },
            vendedor: {
              efectivos: vend_efectivos,
              no_efectivos: vend_no_efectivos,
            },
            gestiones_reales: gestiones_reales_con_gestion,
            sin_gestiones: clientes_sin_gestion,
          };
        });

        setData(processedData);
      } catch (error) {
        console.error("Error calculando rendimiento:", error);
      }
    },
    [selectedMonth, selectedWeek],
  );

  useEffect(() => {
    if (rawClients.length > 0) {
      processData(rawClients, rawMatrixMap);
    }
  }, [selectedMonth, selectedWeek, rawClients, rawMatrixMap, processData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      item.segmento.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, curr) => {
        acc.total_clientes += curr.total_clientes;
        acc.ejecutiva_efectivos += curr.ejecutiva.efectivos;
        acc.ejecutiva_no += curr.ejecutiva.no_efectivos;
        acc.vendedor_efectivos += curr.vendedor.efectivos;
        acc.vendedor_no += curr.vendedor.no_efectivos;
        acc.gestiones_reales += curr.gestiones_reales || 0;
        acc.sin_gestiones += curr.sin_gestiones || 0;
        return acc;
      },
      {
        total_clientes: 0,
        ejecutiva_efectivos: 0,
        ejecutiva_no: 0,
        vendedor_efectivos: 0,
        vendedor_no: 0,
        gestiones_reales: 0,
        sin_gestiones: 0,
      },
    );
  }, [filteredData]);

  const globalPctEjecutiva =
    totals.ejecutiva_efectivos + totals.ejecutiva_no > 0
      ? (totals.ejecutiva_efectivos /
          (totals.ejecutiva_efectivos + totals.ejecutiva_no)) *
        100
      : 0;

  const globalPctVendedor =
    totals.vendedor_efectivos + totals.vendedor_no > 0
      ? (totals.vendedor_efectivos /
          (totals.vendedor_efectivos + totals.vendedor_no)) *
        100
      : 0;

  const handleExport = () => {
    generateRendimientoExcel(filteredData, totals);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#1a9888] animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            Calculando rendimiento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900 p-3 rounded-2xl">
            <TrendingUp
              size={32}
              className="text-[#1a9888] dark:text-teal-400"
            />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Tabla de{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Rendimiento
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Análisis de efectividad &bull; Ejecutiva y Vendedor
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="flex gap-2 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1a9888] transition-all cursor-pointer"
            >
              <option value="all">Todos los meses</option>
              <option value="0">Enero</option>
              <option value="1">Febrero</option>
              <option value="2">Marzo</option>
              <option value="3">Abril</option>
              <option value="4">Mayo</option>
              <option value="5">Junio</option>
              <option value="6">Julio</option>
              <option value="7">Agosto</option>
              <option value="8">Septiembre</option>
              <option value="9">Octubre</option>
              <option value="10">Noviembre</option>
              <option value="11">Diciembre</option>
            </select>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1a9888] transition-all cursor-pointer"
            >
              <option value="all">Todas las semanas</option>
              <option value="1">Semana 1 (1-7)</option>
              <option value="2">Semana 2 (8-14)</option>
              <option value="3">Semana 3 (15-21)</option>
              <option value="4">Semana 4 (22-28)</option>
              <option value="5">Semana 5 (29+)</option>
            </select>
            <button
              onClick={fetchData}
              className="px-4 py-3 bg-[#1a9888] text-white rounded-xl hover:bg-[#158072] transition-all shadow-lg shadow-teal-900 flex items-center gap-2 ml-1"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline font-bold">Act. Data</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-3 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-all ml-1 flex items-center gap-2"
            >
              <Download size={18} />
              <span className="hidden sm:inline font-bold">Excel</span>
            </button>
          </div>
          <div className="relative w-full xl:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#1a2333] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#1a9888] dark:text-white text-sm font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Clientes"
          value={formatNumber(totals.total_clientes)}
          icon={Users}
          colorHex="#2563eb"
        />
        <StatCard
          label="Efe. Ejecutiva"
          value={formatPercent(globalPctEjecutiva)}
          icon={CheckCircle2}
          colorHex="#059669"
        />
        <StatCard
          label="Efe. Vendedor"
          value={formatPercent(globalPctVendedor)}
          icon={BarChart3}
          colorHex="#d97706"
        />
        <StatCard
          label="Gestión Total"
          value={formatNumber(
            totals.ejecutiva_efectivos +
              totals.ejecutiva_no +
              totals.vendedor_efectivos +
              totals.vendedor_no,
          )}
          icon={PieChart}
          colorHex="#7c3aed"
        />
      </div>

      {/* TABLA */}
      <TableContainer className="shadow-none border border-gray-200 dark:border-gray-800 rounded-xl overflow-auto max-h-[75vh] bg-white dark:bg-[#111827]">
        <Table>
          <Thead className="sticky top-0 z-30 shadow-sm">
            <tr className="uppercase leading-tight">
              <Th
                rowSpan={2}
                stickyLeft
                className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 min-w-45 border-b border-r dark:border-gray-700 font-bold z-40"
              >
                Compañía / Segmento
              </Th>
              <Th
                rowSpan={2}
                className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 min-w-25 border-b border-r dark:border-gray-700 text-center font-bold"
              >
                Total Clientes
              </Th>
              <Th
                colSpan={3}
                className="bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 border-b border-r dark:border-gray-700 text-center font-bold"
              >
                Gestión Ejecutiva
              </Th>
              <Th
                colSpan={3}
                className="bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-b border-r dark:border-gray-700 text-center font-bold"
              >
                Gestión Vendedor
              </Th>
              <Th
                colSpan={2}
                className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 border-b border-r dark:border-gray-700 text-center font-bold"
              >
                Consolidado
              </Th>
              <Th
                rowSpan={2}
                className="bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-b dark:border-gray-700 text-center font-bold min-w-27.5"
              >
                Sin Gestión
              </Th>
            </tr>
            <tr className="uppercase leading-tight text-[10px]">
              <Th className="bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-b border-r dark:border-gray-700 text-center">
                Efectivos
              </Th>
              <Th className="bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-b border-r dark:border-gray-700 text-center">
                Neg/Proc
              </Th>
              <Th className="bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-b border-r dark:border-gray-700 text-center font-bold">
                % Efec.
              </Th>
              <Th className="bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-b border-r dark:border-gray-700 text-center">
                Efectivos
              </Th>
              <Th className="bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-b border-r dark:border-gray-700 text-center">
                Neg/Proc
              </Th>
              <Th className="bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-b border-r dark:border-gray-700 text-center font-bold">
                % Efec.
              </Th>
              <Th className="bg-purple-50 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-b border-r dark:border-gray-700 text-center">
                Gest. Reales
              </Th>
              <Th className="bg-purple-50 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-b border-r dark:border-gray-700 text-center font-bold">
                % Cumpl.
              </Th>
            </tr>
          </Thead>
          <Tbody>
            {filteredData.map((row) => {
              const totalGestionesEjecutiva =
                row.ejecutiva.efectivos + row.ejecutiva.no_efectivos;
              const pctEjecutiva =
                totalGestionesEjecutiva > 0
                  ? (row.ejecutiva.efectivos / totalGestionesEjecutiva) * 100
                  : 0;

              const totalGestionesVendedor =
                row.vendedor.efectivos + row.vendedor.no_efectivos;
              const pctVendedor =
                totalGestionesVendedor > 0
                  ? (row.vendedor.efectivos / totalGestionesVendedor) * 100
                  : 0;

              const gestionesVerdaderas = row.gestiones_reales;
              const pctCumplimiento =
                row.total_clientes > 0
                  ? (gestionesVerdaderas / row.total_clientes) * 100
                  : 0;

              return (
                <Tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#1a2333]"
                >
                  <Td
                    stickyLeft
                    className="font-black text-xs sm:text-sm text-gray-800 dark:text-gray-200 border-r dark:border-gray-800"
                  >
                    {row.segmento}
                  </Td>

                  <Td className="text-center font-bold text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 border-r dark:border-gray-800">
                    {row.total_clientes}
                  </Td>

                  <Td className="text-center text-emerald-700 dark:text-emerald-400 font-medium border-r dark:border-gray-800">
                    {row.ejecutiva.efectivos}
                  </Td>
                  <Td className="text-center text-gray-500 dark:text-gray-400 border-r dark:border-gray-800">
                    {row.ejecutiva.no_efectivos}
                  </Td>
                  <Td className="text-center border-r dark:border-gray-800 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <PercentBadge value={pctEjecutiva} />
                  </Td>

                  <Td className="text-center text-amber-700 dark:text-amber-400 font-medium border-r dark:border-gray-800">
                    {row.vendedor.efectivos}
                  </Td>
                  <Td className="text-center text-gray-500 dark:text-gray-400 border-r dark:border-gray-800">
                    {row.vendedor.no_efectivos}
                  </Td>
                  <Td className="text-center border-r dark:border-gray-800 bg-amber-50/30 dark:bg-amber-900/10">
                    <PercentBadge value={pctVendedor} />
                  </Td>

                  <Td className="text-center text-purple-700 dark:text-purple-400 font-bold border-r dark:border-gray-800">
                    {gestionesVerdaderas}
                  </Td>
                  <Td className="text-center bg-purple-50/30 dark:bg-purple-900/10 border-r dark:border-gray-800">
                    <PercentBadge value={pctCumplimiento} />
                  </Td>

                  <Td className="text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10">
                    {row.sin_gestiones || 0}
                  </Td>
                </Tr>
              );
            })}

            <tr className="bg-gray-100 dark:bg-[#1f2937] border-t-2 border-gray-300 dark:border-gray-600 font-black text-xs uppercase">
              <Td
                stickyLeft
                className="text-right p-3 border-r dark:border-gray-700 bg-gray-100 dark:bg-[#1f2937]"
              >
                TOTALES:
              </Td>
              <Td className="text-center text-blue-800 dark:text-blue-300 border-r dark:border-gray-700">
                {formatNumber(totals.total_clientes)}
              </Td>
              <Td className="text-center text-emerald-800 dark:text-emerald-300 border-r dark:border-gray-700">
                {formatNumber(totals.ejecutiva_efectivos)}
              </Td>
              <Td className="text-center text-gray-600 dark:text-gray-400 border-r dark:border-gray-700">
                {formatNumber(totals.ejecutiva_no)}
              </Td>
              <Td className="text-center border-r dark:border-gray-700">
                {formatPercent(globalPctEjecutiva)}
              </Td>
              <Td className="text-center text-amber-800 dark:text-amber-300 border-r dark:border-gray-700">
                {formatNumber(totals.vendedor_efectivos)}
              </Td>
              <Td className="text-center text-gray-600 dark:text-gray-400 border-r dark:border-gray-700">
                {formatNumber(totals.vendedor_no)}
              </Td>
              <Td className="text-center border-r dark:border-gray-700">
                {formatPercent(globalPctVendedor)}
              </Td>
              <Td className="text-center text-purple-800 dark:text-purple-300 border-r dark:border-gray-700">
                {formatNumber(totals.gestiones_reales)}
              </Td>
              <Td className="text-center border-r dark:border-gray-700">
                {formatPercent(
                  (totals.gestiones_reales / (totals.total_clientes || 1)) *
                    100,
                )}
              </Td>
              <Td className="text-center text-rose-800 dark:text-rose-300">
                {formatNumber(totals.sin_gestiones)}
              </Td>
            </tr>
          </Tbody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Rendimiento;
