import os
import re

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# First, remove the Edit Modal at the bottom
content = re.sub(r'\{\/\* MODAL DE EDICION \*\/}.*?(?=\<\/div\>\s*\)\;\s*\}$)', '', content, flags=re.DOTALL)

# Then, replace the cell content with inline controls
cellDivTarget = r'<div\s+onClick=\{\(\) => \{ setSelectedCita\(cita\); setIsEditModalOpen\(true\); \}\}\s+className=\{p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center h-full w-full cursor-pointer shadow-sm hover:brightness-95 transition-all \$\{getEstadoColor\(cita\.estado\)\}\}>.*?<\/div>\s*<\/div>'

cellDivReplacement = '''<div className={p-2 rounded border text-xs flex flex-col gap-1.5 h-full w-full shadow-sm transition-all }>
                            <div className="flex justify-between items-start w-full">
                              <div className="flex flex-col truncate">
                                <span className="font-bold truncate w-full text-[11px]">{cita.paciente}</span>
                                <span className="text-[9px] opacity-80 uppercase truncate w-full">{cita.tipoServicio}</span>
                              </div>
                              <button onClick={() => handleDeleteCita(cita.id)} className="text-red-500 hover:text-red-700 font-bold ml-1" title="Eliminar Cita">&times;</button>
                            </div>
                            
                            <select 
                              value={cita.estado} 
                              onChange={(e) => handleUpdateInline(cita.id, { estado: e.target.value })}
                              className="text-[10px] w-full p-1 rounded border border-slate-300 bg-white/80 outline-none mt-1 font-semibold text-slate-700"
                            >
                              <option value="Ocupado">Confirmado</option>
                              <option value="Asistió">Asistió</option>
                              <option value="Canceló">Canceló</option>
                              <option value="Faltó">Faltó</option>
                              <option value="Baja">Baja</option>
                              <option value="Alta">Alta</option>
                              <option value="Reagendado">Reagendado</option>
                            </select>

                            <div className="flex items-center gap-1 mt-0.5">
                              <input 
                                type="checkbox" 
                                checked={cita.pagado || false}
                                onChange={(e) => handleUpdateInline(cita.id, { pagado: e.target.checked })}
                                className="w-3 h-3 cursor-pointer"
                                id={pago-}
                              />
                              <label htmlFor={pago-} className="text-[10px] font-bold cursor-pointer">Pagó</label>
                            </div>

                            {cita.pagado && (
                              <select 
                                value={cita.metodoPago || ""} 
                                onChange={(e) => handleUpdateInline(cita.id, { metodoPago: e.target.value })}
                                className="text-[9px] w-full p-1 rounded border border-slate-300 bg-white/80 outline-none font-semibold text-slate-700"
                              >
                                <option value="">Método...</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Transferencia">Transferencia</option>
                              </select>
                            )}
                          </div>'''

content = re.sub(cellDivTarget, cellDivReplacement, content, flags=re.DOTALL)

# Add handleUpdateInline
inlineUpdateStr = '''  const handleUpdateInline = async (id: string, updates: any) => {
    // Optimistic update
    setCitas(citas.map(c => c.id === id ? { ...c, ...updates } : c));
    const current = citas.find(c => c.id === id);
    if (!current) return;
    await updateCita(id, { ...current, ...updates });
  };
'''

content = content.replace('const handleDeleteCita = async', inlineUpdateStr + '\n  const handleDeleteCita = async')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied inline editing!")
