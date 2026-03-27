/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  Hash,
  CheckCircle2,
  Trash2,
  FileAudio,
} from "lucide-react";

const CATEGORIA_CONFIG = {
  auditoria: {
    label: "Auditoría",
    order: 1,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  planificaciones: {
    label: "Planificaciones",
    order: 2,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  rendimiento: {
    label: "Rendimiento",
    order: 3,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
};

const SeveridadIcon = ({ severidad, size = 14 }) =>
  severidad === "error" ? (
    <AlertCircle size={size} className="text-rose-500 shrink-0" />
  ) : (
    <AlertTriangle size={size} className="text-amber-500 shrink-0" />
  );

export default function ModalRevisionAlerta({
  grupo,
  isOpen,
  onClose,
  onResolver,
}) {
  const [comentarioAuditor, setComentarioAuditor] = useState("");

  // Estados para guardar los archivos físicos seleccionados
  const [imagenFile, setImagenFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Limpiar el modal al cerrar
  useEffect(() => {
    if (!isOpen) {
      setComentarioAuditor("");
      setImagenFile(null);
      setAudioFile(null);
    }
  }, [isOpen]);

  if (!isOpen || !grupo) return null;

  // Agrupar alertas por categoría
  const porCategoria = Object.entries(
    grupo.alertas.reduce((acc, a) => {
      const cat = a.campo || "rendimiento";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {}),
  ).sort(([a], [b]) => {
    return (
      (CATEGORIA_CONFIG[a]?.order ?? 99) - (CATEGORIA_CONFIG[b]?.order ?? 99)
    );
  });

  // --- Manejadores de Archivos ---
  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) setImagenFile(file);
  };

  const handleAudio = (e) => {
    const file = e.target.files[0];
    if (file) setAudioFile(file);
  };

  // --- Enviar Resolución ---
  const handleResolver = () => {
    onResolver({
      grupoId: grupo.id,
      vendedor: grupo.vendedor,
      alertas: grupo.alertas,
      comentarioAuditor:
        comentarioAuditor.trim() || "Sin observaciones adicionales",
      imagenFile: imagenFile, // Archivo físico de la imagen
      audioFile: audioFile, // Archivo físico del audio
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
              Revisión de alerta
            </p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              {grupo.vendedor}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Alertas del vendedor */}
          <div className="flex flex-col gap-4">
            {porCategoria.map(([cat, alertas]) => {
              const cfg = CATEGORIA_CONFIG[cat] || {
                label: cat,
                color: "bg-gray-100 text-gray-600",
                border: "border-gray-200",
              };
              return (
                <div key={cat}>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <div
                    className={`flex flex-col gap-2 pl-3 border-l-2 ${cfg.border}`}
                  >
                    {alertas.map((a, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <SeveridadIcon severidad={a.severidad} />
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {a.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Justificación */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <Hash size={11} className="inline mr-1" />
              Justificación del Auditor
            </label>
            <textarea
              value={comentarioAuditor}
              onChange={(e) => setComentarioAuditor(e.target.value)}
              placeholder="Explica qué ocurrió y cómo se solucionó (obligatorio)..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all min-h-[100px] resize-y"
            />
          </div>

          {/* Adjuntar imagen */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <ImageIcon size={11} className="inline mr-1" />
              Imagen adjunta
            </label>
            {imagenFile ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={URL.createObjectURL(imagenFile)}
                  alt="Adjunto"
                  className="w-full max-h-48 object-cover"
                />
                <button
                  onClick={() => setImagenFile(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                Subir captura de pantalla
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagen}
            />
          </div>

          {/* Adjuntar Audio */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <FileAudio size={11} className="inline mr-1" />
              Archivo de audio
            </label>
            {audioFile ? (
              <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-400 font-medium truncate pr-4">
                  <FileAudio size={16} className="shrink-0" />
                  <span className="truncate">{audioFile.name}</span>
                </div>
                <button
                  onClick={() => setAudioFile(null)}
                  className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => audioInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors flex items-center justify-center gap-2"
              >
                <Mic size={18} />
                Subir nota de audio (MP3, OGG, M4A)
              </button>
            )}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudio}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleResolver}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 size={16} />
            Guardar y Resolver
          </button>
        </div>
      </div>
    </div>
  );
}
