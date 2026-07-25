"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getTerapeutas } from "@/app/actions/configuracion";
import { registrarEntrada, registrarSalida, getHorariosHoy, getHorariosByDate } from "@/app/actions/horarios";
import { DateInput } from "@/components/DateInput";

interface Horario {
  id: string;
  terapeuta: string;
  horaEntrada: string;
  horaSalida: string | null;
}

export default function HorariosPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Administrador";
  const userRole = (session?.user as any)?.role || "ADMIN";

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [terapeutaSeleccionado, setTerapeutaSeleccionado] = useState("");
  const [horaActual, setHoraActual] = useState("");
  const [terapeutasDisponibles, setTerapeutasDisponibles] = useState<string[]>([]);
  
  const hoy = new Date().toLocaleDateString("en-CA");
  const [fechaFiltro, setFechaFiltro] = useState(hoy);

  const fetchHorarios = async (fecha?: string) => {
    const f = fecha || fechaFiltro;
    if (f === hoy) {
      const res = await getHorariosHoy();
      if (res.success && res.data) setHorarios(res.data);
    } else {
      const res = await getHorariosByDate(f);
      if (res.success && res.data) setHorarios(res.data);
    }
  };

  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        if (userRole.toUpperCase() === "TERAPEUTA") {
          setTerapeutasDisponibles([userName]);
          setTerapeutaSeleccionado(userName);
        } else {
          setTerapeutasDisponibles(res.terapeutas);
        }
      }
    }
    if (userName) {
      loadTerapeutas();
      fetchHorarios();
    }
  }, [userName, userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    
    // Polling auto-refresh de la base de datos cada 10 segundos
    const syncInterval = setInterval(() => {
      fetchHorarios(fechaFiltro);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

  const handleEntrada = async () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }
    
    const res = await registrarEntrada(terapeutaSeleccionado);
    if (!res.success) {
      alert(res.error || "Error al registrar entrada");
      return;
    }

    await fetchHorarios();
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };

  const handleSalida = async () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    const res = await registrarSalida(terapeutaSeleccionado);
    if (!res.success) {
      alert(res.error || "Error al registrar salida");
      return;
    }

    await fetchHorarios();
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Horarios</h2>
          <p className="text-sm text-slate-500">Registro de entradas y salidas del personal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel de Registro */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center space-y-6">
          <div className="text-4xl font-bold text-slate-800 tabular-nums font-mono">
            {horaActual || "00:00:00"}
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-sm font-medium text-slate-700">Terapeuta</label>
            <select 
              className="w-full text-slate-900 font-medium p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              value={terapeutaSeleccionado}
              onChange={e => setTerapeutaSeleccionado(e.target.value)}
              disabled={userRole.toUpperCase() === "TERAPEUTA"}
            >
              {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">-- Seleccionar --</option>}
              {terapeutasDisponibles.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full">
            <button 
              onClick={handleEntrada}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Entrada
            </button>
            <button 
              onClick={handleSalida}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Salida
            </button>
          </div>
        </div>

        {/* Registros (Cuadros por separado) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="font-bold text-slate-700">
              {fechaFiltro === hoy ? "Registros de Hoy" : "Historial de Registros"}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-500">Fecha:</label>
              <DateInput 
                value={fechaFiltro}
                onChange={(e) => {
                  setFechaFiltro(e.target.value);
                  fetchHorarios(e.target.value);
                }}
                className="border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-indigo-500 text-slate-700"
              />
              {fechaFiltro !== hoy && (
                <button 
                  onClick={() => {
                    setFechaFiltro(hoy);
                    fetchHorarios(hoy);
                  }}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                >
                  Ver Hoy
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {terapeutasDisponibles.map((t, idx) => {
              // Buscar el último movimiento de este terapeuta hoy
              const registro = horarios.find(h => h.terapeuta === t);
              
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-lg text-slate-800">{t}</span>
                    <div className={`h-3 w-3 rounded-full shadow-sm ${registro && !registro.horaSalida ? 'bg-green-500' : 'bg-slate-300'}`} title={registro && !registro.horaSalida ? 'Activo' : 'Inactivo'}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrada</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${registro ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {registro ? `🕒 ${registro.horaEntrada}` : "—"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salida</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${registro && registro.horaSalida ? 'bg-slate-200 text-slate-700' : (registro ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}`}>
                        {registro && registro.horaSalida ? `🕒 ${registro.horaSalida}` : (registro ? "En turno..." : "—")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
