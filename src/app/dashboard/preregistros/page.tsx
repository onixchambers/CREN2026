"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";

export default function PreregistrosPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Administrador";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const [editingId, setEditingId] = useState<string | null>(null);

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

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

  const getFilteredPatients = () => {
    let filtered = fichas;
    // Filter by Terapeuta logic: If therapist, only show their own
    if (userRole.toUpperCase() === "TERAPEUTA") {
      filtered = filtered.filter(f => f.medicoTratante === userName);
    }
    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };
  const searchResults = getFilteredPatients();



  const handleEdit = (ficha: any) => {
    setEditingId(ficha.id);
    setFormData({
      ...formData,
      ...ficha,
      nombre: ficha.name || ficha.nombre || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este paciente permanentemente?")) return;
    const { deletePatient, getPatients } = await import('@/app/actions/pacientes');
    const res = await deletePatient(id);
    if (res.success) {
      alert("Paciente eliminado.");
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setFichas(updated.data);
      }
    } else {
      alert(res.error);
    }
  };

  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
    setPhotoPreview(null);
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
    
    const { createPatient, updatePatient, getPatients } = await import('@/app/actions/pacientes');
    
    let result;
    if (editingId) {
      result = await updatePatient(editingId, formData);
    } else {
      result = await createPatient(formData);
    }
    
    if (result.success) {
      alert(editingId ? "¡Ficha actualizada exitosamente!" : "¡Paciente registrado exitosamente en la base de datos!");
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


  const tableFilteredFichas = fichas.filter(f => userRole.toUpperCase() === "TERAPEUTA" ? f.medicoTratante === userName : true);
  const totalPages = Math.ceil(tableFilteredFichas.length / 25) || 1;
  const currentTableData = tableFilteredFichas.slice((currentPage - 1) * 25, currentPage * 25);

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
          {/* BUSCADOR AUTOCOMPLETADO */}
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
            <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-2">Buscador Inteligente (Autocompletar Formulario)</h4>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder={userRole.toUpperCase() === "TERAPEUTA" ? "Buscar entre mis pacientes..." : "Buscar cualquier paciente registrado..."}
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2980b9] text-slate-900"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((paciente) => (
                    <div 
                      key={paciente.id} 
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => {
                        handleEdit(paciente);
                        setSearchQuery(paciente.name);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="font-bold text-[#1a5276] text-sm">{paciente.name}</div>
                      <div className="text-xs text-slate-500">Terapeuta: {paciente.medicoTratante || "Sin asignar"} • Estatus: {paciente.estatus}</div>
                    </div>
                  ))}
                </div>
              )}
              {showDropdown && searchQuery && searchResults.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
                  No se encontraron resultados para esta búsqueda.
                </div>
              )}
            </div>
          </div>

          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-6">
            <span className="text-xl">{editingId ? "✏️" : "+"}</span> {editingId ? "Editar Ficha de Identificación" : "Nueva Ficha de Identificación"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-40 h-40 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fotografía del Paciente</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-300 rounded-md p-2 cursor-pointer transition-colors" />
                  <p className="text-[10px] text-slate-400 mt-2">Formatos soportados: JPG, PNG, GIF.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre completo" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Nacimiento</label>
                  <DateInput name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
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
                  <DateInput name="fechaIngreso" value={formData.fechaIngreso} onChange={handleInputChange} className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 outline-none text-slate-900" />
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
                {editingId ? "Actualizar Ficha" : "Guardar Ficha"}
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
              {currentTableData.length > 0 ? (
                currentTableData.map(f => (
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
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(f)} className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors" title="Editar">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {userRole === "ADMIN" && (
                          <button onClick={() => handleDelete(f.id)} className="p-1 text-red-500 hover:text-red-600 transition-colors" title="Eliminar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs font-medium text-slate-500">Mostrando {(currentPage - 1) * 25 + 1} a {Math.min(currentPage * 25, tableFilteredFichas.length)} de {tableFilteredFichas.length} pacientes</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-[#1a5276] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-[#1a5276] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

