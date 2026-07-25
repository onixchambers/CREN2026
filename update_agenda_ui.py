import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for the new actions
if 'getAgenda' not in content:
    content = content.replace(
        'import { getPatients } from "@/app/actions/pacientes";',
        'import { getPatients } from "@/app/actions/pacientes";\nimport { getAgenda, addCita, updateCita } from "@/app/actions/agenda";'
    )

# Update Cita type
content = content.replace(
    'estado: "Ocupado" | "Cancelado" | "Reagendado" | "Disponible";\n};',
    'estado: "Ocupado" | "Cancelado" | "Reagendado" | "Disponible";\n  pagado?: boolean;\n  metodoPago?: string;\n};'
)

# Update state initialization
content = content.replace(
    'paciente: "", fecha: hoy, hora: "09:00", terapeuta: "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado" as Cita["estado"]',
    'paciente: "", fecha: hoy, hora: "09:00", terapeuta: "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado" as Cita["estado"], pagado: false, metodoPago: ""'
)

# Replace useEffect data fetching
target_useeffect = '''      const pacRes = await getPatients();
      if (pacRes.success && pacRes.data) {
        setPacientes(pacRes.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
      
      setIsLoadingTerapeutas(false);
    }
    loadTerapeutas();
  }, [status, userRole, userName]);'''

replacement_useeffect = '''      const pacRes = await getPatients();
      if (pacRes.success && pacRes.data) {
        setPacientes(pacRes.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
      
      const agendaRes = await getAgenda();
      if (agendaRes.success && agendaRes.data) {
        setCitas(agendaRes.data);
      }

      setIsLoadingTerapeutas(false);
    }
    loadTerapeutas();
  }, [status, userRole, userName]);'''

content = content.replace(target_useeffect, replacement_useeffect)

# Update handleAddCita
target_addcita = '''  const handleAddCita = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaCita: Cita = {
      id: Date.now().toString(),
      paciente: formData.paciente,
      fecha: formData.fecha,
      hora: formData.hora, // Formato "HH:MM"
      terapeuta: formData.terapeuta,
      tipoServicio: formData.tipoServicio,
      frecuencia: formData.frecuencia,
      estado: formData.estado
    };
    
    setCitas([...citas, nuevaCita]);
    setIsModalOpen(false);
    setFormData({ paciente: "", fecha: fechaSeleccionada, hora: "09:00", terapeuta: terapeutas[0] || "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado" });
  };'''

replacement_addcita = '''  const handleAddCita = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevaCitaObj = {
      paciente: formData.paciente,
      fecha: formData.fecha,
      hora: formData.hora,
      terapeuta: formData.terapeuta,
      tipoServicio: formData.tipoServicio,
      frecuencia: formData.frecuencia,
      estado: formData.estado,
      pagado: formData.pagado,
      metodoPago: formData.metodoPago
    };
    
    const res = await addCita(nuevaCitaObj);
    if (res.success) {
      setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]);
      setIsModalOpen(false);
      setFormData({ paciente: "", fecha: fechaSeleccionada, hora: "09:00", terapeuta: terapeutas[0] || "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado", pagado: false, metodoPago: "" });
    } else {
      alert("Error: " + res.error);
    }
  };
  
  const handleTogglePagado = async (citaId: string, currentPagado: boolean) => {
    const newVal = !currentPagado;
    const res = await updateCita(citaId, { pagado: newVal });
    if (res.success) {
      setCitas(citas.map(c => c.id === citaId ? { ...c, pagado: newVal } : c));
    }
  };'''

content = content.replace(target_addcita, replacement_addcita)

# Add pagado toggle and badge to table cells
target_cell = '''                          <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${getEstadoColor(cita.estado)}`}>
                            {cita.estado}
                          </div>
                        </div>'''

replacement_cell = '''                          <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${getEstadoColor(cita.estado)}`}>
                            {cita.estado}
                          </div>
                          
                          <div className="mt-1 flex justify-center items-center gap-1">
                            <button 
                              onClick={() => handleTogglePagado(cita.id, !!cita.pagado)}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${cita.pagado ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                            >
                              {cita.pagado ? 'Pagado' : 'Cobrar'}
                            </button>
                            {cita.pagado && cita.metodoPago && (
                              <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[60px]">{cita.metodoPago}</span>
                            )}
                          </div>
                        </div>'''

content = content.replace(target_cell, replacement_cell)

# Update Modal UI to add pagado switch and method
target_modal = '''              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">'''

replacement_modal = '''              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="pagado"
                    checked={formData.pagado}
                    onChange={e => setFormData({...formData, pagado: e.target.checked})}
                    className="w-4 h-4 text-[#2980b9] rounded focus:ring-[#2980b9]"
                  />
                  <label htmlFor="pagado" className="text-sm font-bold text-slate-700 cursor-pointer">Paciente Pagó</label>
                </div>
                
                {formData.pagado && (
                  <div>
                    <select 
                      name="metodoPago" 
                      value={formData.metodoPago} 
                      onChange={handleInputChange} 
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                      required
                    >
                      <option value="">Método...</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">'''

content = content.replace(target_modal, replacement_modal)

# Fix duplicate "setFormData({..." in initial states if any
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
