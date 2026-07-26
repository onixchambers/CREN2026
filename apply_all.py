import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports and getAsistenciasDB
c = c.replace('import { getAgenda } from "@/app/actions/agenda";', 'import { getAsistenciasDB } from "@/app/actions/asistencia";\nimport { getAgenda } from "@/app/actions/agenda";')
c = c.replace('const agRes = await getAgenda();', 'const agRes = await getAsistenciasDB();')

# 2. Fix data mapping
target_map = """        let agendaAsistencias: any[] = [];
        if (agRes.success && agRes.data) {
          agendaAsistencias = agRes.data.map((c: any) => {
            // Find patient to get sex and age
            const p = validPatients.find((vp: any) => vp.name === c.paciente);
            return {
              id: c.id,
              fecha: c.fecha,
              area: "Terapia",
              paciente: c.paciente,
              sexo: p?.sexo || "N/A",
              edad: p?.age ? p.age.toString() : "N/A",
              terapeuta: c.terapeuta,
              tipoSesion: c.tipoServicio || "Individual",
              estado: c.estado,
              sesiones: c.frecuencia || "1/1",
              pago: c.pagado ? "Sí" : "No",
              fact: "No",
              subtotal: "$0",
              obs: c.metodoPago ? `Método: ${c.metodoPago}` : "Desde Agenda",
              creadoPor: c.terapeuta
            };
          });
        }"""
repl_map = """        let agendaAsistencias: any[] = [];
        if (agRes.success && agRes.data) {
          agendaAsistencias = agRes.data.map((c: any) => {
            // Find patient to get sex and age
            const p = validPatients.find((vp: any) => vp.name === c.paciente);
            return {
              id: c.id,
              fecha: c.fecha,
              area: c.area || "-",
              paciente: c.paciente,
              sexo: p?.sexo || c.sexo,
              edad: p?.age ? p.age.toString() : c.edad,
              terapeuta: c.terapeuta,
              tipoSesion: c.tipoSesion || "-",
              estado: c.estado,
              sesiones: c.sesiones || "1",
              paqueteActual: c.paqueteActual || 1,
              pago: c.pago || "-",
              fact: c.fact || "No",
              subtotal: c.subtotal || "$0.00",
              total: c.total || "$0.00",
              saldo: c.saldo || 0,
              obs: c.obs || "-",
              creadoPor: c.creadoPor || "-"
            };
          });
        }"""
c = c.replace(target_map, repl_map)

# 3. Terapeuta and area handling
target_ter1 = """  const [terapeutas, setTerapeutas] = useState<string[]>([]);

  // Predictivo"""
repl_ter1 = """  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [terapeutasFullData, setTerapeutasFullData] = useState<any[]>([]);

  // Predictivo"""
c = c.replace(target_ter1, repl_ter1)

target_ter2 = """        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          const areas = Array.from(new Set(tRes.data.map((t: any) => t.especialidad).filter(Boolean)));
          
          if (userRole.toUpperCase() === "TERAPEUTA") {
            const matched = tRes.data.find((t: any) => t.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(t.name.toLowerCase()));
            const miTerapeutaStr = matched ? matched.name : (tRes.data[0]?.name || userName);
            const miAreaStr = matched ? matched.especialidad : "";
            
            setAvailableAreas(miAreaStr ? [miAreaStr] : (areas.length > 0 ? areas as string[] : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]));
            setTerapeutas([miTerapeutaStr]);
            setFormData(prev => ({...prev, terapeuta: miTerapeutaStr, area: miAreaStr}));
          } else {
            setAvailableAreas(areas.length > 0 ? areas as string[] : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
            setTerapeutas(tRes.data.map((t: any) => t.name));
          }
        }"""
repl_ter2 = """        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setTerapeutasFullData(tRes.data);
          let allAreas: string[] = [];
          tRes.data.forEach((t: any) => {
            if (t.especialidad) {
              const parts = t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
              allAreas = allAreas.concat(parts);
            }
          });
          const areas = Array.from(new Set(allAreas));
          
          if (userRole.toUpperCase() === "TERAPEUTA") {
            const matched = tRes.data.find((t: any) => t.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(t.name.toLowerCase()));
            const miTerapeutaStr = matched ? matched.name : (tRes.data[0]?.name || userName);
            const miAreaStr = matched ? matched.especialidad : "";
            let misAreas: string[] = [];
            if (miAreaStr) misAreas = miAreaStr.split(',').map((x: string) => x.trim()).filter(Boolean);
            
            setAvailableAreas(misAreas.length > 0 ? misAreas : (areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]));
            setTerapeutas([miTerapeutaStr]);
            setFormData(prev => ({...prev, terapeuta: miTerapeutaStr, area: misAreas[0] || ""}));
          } else {
            setAvailableAreas(areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
            setTerapeutas(tRes.data.map((t: any) => t.name));
          }
        }"""
c = c.replace(target_ter2, repl_ter2)

target_eff = """  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };"""
repl_eff = """  useEffect(() => {
    if (userRole.toUpperCase() !== "TERAPEUTA" && formData.terapeuta && terapeutasFullData.length > 0) {
      const match = terapeutasFullData.find(t => t.name === formData.terapeuta);
      if (match && match.especialidad) {
        const parts = match.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
        setAvailableAreas(parts);
        if (!parts.includes(formData.area)) {
          setFormData(prev => ({ ...prev, area: parts[0] || "" }));
        }
      } else {
        let allAreas: string[] = [];
        terapeutasFullData.forEach(t => {
          if (t.especialidad) {
            allAreas = allAreas.concat(t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean));
          }
        });
        setAvailableAreas(Array.from(new Set(allAreas)));
      }
    }
  }, [formData.terapeuta, terapeutasFullData, userRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };"""
c = c.replace(target_eff, repl_eff)

# 4. Math logic UI
target_math = """              <div>
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
repl_math = """              <div>
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
                      <input type="text" readOnly value={Math.abs(saldoF).toFixed(2)} className={`w-full text-sm p-2 pl-6 border ${isNeg ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'} rounded outline-none font-bold`} />
                      {isNeg && <span className="absolute right-2 top-2 text-red-500 font-bold">-</span>}
                    </div>
                  );
                })()}
              </div>"""
c = c.replace(target_math, repl_math)

# 5. Type and handleGuardar modifications
target_type1 = """  subtotal: string;
  total: string;
  obs: string;"""
repl_type1 = """  subtotal: string;
  total: string;
  saldo?: number;
  precioTerapia?: string;
  montoPago?: string;
  paqueteActual?: number;
  obs: string;"""
c = c.replace(target_type1, repl_type1)

target_type2 = """      subtotal: `$${sub.toFixed(2)}`,
      total: `$${tot.toFixed(2)}`,
      obs: formData.observaciones || "—","""
repl_type2 = """      subtotal: `$${sub.toFixed(2)}`,
      total: `$${tot.toFixed(2)}`,
      precioTerapia: formData.precioTerapia,
      montoPago: formData.montoPago,
      obs: formData.observaciones || "—","""
c = c.replace(target_type2, repl_type2)

# 6. Pagination logic
target_pag1 = """  const asistenciasFiltradas = asistencias.filter(a => {"""
repl_pag1 = """  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const asistenciasFiltradas = asistencias.filter(a => {"""
c = c.replace(target_pag1, repl_pag1)

target_pag4 = """    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  return ("""
repl_pag4 = """    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  return ("""
c = c.replace(target_pag4, repl_pag4)

# 7. Table and pagination UI
target_table1 = """                <th className="px-2 py-3 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SUBTOTAL</th>"""
repl_table1 = """                <th className="px-2 py-3 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAQUETE</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SALDO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SUBTOTAL</th>"""
c = c.replace(target_table1, repl_table1)

target_table2 = """            <tbody className="divide-y divide-slate-100">
              {asistenciasFiltradas.length > 0 ? asistenciasFiltradas.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                  <td className="px-2 py-3 text-slate-500 max-w-[100px] truncate" title={a.terapeuta}>{a.terapeuta}</td>
                  <td className="px-2 py-3 text-slate-500">{a.area}</td>
                  <td className="px-4 py-3 text-left font-bold text-[#1a5276] max-w-[150px] truncate" title={a.paciente}>{a.paciente}</td>
                  <td className="px-2 py-3 text-slate-500">{a.sexo}</td>
                  <td className="px-2 py-3 text-slate-500">{a.edad}</td>
                  <td className="px-2 py-3 text-slate-500">{a.tipoSesion}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado.includes('Cancelo') ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-slate-100 text-slate-600'}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.sesiones}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.pago === 'Sí' || a.pago !== '-' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
                      {a.pago !== '-' ? (a.pago === 'Sí' ? 'Pagado' : a.pago) : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.fact}</td>
                  <td className="px-2 py-3 font-medium text-[#2980b9]">{a.subtotal}</td>
"""
repl_table2 = """            <tbody className="divide-y divide-slate-100">
              {(() => {
                const currentItems = asistenciasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
                return currentItems.length > 0 ? currentItems.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                  <td className="px-2 py-3 text-slate-500 max-w-[100px] truncate" title={a.terapeuta}>{a.terapeuta}</td>
                  <td className="px-2 py-3 text-slate-500">{a.area}</td>
                  <td className="px-4 py-3 text-left font-bold text-[#1a5276] max-w-[150px] truncate" title={a.paciente}>{a.paciente}</td>
                  <td className="px-2 py-3 text-slate-500">{a.sexo}</td>
                  <td className="px-2 py-3 text-slate-500">{a.edad}</td>
                  <td className="px-2 py-3 text-slate-500">{a.tipoSesion}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado.includes('Cancelo') ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-slate-100 text-slate-600'}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.sesiones}</td>
                  <td className="px-2 py-3 text-slate-500 font-bold">{a.paqueteActual}/{a.sesiones}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.pago === 'Sí' || (a.pago !== '-' && a.pago !== '') ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
                      {a.pago !== '-' && a.pago !== '' ? (a.pago === 'Sí' ? 'Pagado' : a.pago) : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.fact}</td>
                  <td className={`px-2 py-3 font-bold ${a.saldo != null && a.saldo < 0 ? 'text-red-500' : 'text-green-600'}`}>{a.saldo != null ? (a.saldo < 0 ? `-$${Math.abs(a.saldo).toFixed(2)}` : `$${a.saldo.toFixed(2)}`) : "$0.00"}</td>
                  <td className="px-2 py-3 font-medium text-[#2980b9]">{a.subtotal}</td>
"""
c = c.replace(target_table2, repl_table2)

target_pag2 = """                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Sin registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>"""
repl_pag2 = """                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Sin registros.
                  </td>
                </tr>
              )}
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {asistenciasFiltradas.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, asistenciasFiltradas.length)} de {asistenciasFiltradas.length}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50">Anterior</button>
              {Array.from({ length: Math.ceil(asistenciasFiltradas.length / itemsPerPage) }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 border rounded text-xs font-medium ${currentPage === i + 1 ? 'bg-[#0e2f44] text-white border-[#0e2f44]' : 'border-slate-300 text-slate-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(asistenciasFiltradas.length / itemsPerPage)))} disabled={currentPage === Math.ceil(asistenciasFiltradas.length / itemsPerPage)} className="px-3 py-1 border border-slate-300 rounded text-xs font-medium text-slate-600 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>"""
c = c.replace(target_pag2, repl_pag2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Applied all changes.")
