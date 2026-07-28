"use client";
import React, { useState, useRef, useEffect } from "react";
import { TIMEZONES, TimezoneItem } from "@/lib/timezones";

interface TimezoneSelectorProps {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export function TimezoneSelector({ value, onChange, className = "" }: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find currently selected timezone item
  const selectedTz = TIMEZONES.find(t => t.tz === value) || TIMEZONES[0];

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

  const filteredTimezones = TIMEZONES.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.country.toLowerCase().includes(search.toLowerCase()) ||
    t.tz.toLowerCase().includes(search.toLowerCase()) ||
    t.utcOffset.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 border border-blue-300 rounded-lg bg-white hover:bg-blue-50/50 text-xs font-bold text-slate-800 transition-colors focus:border-blue-600 outline-none shadow-sm cursor-pointer min-w-[280px] sm:min-w-[320px] justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedTz.iso !== "UN" ? (
            <img
              src={`https://flagcdn.com/w40/${selectedTz.iso.toLowerCase()}.png`}
              alt={selectedTz.country}
              className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm flex-shrink-0"
            />
          ) : (
            <span className="text-sm">🌐</span>
          )}
          <span className="truncate text-slate-900">{selectedTz.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="font-mono text-[10px] text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded font-black">
            {selectedTz.utcOffset}
          </span>
          <span className="text-[9px] text-slate-400">▼</span>
        </div>
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto left-0 top-full mt-1.5 w-80 sm:w-96 max-h-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50 sticky top-0">
            <input
              type="text"
              placeholder="🔍 Buscar país, ciudad o uso horario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-600 bg-white text-slate-900 font-medium"
              autoFocus
            />
          </div>

          {/* Timezone Items */}
          <div className="overflow-y-auto max-h-56 divide-y divide-slate-50">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((t) => (
                <button
                  key={t.tz}
                  type="button"
                  onClick={() => {
                    onChange(t.tz);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-blue-50/80 text-left transition-colors cursor-pointer ${
                    t.tz === value ? "bg-blue-100/70 font-black text-blue-900" : "text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {t.iso !== "UN" ? (
                      <img
                        src={`https://flagcdn.com/w40/${t.iso.toLowerCase()}.png`}
                        alt={t.country}
                        className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <span className="text-sm flex-shrink-0">🌐</span>
                    )}
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                    {t.utcOffset}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-400 text-center">No se encontraron zonas horarias</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
