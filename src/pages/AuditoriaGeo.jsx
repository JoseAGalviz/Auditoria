/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useAuditoriaGeo } from "../hooks/useAuditoriaGeo";
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
  MapPin,
  AlertTriangle,
  CheckCircle,
  Database,
  ArrowRightLeft,
  ExternalLink,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
} from "lucide-react";

// --- HELPERS VISUALES ---

const StatCard = ({ icon: Icon, label, value, colorClass, iconColor }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorClass} shadow-sm min-w-35`}
  >
    <div className={`p-2 rounded-lg ${iconColor}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold opacity-70 leading-none mb-1">
        {label}
      </p>
      <p className="text-lg font-black leading-none">{value}</p>
    </div>
  </div>
);

const getRowColor = (status) => {
  switch (status) {
    case "MATCH":
      return "bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20";
    case "FAR":
      return "bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20";
    case "MISSING_PROFIT":
      return "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20";
    case "MISSING_BITRIX":
      return "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20";
    default:
      return "bg-white hover:bg-slate-50 dark:bg-[#111827] dark:hover:bg-white/5";
  }
};

const GeoStatusBadge = ({ status, distance }) => {
  let icon = <AlertTriangle size={14} />;
  let text = status;
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200";

  switch (status) {
    case "MATCH":
      icon = <CheckCircle size={14} />;
      text = "COINCIDEN";
      colorClass =
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      break;
    case "FAR":
      icon = <ArrowRightLeft size={14} />;
      text = `DIF: ${distance}m`;
      colorClass =
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      break;
    case "MISSING_PROFIT":
      icon = <Database size={14} />;
      text = "FALTA PROFIT";
      colorClass =
        "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      break;
    case "MISSING_BITRIX":
      icon = <Database size={14} />;
      text = "FALTA BITRIX";
      colorClass =
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      break;
    default:
      text = "SIN DATA";
      break;
  }

  return (
    <div
      className={`flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold w-full shadow-sm ${colorClass}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

const EditableCell = ({ value, onChange, placeholder = "..." }) => (
  <div className="relative w-full">
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-w-25 bg-white dark:bg-[#262626] border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-[#1a9888] focus:border-transparent dark:text-gray-200 shadow-sm"
    />
    <Edit3
      size={12}
      className="absolute right-2 top-2 text-gray-400 pointer-events-none opacity-50"
    />
  </div>
);

const AuditoriaGeo = () => {
  const {
    auditData,
    loading,
    handleAuditChange,
    page,
    totalPages,
    totalRecords,
    goToPage,
    refresh,
  } = useAuditoriaGeo();

  const [jumpPage, setJumpPage] = useState("");

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= totalPages) {
      goToPage(p);
      setJumpPage("");
    }
  };

  // Función MEJORADA para abrir Google Maps
  // Función INTELIGENTE para abrir mapas
  const openSmartMap = (c1, c2, distance) => {
    if (!c1 || !c2) return;

    // 1. Limpieza estricta de espacios
    const origin = String(c1).replace(/\s/g, "");
    const dest = String(c2).replace(/\s/g, "");

    // 2. Validar coordenadas basura (0,0)
    if (origin.startsWith("0,0") || dest.startsWith("0,0")) {
      alert("Coordenada inválida (0,0 detected).");
      return;
    }

    // 3. LÓGICA DE DECISIÓN:

    // CASO A: Son idénticas (o menos de 20 metros de diferencia)
    // No tiene sentido trazar una ruta. Mostramos un PIN simple.
    // Usamos el parámetro 'distance' que ya calculó tu hook.
    if (distance < 20) {
      // Abre el mapa centrado en el punto con un marcador rojo
      const url = `https://www.google.com/maps/search/?api=1&query=${origin}`;
      window.open(url, "_blank");
    }

    // CASO B: Son diferentes
    // Trazamos la ruta para ver la diferencia visualmente.
    else {
      // Usamos la API oficial de "Directions" (dir)
      // travelmode=driving es lo estándar.
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
      window.open(url, "_blank");
    }
  };

  const problemCount = auditData.filter((r) => r.status !== "MATCH").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <MapPin size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Comparativa{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Profit vs Bitrix
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Auditoría de integridad de coordenadas entre sistemas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard
            icon={Database}
            label="Registros"
            value={totalRecords}
            colorClass="bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
            iconColor="text-slate-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="Discrepancias"
            value={problemCount}
            colorClass="bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            iconColor="text-red-500"
          />
          <button
            onClick={refresh}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <TableContainer>
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-gray-500">
            <RefreshCw className="animate-spin w-8 h-8 mb-2 text-[#1a9888]" />
            <span>Analizando bases de datos...</span>
          </div>
        ) : (
          <Table>
            <Thead>
              {/* Nivel 1 */}
              <Tr className="border-b-0">
                <Th
                  colSpan={2}
                  stickyTop
                  className="border-b border-r border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-[#1e1e1e] text-center"
                >
                  CLIENTE
                </Th>
                <Th
                  colSpan={1}
                  stickyTop
                  className="border-b border-r border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#1e1e1e] text-center"
                >
                  UBICACIÓN
                </Th>
                <Th
                  colSpan={1}
                  stickyTop
                  className="border-b border-r border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/40 text-green-700 text-center"
                >
                  PROFIT
                </Th>
                <Th
                  colSpan={1}
                  stickyTop
                  className="border-b border-r border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/40 text-blue-700 text-center"
                >
                  BITRIX
                </Th>
                <Th
                  colSpan={3}
                  stickyTop
                  className="border-b border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-gray-800 text-center"
                >
                  AUDITORÍA
                </Th>
              </Tr>

              {/* Nivel 2 */}
              <Tr className="border-b border-gray-200 dark:border-[#333]">
                <Th className="min-w-25 bg-white dark:bg-[#1e1e1e] z-10 text-xs uppercase text-gray-500">
                  Código
                </Th>
                <Th className="min-w-62.5 text-left bg-white dark:bg-[#1e1e1e] shadow-md z-10 border-r border-gray-100 text-xs uppercase text-gray-500">
                  Nombre
                </Th>

                <Th className="min-w-37.5 bg-white dark:bg-[#1e1e1e] border-r border-gray-100 text-xs uppercase text-gray-500">
                  Zona
                </Th>

                {/* Coords Profit - COLUMNA CLAVE */}
                <Th className="min-w-45 bg-green-50 dark:bg-green-900 border-r border-green-100 text-xs uppercase text-green-700 text-center font-bold">
                  Coords Profit
                </Th>

                {/* Coords Bitrix - COLUMNA CLAVE */}
                <Th className="min-w-45 bg-blue-50 dark:bg-blue-900 border-r border-blue-100 text-xs uppercase text-blue-700 text-center font-bold">
                  Coords Bitrix
                </Th>

                <Th className="min-w-35 text-center bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                  Estado
                </Th>
                <Th className="min-w-12.5 text-center bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                  Mapa
                </Th>
                <Th className="min-w-45 bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500">
                  Nota
                </Th>
              </Tr>
            </Thead>

            <Tbody>
              {auditData.map((row) => (
                <Tr key={row.id_interno} className={getRowColor(row.status)}>
                  <Td className="bg-slate-50 dark:bg-[#0b1120] text-xs font-mono font-bold text-slate-700 dark:text-slate-300 z-10">
                    {row.codigo}
                  </Td>
                  <Td className="text-left font-semibold bg-white dark:bg-[#111827] border-r dark:border-white/5 shadow-md text-xs z-10">
                    <div className="truncate max-w-62.5" title={row.nombre}>
                      {row.nombre}
                    </div>
                  </Td>

                  <Td className="text-xs border-r border-gray-200 dark:border-white/5">
                    {row.zona}
                  </Td>

                  {/* PROFIT */}
                  <Td className="font-mono text-[10px] text-center text-green-700 bg-green-50 border-r border-green-100 dark:bg-green-900 dark:border-white/5">
                    {row.coords_profit || (
                      <span className="text-red-400 font-bold text-[9px] bg-red-50 px-1 py-0.5 rounded">
                        VACÍO
                      </span>
                    )}
                  </Td>

                  {/* BITRIX */}
                  <Td className="font-mono text-[10px] text-center text-blue-600 bg-blue-50 border-r border-blue-100 dark:bg-blue-900 dark:border-white/5">
                    {row.coords_bitrix || (
                      <span className="text-red-400 font-bold text-[9px] bg-red-50 px-1 py-0.5 rounded">
                        VACÍO
                      </span>
                    )}
                  </Td>

                  {/* STATUS */}
                  <Td className="flex justify-center py-2">
                    <GeoStatusBadge
                      status={row.status}
                      distance={row.distancia}
                    />
                  </Td>
                  {/* Columna Mapa */}
                  <Td className="text-center">
                    {row.coords_profit && row.coords_bitrix && (
                      <button
                        // AQUI CAMBIAMOS: Pasamos (profit, bitrix, y la distancia)
                        onClick={() =>
                          openSmartMap(
                            row.coords_profit,
                            row.coords_bitrix,
                            row.distancia,
                          )
                        }
                        className={`p-1.5 rounded-md transition-colors ${
                          // Cambiamos el color del botón según si coinciden o no
                          row.status === "MATCH"
                            ? "text-green-600 hover:bg-green-100 border border-green-200" // Verde si es igual
                            : "text-blue-600 hover:bg-blue-100 border border-blue-200" // Azul si hay ruta
                        }`}
                        title={
                          row.status === "MATCH"
                            ? "Ver ubicación"
                            : "Ver ruta de diferencia"
                        }
                      >
                        {/* Cambiamos el icono visualmente también */}
                        {row.status === "MATCH" ? (
                          <MapPin size={16} />
                        ) : (
                          <ExternalLink size={16} />
                        )}
                      </button>
                    )}
                  </Td>
                  <Td className="bg-white dark:bg-[#111827]">
                    <EditableCell
                      value={row.obs_auditor}
                      onChange={(val) => handleAuditChange(row.id_interno, val)}
                      placeholder="Obs..."
                    />
                  </Td>
                </Tr>
              ))}
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
            Página {page} de {totalPages}
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
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ir a pág:
          </span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
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
    </div>
  );
};

export default AuditoriaGeo;
