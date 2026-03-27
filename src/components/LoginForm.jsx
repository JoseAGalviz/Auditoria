import { Eye, EyeOff, Lock, UserLock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Logo from "../assets/Logo.png";
const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(credentials.username, credentials.password);

      // Redirigir según permisos
      const p = data.user?.permisos || {};
      if (p.acceso_total || p.editar_usuarios) {
        navigate("/gestion-usuarios");
      } else if (p.gestion_matrix) {
        navigate("/matriz");
      } else if (p.ver_dashboard) {
        navigate("/base-datos-bitrix");
      } else {
        navigate("/matriz"); // Redirección por defecto
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#111827] p-10 rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-gray-100 dark:border-white/5 transition-all duration-500"
    >
      <img
        src={Logo}
        alt="Logo de Auditoria"
        className="mx-auto h-28 mb-8 hover:scale-105 transition-transform duration-500"
      />

      <h2 className="text-3xl font-black text-center text-slate-800 dark:text-white mb-8 tracking-tight">
        Ingresar al Sistema de{" "}
        <span className="text-[#1a9888] dark:text-teal-400">Auditoria</span>
      </h2>

      <div className="mb-6">
        <label
          htmlFor="username"
          className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1"
        >
          Usuario
        </label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <UserLock size={20} />
          </span>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-300 bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white placeholder-slate-400"
            placeholder="Usuario"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="mb-10">
        <label
          htmlFor="password"
          className="block text-slate-600 dark:text-slate-300 text-left text-sm font-bold mb-2 ml-1"
        >
          Contraseña
        </label>
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <Lock size={20} />
          </span>
          <input
            type={passwordVisible ? "text" : "password"}
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            className="w-full pl-12 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all duration-300 bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white placeholder-slate-400"
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible(!passwordVisible)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
          >
            {passwordVisible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl relative mb-6 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 flex items-center gap-2 text-sm font-medium animate-shake"
          role="alert"
        >
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-[#1a9888] hover:bg-[#137a6d] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-teal-900/20 hover:shadow-teal-900/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300 disabled:transform-none"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={20} />
            INGRESANDO...
          </span>
        ) : (
          "INGRESAR AL SISTEMA"
        )}
      </button>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{" "}
          <Link
            to="/register"
            className="font-bold text-[#1a9888] hover:text-[#056356] dark:text-green-500 dark:hover:text-green-400 transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
