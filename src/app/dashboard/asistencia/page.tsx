"use client";
import { useState, useEffect } from "react";

type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
};

type Asistencia = {
  id: string;
  fecha: string;
  area: string;
  paciente: string;
  sexo: string;
  edad: string;
  tipoSesion: string;
  estado: string;
  sesiones: string;
  pago: string;
  fact: string;
  subtotal: string;
  total: string;
  obs: string;
};

export default function AsistenciaPage() {
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  
  // Filtros de tabla
  const hoy = new Date().toISOString().split("T")[0];
  const [filtroDesde, setFiltroDesde] = useState(hoy);
  const [filtroHasta, setFiltroHasta] = useState(hoy);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  // Formulario
  const [formData, setFormData] = useState({
    fecha: hoy,
    area: "",
    tipoSesion: "",
    pacienteId: "",
    pacienteNombre: "",
    pacienteNac: "",
    pacienteSexo: "",
    pacienteEdad: "",
    precioTerapia: "",
    tipoPaquete: "Básico",
    numeroSesiones: "",
    costoTotal: "",
    costoSesion: "Automático",
    saldoDisponible: "",
    estadoAsistencia: "",
    metodoPago: "",
    montoPago: "",
    solicitaFactura: false,
    observaciones: ""
  });

  useEffect(() => {
    // Cargar pacientes
    const pData = localStorage.getItem("pacientesData");
    if (pData) setPacientes(JSON.parse(pData));

    // Cargar asistencias
    const aData = localStorage.getItem("asistenciaData");
    if (aData) setAsistencias(JSON.parse(aData));
  }, []);

  const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const p = pacientes.find(x => x.paciente === val);
    if (p) {
      setFormData({
        ...formData,
        pacienteId: p.id,
        pacienteNombre: p.paciente,
        pacienteNac: p.nac !== "�" ? p.nac : "",
        pacienteSexo: p.sexo,
        pacienteEdad: p.edad
      });
    } else {
      setFormData({
        ...formData,
        pacienteId: "",
        pacienteNombre: val,
        pacienteNac: "",
        pacienteSexo: "",
        pacienteEdad: ""
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLimpiarForm = () => {
    setFormData({
      fecha: hoy,
      area: "",
      tipoSesion: "",
      pacienteId: "",
      pacienteNombre: "",
      pacienteNac: "",
      pacienteSexo: "",
      pacienteEdad: "",
      precioTerapia: "",
      tipoPaquete: "Básico",
      numeroSesiones: "",
      costoTotal: "",
      costoSesion: "Automático",
      saldoDisponible: "",
      estadoAsistencia: "",
      metodoPago: "",
      montoPago: "",
      solicitaFactura: false,
      observaciones: ""
    });
  };

  const handleGuardar = () => {
    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia) {
      alert("Por favor completa los campos principales (Paciente, Área, Estado).");
      return;
    }

    const sub = formData.costoTotal ? parseFloat(formData.costoTotal) : 0;
    const tot = formData.solicitaFactura ? sub * 1.16 : sub; // Simulando IVA

    const nuevaAsistencia: Asistencia = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      area: formData.area,
      paciente: formData.pacienteNombre,
      sexo: formData.pacienteSexo,
      edad: formData.pacienteEdad,
      tipoSesion: formData.tipoSesion,
      estado: formData.estadoAsistencia,
      sesiones: formData.numeroSesiones || "1",
      pago: formData.metodoPago,
      fact: formData.solicitaFactura ? "Sí" : "No",
      subtotal: `$${sub.toFixed(2)}`,
      total: `$${tot.toFixed(2)}`,
      obs: formData.observaciones || "—"
    };

    const nuevas = [nuevaAsistencia, ...asistencias];
    setAsistencias(nuevas);
    localStorage.setItem("asistenciaData", JSON.stringify(nuevas));
    alert("Sesión guardada exitosamente");
    handleLimpiarForm();
  };

  // --- Lógica de Edición ---
  const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const openEditModal = (a: Asistencia) => {
    setEditingAsistencia(a);
    setEditForm({
      fecha: a.fecha,
      area: a.area,
      tipoSesion: a.tipoSesion,
      estado: a.estado,
      sesiones: a.sesiones,
      pago: a.pago,
      fact: a.fact === "Sí",
      subtotal: a.subtotal.replace('$', ''),
      obs: a.obs
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setEditForm({ ...editForm, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const saveEdit = () => {
    if (!editingAsistencia) return;
    
    const sub = editForm.subtotal ? parseFloat(editForm.subtotal) : 0;
    const tot = editForm.fact ? sub * 1.16 : sub;

    const nuevasAsistencias = asistencias.map(a => {
      if (a.id === editingAsistencia.id) {
        return {
          ...a,
          fecha: editForm.fecha,
          area: editForm.area,
          tipoSesion: editForm.tipoSesion,
          estado: editForm.estado,
          sesiones: editForm.sesiones,
          pago: editForm.pago,
          fact: editForm.fact ? "Sí" : "No",
          subtotal: `$${sub.toFixed(2)}`,
          total: `$${tot.toFixed(2)}`,
          obs: editForm.obs || "—"
        };
      }
      return a;
    });

    setAsistencias(nuevasAsistencias);
    localStorage.setItem("asistenciaData", JSON.stringify(nuevasAsistencias));
    alert("Registro actualizado.");
    setEditingAsistencia(null);
  };

  const asistenciasFiltradas = asistencias.filter(a => {
    if (filtroEstado !== "Todos" && a.estado !== filtroEstado) return false;
    // Asumiendo que la fecha se guarda en formato YYYY-MM-DD que es el del input date
    if (filtroDesde && a.fecha < filtroDesde) return false;
    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-5 h-5 text-[#0e2f44]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h2 className="text-[17px] font-bold text-[#1a5276]">Asistencia</h2>
      </div>

      {/* CARD 1: NUEVA SESIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4 text-[15px]">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Nueva sesión
          </h3>

          <div className="bg-[#eef5fa] text-[#2980b9] p-3 rounded-md text-xs flex items-center gap-2 mb-6 border border-[#d1e6f5]">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            Selecciona tu área y el precio fijo de la terapia. Indica cuántas sesiones necesita el paciente y cuántas fueron pagadas.
          </div>

          <div className="space-y-5">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FECHA</label>
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ÁREA</label>
                <select name="area" value={formData.area} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar especialidad...</option>
                  <option value="Psicología">Psicología</option>
                  <option value="Lenguaje">Lenguaje</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TIPO DE SESIÓN</label>
                <select name="tipoSesion" value={formData.tipoSesion} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar...</option>
                  <option value="Individual">Individual</option>
                  <option value="Escuela">Escuela</option>
                  <option value="Reposicion">Reposición</option>
                  <option value="Terapia Grupal">Terapia grupal</option>
                  <option value="Orientacion Padres">Orientación padres</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NOMBRE PACIENTE</label>
                <input 
                  type="text" 
                  name="pacienteNombre" 
                  list="pacientes-list"
                  value={formData.pacienteNombre} 
                  onChange={handlePacienteChange} 
                  placeholder="Escribir o seleccionar paciente..."
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" 
                />
                <datalist id="pacientes-list">
                  {pacientes.map(p => (
                    <option key={p.id} value={p.paciente} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FECHA DE NACIMIENTO</label>
                <input type="text" name="pacienteNac" value={formData.pacienteNac} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SEXO DEL PACIENTE</label>
                <select name="pacienteSexo" value={formData.pacienteSexo} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar...</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="—">—</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PRECIO DE TERAPIA</label>
                <select name="precioTerapia" value={formData.precioTerapia} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar precio...</option>
                  <option value="400">$400.00</option>
                  <option value="450">$450.00</option>
                  <option value="500">$500.00</option>
                  <option value="550">$550.00</option>
                  <option value="600">$600.00</option>
                  <option value="650">$650.00</option>
                  <option value="700">$700.00</option>
                  <option value="750">$750.00</option>
                  <option value="800">$800.00</option>
                  <option value="850">$850.00</option>
                  <option value="900">$900.00</option>
                  <option value="950">$950.00</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TIPO PAQUETE</label>
                <select name="tipoPaquete" value={formData.tipoPaquete} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="Básico">Básico</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NÚMERO DE SESIONES</label>
                <input type="number" name="numeroSesiones" value={formData.numeroSesiones} onChange={handleChange} placeholder="Ej: 10" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO TOTAL</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                  <input type="number" name="costoTotal" value={formData.costoTotal} onChange={handleChange} placeholder="Ej: 4000" className="w-full text-sm p-2 pl-6 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO POR SESIÓN</label>
                <input type="text" readOnly value={formData.costoSesion} className="w-full text-sm p-2 border border-slate-300 rounded bg-slate-50 outline-none text-slate-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SALDO DISPONIBLE</label>
                <input type="text" name="saldoDisponible" value={formData.saldoDisponible} onChange={handleChange} placeholder="Ej: 8" className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ESTADO ASISTENCIA</label>
                <select name="estadoAsistencia" value={formData.estadoAsistencia} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Seleccionar...</option>
                  <option value="Asistio">Asistió</option>
                  <option value="Cancelo anticipadamente">Canceló anticipadamente</option>
                  <option value="Cancelo sin anticipacion">Canceló sin anticipación</option>
                  <option value="Cancelo el centro">Canceló el centro</option>
                  <option value="Alta">Alta</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            {/* PAYMENT SECTION */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">MÉTODO DE PAGO (PAGOS MIXTOS DISPONIBLES)</label>
              <div className="flex items-center gap-2 max-w-2xl">
                <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} className="flex-1 text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                  <option value="">Método...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Por definir">Por definir</option>
                  <option value="Beca">Beca</option>
                </select>
                <div className="relative w-32">
                  <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                  <input type="number" name="montoPago" value={formData.montoPago} onChange={handleChange} placeholder="0" className="w-full text-sm p-2 pl-6 border border-slate-300 rounded bg-slate-50 outline-none text-slate-900" />
                </div>
                <button className="p-2 border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
              </div>
            </div>

            {/* TOTALS & ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 items-end">
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" name="solicitaFactura" checked={formData.solicitaFactura} onChange={handleChange} className="w-4 h-4 rounded border-slate-300" />
                <label className="text-sm font-medium text-[#1a5276]">¿Solicita factura?</label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUBTOTAL (SIN IVA)</label>
                <input type="text" readOnly value="Automático" className="w-full text-sm p-2 border border-slate-200 rounded bg-slate-50 outline-none text-slate-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TOTAL (CON IVA SI APLICA)</label>
                <input type="text" readOnly value="Automático" className="w-full text-sm p-2 border border-slate-200 rounded bg-slate-50 outline-none text-slate-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">OBSERVACIONES</label>
                <input type="text" name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Notas adicionales..." className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleGuardar} className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Guardar Sesión
              </button>
              <button onClick={handleLimpiarForm} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.36 2.72l1.92 1.92c.39.39.39 1.02 0 1.41L13.6 13.73l-3.3.47.47-3.3 7.68-7.68c.39-.39 1.02-.39 1.41 0zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: REGISTROS RECIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 text-[15px]">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Registros Recientes
          </h3>
          <button className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Exportar CSV
          </button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500">Desde:</label>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} className="text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500">Hasta:</label>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} className="text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500">Estado:</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-32 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white">
              <option value="Todos">Todos</option>
              <option value="Asistio">Asistió</option>
              <option value="Cancelo anticipadamente">Canceló anticipadamente</option>
              <option value="Cancelo sin anticipacion">Canceló sin anticipación</option>
              <option value="Cancelo el centro">Canceló el centro</option>
              <option value="Alta">Alta</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button className="bg-[#0e2f44] hover:bg-[#1a5276] text-white px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
              Filtrar
            </button>
            <button onClick={() => {setFiltroDesde(""); setFiltroHasta(""); setFiltroEstado("Todos");}} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              Limpiar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-[#0e2f44] text-white font-semibold">
              <tr>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FECHA</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">ÁREA</th>
                <th className="px-4 py-3 text-left border-b border-[#0e2f44]">PACIENTE</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SEXO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">EDAD</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">TIPO DE SESIÓN</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">ESTADO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SUBTOTAL</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">TOTAL</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">OBS</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asistenciasFiltradas.length > 0 ? asistenciasFiltradas.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                  <td className="px-2 py-3 text-slate-500">{a.area}</td>
                  <td className="px-4 py-3 text-left font-bold text-[#1a5276] max-w-[150px] truncate" title={a.paciente}>{a.paciente}</td>
                  <td className="px-2 py-3 text-slate-500">{a.sexo}</td>
                  <td className="px-2 py-3 text-slate-500">{a.edad}</td>
                  <td className="px-2 py-3 text-slate-500">{a.tipoSesion}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado === 'Cancelo anticipadamente' || a.estado === 'Cancelo sin anticipacion' ? 'bg-orange-100 text-orange-700' : a.estado === 'Cancelo el centro' ? 'bg-red-100 text-red-700' : a.estado === 'Alta' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.sesiones}</td>
                  <td className="px-2 py-3 text-slate-500">{a.pago}</td>
                  <td className="px-2 py-3 text-slate-500">{a.fact}</td>
                  <td className="px-2 py-3 font-medium text-slate-600">{a.subtotal}</td>
                  <td className="px-2 py-3 font-bold text-[#1a5276]">{a.total}</td>
                  <td className="px-2 py-3 text-slate-500 max-w-[100px] truncate" title={a.obs}>{a.obs}</td>
                  <td className="px-2 py-3">
                    <button onClick={() => openEditModal(a)} className="text-slate-400 hover:text-[#1a5276] mx-auto">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Sin registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingAsistencia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-[#1a5276] flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                Editar Registro de Asistencia
              </h3>
              <button onClick={() => setEditingAsistencia(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600 mb-2 border border-slate-100">
                <span className="font-bold text-[#1a5276]">Paciente:</span> {editingAsistencia.paciente} <br/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
                  <input type="date" name="fecha" value={editForm.fecha} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área</label>
                  <select name="area" value={editForm.area} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Psicología">Psicología</option>
                    <option value="Lenguaje">Lenguaje</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Sesión</label>
                  <select name="tipoSesion" value={editForm.tipoSesion} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Individual">Individual</option>
                    <option value="Escuela">Escuela</option>
                    <option value="Reposicion">Reposición</option>
                    <option value="Terapia Grupal">Terapia grupal</option>
                    <option value="Orientacion Padres">Orientación padres</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                  <select name="estado" value={editForm.estado} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Asistio">Asistió</option>
                    <option value="Cancelo anticipadamente">Canceló anticipadamente</option>
                    <option value="Cancelo sin anticipacion">Canceló sin anticipación</option>
                    <option value="Cancelo el centro">Canceló el centro</option>
                    <option value="Alta">Alta</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sesiones</label>
                  <input type="number" name="sesiones" value={editForm.sesiones} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtotal (Monto)</label>
                  <input type="number" name="subtotal" value={editForm.subtotal} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Método de Pago</label>
                  <select name="pago" value={editForm.pago} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Por definir">Por definir</option>
                    <option value="Beca">Beca</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" name="fact" checked={editForm.fact} onChange={handleEditChange} className="w-4 h-4 rounded border-slate-300" />
                  <label className="text-sm font-medium text-[#1a5276]">¿Solicitó factura?</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                  <input type="text" name="obs" value={editForm.obs} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={saveEdit} className="w-full bg-[#1a5276] hover:bg-[#0e2f44] text-white py-2 rounded font-semibold transition-colors">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

