"use client";

import { useState, useRef, useEffect } from "react";
import { AGOO_BARANGAYS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BarangayComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function BarangayCombobox({ value, onChange, error, className, inputClassName, disabled, placeholder = "e.g. San Miguel" }: BarangayComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = AGOO_BARANGAYS.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className || ""}`} ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          className={`w-full border p-2 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#006b2c]/20 ${
            error ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#006b2c]"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} ${inputClassName || ""}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ChevronDown
          className={`w-4 h-4 absolute right-3 text-gray-500 pointer-events-none transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#1f1f1f] text-white rounded-xl shadow-xl max-h-60 overflow-y-auto border border-[#333] p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filtered.length > 0 ? (
              filtered.map((brgy) => (
                <div
                  key={brgy}
                  onClick={() => {
                    setSearch(brgy);
                    onChange(brgy);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2.5 hover:bg-[#333] cursor-pointer rounded-lg text-sm transition-colors flex items-center"
                >
                  {brgy}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                No barangay found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
