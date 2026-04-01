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

  const dayGroupStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
    fill: { fgColor: { rgb: "0D5B52" } }, // Teal más oscuro para resaltar el día
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "medium", color: { rgb: "000000" } },
      right: { style: "medium", color: { rgb: "000000" } },
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

  // Etiquetas de gestión (16 columnas)
  const managementLabels = [
    "I. Whats (E)",
    "I. Whats (C)",
    "Venta (E)",
    "Venta (P)",
    "Venta (N)",
    "Cobro (E)",
    "Cobro (P)",
    "Cobro (N)",
    "CP",
    "Llam. Venta (E)",
    "Llam. Venta (P)",
    "Llam. Venta (N)",
    "Llam. Cobro (E)",
    "Llam. Cobro (P)",
    "Llam. Cobro (N)",
    "Observación",
  ];

  // --- 2. GENERAR UNA HOJA POR CADA DÍA (CUMULATIVA) ---
  days.forEach((currentDayKey, dayIdx) => {
    const activeDays = days.slice(0, dayIdx + 1);

    // Header 1: Títulos de los días (Combinados)
    const headerRow1 = ["", "", ""]; // Espacio para Cliente, Código, Zona
    activeDays.forEach((d) => {
      headerRow1.push(d.toUpperCase());
      // Llenamos con vacíos para los merges (15 más para un total de 16)
      for (let i = 0; i < 15; i++) headerRow1.push("");
    });

    // Header 2: Etiquetas específicas
    const headerRow2 = ["Cliente", "Código", "Zona"];
    activeDays.forEach(() => {
      headerRow2.push(...managementLabels);
    });

    // Filas de Datos
    const rows = data.map((client) => {
      const rowData = [client.nombre, client.codigo, client.zona];
      
      activeDays.forEach((dKey) => {
        const audit = client.auditoria?.[dKey] || {};
        const check = (val, char) => (val ? char : "");
        
        rowData.push(
          check(audit.inicio_whatsapp?.e, "E"),
          check(audit.inicio_whatsapp?.c, "C"),
          check(audit.accion_venta?.e, "E"),
          check(audit.accion_venta?.p, "P"),
          check(audit.accion_venta?.n, "N"),
          check(audit.accion_cobranza?.e, "E"),
          check(audit.accion_cobranza?.p, "P"),
          check(audit.accion_cobranza?.n, "N"),
          check(audit.cp, "X"),
          check(audit.llamadas_venta?.e, "E"),
          check(audit.llamadas_venta?.p, "P"),
          check(audit.llamadas_venta?.n, "N"),
          check(audit.llamadas_cobranza?.e, "E"),
          check(audit.llamadas_cobranza?.p, "P"),
          check(audit.llamadas_cobranza?.n, "N"),
          audit.observacion || ""
        );
      });
      return rowData;
    });

    const worksheetData = [headerRow1, headerRow2, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // DEFINIR MERGES para los títulos de los días
    const merges = [];
    activeDays.forEach((_, idx) => {
      const startCol = 3 + idx * 16;
      const endCol = startCol + 15;
      merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: endCol } });
    });
    ws["!merges"] = merges;

    // APLICAR ESTILOS
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        const cell = ws[cellAddress];

        if (R === 0) {
          // Fila de Títulos de Día (solo aplicar estilo a las celdas con texto o merges)
          if (C >= 3) cell.s = dayGroupStyle;
        } else if (R === 1) {
          // Fila de Etiquetas
          cell.s = headerStyle;
        } else {
          // Filas de Datos
          const val = cell.v;
          if (["E", "P", "N", "X"].includes(val)) {
            cell.s = getStatusStyle(val);
          } else {
            cell.s = cellStyle;
          }
        }
      }
    }

    // AJUSTAR ANCHOS DE COLUMNAS
    const cols = [{ wch: 35 }, { wch: 10 }, { wch: 15 }]; // Info base
    activeDays.forEach(() => {
      for (let i = 0; i < 15; i++) cols.push({ wch: 7 }); // Gestión
      cols.push({ wch: 35 }); // Observación
    });
    ws["!cols"] = cols;

    // Agregar hoja
    const sheetName = currentDayKey.charAt(0).toUpperCase() + currentDayKey.slice(1);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // GENERAR Y DESCARGAR
  const fileName = `Auditoria_Acumulada_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};


