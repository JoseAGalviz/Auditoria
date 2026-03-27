import React, { useState, useEffect, useMemo } from "react";
import { X, MapPin, ExternalLink, RefreshCw, Clock, Route } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Centro de Venezuela por defecto
const defaultCenter = [7.12539, -66.16667];

// 1. OBLIGA AL MAPA A RECALCULAR SU TAMAÑO TRAS LA ANIMACIÓN DEL MODAL
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
};

// 2. AJUSTA EL ZOOM A LOS PINES
const BoundsUpdater = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
};

// 3. GENERADOR DE PINES DINÁMICOS CON COLORES
const createDynamicIcon = (number, totalStops) => {
  let bgColor = "bg-blue-500"; // Por defecto: Azul (Paradas intermedias)
  let ringColor = "ring-blue-200";

  if (number === 1) {
    bgColor = "bg-emerald-500"; // Inicio: Verde
    ringColor = "ring-emerald-200";
  } else if (number === totalStops) {
    bgColor = "bg-rose-500"; // Fin: Rojo
    ringColor = "ring-rose-200";
  }

  return new L.DivIcon({
    className: "bg-transparent",
    html: `<div class="${bgColor} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white shadow-lg ring-4 ${ringColor} text-sm transition-transform hover:scale-110">
            ${number}
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// 4. HELPERS DE FORMATO
const formatDuration = (seconds) => {
  if (!seconds) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
};

const formatDistance = (meters) => {
  if (!meters) return "0 km";
  return (meters / 1000).toFixed(1) + " km";
};

export const RoutePreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  clientData = [],
  vendorName = "",
}) => {
  const [routePath, setRoutePath] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null); // Guardará tiempo y distancia
  const [isRouting, setIsRouting] = useState(false);
  const [routingError, setRoutingError] = useState(false);

  const locations = useMemo(() => {
    return clientData
      .map((client) => {
        if (!client.coordenadas) return null;
        const parts = client.coordenadas.split(",");
        if (parts.length !== 2) return null;
        return {
          lat: parseFloat(parts[0].trim()),
          lng: parseFloat(parts[1].trim()),
          name: client.nombre,
        };
      })
      .filter(Boolean);
  }, [clientData]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (locations.length < 2) {
        setRoutePath([]);
        setRouteSummary(null);
        return;
      }
      setIsRouting(true);
      setRoutingError(false);
      setRouteSummary(null);

      try {
        const coordsStr = locations
          .map((loc) => `${loc.lng},${loc.lat}`)
          .join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la API de rutas");

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];

          // Trazar el camino
          const leafletCoords = route.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]);
          setRoutePath(leafletCoords);

          // Guardar resumen de tiempo y distancia
          setRouteSummary({
            distance: route.distance, // En metros
            duration: route.duration, // En segundos
          });
        } else {
          throw new Error("No ruta válida");
        }
      } catch (error) {
        console.error("OSRM Error:", error);
        setRoutingError(true);
        setRoutePath(locations.map((loc) => [loc.lat, loc.lng]));
      } finally {
        setIsRouting(false);
      }
    };

    if (isOpen) {
      fetchRoute();
    }
  }, [locations, isOpen]);

  const handleOpenExternalMap = () => {
    if (locations.length < 2) return;
    const origin = `${locations[0].lat},${locations[0].lng}`;
    const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;
    const waypoints = locations.slice(1, -1).map((l) => `${l.lat},${l.lng}`);
    const waypointsStr = waypoints.join("|");

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypointsStr}&travelmode=driving`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white dark:bg-[#111827] w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between z-10 bg-white dark:bg-[#111827]">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Vista Previa de Ruta: {vendorName}
            </h3>
            <p className="text-slate-500 text-sm">
              {locations.length} paradas seleccionadas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 border-b border-blue-100 dark:border-blue-900/30 flex flex-wrap items-center justify-between gap-4 z-10">
          <div className="flex gap-3 items-center text-blue-800 dark:text-blue-200 text-sm">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <MapPin size={20} />
            </div>
            <div>
              <p className="font-bold">Navegación GPS para el conductor</p>
              <p className="opacity-80">
                Abre esta ruta directamente en la app de Google Maps.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenExternalMap}
            disabled={locations.length < 2}
            className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink size={16} />
            Abrir en Google Maps
          </button>
        </div>

        <div className="flex-1 relative bg-gray-100 dark:bg-[#0b1120] z-0">
          {isRouting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#0b1120]/50 backdrop-blur-sm z-2000">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw
                  className="animate-spin text-blue-600 dark:text-blue-400"
                  size={32}
                />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-black/80 px-4 py-1 rounded-full shadow-sm">
                  Calculando ruta óptima...
                </p>
              </div>
            </div>
          )}

          {/* PANEL DE RESUMEN DE RUTA (FLOTANTE) */}
          {routeSummary && !isRouting && (
            <div className="absolute top-4 left-4 z-1000 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col gap-3 animate-in slide-in-from-left-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Resumen del Recorrido
              </h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Clock className="text-blue-500" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none mb-1">
                      Tiempo Estimado
                    </p>
                    <p className="font-bold text-lg leading-none">
                      {formatDuration(routeSummary.duration)}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Route className="text-emerald-500" size={20} />
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none mb-1">
                      Distancia Total
                    </p>
                    <p className="font-bold text-lg leading-none">
                      {formatDistance(routeSummary.distance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {locations.length > 0 ? (
            <MapContainer
              center={locations[0] || defaultCenter}
              zoom={12}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={true}
            >
              <MapResizer />

              <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              <BoundsUpdater locations={locations} />

              {/* LÍNEA DE LA RUTA (Estilo GPS) */}
              {routePath.length > 0 && (
                <>
                  {/* Sombra de la ruta para darle profundidad */}
                  <Polyline
                    positions={routePath}
                    pathOptions={{ color: "#1e3a8a", weight: 8, opacity: 0.3 }}
                  />
                  {/* Línea principal */}
                  <Polyline
                    positions={routePath}
                    pathOptions={{
                      color: routingError ? "#94a3b8" : "#3B82F6",
                      weight: 5,
                      opacity: 1,
                      dashArray: routingError ? "10, 10" : undefined,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                </>
              )}

              {/* PINES DINÁMICOS */}
              {locations.map((loc, idx) => (
                <Marker
                  key={`${loc.lat}-${loc.lng}-${idx}`}
                  position={[loc.lat, loc.lng]}
                  icon={createDynamicIcon(idx + 1, locations.length)}
                />
              ))}
            </MapContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 p-8 text-center">
              <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-full">
                <MapPin size={40} className="text-gray-400" />
              </div>
              <p className="font-medium text-lg text-slate-600 dark:text-slate-300">
                No hay coordenadas válidas para mostrar el mapa.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-white dark:bg-[#111827] z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <MapPin size={18} />
            Confirmar y Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
