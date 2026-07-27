"use client";
import { useState, useEffect } from "react";
import { getTerapeutas } from "@/app/actions/configuracion";
import { getPatients } from "@/app/actions/pacientes";
import { getAgenda, addCita, updateCita, deleteCita } from "@/app/actions/agenda";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";

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
  const [pacientes, setPacientes] = useState<{id: string, name: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingTerapeutas, setIsLoadingTerapeutas] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [formData, setFormData] = useState({
    paciente: "", fecha: hoy, hora: "09:00", terapeuta: "", tipoServicio: "individual", frecuencia: "semanal", numeroSesiones: 1, estado: "Ocupado" as Cita["estado"], pagado: false, metodoPago: ""
  });

  useEffect(() => {
    if (status === "loading") return;
    async function loadTerapeutas() {
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
        setPacientes(activosOnly.map((p: any) => ({ id: p.id, name: p.name })));
      }
      
      const agendaRes = await getAgenda();
      if (agendaRes.success && agendaRes.data) {
        setCitas(agendaRes.data);
      }

      setIsLoadingTerapeutas(false);
    }
    loadTerapeutas();
  }, [status, userRole, userName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCita = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hourNum = parseInt((formData.hora || "09:00").split(":")[0]);
    if (isNaN(hourNum) || hourNum < 7 || hourNum > 22) {
      alert("Las citas solo pueden agendarse en el horario de 7:00 AM a 10:00 PM.");
      return;
    }

    const nuevaCitaObj = {
      paciente: formData.paciente,
      fecha: formData.fecha,
      hora: formData.hora,
      terapeuta: formData.terapeuta,
      tipoServicio: formData.tipoServicio,
      frecuencia: formData.frecuencia,
      numeroSesiones: formData.numeroSesiones,
      estado: formData.estado,
      pagado: formData.pagado,
      metodoPago: formData.metodoPago
    };
    
    const res = await addCita(nuevaCitaObj);
    if (res.success) { if (res.citas) { setCitas([...citas, ...res.citas]); } else { setCitas([...citas, { id: res.id, ...nuevaCitaObj } as Cita]); }
      setIsModalOpen(false);
      setFormData({ paciente: "", fecha: fechaSeleccionada, hora: "09:00", terapeuta: terapeutas[0] || "", tipoServicio: "individual", frecuencia: "semanal", numeroSesiones: 1, estado: "Ocupado", pagado: false, metodoPago: "" });
    } else {
      alert("Error: " + res.error);
    }
  };
  
    const handleUpdateInline = (id: string, updates: any) => {
    setCitas(citas.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSaveInline = async (id: string) => {
    const current = citas.find(c => c.id === id);
    if (!current) return;
    const res = await updateCita(id, { 
      estado: current.estado,
      pagado: current.pagado,
      metodoPago: current.metodoPago
    });
    if (res.success) {
      alert("Cita guardada correctamente");
    } else {
      alert("Error al guardar cita");
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

  const handleTogglePagado = async (citaId: string, currentPagado: boolean) => {
    const newVal = !currentPagado;
    const res = await updateCita(citaId, { pagado: newVal });
    if (res.success) {
      setCitas(citas.map(c => c.id === citaId ? { ...c, pagado: newVal } : c));
    }
  };

  const citasFiltradas = citas.filter(c => c.fecha === fechaSeleccionada);

  const getCitaParaCelda = (hora: string, terapeuta: string) => {
    // Busca una cita cuya hora empiece con la misma hora de la celda (ej. "09:" coincide con "09:00" o "09:30")
    const horaPrefix = hora.split(":")[0];
    return citasFiltradas.find(c => c.terapeuta === terapeuta && c.hora.startsWith(horaPrefix));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Ocupado': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Reagendado': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Disponible': return 'bg-green-100 text-green-800 border-green-300';
        case 'Asistió': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Canceló': return 'bg-red-100 text-red-800 border-red-300';
        case 'Faltó': return 'bg-rose-100 text-rose-800 border-rose-300';
        case 'Baja': return 'bg-stone-100 text-stone-800 border-stone-300';
        case 'Alta': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (isLoadingTerapeutas) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0e2f44] flex items-center gap-2">
          <svg className="w-6 h-6 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Vista Diaria de la Agenda
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#1a5276] hover:bg-[#0e2f44] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
          + Programar Cita
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">Filtrar Fecha:</span>
            <DateInput value={fechaSeleccionada} 
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-medium text-slate-700" 
            />
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
                            <div 
                              onClick={() => { setSelectedCita(cita); setIsEditModalOpen(true); }}
                              className={`absolute left-0 w-full h-full p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center cursor-pointer shadow-sm hover:brightness-95 transition-all ${cita.hora.includes(":30") ? "top-[50%] z-10" : "top-0"} ${getEstadoColor(cita.estado)}`}>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteCita(cita.id); }} 
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold bg-white/50 rounded-full w-4 h-4 flex items-center justify-center leading-none" 
                                title="Eliminar Cita"
                              >&times;</button>

                              <span className="truncate w-full text-center mt-1">{cita.paciente}</span>
                              <span className="text-[10px] opacity-80 uppercase mt-0.5 truncate w-full text-center">{cita.tipoServicio}</span>
                            </div>
                        ) : (
                          <span className="text-slate-300">—</span>
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Paciente</label>
                  <input 
                    required 
                    type="text" 
                    name="paciente" 
                    autoComplete="off"
                    value={formData.paciente} 
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" 
                    placeholder="Escribir para buscar paciente..." 
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {pacientes
                        .filter(p => p.name.toLowerCase().includes(formData.paciente.toLowerCase()))
                        .map(p => (
                          <li 
                            key={p.id} 
                            className="px-3 py-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                paciente: p.name,
                              });
                              setShowDropdown(false);
                            }}
                          >
                            {p.name}
                          </li>
                        ))}
                      {pacientes.filter(p => p.name.toLowerCase().includes(formData.paciente.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">No se encontraron pacientes</li>
                      )}
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
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha</label>
                  <DateInput required name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hora</label>
                  <input required type="time" name="hora" value={formData.hora} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
                </div>

                {/* Servicio y Frecuencia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Servicio</label>
                  <select name="tipoServicio" value={formData.tipoServicio} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
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
                    <select name="frecuencia" value={formData.frecuencia} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="unica">Única / Ocasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Número de Sesiones</label>
                    <input required type="number" min="1" max="100" name="numeroSesiones" value={formData.numeroSesiones} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
                  </div>

                {/* Estado */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]">
                    <option value="Disponible">Disponible (Libre para agendar)</option>
                    <option value="Ocupado">Ocupado (Confirmado)</option>
                    <option value="Reagendado">Reagendado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
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
              <div>
                <p className="font-bold text-slate-800">{selectedCita.paciente}</p>
                <p className="text-slate-500 text-sm">{selectedCita.fecha} a las {selectedCita.hora}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado de Asistencia</label>
                <select 
                  value={selectedCita.estado} 
                  onChange={e => setSelectedCita({...selectedCita, estado: e.target.value})} 
                  className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]"
                >
                  <option value="Ocupado">Ocupado (Confirmado)</option>
                  <option value="Asistió">Asistió</option>
                  <option value="Canceló">Canceló</option>
                  <option value="Faltó">Faltó</option>
                  <option value="Baja">Baja</option>
                  <option value="Alta">Alta</option>
                  <option value="Reagendado">Reagendado</option>
                  <option value="Disponible">Disponible</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button type="button" onClick={() => handleDeleteCita(selectedCita.id)} className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors">Eliminar</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#1a5276] text-white font-semibold rounded-lg hover:bg-[#0e2f44] transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


