"use client";

import React, { useState } from "react";
import { updateCita } from "@/app/actions/agenda";
import { saveAsistenciaDB } from "@/app/actions/asistencia";

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

type StatusMenuModalProps = {
  cita: Cita;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
  onOpenPreRegistro: () => void;
};

export function StatusMenuModal({
  cita,
  onClose,
  onStatusChange,
  onOpenPreRegistro,
}: StatusMenuModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusClick = async (estado: string) => {
    setIsLoading(true);
    try {
      // 1. Actualizar estado de la cita
      await updateCita(cita.id, { estado });
      
      // 2. Si el estado no es Agendado, guardar registro automático
      // en asistencia para que aparezca en registros recientes.
      if (estado !== "Agendado" && estado !== "Ocupado" && estado !== "Disponible") {
        await saveAsistenciaDB({
          agendaId: cita.id,
          fecha: cita.fecha,
          hora: cita.hora,
          terapeuta: cita.terapeuta,
          pacienteNombre: cita.paciente,
          tipoSesion: cita.tipoServicio,
          frecuencia: cita.frecuencia,
          estadoAsistencia: estado,
          metodoPago: cita.metodoPago || "Por definir",
          montoPago: "0",
          asistenciaGuardada: true
        });
      }
      
      onStatusChange(estado);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Asistió": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-300";
      case "Falta": return "bg-red-100 text-red-700 hover:bg-red-200 border-red-300";
      case "Canceló Centro": return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300";
      case "Canceló Anticipadamente": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300";
      case "No Disponible": return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300";
      case "Agendado": return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
      default: return "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 relative">
        <div className="px-5 py-4 border-b border-slate-100 bg-[#0e2f44] flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">Estado de la Cita</h3>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 text-center">
            <p className="font-bold text-slate-800">{cita.paciente}</p>
            <p className="text-sm text-slate-500">{cita.hora} - {cita.tipoServicio}</p>
          </div>

          <button 
            onClick={() => {
              onClose();
              onOpenPreRegistro();
            }}
            disabled={isLoading}
            className="w-full mb-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Llenar Pre-registro de Asistencia
          </button>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase text-center mb-3">O Cambiar Estado Rápido</p>
            
            {["Asistió", "Falta", "Canceló Centro", "Canceló Anticipadamente", "No Disponible", "Agendado"].map(st => (
              <button
                key={st}
                disabled={isLoading}
                onClick={() => handleStatusClick(st)}
                className={`w-full py-2 px-3 border rounded-lg font-semibold text-sm transition-colors ${getStatusColor(st)} ${cita.estado === st ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
