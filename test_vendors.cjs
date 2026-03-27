

async function test() {
  const token = ""; // Si no lo tenemos, ojalá sea público.
  try {
    console.log("Fetching vendedores-app...");
    const req1 = await fetch("http://192.168.4.23:3000/api/usuarios/vendedores-app");
    const json1 = await req1.json();
    console.log("Vendedores app count:", json1?.length, "o", json1?.data?.length);
    if (json1 && json1.length > 0) {
      console.log("Sample:", json1[0]);
    } else if (json1?.data && json1.data.length > 0) {
      console.log("Sample:", json1.data[0]);
    }

    const payload = {
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        startDateCobrado: "2026-03-17",
        endDateCobrado: "2026-03-17"
    };

    console.log("Fetching KPI Metas...");
    const req2 = await fetch("https://98.94.185.164.nip.io/api/auditoria/kpi-metas", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json2 = await req2.json();
    console.log("KPI Metas count:", json2?.length, "o", json2?.data?.length);
    if (json2 && json2.length > 0) {
      console.log("Sample metas:", json2[0].nombre, json2[0].co_ven);
    } else if (json2?.data && json2.data.length > 0) {
      console.log("Sample metas:", json2.data[0].nombre, json2.data[0].co_ven);
    }
  } catch (err) {
    console.error(err.message);
  }
}

test();
