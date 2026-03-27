import React from "react";

// 1. Contenedor Principal
export const TableContainer = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-lg shadow-md border border-gray-200 dark:border-slate-800 flex flex-col relative pb-0 ${className}`}
  >
    <div className="overflow-auto w-full max-h-[72vh]">{children}</div>
  </div>
);

// 2. La Tabla en sí
export const Table = ({ children, className = "" }) => (
  <table
    className={`min-w-full table-fixed divide-y divide-gray-200 dark:divide-slate-800 ${className}`}
  >
    {children}
  </table>
);

// 3. Encabezado (Thead)
export const Thead = ({ children, className = "" }) => (
  <thead className={`bg-gray-50 dark:bg-slate-800 ${className}`}>
    {children}
  </thead>
);

// 4. Cuerpo (Tbody)
export const Tbody = ({ children, className = "" }) => (
  <tbody
    className={`bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 ${className}`}
  >
    {children}
  </tbody>
);

// 5. Fila (Tr)
export const Tr = ({ children, className = "", onClick }) => (
  <tr
    onClick={onClick}
    className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${className}`}
  >
    {children}
  </tr>
);

// 6. Celda de Encabezado (Th)
export const Th = ({
  children,
  stickyLeft = false,
  stickyTop = true,
  stickyRight = false,
  align = "center",
  className = "",
  ...props
}) => {
  // ✅ Validación contra NaN
  const safeChildren = Number.isNaN(children) ? "" : children;

  const alignClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  let stickyClasses = "";
  let zIndex = "";

  if (stickyLeft && stickyTop) {
    stickyClasses =
      "sticky left-0 top-0 border-r border-gray-200 dark:border-slate-700";
    zIndex = "z-30";
  } else if (stickyRight && stickyTop) {
    stickyClasses =
      "sticky right-0 top-0 border-l border-gray-200 dark:border-slate-700";
    zIndex = "z-30";
  } else if (stickyTop) {
    stickyClasses = "sticky top-0";
    zIndex = "z-20";
  } else if (stickyLeft) {
    stickyClasses =
      "sticky left-0 border-r border-gray-200 dark:border-slate-700";
    zIndex = "z-20";
  } else if (stickyRight) {
    stickyClasses =
      "sticky right-0 border-l border-gray-200 dark:border-slate-700";
    zIndex = "z-20";
  }

  const defaultBg = "bg-gray-50 dark:bg-slate-800";
  const hasBgClass = /\bbg-(?!dark:)/.test(className);
  const bgClass =
    (stickyLeft || stickyTop || stickyRight) && !hasBgClass ? defaultBg : "";

  return (
    <th
      className={`px-6 py-3 text-xs font-bold text-gray-500 dark:text-white uppercase tracking-wider ${alignClass} ${stickyClasses} ${zIndex} ${bgClass} ${className}`}
      {...props}
    >
      {safeChildren}
    </th>
  );
};

// 7. Celda de Datos (Td)
export const Td = ({
  children,
  stickyLeft = false,
  stickyRight = false,
  align = "center",
  className = "",
  ...props
}) => {
  // ✅ Validación contra NaN: Si el valor es NaN, renderiza un string vacío
  const safeChildren = Number.isNaN(children) ? "" : children;

  const alignClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  let stickyClasses = "";
  let zIndex = "";
  let textColors = "text-gray-500 dark:text-gray-300";

  if (stickyLeft) {
    stickyClasses =
      "sticky left-0 border-r border-gray-200 dark:border-slate-700";
    zIndex = "z-10";
    textColors = "font-medium text-gray-900 dark:text-white";
  } else if (stickyRight) {
    stickyClasses =
      "sticky right-0 border-l border-gray-200 dark:border-slate-700";
    zIndex = "z-10";
    textColors = "font-medium text-gray-900 dark:text-white";
  }

  const defaultBg = "bg-white dark:bg-slate-900";
  const hasBgClass = /\bbg-(?!dark:)/.test(className);
  const bgClass = (stickyLeft || stickyRight) && !hasBgClass ? defaultBg : "";

  return (
    <td
      className={`px-6 py-4 text-sm whitespace-nowrap ${alignClass} ${textColors} ${stickyClasses} ${zIndex} ${bgClass} ${className}`}
      {...props}
    >
      {safeChildren}
    </td>
  );
};

// 8. Input Editable Estándar
export const TableInput = ({
  value,
  onChange,
  type = "text",
  className = "",
}) => {
  // ✅ Validación contra NaN: Si el valor es NaN, el input se muestra vacío
  const safeValue = Number.isNaN(value) ? "" : value;

  return (
    <input
      type={type}
      value={safeValue}
      onChange={onChange}
      className={`w-full min-w-20 p-1 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-center ${className}`}
    />
  );
};
