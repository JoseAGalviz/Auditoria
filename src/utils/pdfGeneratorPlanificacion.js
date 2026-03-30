import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- HELPERS ---
const currency = (val) => {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
  }).format(val || 0);
};

const formatDate = (dateInput) => {
  if (!dateInput) return "Fecha desconocida";
  const date = new Date(dateInput);
  return date.toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Genera un PDF para un grupo específico de planificaciones
 * @param {Array} items - Array de objetos de la planificación (el grupo seleccionado)
 * @param {Date|String} datePlanificacion - La fecha de registro de ese grupo
 */
export const generatePlanificacionPDF = (items, datePlanificacion) => {
  if (!items || items.length === 0) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // --- 1. DATOS DEL ENCABEZADO ---
  // Tomamos el primer item para sacar datos comunes del vendedor
  const headerData = items[0];
  const vendedor = headerData.vendedor || headerData.usuario || "Vendedor";
  const fechaReporte = formatDate(datePlanificacion || new Date());

  // --- 2. DIBUJAR ENCABEZADO ---
  doc.setFontSize(18);
  doc.setTextColor(26, 152, 136);
  doc.text("Reporte de Planificación", 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Vendedor: ${vendedor}`, 14, 22);
  doc.text(`Fecha de Planificación: ${fechaReporte}`, 14, 27);
  doc.text(`Total Clientes: ${items.length}`, 280, 22, { align: "right" });

  // --- 3. MAPEO DE DATOS (BODY) ---
  const body = items.map((item) => {
    const tarea = item.gestion?.tarea || item.full_data?.tarea || "-";
    const tieneTarea = tarea && tarea !== "-";

    const tareaStyles = {
      fontSize: 8,
      valign: "middle",
      fillColor: tieneTarea ? [254, 243, 199] : [255, 255, 255],
      textColor: tieneTarea ? [120, 53, 15] : [100, 100, 100],
    };


    return {
      cliente: item.nombre_cliente || "Sin Nombre",
      codigo: item.codigo_profit || "-",
      ruta: item.full_data?.segmento || "-",
      vencido: currency(item.full_data?.saldo_vencido),
      _vencidoRaw: item.full_data?.saldo_vencido || 0,
      tarea: { content: tarea, styles: tareaStyles },
    };
  });

  // --- 4. GENERAR TABLA ---
  autoTable(doc, {
    startY: 35,
    columns: [
      { header: "Cliente", dataKey: "cliente" },
      { header: "Cód.", dataKey: "codigo" },
      { header: "Ruta", dataKey: "ruta" },
      { header: "Vencido", dataKey: "vencido" },
      { header: "Tarea", dataKey: "tarea" },
    ],
    body: body,
    theme: "grid",
    headStyles: {
      fillColor: [26, 152, 136], // Cabecera Teal
      textColor: 255,
      fontSize: 9,
      halign: "center",
      valign: "middle",
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      overflow: "linebreak",
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    columnStyles: {
      cliente: { cellWidth: 55 },
      codigo: { cellWidth: 18, halign: "center" },
      ruta: { cellWidth: 22, halign: "center" },
      vencido: { cellWidth: 25, halign: "right", fontStyle: "bold" },
      tarea: { cellWidth: 80 },
    },
    // Hook para pintar el texto de "Vencido" en rojo si es mayor a 0
    didParseCell: (data) => {
      if (data.section === "body" && data.column.dataKey === "vencido") {
        const rawValue = data.row.raw._vencidoRaw;
        if (rawValue > 0) {
          data.cell.styles.textColor = [220, 38, 38]; // Rojo intenso
        }
      }
    },
  });

  // --- 6. GUARDAR ARCHIVO ---
  // Nombre limpio: Planificacion_Vendedor_YYYY-MM-DD.pdf
  const dateStr = datePlanificacion
    ? new Date(datePlanificacion).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const cleanVendor = vendedor.replace(/\s+/g, "_");

  doc.save(`Planificacion_${cleanVendor}_${dateStr}.pdf`);
};
