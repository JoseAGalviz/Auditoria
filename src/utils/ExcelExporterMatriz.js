import XLSX from "xlsx-js-style";

export const generateDailyAuditExcel = (data, selectedDay) => {
  if (!data || data.length === 0) return;

  // --- 1. DEFINIR ESTILOS ---
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1A9888" } }, // Color Teal de tu app
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const cellStyle = {
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      left: { style: "thin", color: { rgb: "CCCCCC" } },
      right: { style: "thin", color: { rgb: "CCCCCC" } },
    },
  };

  // Estilos condicionales para E, P, N
  const getStatusStyle = (val) => {
    let color = "FFFFFF"; // Blanco por defecto
    if (val === "E") color = "C6F6D5"; // Verde claro (bg-green-200)
    if (val === "P") color = "FEEBC8"; // Naranja claro (bg-orange-200)
    if (val === "N") color = "FED7D7"; // Rojo claro (bg-red-200)
    if (val === "X") color = "E9D8FD"; // Morado claro (para CP)

    return {
      ...cellStyle,
      fill: { fgColor: { rgb: color } },
      font: { bold: true },
    };
  };

  // --- 2. PREPARAR LOS DATOS ---
  // Encabezados de las columnas
  const headers = [
    "Cliente",
    "Código",
    "Zona",
    "Día Semana", // Nuevo: Día seleccionado
    "Inicio Whats (E)",
    "Inicio Whats (C)",
    "Venta (E)",
    "Venta (P)",
    "Venta (N)",
    "Cobranza (E)",
    "Cobranza (P)",
    "Cobranza (N)",
    "CP",
    "Llamada Venta (E)",
    "Llamada Venta (P)",
    "Llamada Venta (N)",
    "Llamada Cobro (E)",
    "Llamada Cobro (P)",
    "Llamada Cobro (N)",
    "Observación del Día",
  ];

  // Crear filas de datos
  const rows = data.map((row) => {
    const dayData = row.auditoria?.[selectedDay] || {};

    // Helper para retornar "X" o la letra correspondiente si es true
    const check = (val, char) => (val ? char : "");

    return [
      row.nombre,
      row.codigo,
      row.zona,
      selectedDay.toUpperCase(), // Día actual
      check(dayData.inicio_whatsapp?.e, "E"),
      check(dayData.inicio_whatsapp?.c, "C"),
      check(dayData.accion_venta?.e, "E"),
      check(dayData.accion_venta?.p, "P"),
      check(dayData.accion_venta?.n, "N"),
      check(dayData.accion_cobranza?.e, "E"),
      check(dayData.accion_cobranza?.p, "P"),
      check(dayData.accion_cobranza?.n, "N"),
      check(dayData.cp, "X"),
      check(dayData.llamadas_venta?.e, "E"),
      check(dayData.llamadas_venta?.p, "P"),
      check(dayData.llamadas_venta?.n, "N"),
      check(dayData.llamadas_cobranza?.e, "E"),
      check(dayData.llamadas_cobranza?.p, "P"),
      check(dayData.llamadas_cobranza?.n, "N"),
      dayData.observacion || "",
    ];
  });

  // Combinar headers y filas
  const worksheetData = [headers, ...rows];

  // --- 3. CREAR LA HOJA DE TRABAJO (WORKSHEET) ---
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // --- 4. APLICAR ESTILOS ---
  // El rango de la hoja (ej: A1:T50)
  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      // Si es la primera fila (Header)
      if (R === 0) {
        ws[cellAddress].s = headerStyle;
      } else {
        // Si es una celda de datos
        const val = ws[cellAddress].v;
        // Aplicar estilo condicional si es una columna de gestión (columnas 4 a 18 aprox)
        // O simplemente aplicar estilo base
        if (["E", "P", "N", "X"].includes(val)) {
          ws[cellAddress].s = getStatusStyle(val);
        } else {
          ws[cellAddress].s = cellStyle;
        }
      }
    }
  }

  // --- 5. AJUSTAR ANCHO DE COLUMNAS ---
  ws["!cols"] = [
    { wch: 35 }, // Cliente
    { wch: 10 }, // Codigo
    { wch: 15 }, // Zona
    { wch: 12 }, // Día
    { wch: 5 },
    { wch: 5 }, // Whats
    { wch: 5 },
    { wch: 5 },
    { wch: 5 }, // Venta
    { wch: 5 },
    { wch: 5 },
    { wch: 5 }, // Cobranza
    { wch: 5 }, // CP
    { wch: 5 },
    { wch: 5 },
    { wch: 5 }, // Llamada Venta
    { wch: 5 },
    { wch: 5 },
    { wch: 5 }, // Llamada Cobro
    { wch: 40 }, // Observación
  ];

  // --- 6. GENERAR Y DESCARGAR ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Auditoría ${selectedDay}`);

  const fileName = `Auditoria_${selectedDay}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
