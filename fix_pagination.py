import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """  const asistenciasFiltradas = asistencias.filter(a => {"""
repl1 = """  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const asistenciasFiltradas = asistencias.filter(a => {"""

target2 = """                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Sin registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>"""
repl2 = """                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Sin registros.
                  </td>
                </tr>
              )}
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

target3 = """            <tbody className="divide-y divide-slate-100">
              {asistenciasFiltradas.length > 0 ? asistenciasFiltradas.map(a => ("""
repl3 = """            <tbody className="divide-y divide-slate-100">
              {(() => {
                const currentItems = asistenciasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
                return currentItems.length > 0 ? currentItems.map(a => ("""

target4 = """    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  return ("""
repl4 = """    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  return ("""


if target1 in c and target2 in c and target3 in c and target4 in c:
    c = c.replace(target1, repl1)
    c = c.replace(target2, repl2)
    c = c.replace(target3, repl3)
    c = c.replace(target4, repl4)
    print("Added pagination")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
