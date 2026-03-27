export const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371e3; // Radio de la Tierra en metros
  const toRad = (valor) => (valor * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const analizarGeocerca = (item) => {
  // 1. Coordenadas del Cliente (Objetivo)
  const coordsClienteStr = item.full_data?.coordenadas || "";
  const parts = coordsClienteStr.split(",");

  if (parts.length !== 2) return { status: "SIN_DATA_CLIENTE", distancia: 0 };

  const latCli = parseFloat(parts[0].trim());
  const lngCli = parseFloat(parts[1].trim());

  // 2. Coordenadas del Vendedor (Real - Primera gestión del array)
  const gestion = item.full_data?.gestion?.[0];

  if (!gestion || !gestion.ubicacion_lat || !gestion.ubicacion_lng) {
    return { status: "SIN_GPS_VENDEDOR", distancia: 0 };
  }

  const latVen = parseFloat(gestion.ubicacion_lat);
  const lngVen = parseFloat(gestion.ubicacion_lng);

  // 3. Calcular
  const distancia = calcularDistanciaMetros(latCli, lngCli, latVen, lngVen);
  const UMBRAL_METROS = 200; // Tolerancia

  if (distancia <= UMBRAL_METROS) {
    return { status: "OK", distancia: Math.round(distancia) };
  } else {
    return { status: "LEJOS", distancia: Math.round(distancia) };
  }
};
