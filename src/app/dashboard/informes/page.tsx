"use client";
import { useState, useEffect, useRef } from "react";

type Informe = {
  id: string;
  paciente: string;
  tipo: string;
  fecha: string;
  archivoNombre: string;
  fechaSubida: string;
};

type Paciente = {
  id: string;
  paciente: string;
};

export default function InformesPage() {
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [informes, setInformes] = useState<Informe[]>([]);
  
  // Formulario Upload
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const hoy = new Date().toISOString().split("T")[0];
  const [selectedFecha, setSelectedFecha] = useState(hoy);
  const [file, setFile] = useState<File | null>(null);
  
  // Filtros tabla
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cargar pacientes
    const pData = localStorage.getItem("pacientesData");
    if (pData) setPacientes(JSON.parse(pData));

    // Cargar informes
    const iData = localStorage.getItem("informesData");
    if (iData) setInformes(JSON.parse(iData));
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || !file) {
      alert("Por favor selecciona paciente, tipo y adjunta un archivo.");
      return;
    }

    const nuevoInforme: Informe = {
      id: Date.now().toString(),
      paciente: selectedPaciente,
      tipo: selectedTipo,
      fecha: selectedFecha,
      archivoNombre: file.name,
      fechaSubida: new Date().toLocaleDateString()
    };

    const nuevosInformes = [nuevoInforme, ...informes];
    setInformes(nuevosInformes);
    localStorage.setItem("informesData", JSON.stringify(nuevosInformes));
    
    // Reset
    setSelectedPaciente("");
    setSelectedTipo("");
    setFile(null);
    alert("Informe subido exitosamente");
  };

  const informesFiltrados = informes.filter(i => {
    const matchPaciente = filtroPaciente ? i.paciente === filtroPaciente : true;
    const matchTipo = filtroTipo !== "Todos" ? i.tipo === filtroTipo : true;
    return matchPaciente && matchTipo;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-5 h-5 text-[#0e2f44]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
        <h2 className="text-[17px] font-bold text-[#1a5276]">Informes de Pacientes</h2>
      </div>

      {/* CARD 1: SUBIR INFORME */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-5 text-[15px]">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            Subir Informe
          </h3>

          <div className="space-y-6">
            {/* ROW: Paciente, Tipo, Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">PACIENTE</label>
                <select 
                  value={selectedPaciente} 
                  onChange={e => setSelectedPaciente(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.paciente}>{p.paciente}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">TIPO</label>
                <select 
                  value={selectedTipo} 
                  onChange={e => setSelectedTipo(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Nota de Evaluación">Nota de Evaluación</option>
                  <option value="Evaluación Inicial">Evaluación Inicial</option>
                  <option value="Informe Mensual">Informe Mensual</option>
                  <option value="Informe de Alta">Informe de Alta</option>
                  <option value="Plan de Tratamiento">Plan de Tratamiento</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">FECHA</label>
                <input 
                  type="date" 
                  value={selectedFecha}
                  onChange={e => setSelectedFecha(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700" 
                />
              </div>
            </div>

            {/* ROW: Dropzone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">ARCHIVO</label>
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                
                {file ? (
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-green-500 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <p className="text-[#1a5276] font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-[#1a5276] opacity-70 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1.5m1.5 0H15m-6 4h6m-6 4h6" /></svg>
                    <p className="text-[#1a5276] font-bold text-[15px]">Arrastra aquí o haz clic</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC, DOCX (máx. 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* BUTTON */}
            <div>
              <button onClick={handleSubirInforme} className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2.5 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Subir Informe
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* CARD 2: INFORMES REGISTRADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 text-[15px] mb-4">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Informes Registrados
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Paciente:</label>
              <select 
                value={filtroPaciente}
                onChange={e => setFiltroPaciente(e.target.value)}
                className="w-48 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white"
              >
                <option value="">Todos</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.paciente}>{p.paciente}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Tipo:</label>
              <select 
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
                className="w-40 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white"
              >
                <option value="Todos">Todos</option>
                <option value="Nota de Evaluación">Nota de Evaluación</option>
                <option value="Evaluación Inicial">Evaluación Inicial</option>
                <option value="Informe Mensual">Informe Mensual</option>
                <option value="Informe de Alta">Informe de Alta</option>
                <option value="Plan de Tratamiento">Plan de Tratamiento</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-10 flex items-center justify-center min-h-[300px]">
          {informesFiltrados.length === 0 ? (
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-[#0e2f44] mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <p className="text-[#0e2f44] font-bold text-sm">Sin informes</p>
            </div>
          ) : (
            <div className="w-full h-full align-top">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0e2f44] text-white">
                  <tr>
                    <th className="px-4 py-3">FECHA</th>
                    <th className="px-4 py-3">PACIENTE</th>
                    <th className="px-4 py-3">TIPO</th>
                    <th className="px-4 py-3">ARCHIVO</th>
                    <th className="px-4 py-3 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {informesFiltrados.map(inf => (
                    <tr key={inf.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{formatDateStr(inf.fecha)}</td>
                      <td className="px-4 py-3 font-bold text-[#1a5276]">{inf.paciente}</td>
                      <td className="px-4 py-3 text-slate-500">{inf.tipo}</td>
                      <td className="px-4 py-3 text-[#2980b9] font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {inf.archivoNombre}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-slate-400 hover:text-[#1a5276]">
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

