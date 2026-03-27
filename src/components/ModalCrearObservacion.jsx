import React, { useState } from "react";
import { Plus, X, Save, Image as ImageIcon, CheckCircle2 } from "lucide-react";

export default function ModalCrearObservacion({
  isOpen,
  onClose,
  onSave,
  vendedores,
  camposOptions,
}) {
  const [formData, setFormData] = useState({
    titulo: "",
    campo: "",
    vendedor: "",
    descripcion: "",
    imagen: null,
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, imagen: e.target.files[0] }));
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      campo: "",
      vendedor: "",
      descripcion: "",
      imagen: null,
    });
    onClose();
  };

  const handleGuardar = () => {
    onSave(formData, resetForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-xl text-[#1a9888] dark:text-teal-400">
              <Plus size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Nueva Observación
            </h3>
          </div>
          <button
            onClick={resetForm}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO SCROLL */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#1a9888]/10 focus:border-[#1a9888] dark:focus:border-teal-500 outline-none transition-all"
              placeholder="Ej: Visita no concretada"
            />
          </div>

          {/* Selectores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de Observación <span className="text-rose-500">*</span>
              </label>
              <select
                name="campo"
                value={formData.campo}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#1a9888]/10 focus:border-[#1a9888] outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar tipo...</option>
                {camposOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Vendedor <span className="text-rose-500">*</span>
              </label>
              <select
                name="vendedor"
                value={formData.vendedor}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#1a9888]/10 focus:border-[#1a9888] outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar vendedor...</option>
                {vendedores.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción detallada <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#1a9888]/10 focus:border-[#1a9888] outline-none resize-none transition-all"
              placeholder="Describa los detalles de la observación aquí..."
            />
          </div>

          {/* Subida de Imagen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Evidencia Adjunta (Opcional)
            </label>
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${formData.imagen ? 'border-[#1a9888] bg-teal-50 dark:bg-teal-900/10' : 'border-gray-300 dark:border-gray-700 border-dashed bg-gray-50 dark:bg-gray-900/50'} rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {formData.imagen ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 mb-2 text-[#1a9888]" />
                    <p className="text-sm font-medium text-[#1a9888] truncate max-w-50">
                      {formData.imagen.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Click para cambiar archivo</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 mb-2 text-gray-400 group-hover:text-[#1a9888] transition-colors" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-[#1a9888]">Click para explorar</span> o arrastrar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (Max. 5MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={resetForm}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 font-medium transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-6 py-2.5 bg-[#1a9888] hover:bg-[#158a7a] text-white rounded-xl flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Save size={18} /> Guardar Registro
          </button>
        </div>
      </div>
    </div>
  );
}