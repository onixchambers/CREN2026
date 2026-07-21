"use client";
import { useState, useEffect } from "react";

export default function PreregistrosPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    fechaNacimiento: "",
    sexo: "",
    fechaIngreso: "2026-07-21",
    estatus: "Activo",
    origen: "Google",
    medicoTratante: "",
    escuela: "",
    
    madreNombre: "",
    padreNombre: "",
    otrosNombre: "",
    madreContacto: "",
    padreContacto: "",
    otrosContacto: "",
    principalMadre: false,
    principalPadre: false,
    principalOtros: false,
    correoPrincipal: "",
    
    alergias: false,
    crisis: false,
    convulsiones: false,
    sensibilidad: false,
    riesgoFuga: false,
    noSepara: false,
    otrasAlertas: false,
    
    reglamentoFirmado: false,
    consentimientoFirmado: false,
    
    observacionesAdmin: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const [fichas, setFichas] = useState<any[]>([]);

  useEffect(() => {
    async function loadPatients() {
      const { getPatients } = await import('@/app/actions/pacientes');
      const result = await getPatients();
      if (result.success && result.data) {
        setFichas(result.data);
      }
    }
    loadPatients();
  }, []);

  const handleLimpiar = () => {
    setFormData({
      ...formData,
      nombre: "", fechaNacimiento: "", sexo: "", origen: "Google", medicoTratante: "", escuela: "",
      madreNombre: "", padreNombre: "", otrosNombre: "", madreContacto: "", padreContacto: "", otrosContacto: "",
      principalMadre: false, principalPadre: false, principalOtros: false, correoPrincipal: "",
      alergias: false, crisis: false, convulsiones: false, sensibilidad: false, riesgoFuga: false, noSepara: false, otrasAlertas: false,
      reglamentoFirmado: false, consentimientoFirmado: false, observacionesAdmin: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      alert("El nombre es obligatorio");
      return;
    }
    
    const { createPatient, getPatients } = await import('@/app/actions/pacientes');
    const result = await createPatient(formData);
    
    if (result.success) {
      alert("¡Paciente registrado exitosamente en la base de datos!");
      handleLimpiar();
      // Reload list
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setFichas(updated.data);
      }
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      {/* HEADER DE PÁGINA */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <h2 className="text-xl font-bold text-[#0e2f44]">Ficha de Identificación</h2>
      </div>

      {/* FORMULARIO PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-6">
            <span className="text-xl">+</span> Nueva Ficha de Identificación
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fotografía del Paciente</label>
                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-md p-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre completo" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Ingreso</label>
                  <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 outline-none text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estatus de Paciente</label>
                  <select name="estatus" value={formData.estatus} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origen del Paciente</label>
                  <select name="origen" value={formData.origen} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Recomendación">Recomendación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Médico Tratante</label>
                  <input type="text" name="medicoTratante" value={formData.medicoTratante} onChange={handleInputChange} placeholder="Nombre de médico" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Escuela</label>
                  <input type="text" name="escuela" value={formData.escuela} onChange={handleInputChange} placeholder="Nombre de escuela" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONTACTOS */}
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-4">Contactos</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Madre */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Madre (Nombre)</label>
                    <input type="text" name="madreNombre" value={formData.madreNombre} onChange={handleInputChange} placeholder="Nombre de la madre" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de Contacto</label>
                    <input type="tel" name="madreContacto" value={formData.madreContacto} onChange={handleInputChange} placeholder="Contacto de la madre" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="principalMadre" checked={formData.principalMadre} onChange={handleInputChange} className="w-3 h-3" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Contacto Principal</label>
                  </div>
                </div>

                {/* Padre */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Padre (Nombre)</label>
                    <input type="text" name="padreNombre" value={formData.padreNombre} onChange={handleInputChange} placeholder="Nombre del padre" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de Contacto</label>
                    <input type="tel" name="padreContacto" value={formData.padreContacto} onChange={handleInputChange} placeholder="Contacto del padre" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="principalPadre" checked={formData.principalPadre} onChange={handleInputChange} className="w-3 h-3" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Contacto Principal</label>
                  </div>
                </div>

                {/* Otros */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Otros (Nombre)</label>
                    <input type="text" name="otrosNombre" value={formData.otrosNombre} onChange={handleInputChange} placeholder="Nombre del otro contacto" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de Contacto</label>
                    <input type="tel" name="otrosContacto" value={formData.otrosContacto} onChange={handleInputChange} placeholder="Otro contacto" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="principalOtros" checked={formData.principalOtros} onChange={handleInputChange} className="w-3 h-3" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Contacto Principal</label>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/3 mt-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo del Contacto Principal</label>
                <input type="email" name="correoPrincipal" value={formData.correoPrincipal} onChange={handleInputChange} placeholder="ejemplo@correo.com" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
            </div>

            {/* SECCIÓN 3: ALERTAS IMPORTANTES */}
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-3">Alertas Importantes</h4>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'alergias', label: 'Alergias' },
                  { id: 'crisis', label: 'Crisis' },
                  { id: 'convulsiones', label: 'Convulsiones' },
                  { id: 'sensibilidad', label: 'Sensibilidad Sensorial' },
                  { id: 'riesgoFuga', label: 'Riesgo Fuga' },
                  { id: 'noSepara', label: 'No Separa de Mamá' },
                  { id: 'otrasAlertas', label: 'Otras Alertas Operativas' }
                ].map(alerta => (
                  <div key={alerta.id} className="flex items-center gap-2">
                    <input type="checkbox" name={alerta.id} checked={formData[alerta.id as keyof typeof formData] as boolean} onChange={handleInputChange} className="w-3 h-3" />
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{alerta.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 4: DOCUMENTOS */}
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-3">Documentos</h4>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="reglamentoFirmado" checked={formData.reglamentoFirmado} onChange={handleInputChange} className="w-3 h-3" />
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reglamento Firmado</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="consentimientoFirmado" checked={formData.consentimientoFirmado} onChange={handleInputChange} className="w-3 h-3" />
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Consentimiento Informado Firmado</label>
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: OBSERVACIONES */}
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-[11px] font-bold text-red-500 uppercase mb-3">Observaciones Administrativas (Solo Admin)</h4>
              <textarea 
                name="observacionesAdmin"
                value={formData.observacionesAdmin}
                onChange={handleInputChange}
                rows={3} 
                className="w-full p-3 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-sm resize-y text-slate-900"
                placeholder="Observaciones exclusivas del administrador..."
              ></textarea>
            </div>

            {/* BOTONES */}
            <div className="pt-2 flex gap-3 border-t border-slate-100 mt-4 pt-4">
              <button type="submit" className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Guardar Ficha
              </button>
              <button type="button" onClick={handleLimpiar} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpiar
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* TABLA DE FICHAS REGISTRADAS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Fichas Registradas
          </h3>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0e2f44] text-white uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 border-r border-[#1a5276]/50 rounded-tl-sm">FECHA INGRESO</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">PACIENTE</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">EDAD</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">SEXO</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">ESTATUS</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">ORIGEN</th>
                <th className="px-4 py-3 border-r border-[#1a5276]/50">TERAPEUTA TRATANTE</th>
                <th className="px-4 py-3 rounded-tr-sm text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {fichas.length > 0 ? (
                fichas.map(f => (
                  <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold text-[#1a5276]">{f.name}</td>
                    <td className="px-4 py-3 text-slate-500">{f.age || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{f.sexo || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{f.estatus}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{f.origen}</td>
                    <td className="px-4 py-3 text-slate-500">{f.medicoTratante || "Por asignar"}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-blue-500 hover:text-blue-700 font-medium">Ver</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium border border-t-0 border-slate-200">
                    Sin fichas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
