export const obtenerDireccionBDC = async (lat, lng) => {
  if (!lat || !lng) return "Sin GPS";

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "GestorVendedoresApp/1.0",
      },
    });

    if (!response.ok) throw new Error("Error API OSM");

    const data = await response.json();

    // Armamos la dirección con los datos de OSM
    const addr = data.address || {};

    // Prioridad de campos para que se vea bien (Calle, Barrio, Ciudad)
    const partes = [];

    // Intentamos calle o lugar específico
    if (addr.road) partes.push(addr.road);
    else if (addr.pedestrian) partes.push(addr.pedestrian);

    // Barrio o sector
    if (addr.neighbourhood) partes.push(addr.neighbourhood);
    else if (addr.suburb) partes.push(addr.suburb);

    // Ciudad o pueblo (si no hay barrio)
    if (partes.length < 2) {
      if (addr.city) partes.push(addr.city);
      else if (addr.town) partes.push(addr.town);
      else if (addr.village) partes.push(addr.village);
    }

    return partes.join(", ") || "Ubicación encontrada";
  } catch (error) {
    console.warn("Error obteniendo dirección:", error);
    // Devuelve null o texto vacío para que NO salga "Error de red" en la pantalla
    return "Dirección no disponible";
  }
};
