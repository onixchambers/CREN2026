import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add pagination calculation
target = '''const informesFiltrados = informes.filter(i => {
    const matchPaciente = filtroPaciente ? i.paciente === filtroPaciente : true;
    const matchTipo = filtroTipo !== "Todos" ? i.tipo === filtroTipo : true;
    return matchPaciente && matchTipo;
  });'''

replacement = '''const informesFiltrados = informes.filter(i => {
    const matchPaciente = filtroPaciente ? i.paciente === filtroPaciente : true;
    const matchTipo = filtroTipo !== "Todos" ? i.tipo === filtroTipo : true;
    return matchPaciente && matchTipo;
  });

  const totalPages = Math.ceil(informesFiltrados.length / ITEMS_PER_PAGE);
  const paginatedInformes = informesFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );'''

content = content.replace(target, replacement)

# Replace table render
target2 = '''<tbody className="divide-y divide-slate-100">
              {informesFiltrados.map((inf) => ('''
replacement2 = '''<tbody className="divide-y divide-slate-100">
              {paginatedInformes.map((inf) => ('''

content = content.replace(target2, replacement2)

# Add pagination controls below table
target3 = '''</table>
        </div>
      </div>
    </div>'''

replacement3 = '''</table>
        </div>
      </div>
      
      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
          <div className="text-sm text-slate-500">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, informesFiltrados.length)} de {informesFiltrados.length}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 border border-slate-300 rounded text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Anterior
            </button>
            <div className="px-4 py-2 text-sm font-bold text-[#1a5276]">
              Página {currentPage} de {totalPages}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 border border-slate-300 rounded text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>'''

content = content.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
