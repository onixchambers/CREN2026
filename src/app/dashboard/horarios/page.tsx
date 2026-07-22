"use client";
import { useState, useEffect } from "react";
import { getTerapeutas } from "@/app/actions/configuracion";

interface Horario {
  id: number;
  terapeuta: string;
  horaEntrada: string;
  horaSalida?: string;
}

export default function HorariosPage() {
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

  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        setTerapeutasDisponibles(res.terapeutas);
      }
    }
    loadTerapeutas();

    // Actualizar reloj cada segundo
    const interval = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const registrarEntrada = () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    const nuevoHorario: Horario = {
      id: Date.now(),
      terapeuta: terapeutaSeleccionado,
      horaEntrada: new Date().toLocaleTimeString(),
    };

    setHorarios([nuevoHorario, ...horarios]);
    setTerapeutaSeleccionado("");
  };

  const registrarSalida = () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    // Buscar si ya tiene una entrada hoy
    const index = horarios.findIndex(h => h.terapeuta === terapeutaSeleccionado && !h.horaSalida);
    
    if (index !== -1) {
      const nuevosHorarios = [...horarios];
      nuevosHorarios[index] = {
        ...nuevosHorarios[index],
        horaSalida: new Date().toLocaleTimeString()
      };
      setHorarios(nuevosHorarios);
    } else {
      alert("Este terapeuta no tiene una entrada activa registrada.");
    }
    
    setTerapeutaSeleccionado("");
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
            >
              <option value="">-- Seleccionar --</option>
              {terapeutasDisponibles.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full">
            <button 
              onClick={registrarEntrada}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Entrada
            </button>
            <button 
              onClick={registrarSalida}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Salida
            </button>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">
            Registros de Hoy ({new Date().toLocaleDateString()})
          </div>
          {horarios.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay movimientos registrados aún.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b">
                <tr>
                  <th className="p-4 font-semibold">Terapeuta</th>
                  <th className="p-4 font-semibold">Entrada</th>
                  <th className="p-4 font-semibold">Salida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {horarios.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{h.terapeuta}</td>
                    <td className="p-4 text-green-700 font-medium">🕒 {h.horaEntrada}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      {h.horaSalida ? `🕒 ${h.horaSalida}` : <span className="text-slate-400 italic">En turno</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
