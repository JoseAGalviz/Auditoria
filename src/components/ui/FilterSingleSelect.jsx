import { useState, useMemo } from "react";
import { User, ChevronDown, Search, X, Check } from "lucide-react";

export const FilterSingleSelect = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSelect = (val) => {
        onChange(val === selected ? null : val);
        setIsOpen(false);
    };

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const term = searchTerm.toLowerCase();
        return options.filter(opt => {
            const labelStr = typeof opt === 'string' ? opt : opt.label;
            return labelStr.toLowerCase().includes(term);
        });
    }, [options, searchTerm]);

    const selectedLabel = useMemo(() => {
        if (!selected) return null;
        const found = options.find(opt => (typeof opt === 'string' ? opt : opt.value) === selected);
        return typeof found === 'string' ? found : found?.label;
    }, [options, selected]);

    return (
        <div className="relative">
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsOpen(!isOpen);
                    }
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-all shadow-sm cursor-pointer select-none ${selected
                    ? "bg-teal-50 border-[#1a9888] text-[#1a9888] ring-1 ring-[#1a9888] dark:bg-teal-900/20 dark:border-teal-800"
                    : "bg-white border-gray-300 text-gray-700 dark:bg-[#262626] dark:border-gray-600 dark:text-gray-300"
                    }`}
            >
                <User size={16} />
                <span className="max-w-37.5 truncate">{selectedLabel || label}</span>
                {selected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        className="ml-1 hover:text-red-500"
                    >
                        <X size={14} />
                    </button>
                )}
                <ChevronDown size={14} className="ml-1 opacity-50" />
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 left-0">
                        <div className="px-3 pt-2 mb-2 flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {label}
                            </div>
                        </div>

                        {/* Buscador interno */}
                        <div className="px-2 mb-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-[#1a9888]"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="text-center py-4 text-xs text-slate-400">
                                    No se encontraron resultados
                                </div>
                            ) : (
                                filteredOptions.map((opt, index) => {
                                    const value = typeof opt === 'string' ? opt : opt.value;
                                    const labelStr = typeof opt === 'string' ? opt : opt.label;
                                    const isSelected = selected === value;
                                    const uniqueKey = `${value}-${index}`;

                                    return (
                                        <div
                                            key={uniqueKey}
                                            onClick={() => handleSelect(value)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-300 ${isSelected
                                                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 font-bold"
                                                : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                                                }`}
                                        >
                                            <span className="leading-snug wrap-break-word">{labelStr}</span>
                                            {isSelected && <Check size={16} className="text-[#1a9888]" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
