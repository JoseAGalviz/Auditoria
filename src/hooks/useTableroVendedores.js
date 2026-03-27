/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { apiService } from "../services/apiService";
import {
  analizarGeocerca,
  calcularDistanciaMetros,
} from "../utils/geolocalizacion";
// import { obtenerDireccionBDC } from "../utils/obtenerDireccion";

// --- HELPER: filtrar datos del DÍA DE HOY ---
const esHoy = (fechaString) => {
  if (!fechaString) return true;

  let fecha = new Date(fechaString);

  if (isNaN(fecha.getTime())) {
    const partes = String(fechaString).split(/[-/]/);
    if (partes.length === 3) {
      const fechaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
      fecha = new Date(fechaISO);
    }
  }

  if (isNaN(fecha.getTime())) return true;

  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
};

const formatDateLocal = (dateInput = new Date()) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const useTableroVendedores = (selectedDate = null) => {
  const [rawData, setRawData] = useState([]);
  const [metasData, setMetasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [direcciones, setDirecciones] = useState({});
  const [observacionesManuales, setObservacionesManuales] = useState(() => {
    try {
      const saved = localStorage.getItem("tablero_observaciones");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const actualizarObservacion = (vendedorId, texto) => {
    const nuevasObs = { ...observacionesManuales, [vendedorId]: texto };
    setObservacionesManuales(nuevasObs);
    localStorage.setItem("tablero_observaciones", JSON.stringify(nuevasObs));
  };

  const selectedDateISO = useMemo(
    () => selectedDate || formatDateLocal(new Date()),
    [selectedDate],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const payload = {
          startDate: selectedDateISO,
          endDate: selectedDateISO,
          startDateCobrado: selectedDateISO,
          endDateCobrado: selectedDateISO,
          dia: selectedDateISO,
        };

        const KPI_URL = "http://192.168.4.69:3000/api/kpi-metas";
        const fetchKpi = (p) =>
          fetch(KPI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          }).then((res) => res.json());

        const [
          planificacionResponse,
          metasResponse,
          vendedoresResponse,
        ] = await Promise.all([
          apiService.getPlanificacion({
            fechaInicio: selectedDateISO,
            fechaFin: selectedDateISO,
            startDate: selectedDateISO,
            endDate: selectedDateISO,
          }),
          fetchKpi(payload),
          apiService.getVendedoresApp(),
        ]);

        // Manejo seguro de arrays
        let dataArray = [];
        if (
          planificacionResponse?.data &&
          Array.isArray(planificacionResponse.data)
        ) {
          dataArray = planificacionResponse.data;
        } else if (Array.isArray(planificacionResponse)) {
          dataArray = planificacionResponse;
        }

        setRawData(dataArray);

        let metasArray = [];
        if (metasResponse?.data && Array.isArray(metasResponse.data)) {
          metasArray = metasResponse.data;
        } else if (Array.isArray(metasResponse)) {
          metasArray = metasResponse;
        }

        let vendedoresArray = [];
        if (
          vendedoresResponse?.data &&
          Array.isArray(vendedoresResponse.data)
        ) {
          vendedoresArray = vendedoresResponse.data;
        } else if (Array.isArray(vendedoresResponse)) {
          vendedoresArray = vendedoresResponse;
        }

        // FUSIONAR METAS CON VENDEDORES APP
        // Usamos co_ven como clave principal, o el nombre
        const cleanStr = (str) => (str ? String(str).trim().toLowerCase() : "");
        const metasUnified = [...metasArray];

        vendedoresArray.forEach((vApp) => {
          const vAppCoVen = cleanStr(vApp.co_ven);
          const vAppNombre = cleanStr(vApp.nombre);
          if (!vAppNombre && !vAppCoVen) return;

          const exists = metasUnified.find((m) => {
            const mCoVen = cleanStr(m.co_ven);
            const mNombre = cleanStr(m.nombre);
            return (
              (mCoVen && mCoVen === vAppCoVen) ||
              (mNombre && mNombre.includes(vAppNombre))
            );
          });

          if (!exists) {
            metasUnified.push({
              nombre: vApp.nombre || "Sin Nombre",
              co_ven: vApp.co_ven || "",
              // Defaults for KPI
              metaCobranza: 1,
              metaVentas: 1,
              ventas_factura_sum: 0,
              cobrado_dia: 0,
              clientes_new: 0,
              clientes_recuperados: 0,
              clientes_activos_factura: 0,
              negociacion: 0,
              pedidos_app: 0,
              sinKpi: true,
            });
          }
        });

        setMetasData(metasUnified);
      } catch (err) {
        console.error("Error cargando tablero:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDateISO]);

  const vendedoresFinal = useMemo(() => {
    if (!rawData.length && !metasData.length) return [];
    const agrupado = {};

    const diasSemana = [
      "diaDomingo",
      "diaLunes",
      "diaMartes",
      "diaMiercoles",
      "diaJueves",
      "diaViernes",
      "diaSabado",
    ];
    const selectedDayIdx = new Date(selectedDateISO).getUTCDay();
    const campoDiaActual = diasSemana[selectedDayIdx];
    const cleanStr = (str) => (str ? String(str).trim().toLowerCase() : "");


    // 1. INICIALIZAR TODOS LOS VENDEDORES DE METAS (Profit)
    metasData.forEach((m) => {
      const nombreVendedor = m.nombre || "Sin Nombre";
      const key = cleanStr(nombreVendedor);
      if (!agrupado[key]) {
        agrupado[key] = {
          ...m,
          id: nombreVendedor,
          vendedor: nombreVendedor,
          reportesEstablecidos: Number(m[campoDiaActual]) || 0,
          reportesLogrados: 0,
          visitasApp: Number(m.visitas_app) || 0,
          geoTotalGps: 0,
          geoEnSitio: 0,
          horas: [],
          ultimoRegistroTime: 0,
          ultimaLat: null,
          ultimaLng: null,
          ultimoCliente: "N/A",
          distancia: 0,
          negociaciones: Number(m.negociacion) || 0,
          totalPedidos: Number(m.pedidos_app) || 0,
          cobradoDia: Number(m.cobrado_dia) || 0,
          clientesNew: Number(m.clientes_new) || 0,
          metaCobranza: Number(m.metaCobranza) || 1,
          ventas: Number(m.ventas_factura_sum) || 0,
          carteraActiva: Number(m.clientes_activos_factura) || 0,
          metaVentasMensual: Number(m.metaVentas) || 1,
          nuevosRecuperados: Number(m.clientes_recuperados) || 0,
          gestionesPlanificacion: 0,
          gestionesEfectivas: 0,
          co_ven: m.co_ven,
          sinKpi: m.sinKpi || false,
          hora_1_ven: m.hora_1_ven || null,
          hora_2_ven: m.hora_2_ven || null,
        };
      }
    });

    // 2. PROCESAR LA PLANIFICACION (rawData)
    rawData.forEach((item) => {
      // -----------------------------------------------------
      // FILTRO DE SEMANA (Permisivo)
      // -----------------------------------------------------
      const fechaRegistro =
        item.created_at ||
        item.fecha ||
        item.fecha_asignacion ||
        item.full_data?.fecha ||
        item.full_data?.created_at;

      if (!esHoy(fechaRegistro)) {
        return;
      }

      const nombreVendedorItem = item.vendedor || "Sin Asignar";
      const fullData = item.full_data || {};
      const gestiones = Array.isArray(fullData.gestion) ? fullData.gestion : [];
      const coordsCliente = fullData.coordenadas
        ? fullData.coordenadas.split(",")
        : [];
      const latCliente =
        coordsCliente.length === 2 ? parseFloat(coordsCliente[0]) : null;
      const lngCliente =
        coordsCliente.length === 2 ? parseFloat(coordsCliente[1]) : null;

      const nombreLimpio = cleanStr(nombreVendedorItem);
      const codigoLimpio = cleanStr(fullData.co_ven);

      let v = agrupado[nombreLimpio];

      if (!v) {
        const foundKey = Object.keys(agrupado).find((k) => {
          const m = agrupado[k];
          const mNombre = cleanStr(m.vendedor);
          const mCoVen = cleanStr(m.co_ven);
          return (
            (mNombre && mNombre.includes(nombreLimpio)) ||
            (mCoVen && mCoVen === codigoLimpio)
          );
        });

        if (foundKey) {
          v = agrupado[foundKey];
        } else {
          v = {
            id: nombreVendedorItem,
            vendedor: nombreVendedorItem,
            reportesEstablecidos: 0,
            reportesLogrados: 0,
            visitasApp: 0,
            geoTotalGps: 0,
            geoEnSitio: 0,
            horas: [],
            ultimoRegistroTime: 0,
            ultimaLat: null,
            ultimaLng: null,
            ultimoCliente: "N/A",
            distancia: 0,
            negociaciones: 0,
            cobradoDia: 0,
            clientesNew: 0,
            metaCobranza: 1,
            ventas: 0,
            ventas_factura_sum: 0,
            cobrado_dia: 0,
            carteraActiva: 0,
            metaVentasMensual: 1,
            nuevosRecuperados: 0,
            gestionesPlanificacion: 0,
            gestionesEfectivas: 0,
            co_ven: fullData.co_ven,
            sinKpi: true,
            hora_1_ven: null,
            hora_2_ven: null,
            totalPedidos: 0,
          };
          agrupado[nombreLimpio] = v;
        }
      }
      v.gestionesPlanificacion += 1;

      if (gestiones.length > 0) {
        v.reportesLogrados += 1;
        const analisis = analizarGeocerca(item);
        if (
          analisis.status !== "SIN_GPS_VENDEDOR" &&
          analisis.status !== "SIN_DATA_CLIENTE"
        ) {
          v.geoTotalGps += 1;
          if (analisis.status === "OK") v.geoEnSitio += 1;
        }

        gestiones.forEach((g) => {
          if (
            g.venta_tipoGestion === "concretada" ||
            g.cobranza_tipoGestion === "concretada"
          ) {
            v.gestionesEfectivas += 1;
          }

          if (g.fecha_registro) {
            const fechaSafe = new Date(g.fecha_registro.replace(" ", "T"));
            const time = fechaSafe.getTime();
            if (!isNaN(time)) {
              v.horas.push(fechaSafe);
              if (time > v.ultimoRegistroTime) {
                v.ultimoRegistroTime = time;
                v.ultimaLat = g.ubicacion_lat;
                v.ultimaLng = g.ubicacion_lng;
                v.ultimoCliente = item.nombre_cliente;

                if (latCliente && lngCliente && v.ultimaLat && v.ultimaLng) {
                  const dist = calcularDistanciaMetros(
                    latCliente,
                    lngCliente,
                    parseFloat(v.ultimaLat),
                    parseFloat(v.ultimaLng),
                  );
                  v.distancia = Math.round(dist);
                }
              }
            }
          }
        });
      }
    });

    return Object.values(agrupado).map((v) => {
      // Helper para formatear "HH:MM:SS" -> "HH:MM AM/PM"
      const formatTimeStr = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(":");
        if (parts.length < 2) return null;
        let hh = parseInt(parts[0], 10);
        const mm = parts[1];
        const ampm = hh >= 12 ? "PM" : "AM";
        hh = hh % 12 || 12;
        return `${hh}:${mm} ${ampm}`;
      };

      let horaSalida = formatTimeStr(v.hora_1_ven) || "--:--";
      let horaLlegada = formatTimeStr(v.hora_2_ven) || "--:--";

      // Ya no usamos el cálculo manual basado en gestiones de GPS si la API debe mandar las horas oficiales.
      // v.horas.length > 0...

      let direccionTexto = "Sin actividad";
      if (v.ultimaLat) {
        direccionTexto = direcciones[v.vendedor] || "Localizando...";
      }

      const pctGeocerca =
        v.geoTotalGps > 0
          ? Math.round((v.geoEnSitio / v.geoTotalGps) * 100)
          : 0;

      return {
        ...v,
        horaSalida,
        horaLlegada,
        pctGeocerca,
        direccionTexto,
        observacionManual: observacionesManuales[v.vendedor] || "",
      };
    });
  }, [rawData, metasData, direcciones, observacionesManuales]);

  // useEffect(() => {
  //   if (vendedoresFinal.length === 0) return;
  //   const faltantes = vendedoresFinal.filter(
  //     (v) => v.ultimaLat && v.ultimaLng && !direcciones[v.vendedor],
  //   );
  //   if (faltantes.length === 0) return;

  //   const timer = setTimeout(async () => {
  //     const vendedor = faltantes[0];
  //     try {
  //       const dir = await obtenerDireccionBDC(
  //         vendedor.ultimaLat,
  //         vendedor.ultimaLng,
  //       );
  //       setDirecciones((prev) => ({ ...prev, [vendedor.vendedor]: dir }));
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }, 1200);
  //   return () => clearTimeout(timer);
  // }, [vendedoresFinal, direcciones]);

  return { vendedores: vendedoresFinal, loading, actualizarObservacion };
};
