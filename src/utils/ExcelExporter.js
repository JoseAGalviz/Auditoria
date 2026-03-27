// src/utils/ExcelExporter.js
import XLSX from "xlsx-js-style";

// --- PALETA DE COLORES (Basada en Tailwind) ---
const COLORS = {
  HEADER_BG: "F3F4F6", // Gray-100
  HEADER_TEXT: "1F2937", // Gray-800

  BLUE_BG: "EFF6FF", // Blue-50
  BLUE_TEXT: "1E40AF", // Blue-800

  GREEN_BG: "ECFDF5", // Emerald-50
  GREEN_TEXT: "065F46", // Emerald-800
  GREEN_HEADER: "D1FAE5", // Emerald-100

  AMBER_BG: "FFFBEB", // Amber-50
  AMBER_TEXT: "92400E", // Amber-800
  AMBER_HEADER: "FEF3C7", // Amber-100

  PURPLE_BG: "FAF5FF", // Purple-50
  PURPLE_TEXT: "6B21A8", // Purple-800
  PURPLE_HEADER: "F3E8FF", // Purple-100

  TOTAL_BG: "374151", // Gray-700
  TOTAL_TEXT: "FFFFFF", // White
};

// --- ESTILOS COMUNES ---
const borderStyle = {
  top: { style: "thin", color: { rgb: "E5E7EB" } },
  bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  left: { style: "thin", color: { rgb: "E5E7EB" } },
  right: { style: "thin", color: { rgb: "E5E7EB" } },
};

const baseHeaderStyle = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: "center", vertical: "center" },
  border: borderStyle,
};

const baseCellStyle = {
  font: { sz: 10 },
  alignment: { horizontal: "center", vertical: "center" },
  border: borderStyle,
};

// Función auxiliar para crear celdas con estilo
const createCell = (value, type, styleArgs = {}) => {
  return {
    v: value,
    t: type, // 's' string, 'n' number
    s: { ...baseCellStyle, ...styleArgs },
  };
};

export const generateRendimientoExcel = (data, totals) => {
  // 1. Definir Encabezados
  const headers = [
    {
      v: "SEGMENTO / RUTA",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.HEADER_BG } },
        font: { bold: true, color: { rgb: COLORS.HEADER_TEXT } },
        alignment: { horizontal: "left" },
      },
    },
    {
      v: "TOTAL CLIENTES",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.BLUE_BG } },
        font: { bold: true, color: { rgb: COLORS.BLUE_TEXT } },
      },
    },

    // Ejecutiva
    {
      v: "EJEC. EFECTIVOS",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.GREEN_HEADER } },
        font: { bold: true, color: { rgb: COLORS.GREEN_TEXT } },
      },
    },
    {
      v: "EJEC. NEG/PROC",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.GREEN_HEADER } },
        font: { bold: true, color: { rgb: COLORS.GREEN_TEXT } },
      },
    },
    {
      v: "% EFEC. EJECUTIVA",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.GREEN_HEADER } },
        font: { bold: true, color: { rgb: COLORS.GREEN_TEXT } },
      },
    },

    // Vendedor
    {
      v: "VEND. EFECTIVOS",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.AMBER_HEADER } },
        font: { bold: true, color: { rgb: COLORS.AMBER_TEXT } },
      },
    },
    {
      v: "VEND. NEG/PROC",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.AMBER_HEADER } },
        font: { bold: true, color: { rgb: COLORS.AMBER_TEXT } },
      },
    },
    {
      v: "% EFEC. VENDEDOR",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.AMBER_HEADER } },
        font: { bold: true, color: { rgb: COLORS.AMBER_TEXT } },
      },
    },

    // Consolidado
    {
      v: "GEST. REALES",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.PURPLE_HEADER } },
        font: { bold: true, color: { rgb: COLORS.PURPLE_TEXT } },
      },
    },
    {
      v: "% CUMPLIMIENTO",
      t: "s",
      s: {
        ...baseHeaderStyle,
        fill: { fgColor: { rgb: COLORS.PURPLE_HEADER } },
        font: { bold: true, color: { rgb: COLORS.PURPLE_TEXT } },
      },
    },
  ];

  // 2. Procesar Filas de Datos
  const rows = data.map((row) => {
    // Cálculos
    const totalExec = row.ejecutiva.efectivos + row.ejecutiva.no_efectivos;
    const pctExec = totalExec > 0 ? row.ejecutiva.efectivos / totalExec : 0; // Guardamos decimal para formato %

    const totalVend = row.vendedor.efectivos + row.vendedor.no_efectivos;
    const pctVend = totalVend > 0 ? row.vendedor.efectivos / totalVend : 0;

    const pctCumpl =
      row.total_clientes > 0 ? row.gestiones_reales / row.total_clientes : 0;

    return [
      // Segmento
      createCell(row.segmento, "s", {
        alignment: { horizontal: "left" },
        font: { bold: true },
      }),
      // Clientes
      createCell(row.total_clientes, "n", {
        font: { color: { rgb: COLORS.BLUE_TEXT }, bold: true },
      }),

      // Ejecutiva (Verde)
      createCell(row.ejecutiva.efectivos, "n", {
        font: { color: { rgb: COLORS.GREEN_TEXT } },
      }),
      createCell(row.ejecutiva.no_efectivos, "n", {
        font: { color: { rgb: "6B7280" } },
      }), // Gray text
      createCell(pctExec, "n", {
        numFmt: "0.0%",
        font: { bold: true, color: { rgb: COLORS.GREEN_TEXT } },
        fill: { fgColor: { rgb: COLORS.GREEN_BG } },
      }),

      // Vendedor (Ambar)
      createCell(row.vendedor.efectivos, "n", {
        font: { color: { rgb: COLORS.AMBER_TEXT } },
      }),
      createCell(row.vendedor.no_efectivos, "n", {
        font: { color: { rgb: "6B7280" } },
      }),
      createCell(pctVend, "n", {
        numFmt: "0.0%",
        font: { bold: true, color: { rgb: COLORS.AMBER_TEXT } },
        fill: { fgColor: { rgb: COLORS.AMBER_BG } },
      }),

      // Consolidado (Morado)
      createCell(row.gestiones_reales, "n", {
        font: { bold: true, color: { rgb: COLORS.PURPLE_TEXT } },
      }),
      createCell(pctCumpl, "n", {
        numFmt: "0.0%",
        font: { bold: true, color: { rgb: COLORS.PURPLE_TEXT } },
        fill: { fgColor: { rgb: COLORS.PURPLE_BG } },
      }),
    ];
  });

  // 3. Fila de Totales
  const totalExecCount = totals.ejecutiva_efectivos + totals.ejecutiva_no;
  const pctGlobalExec =
    totalExecCount > 0 ? totals.ejecutiva_efectivos / totalExecCount : 0;

  const totalVendCount = totals.vendedor_efectivos + totals.vendedor_no;
  const pctGlobalVend =
    totalVendCount > 0 ? totals.vendedor_efectivos / totalVendCount : 0;

  const pctGlobalCumpl =
    totals.total_clientes > 0
      ? totals.gestiones_reales / totals.total_clientes
      : 0;

  const totalStyle = {
    fill: { fgColor: { rgb: COLORS.TOTAL_BG } },
    font: { bold: true, color: { rgb: COLORS.TOTAL_TEXT } },
    border: borderStyle,
  };

  const totalRow = [
    {
      v: "TOTALES",
      t: "s",
      s: { ...totalStyle, alignment: { horizontal: "right" } },
    },
    { v: totals.total_clientes, t: "n", s: totalStyle },

    { v: totals.ejecutiva_efectivos, t: "n", s: totalStyle },
    { v: totals.ejecutiva_no, t: "n", s: totalStyle },
    { v: pctGlobalExec, t: "n", s: { ...totalStyle, numFmt: "0.0%" } },

    { v: totals.vendedor_efectivos, t: "n", s: totalStyle },
    { v: totals.vendedor_no, t: "n", s: totalStyle },
    { v: pctGlobalVend, t: "n", s: { ...totalStyle, numFmt: "0.0%" } },

    { v: totals.gestiones_reales, t: "n", s: totalStyle },
    { v: pctGlobalCumpl, t: "n", s: { ...totalStyle, numFmt: "0.0%" } },
  ];

  // 4. Construir Hoja
  const wsData = [headers, ...rows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Agregar datos celda por celda para respetar los objetos de estilo
  wsData.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      ws[cellRef] = cell;
    });
  });

  // Definir rango de la hoja
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: wsData.length - 1, c: headers.length - 1 },
  });

  // Ancho de columnas
  ws["!cols"] = [
    { wch: 35 }, // Segmento
    { wch: 15 }, // Total
    { wch: 15 },
    { wch: 15 },
    { wch: 12 }, // Exec
    { wch: 15 },
    { wch: 15 },
    { wch: 12 }, // Vend
    { wch: 15 },
    { wch: 12 }, // Cons
  ];

  // 5. Descargar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rendimiento");
  XLSX.writeFile(
    wb,
    `Rendimiento_Detallado_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
};
