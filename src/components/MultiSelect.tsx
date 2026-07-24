import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(x => x !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const displayText = selected.length > 0 ? selected.join(', ') : 'Ninguno';

  return (
    <div className="relative flex-1" ref={containerRef}>
      <button 
        type="button"
        className="w-full p-2 border border-slate-300 rounded text-xs text-left bg-white focus:border-blue-500 outline-none flex justify-between items-center text-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2">{displayText}</span>
        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-1 flex flex-col gap-1">
            {options.map(opt => (
              <label key={opt} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer rounded text-xs text-slate-700">
                <input 
                  type="checkbox" 
                  className="accent-blue-600 cursor-pointer w-3 h-3"
                  checked={selected.includes(opt)}
                  onChange={() => handleToggle(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
