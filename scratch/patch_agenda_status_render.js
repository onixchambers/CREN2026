const fs = require('fs');
const file = 'src/app/dashboard/agenda/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const statusModalCode = `      {/* STATUS MODAL */}
      {isStatusModalOpen && selectedCitaForStatus && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
            >&times;</button>
            <h3 className="font-bold text-lg text-[#0e2f44] mb-4 text-center">Estado de Cita</h3>
            <p className="text-center font-semibold mb-6">{selectedCitaForStatus.paciente}</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                await updateCita(selectedCitaForStatus.id, { ...selectedCitaForStatus, estado: "Asistió" });
                setCitas(citas.map(c => c.id === selectedCitaForStatus.id ? { ...c, estado: "Asistió" } : c));
                setIsStatusModalOpen(false);
              }} className="w-full py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
                Asistió
              </button>
              
              <button onClick={async () => {
                await updateCita(selectedCitaForStatus.id, { ...selectedCitaForStatus, estado: "Canceló con Anticipación" });
                setCitas(citas.map(c => c.id === selectedCitaForStatus.id ? { ...c, estado: "Canceló con Anticipación" } : c));
                setIsStatusModalOpen(false);
              }} className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Canceló con Anticipación
              </button>

              <button onClick={async () => {
                await updateCita(selectedCitaForStatus.id, { ...selectedCitaForStatus, estado: "Canceló sin Anticipación" });
                setCitas(citas.map(c => c.id === selectedCitaForStatus.id ? { ...c, estado: "Canceló sin Anticipación" } : c));
                setIsStatusModalOpen(false);
              }} className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
                Canceló sin Anticipación
              </button>
              
              <button onClick={async () => {
                await updateCita(selectedCitaForStatus.id, { ...selectedCitaForStatus, estado: "Ocupado" });
                setCitas(citas.map(c => c.id === selectedCitaForStatus.id ? { ...c, estado: "Ocupado" } : c));
                setIsStatusModalOpen(false);
              }} className="w-full py-2 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors">
                Ocupado
              </button>
            </div>
            
            <hr className="my-6 border-slate-200" />
            
            <button onClick={() => {
              setIsStatusModalOpen(false);
              setSelectedCita(selectedCitaForStatus);
              setIsEditModalOpen(true);
            }} className="w-full py-2 border-2 border-[#1a5276] text-[#1a5276] font-bold rounded-lg hover:bg-[#1a5276] hover:text-white transition-colors">
              📋 Asistencia (Pre-llenado)
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MOVE CITA MODAL */}`;

code = code.replace('{/* CONFIRM MOVE CITA MODAL */}', statusModalCode);
fs.writeFileSync(file, code);
