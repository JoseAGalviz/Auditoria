/* eslint-disable react-hooks/set-state-in-effect */
import {
  Database,
  DatabaseZap,
  Moon,
  Sun,
  User,
  Container,
  Menu,
  Upload,
  X as XIcon,
  ArrowUpDown,
  Users,
  CalendarClock,
  ClipboardList,
  Eye,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const { user } = useAuth();

  const links = useMemo(
    () => [
      {
        to: "/gestion-usuarios",
        label: "Gestion de Usuarios",
        icon: <User />,
        permission: (p) => p?.editar_usuarios || p?.acceso_total,
      },
      {
        to: "/base-datos-bitrix",
        label: "Planificador",
        icon: <CalendarClock />,
        permission: (p) =>
          (p?.ver_dashboard && !p?.gestion_matrix) ||
          p?.acceso_total ||
          p?.editar_usuarios,
      },
      {
        to: "/planificaciones",
        label: "Registros",
        icon: <ClipboardList />,
        permission: (p, role) => {
          const r = role?.toLowerCase().trim();
          return (
            p?.gestion_matrix ||
            p?.acceso_total ||
            p?.editar_usuarios ||
            r === "auditor" ||
            r === "administrador"
          );
        },
      },
      {
        to: "/base-datos-profit",
        label: "Comparativa Profit-Bitrix",
        icon: <DatabaseZap />,
        permission: (p) =>
          p?.gestion_matrix || p?.acceso_total || p?.editar_usuarios,
      },
      {
        to: "/matriz",
        label: "Matriz",
        icon: <Container />,
        permission: (p, role) =>
          p?.gestion_matrix ||
          p?.acceso_total ||
          p?.editar_usuarios ||
          p?.ver_rutas ||
          role?.toLowerCase().trim() === "ejecutiva",
      },
      {
        to: "/admin/import",
        label: "Cargar Excel",
        icon: <Upload />,
        permission: (p) => p?.acceso_total || p?.editar_usuarios,
      },
      {
        to: "/rendimiento",
        label: "Rendimiento",
        icon: <ArrowUpDown />,
        permission: (p) =>
          p?.gestion_matrix || p?.acceso_total || p?.editar_usuarios,
      },
      {
        to: "/vendedores",
        label: "Vendedores",
        icon: <Users />,
        permission: (p) =>
          p?.gestion_matrix || p?.acceso_total || p?.editar_usuarios,
        subLinks: [
          {
            to: "/observaciones",
            label: "Observaciones",
            icon: <Eye size={20} />,
            permission: (p) =>
              p?.gestion_matrix || p?.acceso_total || p?.editar_usuarios,
          },
          {
            to: "/panel-aprobaciones",
            label: "Aprobaciones",
            icon: <CheckCircle size={20} />,
            permission: (p, role) => {
              const r = role?.toLowerCase().trim();
              return (
                r === "gerente" ||
                r === "administrador" ||
                r === "auditor" ||
                p?.acceso_total
              );
            },
          },
        ],
      },
    ],
    [],
  );

  const filteredLinks = links
    .map((link) => {
      if (link.subLinks) {
        return {
          ...link,
          subLinks: link.subLinks.filter((sub) =>
            sub.permission ? sub.permission(user?.permisos, user?.role) : true,
          ),
        };
      }
      return link;
    })
    .filter((link) => {
      if (!link.permission) return true;
      return link.permission(user?.permisos, user?.role);
    });

  const toggleDarkMode = () => {
    const nuevoEstado = !isDark;
    setIsDark(nuevoEstado);
    document.documentElement.classList.toggle("dark", nuevoEstado);
    localStorage.setItem("modoOscuro", nuevoEstado ? "true" : "false");
  };

  const toggleSidebar = () => {
    const nuevoEstado = !isCollapsed;
    setIsCollapsed(nuevoEstado);
    localStorage.setItem("sidebarCollapsed", nuevoEstado ? "true" : "false");
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenus((prev) => {
      const newState = { ...prev };
      // Cerrar todos los submenús primero
      Object.keys(newState).forEach((key) => {
        newState[key] = false;
      });
      // Abrir solo el seleccionado
      newState[label] = !prev[label];
      return newState;
    });
  };

  useEffect(() => {
    const modoOscuro = localStorage.getItem("modoOscuro") === "true";
    setIsDark(modoOscuro);
    document.documentElement.classList.toggle("dark", modoOscuro);

    const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    setIsCollapsed(collapsed);

    // Abrir submenús automáticamente si la ruta actual está en un subenlace o en la página principal
    const newOpenSubmenus = {};
    links.forEach((link) => {
      if (link.subLinks) {
        const hasActiveSub = link.subLinks.some(
          (sub) => location.pathname === sub.to,
        );
        const isMainActive = location.pathname === link.to;
        if (hasActiveSub || isMainActive) {
          newOpenSubmenus[link.label] = true;
        }
      }
    });
    setOpenSubmenus(newOpenSubmenus);
  }, [location.pathname, links]);

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-60"} min-h-screen bg-linear-to-b from-[#1a9888] to-[#023831] text-white py-6 px-4 shadow-sm sticky top-0 transition-all duration-300 flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-8 px-2">
        {!isCollapsed && (
          <div className="text-2xl font-bold tracking-wide">Menú</div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none shrink-0"
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? <Menu size={24} /> : <XIcon size={24} />}
        </button>
      </div>

      {/* Se añadió overflow-x-hidden para matar el scroll lateral */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden pr-1 sidebar-nav custom-scrollbar w-full">
        {filteredLinks.map(({ to, label, icon, subLinks }, index) => {
          const isActive =
            location.pathname === to ||
            subLinks?.some((sub) => location.pathname === sub.to);
          const isSubmenuOpen = openSubmenus[label];

          return (
            <div key={`${to}-${index}`} className="flex flex-col w-full">
              <Link
                to={to}
                onClick={subLinks ? () => toggleSubmenu(label) : undefined}
                className={`flex items-center justify-between rounded-lg transition-all duration-300 group w-full ${isCollapsed ? "justify-center py-3 px-0" : "py-3 px-3"} ${
                  isActive
                    ? "bg-white/15 text-white font-bold border-l-4 border-teal-400 shadow-lg shadow-teal-900/20"
                    : "text-teal-100/70 hover:bg-white/10 hover:text-white border-l-4 border-transparent font-medium"
                }`}
                title={isCollapsed ? label : ""}
              >
                {/* Se añadió min-w-0 para ayudar al truncado a respetar los límites */}
                <div
                  className={`flex items-center min-w-0 ${isCollapsed ? "justify-center" : "space-x-3"}`}
                >
                  <span
                    className={`text-xl shrink-0 transition-all duration-300 ${isActive ? "scale-110 text-teal-400" : "group-hover:scale-110 group-hover:text-teal-300"}`}
                  >
                    {icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </div>

                {!isCollapsed && subLinks && (
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${isSubmenuOpen ? "rotate-180 text-teal-400" : "text-teal-100/70"}`}
                  />
                )}
              </Link>

              {!isCollapsed && subLinks && isSubmenuOpen && (
                <div className="flex flex-col mt-1 ml-4 space-y-1 border-l-2 border-white/10 pl-2 w-full">
                  {subLinks.map((sub, subIndex) => {
                    const isSubActive = location.pathname === sub.to;
                    return (
                      <Link
                        key={`sub-${sub.to}-${subIndex}`}
                        to={sub.to}
                        className={`flex items-center space-x-3 rounded-lg transition-all duration-300 py-2 px-3 w-full ${
                          isSubActive
                            ? "text-teal-300 font-bold bg-white/5"
                            : "text-teal-100/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="text-lg shrink-0">{sub.icon}</span>
                        <span className="text-sm truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 w-full">
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center transition-all duration-300 bg-white/5 hover:bg-white/10 text-white rounded-xl p-3 ${isCollapsed ? "justify-center" : "justify-between"} border border-white/5`}
          title={isCollapsed ? (isDark ? "Modo Claro" : "Modo Oscuro") : ""}
        >
          {!isCollapsed && (
            <span className="text-sm font-semibold tracking-wide truncate pr-2">
              {isDark ? "MODO CLARO" : "MODO OSCURO"}
            </span>
          )}
          <span className="text-xl shrink-0">
            {isDark ? (
              <Sun size={isCollapsed ? 24 : 20} className="text-amber-400" />
            ) : (
              <Moon size={isCollapsed ? 24 : 20} className="text-blue-300" />
            )}
          </span>
        </button>
      </div>
    </aside>
  );
}
