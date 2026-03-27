import React, { useState } from "react";
import * as XLSX from "xlsx";
import { apiService } from "../services/apiService";
import { Upload, FileText, CheckCircle, XCircle, Loader } from "lucide-react";
import { useToast } from "../components/ui/Toast";

const AdminImport = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const { showToast, ToastContainer } = useToast();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (
                selectedFile.type ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                selectedFile.type === "application/vnd.ms-excel"
            ) {
                setFile(selectedFile);
                setResult(null);
            } else {
                showToast("Por favor, selecciona un archivo Excel (.xlsx o .xls)", "error");
                e.target.value = null;
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            showToast("Selecciona un archivo primero", "error");
            return;
        }

        console.log("🔘 Botón 'Subir y Procesar' clickeado. Archivo:", file.name);
        setUploading(true);
        setResult(null);

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);

                // Limpieza de claves: eliminar espacios extra y saltos de línea en los encabezados
                const jsonData = rawData.map(row => {
                    const cleanRow = {};
                    Object.keys(row).forEach(key => {
                        const cleanKey = key.toString().replace(/\s+/g, ' ').trim();
                        cleanRow[cleanKey] = row[key];
                    });
                    return cleanRow;
                });

                console.log("📊 Datos extraídos y normalizados:", jsonData);
                console.log("🧪 Ejemplo de claves del primer registro:", Object.keys(jsonData[0] || {}));

                if (jsonData.length === 0) {
                    throw new Error("El archivo Excel está vacío o no tiene el formato correcto.");
                }

                const response = await apiService.uploadExcel(jsonData);
                setResult({
                    success: true,
                    message: response.message,
                    count: response.count,
                });
                showToast("Importación exitosa", "success");
                setFile(null);
            } catch (error) {
                console.error("Error al procesar o subir datos:", error);
                setResult({
                    success: false,
                    message: error.message || "Error al procesar el archivo o subir los datos",
                });
                showToast("Error en la importación", "error");
            } finally {
                setUploading(false);
            }
        };

        reader.onerror = () => {
            console.error("Error al leer el archivo");
            showToast("Error al leer el archivo", "error");
            setUploading(false);
        };

        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <ToastContainer />
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Administración: Cargar Matriz Excel
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Sube la hoja de cálculo para actualizar los datos de la base de datos.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center transition-colors hover:border-teal-400 dark:hover:border-teal-500 bg-gray-50/50 dark:bg-slate-800/50">
                        <input
                            type="file"
                            id="excel-upload"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="excel-upload"
                            className="cursor-pointer flex flex-col items-center group"
                        >
                            <FileText
                                size={48}
                                className="text-gray-400 group-hover:text-teal-500 transition-colors mb-4"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {file ? file.name : "Haga clic para seleccionar archivo Excel"}
                            </span>
                            <span className="text-xs text-gray-500 mt-2">
                                Formatos soportados: .xlsx, .xls
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md ${!file || uploading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-teal-600 hover:bg-teal-700 active:scale-95"
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Subir y Procesar
                                </>
                            )}
                        </button>
                    </div>

                    {result && (
                        <div
                            className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${result.success
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                : "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
                                }`}
                        >
                            <div className="mt-0.5">
                                {result.success ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <XCircle size={20} />
                                )}
                            </div>
                            <div>
                                <p className="font-bold">{result.success ? "Éxito" : "Error"}</p>
                                <p className="text-sm">{result.message}</p>
                                {result.count !== undefined && (
                                    <p className="text-xs mt-1 font-medium">
                                        Filas procesadas: {result.count}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-6">
                <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <XCircle size={18} /> Importante
                </h3>
                <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 list-disc list-inside">
                    <li>Asegúrese de que las columnas coincidan con el formato requerido.</li>
                    <li>El proceso puede tardar unos segundos dependiendo del tamaño del archivo.</li>
                    <li>Los datos cargados se insertarán directamente en la base de datos local.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminImport;
