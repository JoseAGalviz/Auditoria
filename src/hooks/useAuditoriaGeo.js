/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/apiService";

// --- HELPERS MATEMÁTICOS ---
const toRad = (value) => (value * Math.PI) / 180;

const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;

  try {
    const [lat1, lon1] = String(coord1)
      .split(",")
      .map((v) => parseFloat(v.trim()));
    const [lat2, lon2] = String(coord2)
      .split(",")
      .map((v) => parseFloat(v.trim()));

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;

    const R = 6371e3; // Radio de la tierra en metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  } catch (error) {
    return null;
  }
};

// --- HELPER PARA CARGAR PAGINACIÓN COMPLETA ---
const fetchFullList = async (fetchFunction) => {
  // Primera llamada
  const firstResponse = await fetchFunction(0);

  // Detectar estructura de respuesta
  let dataList = [];
  let totalCount = 0;

  if (Array.isArray(firstResponse)) {
    dataList = firstResponse;
    totalCount = firstResponse.length; // Si es array directo, asumimos que es todo
  } else if (firstResponse && firstResponse.data) {
    dataList = firstResponse.data;
    totalCount = firstResponse.count || firstResponse.total || 0;
  }

  // Si hay más páginas, hacemos el bucle
  const chunkSize = dataList.length;
  if (chunkSize > 0 && totalCount > dataList.length) {
    const pendingRequests = [];
    for (let offset = chunkSize; offset < totalCount; offset += chunkSize) {
      pendingRequests.push(fetchFunction(offset));
    }

    const responses = await Promise.all(pendingRequests);
    responses.forEach((res) => {
      const chunk = Array.isArray(res) ? res : res.data || [];
      dataList = dataList.concat(chunk);
    });
  }
  return dataList;
};

export const useAuditoriaGeo = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE_VISUAL = 25;
  const DISTANCE_THRESHOLD = 50;

  const totalRecords = allData.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE_VISUAL) || 1;
  const paginatedData = allData.slice(
    (page - 1) * ITEMS_PER_PAGE_VISUAL,
    page * ITEMS_PER_PAGE_VISUAL,
  );

  useEffect(() => {
    fetchFusedData();
  }, []);

  const fetchFusedData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. CARGAMOS LAS DOS FUENTES EN PARALELO
      const [profitRawList, bitrixRawList] = await Promise.all([
        // Fuente A: Profit (endpoint antiguo que te funcionaba)
        fetchFullList((offset) => apiService.getGeoAudit(offset)),
        // Fuente B: Bitrix (endpoint nuevo que tiene los datos de bitrix)
        fetchFullList((offset) => apiService.getBitrixCompanies(offset)),
      ]);

      // 2. CREAR UN MAPA DE BITRIX PARA BÚSQUEDA RÁPIDA
      // Usamos el código de Profit (UF_CRM_1634787828) como clave
      const bitrixMap = {};
      bitrixRawList.forEach((item) => {
        // El objeto de Bitrix puede venir directo o dentro de una prop 'bitrix' dependiendo del endpoint
        // Asumimos estructura del endpoint 'companies': trae { bitrix: {...}, profit: {...} } o directo bitrix fields
        const b = item.bitrix || item;

        // Buscamos el código de enlace (Field ID de "Código Profit" en Bitrix)
        const codigoEnlace = b.UF_CRM_1634787828;

        if (codigoEnlace) {
          const key = String(codigoEnlace).trim().toUpperCase();
          bitrixMap[key] = b;
        }
      });

      // 3. FUSIONAR USANDO LA LISTA DE PROFIT COMO BASE
      const fusedData = profitRawList
        .map((item, index) => {
          if (!item) return null;

          // Extraer datos de Profit (del endpoint antiguo)
          const p = item.profit || item; // Por si viene anidado o plano
          const codigoProfit = p.co_cli
            ? String(p.co_cli).trim()
            : "SIN_CODIGO";

          // Buscar coincidencia en el Mapa de Bitrix que creamos
          const bitrixMatch = bitrixMap[codigoProfit.toUpperCase()] || {};

          // --- COORDENADAS ---
          const coordsProfit = p.campo3 || null; // Coordenada Profit
          const coordsBitrix = bitrixMatch.UF_CRM_1651251237102 || null; // Coordenada Bitrix

          // --- CÁLCULO ---
          const distanciaMetros = calculateDistance(coordsBitrix, coordsProfit);

          // --- ESTADO ---
          let status = "MISSING_BOTH";
          if (coordsBitrix && coordsProfit) {
            status = distanciaMetros <= DISTANCE_THRESHOLD ? "MATCH" : "FAR";
          } else if (coordsBitrix && !coordsProfit) {
            status = "MISSING_PROFIT";
          } else if (!coordsBitrix && coordsProfit) {
            status = "MISSING_BITRIX";
          }

          return {
            id_interno: `${codigoProfit}-${index}`,
            codigo: codigoProfit,
            nombre: p.cli_des || bitrixMatch.TITLE || "Sin Nombre",
            zona: p.zon_des || "—",

            coords_profit: coordsProfit,
            coords_bitrix: coordsBitrix,

            distancia: distanciaMetros,
            status: status,
            obs_auditor: "",
          };
        })
        .filter(Boolean);

      setAllData(fusedData);
    } catch (err) {
      console.error("Error en fusión:", err);
      setError("Error unificando datos.");
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setPage(pageNumber);
  };

  const handleAuditChange = useCallback((id_interno, value) => {
    setAllData((prev) =>
      prev.map((row) =>
        row.id_interno === id_interno ? { ...row, obs_auditor: value } : row,
      ),
    );
  }, []);

  return {
    auditData: paginatedData,
    loading,
    error,
    handleAuditChange,
    page,
    totalPages,
    totalRecords,
    goToPage,
    refresh: fetchFusedData,
  };
};
