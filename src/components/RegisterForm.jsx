import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import {
  User,
  Lock,
  Briefcase,
  Shield,
  Check,
  ChevronDown,
  X,
  RefreshCw,
} from "lucide-react";
import Logo from "../assets/Logo.png";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [isSegmentMenuOpen, setIsSegmentMenuOpen] = useState(false);
  const segmentRef = useRef(null);
  const [availableSegmentos, setAvailableSegmentos] = useState([]);
  const [loadingSegmentos, setLoadingSegmentos] = useState(true);
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
    segmentos: [],
    status: 1,
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSegmentos = async () => {
      try {
        const data = await apiService.getSegmentos();
        setAvailableSegmentos(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("Error loading segments:", err);
        setError("Error al cargar los segmentos disponibles.");
      } finally {
        setLoadingSegmentos(false);
      }
    };

    fetchSegmentos();
    const handleClickOutside = (event) => {
      if (segmentRef.current && !segmentRef.current.contains(event.target)) {
        setIsSegmentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSegment = (segmentCode) => {
    setFormData((prev) => {
      const exists = prev.segmentos.includes(segmentCode);
      let newSegmentos;
      if (exists) {
        newSegmentos = prev.segmentos.filter((s) => s !== segmentCode);
      } else {
        newSegmentos = [...prev.segmentos, segmentCode];
      }
      return { ...prev, segmentos: newSegmentos };
    });
  };

  const rolesOptions = [
    { value: "ejecutiva", label: "Ejecutiva" },
    { value: "vendedor", label: "Vendedor" },
    { value: "auditor", label: "Auditor" },
    { value: "administrador", label: "Administrador" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const permisosMap = {
      ejecutiva: {
        ver_dashboard: true,
        ver_rutas: true,
        editar_usuarios: false,
      },
      vendedor: {
        ver_dashboard: true,
        ver_segmentos_asignados: true,
        editar_usuarios: false,
      },
      auditor: {
        ver_dashboard: true,
        ver_rutas: true,
        gestion_matrix: true,
        crear_usuario: false,
      },
      administrador: {
        ver_dashboard: true,
        editar_usuarios: true,
        acceso_total: true,
      },
    };

    const payload = {
      usuario: formData.usuario,
      contraseña: formData.contraseña,
      segmentos: formData.segmentos,
      status: 1,
      permisos: permisosMap[formData.role] || {},
    };

    try {
      await apiService.registerUser(payload);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Error al registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      /* Ajustado a max-w-md y mismos paddings/bordes que el Login */
      className="bg-white dark:bg-[#111827] p-10 rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-gray-100 dark:border-white/5 transition-all duration-500"
    >
      <img
        src={Logo}
        alt="Logo de Auditoria"
        className="mx-auto h-28 mb-8 hover:scale-105 transition-transform duration-500"
      />

      <h2 className="text-3xl font-black text-center text-slate-800 dark:text-white mb-8 tracking-tight">
        Registrar{" "}
        <span className="text-[#1a9888] dark:text-teal-400">Nuevo Usuario</span>
      </h2>

      {/* --- Usuario --- */}
      <div className="mb-6">
        <label className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1">
          Usuario
        </label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <User size={20} />
          </span>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-300 bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white placeholder-slate-400"
            placeholder="Ej: juan_perez"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* --- Contraseña --- */}
      <div className="mb-6">
        <label className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1">
          Contraseña
        </label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <Lock size={20} />
          </span>
          <input
            type="password"
            name="contraseña"
            value={formData.contraseña}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-300 bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white placeholder-slate-400"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* --- Rol --- */}
      <div className="mb-6">
        <label className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1">
          Rol y Permisos
        </label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <Shield size={20} />
          </span>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full pl-12 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-300 bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white appearance-none cursor-pointer"
            required
            disabled={loading}
          >
            <option value="" disabled>
              Seleccione un rol...
            </option>
            {rolesOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
            <ChevronDown size={20} />
          </span>
        </div>
      </div>

      {/* --- Segmentos --- */}
      <div className="mb-8" ref={segmentRef}>
        <label className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1">
          Segmentos Asignados
        </label>
        <div className="relative group">
          <div
            onClick={() =>
              !loadingSegmentos &&
              !loading &&
              setIsSegmentMenuOpen(!isSegmentMenuOpen)
            }
            className={`w-full min-h-13 pl-12 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer bg-slate-50 dark:bg-[#0b1120] flex flex-wrap gap-2 items-center transition-all duration-300 ${
              isSegmentMenuOpen
                ? "ring-4 ring-teal-500/10 border-teal-500 shadow-lg"
                : ""
            }`}
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 h-full group-focus-within:text-teal-500">
              <Briefcase size={20} />
            </span>
            {formData.segmentos.length === 0 ? (
              <span className="text-slate-400 text-sm">
                {loadingSegmentos ? "Cargando..." : "Seleccionar..."}
              </span>
            ) : (
              formData.segmentos.map((segCode, idx) => (
                <span
                  key={idx}
                  className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-500/30"
                >
                  {segCode}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSegment(segCode);
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 h-full">
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${isSegmentMenuOpen ? "rotate-180" : ""}`}
              />
            </span>
          </div>

          {isSegmentMenuOpen && (
            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
              {availableSegmentos.map((seg, idx) => {
                const code = seg.co_seg || seg.segmento || seg;
                const isSelected = formData.segmentos.includes(code);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSegment(code)}
                    className="px-5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between text-slate-700 dark:text-slate-100 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <span className="text-xs font-medium">
                      {seg.des_seg || code}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-teal-500 border-teal-500" : "border-slate-300"}`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- Alertas y Botón --- */}
      {(error || success) && (
        <div
          className={`px-4 py-3 rounded-2xl mb-6 text-sm font-medium flex items-center gap-2 animate-shake ${
            success
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          <span>{success ? "¡Éxito! Redirigiendo..." : error}</span>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-[#1a9888] hover:bg-[#137a6d] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-black py-4 px-4 rounded-2xl shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={20} /> REGISTRANDO...
          </span>
        ) : (
          "REGISTRAR USUARIO"
        )}
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{" "}
          <Link
            to="/login"
            className="font-bold text-[#1a9888] hover:text-[#056356] dark:text-green-500 transition-colors"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
