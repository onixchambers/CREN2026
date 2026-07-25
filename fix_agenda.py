import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { getTerapeutas } from "@/app/actions/configuracion";',
    'import { getTerapeutas } from "@/app/actions/configuracion";\nimport { getPatients } from "@/app/actions/pacientes";'
)

# 2. Add patients state
content = content.replace(
    'const [terapeutas, setTerapeutas] = useState<string[]>([]);',
    'const [terapeutas, setTerapeutas] = useState<string[]>([]);\n  const [pacientes, setPacientes] = useState<{id: string, name: string}[]>([]);\n  const [showDropdown, setShowDropdown] = useState(false);'
)

# 3. Fix userRole condition and load patients
old_load = '''        let teraList = res.terapeutas;
        if (userRole === "TERAPEUTA") {
          teraList = [userName];
        }
        setTerapeutas(teraList);
        if (teraList.length > 0) {
          setFormData(prev => ({ ...prev, terapeuta: teraList[0] }));
        }
      }
      setIsLoadingTerapeutas(false);'''

new_load = '''        let teraList = res.terapeutas;
        if (userRole.toUpperCase() === "TERAPEUTA") {
          teraList = [userName];
        }
        setTerapeutas(teraList);
        if (teraList.length > 0) {
          setFormData(prev => ({ ...prev, terapeuta: teraList[0] }));
        }
      }
      
      const pacRes = await getPatients();
      if (pacRes.success && pacRes.data) {
        setPacientes(pacRes.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
      
      setIsLoadingTerapeutas(false);'''
content = content.replace(old_load, new_load)

# 4. Replace input with custom dropdown
old_input = '''                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Paciente</label>
                  <input required type="text" name="paciente" value={formData.paciente} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" placeholder="Ej. Carlos Mendoza" />
                </div>'''

new_input = '''                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Paciente</label>
                  <input 
                    required 
                    type="text" 
                    name="paciente" 
                    autoComplete="off"
                    value={formData.paciente} 
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" 
                    placeholder="Escribir para buscar paciente..." 
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {pacientes
                        .filter(p => p.name.toLowerCase().includes(formData.paciente.toLowerCase()))
                        .map(p => (
                          <li 
                            key={p.id} 
                            className="px-3 py-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                paciente: p.name,
                              });
                              setShowDropdown(false);
                            }}
                          >
                            {p.name}
                          </li>
                        ))}
                      {pacientes.filter(p => p.name.toLowerCase().includes(formData.paciente.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">No se encontraron pacientes</li>
                      )}
                    </ul>
                  )}
                </div>'''
content = content.replace(old_input, new_input)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
