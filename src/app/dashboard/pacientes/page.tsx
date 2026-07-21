"use client";
import { useState, useEffect } from "react";

type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
  asistencias: number;
  sesiones: string;
  valoraciones: number;
  totalPagado: string;
  precio: string;
  metodo: string;
  ultima: string;
  estado: string;
};

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthTerm, setMonthTerm] = useState("");

  useEffect(() => {
    async function loadPatients() {
      const { getPatients } = await import('@/app/actions/pacientes');
      const result = await getPatients();
      if (result.success && result.data) {
        setPacientes(result.data);
      }
    }
    loadPatients();
  }, []);

  const handleLimpiar = () => {
    setSearchTerm("");
    setMonthTerm("");
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-6 h-6 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        <h2 className="text-xl font-bold text-[#1a5276]">Directorio de Pacientes</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* BARRA DE BÚSQUEDA */}
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-500">Buscar:</label>
            <input 
              type="text" 
              placeholder="Nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#2980b9] w-48 text-slate-700"
            />
          </div>
          
          <button className="bg-[#1a5276] hover:bg-[#0e2f44] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Buscar
          </button>

          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm font-semibold text-slate-500">Mes/Año:</label>
            <input 
              type="month" 
              value={monthTerm}
              onChange={(e) => setMonthTerm(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#2980b9] text-slate-700 w-40"
            />
          </div>

          <button onClick={handleLimpiar} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-sm font-semibold transition-colors">
            Limpiar
          </button>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-[#0e2f44] text-white font-semibold">
              <tr>
                <th className="px-4 py-4 text-left border-b border-[#0e2f44]">PACIENTE</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">SEXO</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">NAC.</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">EDAD</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">ASISTENCIAS</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">VALORACIONES</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">TOTAL PAGADO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">PRECIO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">MÉTODO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ÚLTIMA</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ESTADO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-left font-bold text-slate-800">
                    <div className="max-w-[150px] leading-tight">{p.name}</div>
                  </td>
                  <td className="px-2 py-4 text-slate-500">
                    <span className="text-base">{p.sexo === 'M' ? '♂' : p.sexo === 'F' ? '♀' : '⚥'}</span>
                  </td>
                  <td className="px-2 py-4 text-slate-400">{p.fechaNacimiento || "—"}</td>
                  <td className="px-2 py-4 text-slate-400">{p.age || "—"}</td>
                  <td className="px-2 py-4">
                    <span className="bg-[#e6f4ea] text-[#1e8e3e] px-2.5 py-0.5 rounded text-[11px] font-bold">
                      {p.asistencias || 0}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-slate-400">{p.sesiones || "—"}</td>
                  <td className="px-2 py-4">
                    <span className="bg-[#fce8f3] text-[#c5221f] px-2.5 py-0.5 rounded text-[11px] font-bold">
                      {p.valoraciones || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">{p.totalPagado || "$0.00"}</td>
                  <td className="px-4 py-4 font-bold text-[#1a5276]">{p.precio || "Por definir"}</td>
                  <td className="px-4 py-4">
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap">
                      {p.metodo || "Por definir"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-medium">{p.ultima || "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-semibold ${p.estatus === 'Activo' ? 'text-green-500' : 'text-slate-500'}`}>
                      {p.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 text-amber-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-400 font-medium border border-t-0 border-slate-200">
                    Sin pacientes registrados. Ve a "Ficha de Identificación" para agregar uno.
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
