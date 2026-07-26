import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO TOTAL</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                  <input type="number" name="costoTotal" value={formData.costoTotal} onChange={handleChange} placeholder="Ej: 4000" className="w-full text-sm p-2 pl-6 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO POR SESIÓN</label>
                <input type="text" readOnly value={formData.costoSesion} className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 outline-none text-slate-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SALDO DISPONIBLE</label>
                <input type="text" name="saldoDisponible" value={formData.saldoDisponible} onChange={handleChange} placeholder="Ej: 8" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>"""

repl1 = """              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SESIONES RESTANTES</label>
                <div className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 outline-none text-[#2980b9] font-bold text-center">
                  {(() => {
                    const lastSession = asistencias.find(a => a.paciente === formData.pacienteNombre);
                    let curr = 1;
                    const tot = parseInt(formData.numeroSesiones || "1");
                    if (lastSession && parseInt(lastSession.sesiones || "1") === tot && lastSession.paqueteActual) {
                      curr = lastSession.paqueteActual < tot ? lastSession.paqueteActual + 1 : 1;
                    }
                    return `${curr}/${tot}`;
                  })()}
                </div>
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO TOTAL (PAQUETE)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                  <input type="text" readOnly value={(() => {
                    const sesionesInt = parseInt(formData.numeroSesiones || "1");
                    const precioF = parseFloat(formData.precioTerapia || "0");
                    return (sesionesInt * precioF).toFixed(2);
                  })()} className="w-full text-sm p-2 pl-6 border border-slate-300 rounded bg-slate-50 outline-none text-slate-600 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SALDO DISPONIBLE</label>
                {(() => {
                  const montoF = parseFloat(formData.montoPago || "0");
                  const costoSesionF = parseFloat(formData.precioTerapia || "0");
                  let saldoF = 0;
                  if (montoF > 0 || costoSesionF > 0) saldoF = montoF - costoSesionF;
                  const isNeg = saldoF < 0;
                  return (
                    <div className="relative">
                      <span className={`absolute left-2 top-1.5 ${isNeg ? 'text-red-500' : 'text-green-600'}`}>$</span>
                      <input type="text" readOnly value={saldoF.toFixed(2)} className={`w-full text-sm p-2 pl-6 border ${isNeg ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'} rounded outline-none font-bold`} />
                    </div>
                  );
                })()}
              </div>"""

if target1 in c:
    c = c.replace(target1, repl1)
    print("Replaced calculations")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
