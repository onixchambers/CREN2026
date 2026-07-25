import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a state for showing the custom dropdown
state_code = '''  // Formulario
  const [formData, setFormData] = useState({'''
new_state_code = '''  // Predictivo
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({'''
content = content.replace(state_code, new_state_code)

# Replace the input and datalist with a custom predictive dropdown
old_input = '''              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE</label>
                <input 
                  type="text" 
                  name="pacienteNombre" 
                  list="pacientes-list"
                  value={formData.pacienteNombre} 
                  onChange={handlePacienteChange} 
                  placeholder="Escribir o seleccionar paciente..."
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" 
                />
                <datalist id="pacientes-list">
                  {pacientes.map(p => (
                    <option key={p.id} value={p.paciente} />
                  ))}
                </datalist>
              </div>'''

new_input = '''              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE</label>
                <input 
                  type="text" 
                  name="pacienteNombre" 
                  autoComplete="off"
                  value={formData.pacienteNombre} 
                  onChange={(e) => {
                    handlePacienteChange(e);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Escribir para buscar paciente..."
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" 
                />
                {showDropdown && (
                  <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {pacientes
                      .filter(p => p.paciente.toLowerCase().includes(formData.pacienteNombre.toLowerCase()))
                      .map(p => (
                        <li 
                          key={p.id} 
                          className="px-3 py-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              pacienteId: p.id,
                              pacienteNombre: p.paciente,
                              pacienteNac: p.nac !== "—" ? p.nac : "",
                              pacienteSexo: p.sexo,
                              pacienteEdad: p.edad
                            });
                            setShowDropdown(false);
                          }}
                        >
                          {p.paciente}
                        </li>
                      ))}
                    {pacientes.filter(p => p.paciente.toLowerCase().includes(formData.pacienteNombre.toLowerCase())).length === 0 && (
                      <li className="px-3 py-2 text-sm text-slate-400">No se encontraron pacientes</li>
                    )}
                  </ul>
                )}
              </div>'''
content = content.replace(old_input, new_input)

# Fix the medicoTratante case-insensitive filter
old_filter = '''validPatients = validPatients.filter((p: any) => p.medicoTratante === userName);'''
new_filter = '''validPatients = validPatients.filter((p: any) => p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());'''
content = content.replace(old_filter, new_filter)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
