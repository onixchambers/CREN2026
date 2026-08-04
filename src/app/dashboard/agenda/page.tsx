"use client";
import { useState, useEffect } from "react";
import { getTerapeutas } from "@/app/actions/configuracion";
import { getPatients, updatePatientFast } from "@/app/actions/pacientes";
import { getAgenda, addCita, updateCita, deleteCita } from "@/app/actions/agenda";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";
import { EditPatientModal } from "@/components/EditPatientModal";

type Cita = {
  id: string;
  paciente: string;
  fecha: string;
  hora: string;
  terapeuta: string;
  tipoServicio: string;
  frecuencia: string;
  estado: string;
  pagado?: boolean;
  metodoPago?: string;
};

const HORAS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00", "21:00", "22:00"
];

export default function AgendaPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Administrador";

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const hoy = new Date().toISOString().split("T")[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [pacientes, setPacientes] = useState<{id: string, name: string, medicoTratante?: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verTodosLosPacientes, setVerTodosLosPacientes] = useState(false);
  const [isLoadingTerapeutas, setIsLoadingTerapeutas] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [formData, setFormData] = useState({
    paciente: "", fecha: hoy, hora: "09:00", terapeuta: "", tipoServicio: "individual", frecuencia: "semanal", numeroSesiones: 1, estado: "Agendado" as Cita["estado"], pagado: false, metodoPago: ""
  });

  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    async function loadData() {
      const { getAllowTherapistEdit } = await import('@/app/actions/configuracion');
      const allowRes = await getAllowTherapistEdit();
      setAllowTherapistEdit(allowRes);

      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        let teraList = res.terapeutas;
        if (userRole.toUpperCase() === "TERAPEUTA") {
          teraList = [userName];
        }
        setTerapeutas(teraList);
        if (teraList.length > 0) {
          setFormData(prev => ({ ...prev, terapeuta: teraList[0] }));
        }
      }
      
      const pacRes = await getPatients();
      if (pacRes.success && pacRes.data) {
        const activosOnly = pacRes.data.filter((p: any) => {
          const st = (p.estatus || "Activo").toLowerCase();
          return st === "activo";
        });
        setPacientes(activosOnly.map((p: any) => ({ id: p.id, name: p.name, medicoTratante: p.medicoTratante, sexo: p.sexo, fechaNacimiento: p.fechaNacimiento, precioTerapia: p.precioTerapia, metodoPago: p.metodoPago, estatus: p.estatus })));
      }
      
      const agendaRes = await getAgenda();
      if (agendaRes.success && agendaRes.data) {
        setCitas(agendaRes.data);
      }

      setIsLoadingTerapeutas(false);
    }
    loadData();
  }, [status, userRole, userName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "estado" && value === "Ocupado") {
      setFormData(prev => ({
        ...prev,
        estado: "Ocupado",
        paciente: "No Disponible",
        frecuencia: "unica",
        numeroSesiones: 1
      }));
    } else if (name === "estado" && value === "Disponible") {
      setFormData(prev => ({
        ...prev,
        estado: "Disponible",
        paciente: prev.paciente === "No Disponible" ? "" : prev.paciente
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openPatientEditModal = async (patientName: string) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para editar pacientes.");
      return;
    }
    const searchNorm = patientName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const { getPatients } = await import('@/app/actions/pacientes');
    const pRes = await getPatients();
    const patientsList = pRes.success && pRes.data ? pRes.data : pacientes;

    const fullPatient = patientsList.find((p: any) => p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === searchNorm);
    if (!fullPatient) {
      alert("No se encontró la ficha del paciente para edición.");
      return;
    }
    
    setEditingPatient(fullPatient);
  };

  const savePatientEdit = async (updatedPatient: any) => {
    alert("Paciente actualizado.");
    setEditingPatient(null);
    const { getPatients } = await import('@/app/actions/pacientes');
    const pRes = await getPatients();
    if (pRes.success && pRes.data) {
      setPacientes(pRes.data);
    }
    
    // Update agenda citations to reflect possible name change
    if (updatedPatient.name && updatedPatient.name !== editingPatient.name) {
      const matchingCitas = citas.filter(c => c.paciente === editingPatient.name);
      for (const cita of matchingCitas) {
         await updateCita(cita.id, { paciente: updatedPatient.name });
      }
      if (selectedCita && selectedCita.paciente === editingPatient.name) {
         setSelectedCita({...selectedCita, paciente: updatedPatient.name});
      }
      
      const aRes = await getAgenda();
      if (aRes.success && aRes.data) setCitas(aRes.data);
    }
  };

  const [isSubmittingCita, setIsSubmittingCita] = useState(false);

  const handleAddCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCita) return;
    
    const [h, m] = (formData.hora || "09:00").split(":").map(Number);
    const totalMins = h * 60 + (m || 0);
    if (isNaN(totalMins) || totalMins < 420 || totalMins > 1320) {
      alert("Las citas solo pueden agendarse en el horario de 7:00 AM a 10:00 PM (07:00 a 22:00).");
      return;
    }

    setIsSubmittingCita(true);

    try {
      const nuevaCitaObj = {
        paciente: formData.paciente,
        fecha: formData.fecha,
        hora: formData.hora,
        terapeuta: formData.terapeuta,
        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        numeroSesiones: 1,
        estado: formData.estado,
        pagado: formData.pagado,
        metodoPago: formData.metodoPago
      };
      
      const res = await addCita(nuevaCitaObj);
      if (res.success) { 
        if (res.citas) { 
          setCitas([...citas, ...res.citas]); 
        } else { 
          setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]); 
        }
        setIsModalOpen(false);
        setFormData({ paciente: "", fecha: fechaSeleccionada, hora: "09:00", terapeuta: terapeutas[0] || "", tipoServicio: "individual", frecuencia: "semanal", numeroSesiones: 1, estado: "Agendado", pagado: false, metodoPago: "" });
      } else {
        alert("Error: " + res.error);
      }
    } finally {
      setIsSubmittingCita(false);
    }
  };
  
  const handleDeleteCita = async (id: string) => {
    if (!confirm("¿Eliminar esta cita permanentemente?")) return;
    const res = await deleteCita(id);
    if (res.success) {
      setCitas(citas.filter(c => c.id !== id));
      setIsEditModalOpen(false);
    }
  };

  const handleUpdateSelectedCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCita) return;
    const res = await updateCita(selectedCita.id, {
      estado: selectedCita.estado,
      pagado: selectedCita.pagado,
      metodoPago: selectedCita.metodoPago
    });
    if (res.success) {
      setCitas(citas.map(c => c.id === selectedCita.id ? selectedCita : c));
      setIsEditModalOpen(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(fechaSeleccionada + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(fechaSeleccionada + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    setFechaSeleccionada(hoy);
  };

  const formatFechaLarga = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const str = d.toLocaleDateString('es-ES', opciones);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const citasFiltradas = citas.filter(c => c.fecha === fechaSeleccionada);

  const getCitaParaCelda = (hora: string, terapeuta: string) => {
    const horaPrefix = hora.split(":")[0];
    return citasFiltradas.find(c => c.terapeuta === terapeuta && c.hora.startsWith(horaPrefix));
  };

  const getEstadoStyle = (estado: string) => {
    const est = (estado || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (est.includes("centro")) {
      return {
        className: "bg-amber-100/90 text-amber-900 border-amber-300 font-bold shadow-sm",
        style: { color: "#78350f", backgroundColor: "rgba(254, 240, 138, 0.85)" }
      };
    }
    if (est.includes("sin anticipacion") || est.includes("sin anticipa")) {
      return {
        className: "bg-red-100/90 text-red-900 border-red-300 font-bold shadow-sm",
        style: { color: "#7f1d1d", backgroundColor: "rgba(254, 226, 226, 0.85)" }
      };
    }
    if (est.includes("anticipad") || est.includes("con anticipacion")) {
      return {
        className: "bg-orange-100/90 text-orange-900 border-orange-300 font-bold shadow-sm",
        style: { color: "#7c2d12", backgroundColor: "rgba(254, 215, 170, 0.85)" }
      };
    }
    if (est === "agendado" || est === "alta") {
      return {
        className: "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-sm",
        style: { color: "#065f46", backgroundColor: "#d1fae5" }
      };
    }
    if (est.includes("asisti") || est === "asistio") {
      return {
        className: "bg-slate-200 text-slate-800 border-slate-300 font-bold shadow-sm",
        style: { color: "#1e293b", backgroundColor: "#e2e8f0" }
      };
    }
    if (est === "baja") {
      return {
        className: "bg-slate-900 text-white border-slate-950 font-bold shadow-sm",
        style: { color: "#ffffff", backgroundColor: "#0f172a" }
      };
    }
    if (est.includes("ocupado") || est.includes("no disponible")) {
      return {
        className: "bg-red-600 text-white border-red-700 font-bold shadow-md",
        style: { color: "#ffffff", backgroundColor: "#dc2626" }
      };
    }
    
    return {
      className: "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-sm",
      style: { color: "#065f46", backgroundColor: "#d1fae5" }
    };
  };

  if (isLoading || isLoadingTerapeutas) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleOpenModal = (tName?: string, hStr?: string) => {
    setFormData({
      paciente: "",
      fecha: fechaSeleccionada,
      hora: hStr || "09:00",
      terapeuta: tName || terapeutas[0] || "",
      tipoServicio: "individual",
      frecuencia: "semanal",
      numeroSesiones: 1,
      estado: "Agendado",
      pagado: false,
      metodoPago: ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0e2f44] flex items-center gap-2">
          <svg className="w-6 h-6 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Vista Diaria de la Agenda
        </h2>
        <button onClick={() => handleOpenModal()} className="bg-[#1a5276] hover:bg-[#0e2f44] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
          + Programar Cita
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Ver día anterior"
            >
              ◀ Día Anterior
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold rounded-lg text-xs shadow-sm transition cursor-pointer"
              title="Ir al día de hoy"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Ver día siguiente"
            >
              Día Siguiente ▶
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold text-[#1a5276]">
              📅 {formatFechaLarga(fechaSeleccionada)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Seleccionar Fecha:</span>
              <DateInput
                value={fechaSeleccionada}
                onChange={(val) => setFechaSeleccionada(typeof val === "string" ? val : val.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-slate-800 bg-white cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-[#0e2f44] text-white px-4 py-3 font-semibold uppercase text-xs w-24">
                  HORA
                </th>
                {terapeutas.map(t => (
                  <th key={t} className="border border-slate-200 bg-[#0e2f44] text-white px-4 py-3 font-semibold uppercase text-xs">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map(hora => (
                <tr key={hora} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-200 px-4 py-3 font-bold text-[#0e2f44] bg-slate-50">
                    {hora}
                  </td>
                  {terapeutas.map(t => {
                    const cita = getCitaParaCelda(hora, t);
                    return (
                      <td key={`${hora}-${t}`} className="border border-slate-200 p-0 h-16 w-40 relative align-top group">
                        {cita ? (
                            (() => {
                              const st = getEstadoStyle(cita.estado);
                              return (
                                <div 
                                  onClick={() => { setSelectedCita(cita); setIsEditModalOpen(true); }}
                                  style={st.style}
                                  className={`absolute left-0 w-full h-full p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center cursor-pointer shadow-sm hover:brightness-95 transition-all ${cita.hora.includes(":30") ? "top-[50%] z-10" : "top-0"} ${st.className}`}>
                                  
                                  {userRole.toUpperCase() !== "TERAPEUTA" && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCita(cita.id); }} 
                                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold bg-white/70 hover:bg-white rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm cursor-pointer" 
                                    title="Eliminar Cita"
                                  >&times;</button>
                                  )}

                                  <span className="truncate w-full text-center mt-1 font-bold">
                                    {(cita.estado === "Ocupado" || cita.estado === "No Disponible" || cita.paciente === "No Disponible") ? "No Disponible" : cita.paciente}
                                  </span>
                                  <span className="text-[10px] opacity-90 uppercase mt-0.5 truncate w-full text-center">
                                    {(cita.estado === "Ocupado" || cita.estado === "No Disponible" || cita.paciente === "No Disponible") ? "Bloqueado" : (cita.estado || "Agendado")}
                                  </span>
                                </div>
                              );
                            })()
                        ) : (
                          <div 
                            onClick={() => handleOpenModal(t, hora)}
                            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-blue-50/60 transition-colors group/cell"
                            title="Haz clic para agendar en esta hora"
                          >
                            <span className="text-slate-300 group-hover/cell:text-[#1a5276] font-extrabold text-sm">+</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA NUEVA CITA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-[#0e2f44]">Programar Cita</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleAddCita} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paciente y Terapeuta */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">
                      Nombre del Paciente {formData.estado === "Ocupado" && <span className="text-red-500 font-bold">(Bloqueado)</span>}
                    </label>
                    {userRole.toUpperCase() === "TERAPEUTA" && (
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={verTodosLosPacientes} 
                          onChange={(e) => setVerTodosLosPacientes(e.target.checked)} 
                          className="cursor-pointer"
                        />
                        Ver todos
                      </label>
                    )}
                  </div>
                  <input 
                    required={formData.estado !== "Ocupado"}
                    disabled={formData.estado === "Ocupado"}
                    type="text" 
                    name="paciente" 
                    autoComplete="off"
                    value={formData.estado === "Ocupado" ? "No Disponible" : formData.paciente} 
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
                    className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${formData.estado === "Ocupado" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`} 
                    placeholder={formData.estado === "Ocupado" ? "No Disponible" : "Escribir para buscar paciente..."} 
                  />
                  {showDropdown && formData.estado !== "Ocupado" && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {(() => {
                        const searchNorm = (formData.paciente || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const filtered = pacientes.filter(p => {
                          const matchesName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNorm);
                          const matchesRole = userRole.toUpperCase() !== "TERAPEUTA" || verTodosLosPacientes || (p.medicoTratante && p.medicoTratante.toLowerCase().includes(userName.toLowerCase()));
                          return matchesName && matchesRole;
                        });
                        return filtered.map(p => (
                          <li 
                            key={p.id} 
                            onMouseDown={(e) => e.preventDefault()}
                            className="px-3 py-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                paciente: p.name,
                              }));
                              setShowDropdown(false);
                            }}
                          >
                            {p.name}
                          </li>
                        ));
                      })()}
                      {(() => {
                        const searchNorm = (formData.paciente || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const filtered = pacientes.filter(p => (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchNorm));
                        return filtered.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-slate-400">No se encontraron pacientes</li>
                        ) : null;
                      })()}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Terapeuta Asignado</label>
                  <select name="terapeuta" value={formData.terapeuta} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
                    {terapeutas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha y Hora */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Fecha de la Cita</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date((formData.fecha || hoy) + "T00:00:00");
                          d.setDate(d.getDate() - 1);
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setFormData(prev => ({ ...prev, fecha: `${year}-${month}-${day}` }));
                        }}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition"
                        title="Día anterior"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, fecha: hoy }))}
                        className="px-1.5 py-0.5 bg-[#1a5276] hover:bg-[#0e2f44] text-white text-[10px] font-bold rounded cursor-pointer transition"
                        title="Hoy"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date((formData.fecha || hoy) + "T00:00:00");
                          d.setDate(d.getDate() + 1);
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setFormData(prev => ({ ...prev, fecha: `${year}-${month}-${day}` }));
                        }}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition"
                        title="Día siguiente"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                  <DateInput
                    required
                    name="fecha"
                    value={formData.fecha}
                    onChange={(val) => {
                      const nextDate = typeof val === "string" ? val : (val?.target?.value || val);
                      setFormData(prev => ({ ...prev, fecha: nextDate }));
                    }}
                    className="w-full text-slate-900 font-bold border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hora</label>
                  <input required type="time" min="07:00" max="22:00" name="hora" value={formData.hora} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
                </div>

                {/* Servicio y Frecuencia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Servicio</label>
                  <select disabled={formData.estado === "Ocupado"} name="tipoServicio" value={formData.tipoServicio} onChange={handleInputChange} className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${formData.estado === "Ocupado" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}>
                    <option value="individual">Individual</option>
                    <option value="valoracion">Valoración</option>
                    <option value="taller">Taller</option>
                    <option value="escuela">Escuela</option>
                    <option value="reposicion">Reposición</option>
                    <option value="taller grupal">Taller Grupal</option>
                    <option value="orientacion padres">Orientación Padres</option>
                  </select>
                </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Frecuencia</label>
                    <select disabled={formData.estado === "Ocupado"} name="frecuencia" value={formData.estado === "Ocupado" ? "unica" : formData.frecuencia} onChange={handleInputChange} className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${formData.estado === "Ocupado" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}>
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="unica">Única / Ocasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Número de Sesiones</label>
                    <input disabled={formData.estado === "Ocupado"} required type="number" min="1" max="100" name="numeroSesiones" value={formData.estado === "Ocupado" ? 1 : formData.numeroSesiones} onChange={handleInputChange} className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${formData.estado === "Ocupado" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`} />
                  </div>

                {/* Estado */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado de la Cita</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full text-slate-900 font-bold border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] bg-white">
                    <option value="Agendado">Agendado (Default - Verde)</option>
                    <option value="Asistio">Asistió (Gris)</option>
                    <option value="Cancelo con anticipacion">Canceló con anticipación (Naranja traslúcido)</option>
                    <option value="Cancelo sin anticipacion">Canceló sin anticipación (Rojo traslúcido)</option>
                    <option value="Cancelo el centro">Canceló el centro (Amarillo traslúcido)</option>
                    <option value="Ocupado">Ocupado (Terapeuta No Disponible)</option>
                  </select>
                  {formData.estado === "Ocupado" && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                      ⚠️ El terapeuta estará ocupado en este horario. Solo puedes elegir Fecha y Hora. Aparecerá en rojo como "No Disponible" y no se podrán agendar citas.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#1a5276] text-white font-semibold rounded-lg hover:bg-[#0e2f44] transition-colors">Agendar Cita</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICION */}
      {isEditModalOpen && selectedCita && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-[#0e2f44]">Editar Cita</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateSelectedCita} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{selectedCita.paciente}</p>
                  <p className="text-slate-500 text-sm">{selectedCita.fecha} a las {selectedCita.hora}</p>
                </div>
                {selectedCita.paciente !== "No Disponible" && selectedCita.paciente !== "Bloqueado" && (
                  <button
                    type="button"
                    onClick={() => openPatientEditModal(selectedCita.paciente)}
                    title="Editar Ficha ID del Paciente"
                    className="p-2 border border-slate-200 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Ficha ID
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado de Asistencia</label>
                <select 
                  value={selectedCita.estado} 
                  onChange={e => setSelectedCita({...selectedCita, estado: e.target.value})} 
                  className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] bg-white"
                >
                  <option value="Agendado">Agendado (Verde)</option>
                  <option value="Asistio">Asistió (Gris)</option>
                  <option value="Cancelo con anticipacion">Canceló con anticipación (Naranja traslúcido)</option>
                  <option value="Cancelo sin anticipacion">Canceló sin anticipación (Rojo traslúcido)</option>
                  <option value="Cancelo el centro">Canceló el centro (Amarillo traslúcido)</option>
                  <option value="Ocupado">Ocupado / No Disponible (Rojo)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                {userRole.toUpperCase() !== "TERAPEUTA" && (
                <button type="button" onClick={() => handleDeleteCita(selectedCita.id)} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors">Eliminar</button>
                )}
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#1a5276] text-white font-semibold rounded-lg hover:bg-[#0e2f44] transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PACIENTE (Ficha ID) DESDE LA AGENDA */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          userRole={userRole}
          allowTherapistEdit={allowTherapistEdit}
          onClose={() => setEditingPatient(null)}
          onSaved={savePatientEdit}
        />
      )}

    </div>
  );
}


