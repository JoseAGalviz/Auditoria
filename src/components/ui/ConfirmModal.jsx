import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    type = "warning"
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-lg active:scale-95 transition-all ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : 'bg-[#1a9888] hover:bg-[#137a6d] shadow-teal-500/20'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
