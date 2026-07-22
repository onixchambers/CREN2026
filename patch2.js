const fs = require("fs");
const path = "src/app/dashboard/asistencia/page.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const handlePacienteChange = \(e: React\.ChangeEvent<HTMLSelectElement>\) => \{[\s\S]*?^  \};/m,
  `const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const p = pacientes.find(x => x.paciente === val);
    if (p) {
      setFormData({
        ...formData,
        pacienteId: p.id,
        pacienteNombre: p.paciente,
        pacienteNac: p.nac !== "—" ? p.nac : "",
        pacienteSexo: p.sexo,
        pacienteEdad: p.edad
      });
    } else {
      setFormData({
        ...formData,
        pacienteId: "",
        pacienteNombre: val,
        pacienteNac: "",
        pacienteSexo: "",
        pacienteEdad: ""
      });
    }
  };`
);

content = content.replace(
  /<div>\s*<label className="block text-\[10px\] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE<\/label>\s*<select name="pacienteId" value=\{formData\.pacienteId\} onChange=\{handlePacienteChange\} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-\[#2980b9\] outline-none text-slate-900">\s*<option value="">Seleccionar paciente\.\.\.<\/option>\s*\{pacientes\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\}>\{p\.paciente\}<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/,
  `<div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE</label>
                <input 
                  type="text" 
                  name="pacienteNombre" 
                  list="pacientes-list"
                  value={formData.pacienteNombre} 
                  onChange={handlePacienteChange} 
                  placeholder="Escribir o seleccionar paciente..."
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" 
                />
                <datalist id="pacientes-list">
                  {pacientes.map(p => (
                    <option key={p.id} value={p.paciente} />
                  ))}
                </datalist>
              </div>`
);

fs.writeFileSync(path, content);
console.log("Done");
