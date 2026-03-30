import XLSX from "xlsx-js-style";

export const generateDailyAuditExcel = (data) => {
  if (!data || data.length === 0) return;

  const days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const wb = XLSX.utils.book_new();

  // --- 1. DEFINIR ESTILOS ---
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1A9888" } },
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

  const getStatusStyle = (val) => {
    let color = "FFFFFF";
    if (val === "E") color = "C6F6D5";
    if (val === "P") color = "FEEBC8";
    if (val === "N") color = "FED7D7";
    if (val === "X") color = "E9D8FD";

    return {
      ...cellStyle,
      fill: { fgColor: { rgb: color } },
      font: { bold: true },
    };
  };

  const headers = [
    "Cliente",
    "Código",
    "Zona",
    "Día Semana",
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

  // --- 2. GENERAR UNA HOJA POR CADA DÍA ---
  days.forEach((dayKey) => {
    const rows = [];
    data.forEach((row) => {
      const dayData = row.auditoria?.[dayKey] || {};
      const check = (val, char) => (val ? char : "");

      rows.push([
        row.nombre,
        row.codigo,
        row.zona,
        dayKey.toUpperCase(),
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
      ]);
    });

    const worksheetData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Aplicar estilos
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        if (R === 0) {
          ws[cellAddress].s = headerStyle;
        } else {
          const val = ws[cellAddress].v;
          if (["E", "P", "N", "X"].includes(val)) {
            ws[cellAddress].s = getStatusStyle(val);
          } else {
            ws[cellAddress].s = cellStyle;
          }
        }
      }
    }

    // Ajustar columnas
    ws["!cols"] = [
      { wch: 35 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 5 },
      { wch: 40 },
    ];

    // Nombre de la hoja (capitalizado)
    const sheetName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `Auditoria_Semanal_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
