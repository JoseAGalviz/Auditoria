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
  doc.setTextColor(26, 152, 136); // Color Teal (#1a9888)
  doc.text("Reporte de Planificación Semanal", 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Vendedor: ${vendedor}`, 14, 22);
  doc.text(`Fecha de Planificación: ${fechaReporte}`, 14, 27);

  // Total clientes alineado a la derecha
  doc.text(`Total Clientes: ${items.length}`, 280, 22, { align: "right" });

  // --- 3. DEFINIR COLUMNAS ---
  const columns = [
    { header: "Cliente", dataKey: "cliente" },
    { header: "Cód.", dataKey: "codigo" },
    { header: "Ruta", dataKey: "ruta" },
    { header: "Vencido", dataKey: "vencido" }, // Deuda
    { header: "Lun", dataKey: "lunes" },
    { header: "Mar", dataKey: "martes" },
    { header: "Mie", dataKey: "miercoles" },
    { header: "Jue", dataKey: "jueves" },
    { header: "Vie", dataKey: "viernes" },
  ];

  const days = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  // --- 4. MAPEO DE DATOS (BODY) ---
  const body = items.map((item) => {
    // Fila base
    const row = {
      cliente: item.nombre_cliente || "Sin Nombre",
      codigo: item.codigo_profit || "-",
      ruta: item.full_data?.segmento || "-",
      vencido: currency(item.full_data?.saldo_vencido),
      _vencidoRaw: item.full_data?.saldo_vencido || 0,
    };

    // Lógica para cada día
    days.forEach((day) => {
      // Intentar obtener datos del día desde el objeto anidado o plano
      const dayData = item.semana?.[day] || {};

      let content = "-";
      let cellStyles = {
        halign: "center",
        fontSize: 7,
        valign: "middle",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      };

      // --- 1. TAREA (Planificado) ---
      // Puede venir en item.semana[day].tarea o item[day + '_tarea']
      const tareaVal = dayData.tarea ?? item[`${day}_tarea`];
      const tarea = tareaVal ? `P: ${tareaVal}` : "";

      // --- 2. ACCIÓN (Hecho/Visitado) ---
      const accionVal = dayData.accion ?? item[`${day}_accion`];
      const accion = accionVal ? `H: ${accionVal}` : "";

      // --- 3. OBSERVACIÓN ---
      const obsVal = dayData.observacion ?? item[`${day}_observacion`];
      const observacion = obsVal ? `Obs: ${obsVal}` : "";

      // Combinar textos
      const parts = [tarea, accion, observacion].filter(Boolean);

      if (parts.length > 0) {
        content = parts.join("\n");
      }

      // --- LÓGICA DE COLORES ---
      if (accionVal) {
        // CASO 1: VISITADO (Tiene acción) -> VERDE CLARO
        cellStyles.fillColor = [220, 252, 231];
        cellStyles.textColor = [20, 83, 45];
      } else if (tareaVal) {
        // CASO 2: SOLO PLANIFICADO (Sin acción) -> ROJO CLARO
        cellStyles.fillColor = [254, 226, 226];
        cellStyles.textColor = [127, 29, 29];
      }

      // Asignar celda
      row[day] = { content: content, styles: cellStyles };
    });

    return row;
  });

  // --- 5. GENERAR TABLA ---
  autoTable(doc, {
    startY: 35,
    columns: [
      { header: "Cliente", dataKey: "cliente" },
      { header: "Cód.", dataKey: "codigo" },
      { header: "Ruta", dataKey: "ruta" },
      { header: "Vencido", dataKey: "vencido" },
      { header: "Lun", dataKey: "lunes" },
      { header: "Mar", dataKey: "martes" },
      { header: "Mie", dataKey: "miercoles" },
      { header: "Jue", dataKey: "jueves" },
      { header: "Vie", dataKey: "viernes" },
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
      cliente: { cellWidth: 45 },
      codigo: { cellWidth: 15, halign: "center" },
      ruta: { cellWidth: 20, halign: "center" },
      vencido: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      // Los días se reparten el resto del espacio automáticamente
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
