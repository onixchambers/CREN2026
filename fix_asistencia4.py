import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleDeleteAsistencia
old_save_edit = '''    setAsistencias(nuevasAsistencias);
    localStorage.setItem("asistenciaData", JSON.stringify(nuevasAsistencias));
    alert("Registro actualizado.");
    setEditingAsistencia(null);
  };'''

new_save_edit = '''    setAsistencias(nuevasAsistencias);
    localStorage.setItem("asistenciaData", JSON.stringify(nuevasAsistencias));
    alert("Registro actualizado.");
    setEditingAsistencia(null);
  };

  const handleDeleteAsistencia = (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de asistencia?")) {
      const nuevas = asistencias.filter(a => a.id !== id);
      setAsistencias(nuevas);
      localStorage.setItem("asistenciaData", JSON.stringify(nuevas));
    }
  };'''

content = content.replace(old_save_edit, new_save_edit)

# 2. Add delete button to the table
old_td = '''                  <td className="px-2 py-3">
                    <button onClick={() => openEditModal(a)} className="text-slate-400 hover:text-[#1a5276] mx-auto">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                  </td>'''

new_td = '''                  <td className="px-2 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(a)} className="text-slate-400 hover:text-[#1a5276]" title="Editar">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteAsistencia(a.id)} className="text-slate-400 hover:text-red-600" title="Eliminar">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </td>'''

content = content.replace(old_td, new_td)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
