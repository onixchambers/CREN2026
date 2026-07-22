"use client";
import { useState, useEffect } from "react";
import { getTerapeutas } from "@/app/actions/configuracion";

type Cita = {
  id: string;
  paciente: string;
  fecha: string;
  hora: string;
  terapeuta: string;
  tipoServicio: string;
  frecuencia: string;
  estado: "Ocupado" | "Cancelado" | "Reagendado" | "Disponible";
};

const HORAS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];

export default function AgendaPage() {
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
  const [isLoadingTerapeutas, setIsLoadingTerapeutas] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente: "", fecha: hoy, hora: "09:00", terapeuta: "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado" as Cita["estado"]
  });

  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        setTerapeutas(res.terapeutas);
        if (res.terapeutas.length > 0) {
          setFormData(prev => ({ ...prev, terapeuta: res.terapeutas[0] }));
        }
      }
      setIsLoadingTerapeutas(false);
    }
    loadTerapeutas();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCita = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaCita: Cita = {
      id: Date.now().toString(),
      paciente: formData.paciente,
      fecha: formData.fecha,
      hora: formData.hora, // Formato "HH:MM"
      terapeuta: formData.terapeuta,
      tipoServicio: formData.tipoServicio,
      frecuencia: formData.frecuencia,
      estado: formData.estado
    };
    
    setCitas([...citas, nuevaCita]);
    setIsModalOpen(false);
    setFormData({ paciente: "", fecha: fechaSeleccionada, hora: "09:00", terapeuta: terapeutas[0] || "", tipoServicio: "individual", frecuencia: "semanal", estado: "Ocupado" });
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
            <input 
              type="date" 
              value={fechaSeleccionada} 
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
                      <td key={`${hora}-${t}`} className="border border-slate-200 p-2 h-16 w-40 relative group">
                        {cita ? (
                          <div className={`p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center h-full w-full cursor-pointer shadow-sm hover:brightness-95 transition-all ${getEstadoColor(cita.estado)}`}>
                            <span className="truncate w-full">{cita.paciente}</span>
                            <span className="text-[10px] opacity-80 uppercase mt-0.5 truncate w-full">{cita.tipoServicio}</span>
                            
                            {/* Hover info */}
                            <div className="hidden group-hover:block absolute z-10 w-48 bg-white border border-slate-200 shadow-xl rounded-lg p-3 text-left -top-2 left-full ml-2">
                              <p className="font-bold text-slate-800 mb-1">{cita.paciente}</p>
                              <p className="text-slate-600 text-xs"><strong>Hora:</strong> {cita.hora}</p>
                              <p className="text-slate-600 text-xs capitalize"><strong>Servicio:</strong> {cita.tipoServicio}</p>
                              <p className="text-slate-600 text-xs capitalize"><strong>Frecuencia:</strong> {cita.frecuencia}</p>
                              <p className="text-slate-600 text-xs capitalize mt-1"><span className={`px-2 py-0.5 rounded text-[10px] ${getEstadoColor(cita.estado)}`}>{cita.estado}</span></p>
                            </div>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre del Paciente</label>
                  <input required type="text" name="paciente" value={formData.paciente} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" placeholder="Ej. Carlos Mendoza" />
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
                  <input required type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9]" />
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
    </div>
  );
}

