import os
import re

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the cell content with just name and service, triggering modal
cellTargetRegex = r'<div className=\{p-2 rounded border text-xs flex flex-col gap-1\.5 h-full w-full shadow-sm transition-all \$\{getEstadoColor\(cita\.estado\)\}\}>.*?</button>\s*</div>'

cellReplacement = '''<div 
                              onClick={() => { setSelectedCita(cita); setIsEditModalOpen(true); }}
                              className={p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center h-full w-full cursor-pointer shadow-sm hover:brightness-95 transition-all }>
                              <span className="truncate w-full text-center">{cita.paciente}</span>
                              <span className="text-[10px] opacity-80 uppercase mt-0.5 truncate w-full text-center">{cita.tipoServicio}</span>
                            </div>'''

content = re.sub(cellTargetRegex, cellReplacement, content, flags=re.DOTALL)

# Revert cell width/height
content = content.replace('className="border border-slate-200 p-2 min-h-[110px] w-48 relative align-top"', 'className="border border-slate-200 p-2 h-16 w-40 relative align-top group"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted to clean cells!")
