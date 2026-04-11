"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterDropdownProps {
  icon: React.ElementType;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDropdown({ icon: Icon, label, value, options, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative z-20", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all hover:shadow-lg active:scale-95 group",
          value !== label 
            ? "border-primary bg-primary text-white shadow-md shadow-primary/30" 
            : "border-gray-200 bg-white hover:border-primary/30 hover:bg-primary/5 text-gray-600"
        )}
      >
        <Icon className={cn("w-4 h-4", value !== label ? "text-white" : "text-gray-400 group-hover:text-primary")} />
        <span className="text-sm font-bold truncate max-w-[120px]">
          {value === label ? label : value}
        </span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen ? "rotate-180" : "", value !== label ? "text-white" : "text-gray-400")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => {
                  onChange(label);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm font-bold hover:bg-primary/5 transition-colors",
                  value === label ? "text-primary bg-primary/5" : "text-gray-600"
                )}
              >
                All {label}s
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors",
                    value === option ? "text-primary font-bold bg-primary/5" : "text-gray-600"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
