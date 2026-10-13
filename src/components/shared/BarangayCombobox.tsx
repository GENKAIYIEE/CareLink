"use client";

import { useState, useRef, useEffect } from "react";
import { AGOO_BARANGAYS } from "@/lib/constants";
import { ChevronDown, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BarangayComboboxProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

export function BarangayCombobox({
  value,
  onChange,
  error,
  className,
  inputClassName,
  disabled,
  placeholder = "Select a barangay",
  includeAllOption = false,
  allOptionLabel = "All Barangays",
}: BarangayComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className || ""}`} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006b2c]/20 transition-all ${
          error ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#006b2c]"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "bg-white hover:bg-gray-50"} ${inputClassName || ""}`}
      >
        <span className={`block truncate ${!value ? "text-gray-500" : "text-gray-900 font-medium"}`}>
          {value === "ALL" ? allOptionLabel : (value || placeholder)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 pointer-events-none transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl max-h-[250px] overflow-y-auto border border-gray-100 p-1.5 origin-top [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {includeAllOption && (
              <>
                <div
                  onClick={() => {
                    onChange("ALL");
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer rounded-lg text-sm transition-colors flex items-center justify-between ${
                    value === "ALL"
                      ? "bg-emerald-50 text-[#006b2c] font-semibold"
                      : "hover:bg-gray-50 text-gray-700 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCheck className={`w-4 h-4 shrink-0 ${value === "ALL" ? "text-[#006b2c]" : "text-gray-400"}`} />
                    <span className="whitespace-nowrap truncate">{allOptionLabel}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                    value === "ALL"
                      ? "bg-emerald-100 text-[#006b2c]"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    All
                  </span>
                </div>
                <div className="border-t border-gray-100 my-1" />
              </>
            )}
            {AGOO_BARANGAYS.map((brgy) => (
              <div
                key={brgy}
                onClick={() => {
                  onChange(brgy);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 cursor-pointer rounded-lg text-sm transition-colors flex items-center ${
                  value === brgy
                    ? "bg-emerald-50 text-[#006b2c] font-semibold"
                    : "hover:bg-gray-50 text-gray-700 font-medium"
                }`}
              >
                {brgy}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
