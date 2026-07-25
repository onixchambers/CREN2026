const fs = require('fs');
const path = './src/app/dashboard/agenda/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  'import { getAgenda, addCita, updateCita } from "@/app/actions/agenda";',
  'import { getAgenda, addCita, updateCita, deleteCita } from "@/app/actions/agenda";'
);

// 2. Update type Cita
content = content.replace(
  'estado: "Ocupado" | "Cancelado" | "Reagendado" | "Disponible";',
  'estado: string;'
);

// 3. Add edit modal state
const stateHookTarget = 'const [isModalOpen, setIsModalOpen] = useState(false);';
const stateHookReplacement = `const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);`;
content = content.replace(stateHookTarget, stateHookReplacement);

// 4. Update getEstadoColor
const getEstadoColorTarget = `case 'Disponible': return 'bg-green-100 text-green-800 border-green-300';`;
const getEstadoColorReplacement = `case 'Disponible': return 'bg-green-100 text-green-800 border-green-300';
        case 'Asistió': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Canceló': return 'bg-red-100 text-red-800 border-red-300';
        case 'Faltó': return 'bg-rose-100 text-rose-800 border-rose-300';
        case 'Baja': return 'bg-stone-100 text-stone-800 border-stone-300';
        case 'Alta': return 'bg-teal-100 text-teal-800 border-teal-300';`;
content = content.replace(getEstadoColorTarget, getEstadoColorReplacement);

// 5. Add handleDeleteCita and handleUpdateSelectedCita
const handlersTarget = `const handleTogglePagado = async (citaId: string, currentPagado: boolean) => {`;
const handlersReplacement = `const handleDeleteCita = async (id: string) => {
    if (!confirm("¿Eliminar esta cita permanentemente?")) return;
    const res = await deleteCita(id);
    if (res.success) {
      setCitas(citas.filter(c => c.id !== id));
      setIsEditModalOpen(false);
    }
  };

  const handleUpdateSelectedCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCita) return;
    const res = await updateCita(selectedCita.id, {
      estado: selectedCita.estado,
      pagado: selectedCita.pagado,
      metodoPago: selectedCita.metodoPago
    });
    if (res.success) {
      setCitas(citas.map(c => c.id === selectedCita.id ? selectedCita : c));
      setIsEditModalOpen(false);
    }
  };

  const handleTogglePagado = async (citaId: string, currentPagado: boolean) => {`;
content = content.replace(handlersTarget, handlersReplacement);

// 6. Cell Click handler
const cellDivTarget = /<div className=\{`p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center h-full w-full cursor-pointer shadow-sm hover:brightness-95 transition-all \$\{getEstadoColor\(cita\.estado\)\}`\}>/g;
const cellDivReplacement = `<div 
                              onClick={() => { setSelectedCita(cita); setIsEditModalOpen(true); }}
                              className={\`p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center h-full w-full cursor-pointer shadow-sm hover:brightness-95 transition-all \${getEstadoColor(cita.estado)}\`}>`;
content = content.replace(cellDivTarget, cellDivReplacement);

// Stop propagation on the Pagado button inside the hover so it doesn't open the edit modal
const pagadoBtnTarget = /onClick=\{\(\) => handleTogglePagado\(cita\.id, !!cita\.pagado\)\}/g;
const pagadoBtnReplacement = `onClick={(e) => { e.stopPropagation(); handleTogglePagado(cita.id, !!cita.pagado); }}`;
content = content.replace(pagadoBtnTarget, pagadoBtnReplacement);

// 7. Inject Modal at the very end
const editModalStr = `
      {/* MODAL DE EDICION */}
      {isEditModalOpen && selectedCita && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-[#0e2f44]">Editar Cita</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateSelectedCita} className="p-6 space-y-4">
              <div>
                <p className="font-bold text-slate-800">{selectedCita.paciente}</p>
                <p className="text-slate-500 text-sm">{selectedCita.fecha} a las {selectedCita.hora}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado de Asistencia</label>
                <select 
                  value={selectedCita.estado} 
                  onChange={e => setSelectedCita({...selectedCita, estado: e.target.value})} 
                  className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]"
                >
                  <option value="Ocupado">Ocupado (Confirmado)</option>
                  <option value="Asistió">Asistió</option>
                  <option value="Canceló">Canceló</option>
                  <option value="Faltó">Faltó</option>
                  <option value="Baja">Baja</option>
                  <option value="Alta">Alta</option>
                  <option value="Reagendado">Reagendado</option>
                  <option value="Disponible">Disponible</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="edit-pagado"
                    checked={selectedCita.pagado || false}
                    onChange={e => setSelectedCita({...selectedCita, pagado: e.target.checked})}
                    className="w-4 h-4 text-[#2980b9] rounded focus:ring-[#2980b9]"
                  />
                  <label htmlFor="edit-pagado" className="text-sm font-bold text-slate-700 cursor-pointer">Paciente Pagó</label>
                </div>
                
                {(selectedCita.pagado) && (
                  <div>
                    <select 
                      value={selectedCita.metodoPago || ""} 
                      onChange={e => setSelectedCita({...selectedCita, metodoPago: e.target.value})} 
                      className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                      required
                    >
                      <option value="">Método de Pago...</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => handleDeleteCita(selectedCita.id)} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors">Eliminar</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#1a5276] text-white font-semibold rounded-lg hover:bg-[#0e2f44] transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.substring(0, content.lastIndexOf('</div>\n  );\n}')) + editModalStr;

fs.writeFileSync(path, content);
console.log('Update complete.');
