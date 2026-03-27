import { useState, useRef, useEffect, useMemo } from "react";
import { useGestionUsuarios } from "../hooks/useGestionUsuarios";
import { apiService } from "../services/apiService";
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
  Save,
  Trash2,
  UserCog,
  RefreshCw,
  Check,
  ChevronDown,
  X,
} from "lucide-react";

// --- 1. Celda de Texto ---
const TextCell = ({ value, onChange }) => (
  <Td className="p-2">
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-w-30 p-1.5 text-sm bg-gray-50 dark:bg-[#333] border border-gray-300 dark:border-[#555] rounded dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a9888]"
    />
  </Td>
);

// --- 2. Celda Multi-Select (Adaptada para Strings) ---
const MultiSelectCell = ({ value = [], onChange, options, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleOption = (optionValue) => {
    const currentSelected = Array.isArray(value) ? value : [];
    let newSelected;
    if (currentSelected.includes(optionValue)) {
      newSelected = currentSelected.filter((item) => item !== optionValue);
    } else {
      newSelected = [...currentSelected, optionValue];
    }
    onChange(newSelected);
  };

  return (
    <Td className="p-2 overflow-visible">
      <div ref={containerRef} className="relative">
        <div
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          className={`w-full min-w-50 min-h-9.5 p-1.5 text-sm bg-gray-50 dark:bg-[#333] border border-gray-300 dark:border-[#555] rounded dark:text-white cursor-pointer flex flex-wrap gap-1 items-center transition-all ${
            isOpen ? "ring-2 ring-[#1a9888] border-transparent" : ""
          }`}
        >
          {isLoading ? (
            <span className="text-gray-400 text-xs px-1">Cargando...</span>
          ) : !value || value.length === 0 ? (
            <span className="text-gray-400 text-xs px-1">Seleccionar...</span>
          ) : (
            Array.isArray(value) &&
            value.map((itemCode, idx) => {
              return (
                <span
                  key={idx}
                  className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-200 dark:bg-teal-900/50 dark:text-teal-100 dark:border-teal-800 cursor-help truncate max-w-37.5"
                  title={itemCode}
                >
                  {itemCode}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(itemCode);
                    }}
                    className="hover:text-teal-600 dark:hover:text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })
          )}
          <div className="ml-auto text-gray-400 pl-1">
            <ChevronDown size={14} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-80 bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0 custom-scrollbar">
            {options.map((opt, i) => {
              const isSelected =
                Array.isArray(value) && value.includes(opt.value);
              return (
                <div
                  key={i}
                  onClick={() => toggleOption(opt.value)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-xs transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200"
                      : "hover:bg-gray-100 dark:hover:bg-[#333] text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 border rounded shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-[#1a9888] border-[#1a9888]"
                        : "border-gray-400 dark:border-gray-500"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <span className="truncate" title={opt.label}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Td>
  );
};

// --- 3. Celda Select Simple ---
const SelectCell = ({ value, onChange, options, colorMap = {} }) => {
  const colorClass = colorMap[value] || "bg-gray-50 dark:bg-[#333]";
  return (
    <Td className="p-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-w-35 p-1.5 text-sm border border-gray-300 dark:border-[#555] rounded dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a9888] ${colorClass}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Td>
  );
};

const OPCIONES_ROLES = [
  { value: "ejecutiva", label: "EJECUTIVA" },
  { value: "vendedor", label: "VENDEDOR" },
  { value: "auditor", label: "AUDITOR" },
  { value: "administrador", label: "ADMINISTRADOR" },
];

const OPCIONES_ESTATUS = [
  { value: 1, label: "Activo" },
  { value: 0, label: "Inactivo" },
];

const GestionUsuarios = () => {
  const { usuarios, loading, handleUserChange, saveUserChanges, deleteUser } =
    useGestionUsuarios();

  // Estados para Segmentos
  const [segmentosApi, setSegmentosApi] = useState([]);
  const [loadingSegmentos, setLoadingSegmentos] = useState(true);

  // 1. CARGAR SEGMENTOS (Corregido según tu log)
  useEffect(() => {
    const fetchSegmentos = async () => {
      try {
        setLoadingSegmentos(true);
        const response = await apiService.getSegmentos();
        if (response && response.data && Array.isArray(response.data)) {
          setSegmentosApi(response.data);
        } else if (Array.isArray(response)) {
          setSegmentosApi(response);
        } else {
          setSegmentosApi([]);
        }
      } catch (error) {
        console.error("Error cargando segmentos:", error);
      } finally {
        setLoadingSegmentos(false);
      }
    };
    fetchSegmentos();
  }, []);

  // 2. MAPEAR SEGMENTOS (Adaptado a Strings Simples)
  const opcionesSegmentos = useMemo(() => {
    // Si la API devuelve strings ["Apure", "Barinas"], los usamos directo
    const mapped = segmentosApi.map((seg) => {
      // Si es un string simple (Caso real según tu log)
      if (typeof seg === "string") {
        return { value: seg, label: seg };
      }

      // Si llegara a ser objeto (Caso hipotético)
      const id = seg.co_seg || seg.id || seg.value;
      const nombre = seg.des_seg || seg.nombre || seg.label;
      if (id) {
        return {
          value: String(id),
          label: nombre ? `${id} - ${nombre}` : String(id),
        };
      }

      return { value: JSON.stringify(seg), label: JSON.stringify(seg) };
    });

    // Opcional: Agregar extras si faltan en la BD
    // const extras = [{ value: "EXTRA", label: "EXTRA" }];
    // return [...mapped, ...extras];

    return mapped;
  }, [segmentosApi]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#1a9888] animate-spin" />
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            Cargando usuarios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0b1120]">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <UserCog size={32} className="text-[#1a9888] dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Gestión de{" "}
              <span className="text-[#1a9888] dark:text-teal-400">
                Usuarios
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Administra los accesos y permisos del personal
            </p>
          </div>
        </div>
      </div>

      <TableContainer className="overflow-visible">
        <Table>
          <Thead>
            <Tr>
              <Th align="left">Usuario</Th>
              <Th align="left" className="min-w-50">
                Segmento/Ruta
              </Th>
              <Th align="left">Contraseña</Th>
              <Th align="center">Estatus</Th>
              <Th align="left">Rol / Permiso</Th>
              <Th align="center" stickyLeft>
                Acciones
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {usuarios.map((u) => (
              <Tr key={u.id}>
                <TextCell
                  value={u.usuario}
                  onChange={(val) => handleUserChange(u.id, "usuario", val)}
                />

                {/* Selector de Segmentos */}
                <MultiSelectCell
                  value={u.segmentos}
                  onChange={(newSegments) =>
                    handleUserChange(u.id, "segmentos", newSegments)
                  }
                  options={opcionesSegmentos}
                  isLoading={loadingSegmentos}
                />

                <TextCell
                  value={u.contraseña}
                  onChange={(val) => handleUserChange(u.id, "contraseña", val)}
                />
                <SelectCell
                  value={u.status}
                  onChange={(val) =>
                    handleUserChange(u.id, "status", Number(val))
                  }
                  options={OPCIONES_ESTATUS}
                  colorMap={{
                    1: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                    0: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                  }}
                />
                <SelectCell
                  value={u.role}
                  onChange={(val) => handleUserChange(u.id, "role", val)}
                  options={OPCIONES_ROLES}
                />
                <Td
                  align="center"
                  stickyLeft
                  className="bg-gray-50 dark:bg-[#262626]"
                >
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => saveUserChanges(u.id)}
                      className="p-2 text-white bg-[#1a9888] hover:bg-[#137a6d] rounded-lg transition shadow-sm"
                      title="Guardar"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
            {!loading && usuarios.length === 0 && (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-gray-500">
                  No hay usuarios registrados.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default GestionUsuarios;
