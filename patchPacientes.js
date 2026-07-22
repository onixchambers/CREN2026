const fs = require("fs");
const path = "src/app/dashboard/pacientes/page.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const saveEdit = async \(\) => \{[\s\S]*?setIsSaving\(false\);\s*\};/m,
  `const saveEdit = async () => {
    if (!editingPatient) return;
    setIsSaving(true);
    const { updatePatientFast, getPatients } = await import('@/app/actions/pacientes');
    const result = await updatePatientFast(editingPatient.id, editForm);
    if (result.success) {
      alert("Paciente actualizado.");
      setEditingPatient(null);
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setPacientes(updated.data);
      }
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (p: any) => {
    if (confirm("¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer y borrará todos sus registros asociados.")) {
      const { deletePatient, getPatients } = await import('@/app/actions/pacientes');
      const result = await deletePatient(p.id);
      if (result.success) {
        alert("Paciente eliminado.");
        const updated = await getPatients();
        if (updated.success && updated.data) {
          setPacientes(updated.data);
        }
      } else {
        alert(result.error);
      }
    }
  };`
);

content = content.replace(
  /<button onClick=\{\(\) => openEditModal\(p\)\} className="p-1\.5 border border-slate-200 rounded hover:bg-slate-100 text-amber-500 transition-colors">\s*<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M15\.232 5\.232l3\.536 3\.536m-2\.036-5\.036a2\.5 2\.5 0 113\.536 3\.536L6\.5 21\.036H3v-3\.572L16\.732 3\.732z" \/><\/svg>\s*<\/button>/m,
  `<div className="flex gap-2">
                      <button onClick={() => openEditModal(p)} title="Editar" className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 text-amber-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(p)} title="Borrar" className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>`
);

fs.writeFileSync(path, content);
console.log("Pacientes patched");
