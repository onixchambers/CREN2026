import os
import re

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace optimistic onChange with local state and Guardar button
# Actually, since it's inside a .map() loop, creating local state for each cell without a sub-component is hard.
# What I can do is keep the onChange, which updates the MAIN STATE citas, but does NOT save to the DB!
# And I'll add a "Guardar" button that calls saveCitaToDB(cita.id).

# 1. Modify handleUpdateInline to NOT call updateCita
old_update_inline = '''  const handleUpdateInline = async (id: string, updates: any) => {
    // Optimistic update
    setCitas(citas.map(c => c.id === id ? { ...c, ...updates } : c));
    const current = citas.find(c => c.id === id);
    if (!current) return;
    await updateCita(id, { ...current, ...updates });
  };'''

new_update_inline = '''  const handleUpdateInline = (id: string, updates: any) => {
    setCitas(citas.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSaveInline = async (id: string) => {
    const current = citas.find(c => c.id === id);
    if (!current) return;
    const res = await updateCita(id, { 
      estado: current.estado,
      pagado: current.pagado,
      metodoPago: current.metodoPago
    });
    if (res.success) {
      alert("Cita guardada correctamente");
    } else {
      alert("Error al guardar cita");
    }
  };'''

content = content.replace(old_update_inline, new_update_inline)

# 2. Add the Guardar button inside the cell
# The cell ends with:
#                             )}
#                           </div>
#                         ) : (

old_cell_end = '''                            )}
                          </div>'''
new_cell_end = '''                            )}

                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSaveInline(cita.id); }}
                              className="mt-1 w-full bg-[#1a5276] text-white text-[10px] font-bold py-1 rounded hover:bg-[#0e2f44] transition-colors"
                            >
                              Guardar
                            </button>
                          </div>'''
content = content.replace(old_cell_end, new_cell_end)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Guardar button to cells!")
