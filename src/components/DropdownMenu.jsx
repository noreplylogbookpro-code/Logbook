import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options = [], placeholder, className = "" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = (options || []).find(opt => (typeof opt === 'object' ? opt.value : opt) === value);
    const selectedLabel = selectedOption
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : (placeholder || value || 'Select...');

    return (
        <div ref={ref} className={`relative w-full ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition shadow-2xs font-medium"
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ml-1 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in duration-100">
                    {(options || []).map((opt) => {
                        const optVal = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = optVal === value;

                        return (
                            <button
                                key={optVal}
                                type="button"
                                onClick={() => {
                                    onChange(optVal);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs sm:text-sm rounded-lg font-medium transition cursor-pointer ${isSelected
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-violet-500 dark:hover:bg-indigo-950 hover:scale-105 hover:text-white dark:hover:text-indigo-300'
                                    }`}
                            >
                                <span className="truncate">{optLabel}</span>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-1" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
