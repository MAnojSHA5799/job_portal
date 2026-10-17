"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SearchableOption)[];
  placeholder: string;
  emptyLabel?: string;
  allowCustom?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel = "All Options",
  allowCustom = false,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SearchableOption[]
  const normalizedOptions: SearchableOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option's label
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    );
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const isCustomMatchAvailable =
    allowCustom &&
    search.trim() &&
    !normalizedOptions.some(
      (opt) => opt.value.toLowerCase() === search.trim().toLowerCase()
    );

  const displayLabel = selectedOption ? selectedOption.label : value ? value : placeholder;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group",
        isOpen ? "z-[60]" : "z-10",
        className
      )}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full appearance-none pl-5 pr-9 py-3 bg-white border rounded-full text-sm font-bold transition-all cursor-pointer flex items-center justify-between text-left shadow-xs hover:border-primary/20 hover:bg-gray-50/50 focus:outline-none select-none",
          value
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-gray-100 text-gray-700"
        )}
      >
        <span className="truncate pr-1">{displayLabel}</span>

        {/* Clear icon if value selected, else chevron */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : (
            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform duration-200 pointer-events-none",
                isOpen && "rotate-180 text-primary"
              )}
            />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2.5 z-[70] overflow-hidden"
          >
            {/* Search Input Box */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${placeholder.replace(/^[^\w\s]+\s*/, '')}...`}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-xs font-semibold rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all text-gray-800 placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Option to clear / all options */}
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={cn(
                  "w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between",
                  !value
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>{emptyLabel}</span>
                {!value && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>

              {/* Custom Value Option if typing something not in list */}
              {isCustomMatchAvailable && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-between"
                >
                  <span className="truncate">
                    📍 Use "{search.trim()}"
                  </span>
                  <span className="text-[10px] uppercase font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    Custom
                  </span>
                </button>
              )}

              {/* Filtered Options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = value.toLowerCase() === opt.value.toLowerCase();
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between group/opt",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.count !== undefined && opt.count > 0 && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            isSelected
                              ? "bg-primary/20 text-primary"
                              : "bg-gray-100 text-gray-500 group-hover/opt:bg-gray-200"
                          )}>
                            {opt.count}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })
              ) : !isCustomMatchAvailable ? (
                <div className="py-6 text-center text-xs text-gray-400 font-medium">
                  No matching options found
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
