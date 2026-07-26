import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """            <tbody className="divide-y divide-slate-100">
              {asistenciasFiltradas.length > 0 ? asistenciasFiltradas.map(a => ("""
repl1 = """            <tbody className="divide-y divide-slate-100">
              {(() => {
                const currentItems = asistenciasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
                return currentItems.length > 0 ? currentItems.map(a => ("""

target2 = """                  </tr>
                )}
            </tbody>"""
repl2 = """                  </tr>
                );
              })()}
            </tbody>"""

if target1 in c:
    c = c.replace(target1, repl1)
    print("Replaced top of tbody")
else:
    print("target1 not found")

if target2 in c:
    c = c.replace(target2, repl2)
    print("Replaced bottom of tbody")
else:
    print("target2 not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
