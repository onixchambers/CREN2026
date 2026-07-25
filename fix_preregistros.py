import os

path = 'src/app/dashboard/preregistros/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables for the autocomplete search
search_state_add = '''
  const [fichas, setFichas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
'''

content = content.replace('  const [fichas, setFichas] = useState<any[]>([]);', search_state_add)

# 2. Add filtered search options
filtered_options_logic = '''
    loadPatients();
  }, []);

  const getFilteredPatients = () => {
    let filtered = fichas;
    // Filter by Terapeuta logic: If therapist, only show their own
    if (userRole.toUpperCase() === "TERAPEUTA") {
      filtered = filtered.filter(f => f.medicoTratante === userName);
    }
    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };
  const searchResults = getFilteredPatients();
'''

content = content.replace('''    loadPatients();
  }, []);''', filtered_options_logic)

# 3. Add UI elements above the Form
search_ui = '''
      {/* FORMULARIO PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          {/* BUSCADOR AUTOCOMPLETADO */}
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
            <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-2">Buscador Inteligente (Autocompletar Formulario)</h4>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder={userRole.toUpperCase() === "TERAPEUTA" ? "Buscar entre mis pacientes..." : "Buscar cualquier paciente registrado..."}
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2980b9] text-slate-900"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((paciente) => (
                    <div 
                      key={paciente.id} 
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => {
                        handleEdit(paciente);
                        setSearchQuery(paciente.name);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="font-bold text-[#1a5276] text-sm">{paciente.name}</div>
                      <div className="text-xs text-slate-500">Terapeuta: {paciente.medicoTratante || "Sin asignar"} • Estatus: {paciente.estatus}</div>
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && searchQuery && searchResults.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
                  No se encontraron resultados para esta búsqueda.
                </div>
              )}
            </div>
          </div>

          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-6">
'''

content = content.replace('''
      {/* FORMULARIO PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-6">
''', search_ui)

# 4. Also clear search when handleLimpiar is called
clear_logic = '''
  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
'''
content = content.replace('''
  const handleLimpiar = () => {
    setEditingId(null);
''', clear_logic)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
