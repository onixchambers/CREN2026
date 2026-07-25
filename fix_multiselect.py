import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { getSettings, saveSettings } from "@/app/actions/configuracion";', 'import { getSettings, saveSettings } from "@/app/actions/configuracion";\nimport { MultiSelect } from "@/components/MultiSelect";')

block_to_replace = """                  <div className="flex items-start gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm text-slate-500 w-24 mt-2">Especialidades</label>
                    <div className="flex-1 p-2 border border-slate-300 rounded bg-white h-28 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                      {["Psicología", "Lenguaje", "Neurodesarrollo", "Fisioterapia", "Asesoría de crianza", "Rehabilitación", "Otro"].map(esp => (
                        <label key={esp} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                          <input type="checkbox" className="accent-blue-600 cursor-pointer w-3 h-3"
                            checked={u.especialidad ? u.especialidad.split(',').includes(esp) : false}
                            onChange={(e) => {
                              const newU = [...usuarios];
                              const idx = newU.findIndex(x => x.id === u.id);
                              let current = u.especialidad ? u.especialidad.split(',').filter(Boolean) : [];
                              if (e.target.checked) {
                                current.push(esp);
                              } else {
                                current = current.filter(x => x !== esp);
                              }
                              newU[idx].especialidad = current.join(',');
                              setUsuarios(newU);
                            }}
                          />
                          {esp}
                        </label>
                      ))}
                    </div>
                  </div>"""

new_block = """                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-sm text-slate-500 w-24">Especialidades</label>
                    <MultiSelect 
                      options={["Psicología", "Lenguaje", "Neurodesarrollo", "Fisioterapia", "Asesoría de crianza", "Rehabilitación", "Otro"]}
                      selected={u.especialidad ? u.especialidad.split(',').filter(Boolean) : []}
                      onChange={(selected) => {
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === u.id);
                        newU[idx].especialidad = selected.join(',');
                        setUsuarios(newU);
                      }}
                    />
                  </div>"""

content = content.replace(block_to_replace, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
