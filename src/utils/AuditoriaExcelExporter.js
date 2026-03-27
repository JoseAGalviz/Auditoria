// src/utils/AuditoriaExcelExporter.js
import XLSX from "xlsx-js-style";

// --- PALETA DE COLORES (Auditoría Corporativa) ---
const COLORS = {
  HEADER_BG: "1A9888", // Teal principal de tu app
  HEADER_TEXT: "FFFFFF", // Blanco

  // Colores para el Estado
  PENDIENTE_BG: "FEF3C7", // Amber-100
  PENDIENTE_TEXT: "92400E", // Amber-800

  APROBACION_BG: "EFF6FF", // Blue-100
  APROBACION_TEXT: "1E40AF", // Blue-800

  APROBADA_BG: "D1FAE5", // Emerald-100
  APROBADA_TEXT: "065F46", // Emerald-800

  RECHAZADA_BG: "FFE4E6", // Rose-100
  RECHAZADA_TEXT: "BE123C", // Rose-800

  // Textos y bordes
  TEXT_MAIN: "1F2937", // Gray-800
  TEXT_MUTED: "4B5563", // Gray-600
  BORDER: "E5E7EB", // Gray-200
  BG_ALT: "F9FAFB", // Gray-50 (Para filas alternas si se desea)
};

// --- ESTILOS COMUNES ---
const borderStyle = {
  top: { style: "thin", color: { rgb: COLORS.BORDER } },
  bottom: { style: "thin", color: { rgb: COLORS.BORDER } },
  left: { style: "thin", color: { rgb: COLORS.BORDER } },
  right: { style: "thin", color: { rgb: COLORS.BORDER } },
};

const baseHeaderStyle = {
  font: { bold: true, sz: 11, color: { rgb: COLORS.HEADER_TEXT } },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: COLORS.HEADER_BG } },
  border: borderStyle,
};

const baseCellStyle = {
  font: { sz: 10, color: { rgb: COLORS.TEXT_MAIN } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: borderStyle,
};

// Función auxiliar para crear celdas
const createCell = (value, type, styleArgs = {}) => {
  return {
    v: value,
    t: type, // 's' string, 'n' number
    s: { ...baseCellStyle, ...styleArgs },
  };
};

export const generateAuditoriaExcel = (
  observaciones,
  vendedores,
  camposOptions,
) => {
  // 1. Definir Encabezados
  const headers = [
    createCell("FECHA", "s", baseHeaderStyle),
    createCell("VENDEDOR", "s", baseHeaderStyle),
    createCell("CATEGORÍA", "s", baseHeaderStyle),
    createCell("TIPO", "s", baseHeaderStyle),
    createCell("FALLAS DETECTADAS", "s", baseHeaderStyle),
    createCell("JUSTIFICACIÓN AUDITOR", "s", baseHeaderStyle),
    createCell("ESTADO FINAL", "s", baseHeaderStyle),
    createCell("EVIDENCIAS", "s", baseHeaderStyle),
  ];

  // 2. Procesar Filas de Datos
  const rows = observaciones.map((obs) => {
    // Cruce de datos (IDs a Nombres)
    const vendedorNombre =
      vendedores.find((v) => v.value === obs.vendedor)?.label || obs.vendedor;
    const campoNombre =
      camposOptions.find((c) => c.value === obs.campo)?.label || obs.campo;

    // Formatear la fecha
    const fechaFormat = new Date(
      obs.fecha_gestion || obs.fecha,
    ).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Formatear fallas con viñetas para que se vea bien en Excel
    let fallasOriginales = "";
    if (obs.alertas_detalle && obs.alertas_detalle.length > 0) {
      fallasOriginales = obs.alertas_detalle
        .map((a) => `• ${a.descripcion}`)
        .join("\n");
    } else {
      fallasOriginales = obs.titulo;
    }

    // Determinar colores y textos según el estado
    let estadoTexto = obs.estado;
    let estadoColorConfig = { bg: "FFFFFF", text: COLORS.TEXT_MAIN };

    switch (obs.estado) {
      case "pendiente":
        estadoTexto = "Esperando Auditor";
        estadoColorConfig = {
          bg: COLORS.PENDIENTE_BG,
          text: COLORS.PENDIENTE_TEXT,
        };
        break;
      case "resuelta_auditor":
        estadoTexto = "Pendiente Aprobación";
        estadoColorConfig = {
          bg: COLORS.APROBACION_BG,
          text: COLORS.APROBACION_TEXT,
        };
        break;
      case "aprobada_cierre":
        estadoTexto = "Aprobada";
        estadoColorConfig = {
          bg: COLORS.APROBADA_BG,
          text: COLORS.APROBADA_TEXT,
        };
        break;
      case "rechazada":
        estadoTexto = "Rechazada";
        estadoColorConfig = {
          bg: COLORS.RECHAZADA_BG,
          text: COLORS.RECHAZADA_TEXT,
        };
        break;
      default:
        break;
    }

    // Texto de justificación
    const justificacion =
      obs.estado !== "pendiente" && obs.descripcion
        ? obs.descripcion
        : "Sin justificación / N/A";

    // Evidencias
    const evidencias =
      obs.imagen_url || obs.audio_url ? "Contiene Adjuntos" : "Sin Adjuntos";

    return [
      createCell(fechaFormat, "s"),
      createCell(vendedorNombre, "s", {
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        font: { bold: true, color: { rgb: COLORS.TEXT_MAIN }, sz: 10 },
      }),
      createCell(campoNombre, "s"),
      createCell(obs.tipo === "automatica" ? "Automática" : "Manual", "s"),
      createCell(fallasOriginales, "s", {
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
      }),
      createCell(justificacion, "s", {
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        font: { italic: true, color: { rgb: COLORS.TEXT_MUTED }, sz: 10 },
      }),
      createCell(estadoTexto, "s", {
        font: { bold: true, color: { rgb: estadoColorConfig.text }, sz: 10 },
        fill: { fgColor: { rgb: estadoColorConfig.bg } },
      }),
      createCell(evidencias, "s", {
        font: {
          color:
            obs.imagen_url || obs.audio_url
              ? { rgb: COLORS.HEADER_BG }
              : { rgb: COLORS.TEXT_MUTED },
          sz: 10,
          bold: !!(obs.imagen_url || obs.audio_url),
        },
      }),
    ];
  });

  // 3. Construir Hoja
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Aplicar datos y estilos celda por celda (Requisito de xlsx-js-style)
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

  // 4. Anchos de columnas
  ws["!cols"] = [
    { wch: 18 }, // Fecha
    { wch: 25 }, // Vendedor
    { wch: 18 }, // Categoría
    { wch: 12 }, // Tipo
    { wch: 55 }, // Fallas Detectadas (Más ancha para la lista)
    { wch: 50 }, // Justificación
    { wch: 22 }, // Estado
    { wch: 18 }, // Evidencias
  ];

  // 5. Descargar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoría Vendedores");
  const fechaArchivo = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Reporte_Auditoria_${fechaArchivo}.xlsx`);
};
