import os

path = 'src/app/dashboard/horarios/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_table = '''        {/* Tabla de Registros */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">
            Registros de Hoy ({new Date().toLocaleDateString()})
          </div>
          {horarios.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay movimientos registrados aún.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b">
                <tr>
                  <th className="p-4 font-semibold">Terapeuta</th>
                  <th className="p-4 font-semibold">Entrada</th>
                  <th className="p-4 font-semibold">Salida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {horarios.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{h.terapeuta}</td>
                    <td className="p-4 text-green-700 font-medium">🕒 {h.horaEntrada}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      {h.horaSalida ? `🕒 ${h.horaSalida}` : <span className="text-slate-400 italic">En turno</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>'''

new_cards = '''        {/* Registros (Cuadros por separado) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 font-bold text-slate-700">
            Registros de Hoy ({new Date().toLocaleDateString()})
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {terapeutasDisponibles.map((t, idx) => {
              // Buscar el último movimiento de este terapeuta hoy
              const registro = horarios.find(h => h.terapeuta === t);
              
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-lg text-slate-800">{t}</span>
                    <div className={`h-3 w-3 rounded-full shadow-sm ${registro && !registro.horaSalida ? 'bg-green-500' : 'bg-slate-300'}`} title={registro && !registro.horaSalida ? 'Activo' : 'Inactivo'}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrada</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${registro ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {registro ? `🕒 ${registro.horaEntrada}` : "—"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salida</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${registro && registro.horaSalida ? 'bg-slate-200 text-slate-700' : (registro ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}`}>
                        {registro && registro.horaSalida ? `🕒 ${registro.horaSalida}` : (registro ? "En turno..." : "—")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>'''

content = content.replace(old_table, new_cards)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
