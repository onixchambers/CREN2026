"use client";
import React, { useState, useRef, useEffect } from "react";
import { COUNTRY_CODES } from "@/lib/countryCodes";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function CountrySelector({ value, onChange, className = "" }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find currently selected country
  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) ||
    c.iso.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors focus:border-[#2980b9] outline-none shadow-sm cursor-pointer min-w-[95px] justify-between"
      >
        <div className="flex items-center gap-1.5">
          <img
            src={`https://flagcdn.com/w40/${selectedCountry.iso.toLowerCase()}.png`}
            alt={selectedCountry.name}
            className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm flex-shrink-0"
          />
          <span className="font-semibold text-slate-800">{selectedCountry.code}</span>
        </div>
        <span className="text-[9px] text-slate-400 ml-1">▼</span>
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 max-h-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
            <input
              type="text"
              placeholder="🔍 Buscar país o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded outline-none focus:border-[#2980b9] bg-white text-slate-800"
              autoFocus
            />
          </div>

          {/* Country Items */}
          <div className="overflow-y-auto max-h-52 divide-y divide-slate-50">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, i) => (
                <button
                  key={c.iso + c.code + i}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-sky-50 text-left transition-colors cursor-pointer ${
                    c.code === value ? "bg-sky-100/70 font-semibold text-[#1a5276]" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={`https://flagcdn.com/w40/${c.iso.toLowerCase()}.png`}
                      alt={c.name}
                      className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm flex-shrink-0"
                    />
                    <span className="truncate">{c.name.split(' (')[0]}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-bold ml-2">{c.code}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-400 text-center">No se encontraron resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
