const fs = require('fs');
const file = 'src/app/dashboard/asistencia/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace handlePacienteChange
const oldHandle = const handlePacienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setFormData({ ...formData, pacienteId: "", pacienteNombre: "", pacienteNac: "", pacienteSexo: "", pacienteEdad: "" });
      return;
    }
    const p = pacientes.find(x => x.id === id);
    if (p) {
      setFormData({
        ...formData,
        pacienteId: p.id,
        pacienteNombre: p.paciente,
        pacienteNac: p.nac !== "—" ? p.nac : "",
        pacienteSexo: p.sexo,
        pacienteEdad: p.edad
      });
    }
  };;

const newHandle = const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };;

content = content.replace(oldHandle, newHandle);

// Replace Select with Input+Datalist
const oldSelect = <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE</label>
                <select name="pacienteId" value={formData.pacienteId} onChange={handlePacienteChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.paciente}</option>
                  ))}
                </select>
              </div>;

const newSelect = <div>
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
              </div>;

content = content.replace(oldSelect, newSelect);

fs.writeFileSync(file, content);
console.log("Done");
