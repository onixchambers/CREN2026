"use client";
import { useState, useEffect } from "react";
import { getTerapeutas, getTerapeutasFull, getTherapyPrices } from "@/app/actions/configuracion";
import { getPatients, updatePatientFast } from "@/app/actions/pacientes";
import { getAgenda, addCita, updateCita, deleteCita } from "@/app/actions/agenda";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";
import { AsistenciaForm } from "@/components/AsistenciaForm";
import { saveAsistenciaDB } from "@/app/actions/asistencia";
import { EditPatientModal } from "@/components/EditPatientModal";
import { polyfill } from "mobile-drag-drop";
// Importar los estilos por defecto opcional para feedback visual (opcional)
import "mobile-drag-drop/default.css";

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
  
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [terapeutasFullData, setTerapeutasFullData] = useState<any[]>([]);
  const [therapyPrices, setTherapyPrices] = useState<number[]>([400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950]);
  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
  const [pacientes, setPacientes] = useState<{id: string, name: string, medicoTratante?: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verTodosLosPacientes, setVerTodosLosPacientes] = useState(false);
  const [isLoadingTerapeutas, setIsLoadingTerapeutas] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmMoveModalOpen, setIsConfirmMoveModalOpen] = useState(false);
  const [pendingMoveCita, setPendingMoveCita] = useState<{citaId: string, newHora: string, newTerapeuta: string, newFecha?: string, newFormData?: any} | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedCitaForStatus, setSelectedCitaForStatus] = useState<any>(null);
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
    // Iniciar polyfill para drag and drop en móviles
    polyfill({
      dragImageTranslateOverride: "scrollBehavior",
    });

    // Requerido por mobile-drag-drop para funcionar en Safari/Chrome mobile
    const passiveFalse = { passive: false };
    const noop = () => {};
    window.addEventListener('touchmove', noop, passiveFalse);

    if (status === "loading") return;
    async function loadData() {
      const { getAllowTherapistEdit } = await import('@/app/actions/configuracion');
      const allowRes = await getAllowTherapistEdit();
      
      const pricesRes = await getTherapyPrices();
      if (pricesRes.success && pricesRes.prices) {
        setTherapyPrices(pricesRes.prices);
      }
      
      const tRes = await getTerapeutasFull();
      if (tRes.success && tRes.data) {
        setTerapeutasFullData(tRes.data);
      }
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

    return () => {
      window.removeEventListener('touchmove', noop, passiveFalse);
    };
  }, [status, userRole, userName, hoy]);

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
      if ((formData as any).id) {
        // Editing existing cita - trigger move confirmation modal to ask about future appointments
        const updated = citas.find((c: any) => c.id === (formData as any).id);
        if (updated) {
          setPendingMoveCita({
            citaId: updated.id,
            newHora: formData.hora,
            newTerapeuta: formData.terapeuta,
            newFecha: formData.fecha,
            newFormData: formData
          });
          setIsConfirmMoveModalOpen(true);
        }
        setIsModalOpen(false);
        setIsSubmittingCita(false);
        return;
      }

      const nuevaCitaObj = {
        paciente: formData.paciente,
        fecha: formData.fecha,
        hora: formData.hora,
        terapeuta: formData.terapeuta,
        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        numeroSesiones: formData.numeroSesiones || 1,
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

  const handleStatusChange = async (estado: string) => {
    if (!selectedCitaForStatus) return;
    const isAttendanceStatus = ["Asistió", "Canceló con Anticipación", "Canceló sin Anticipación", "Canceló el Centro"].includes(estado);
    
    try {
      const updatedData = { ...selectedCitaForStatus, estado };
      await updateCita(selectedCitaForStatus.id, updatedData);
      setCitas(citas.map(c => c.id === selectedCitaForStatus.id ? updatedData : c));
      
      if (isAttendanceStatus) {
         const nuevaAsistencia = {
            id: Date.now().toString(),
            agendaId: selectedCitaForStatus.id,
            fecha: selectedCitaForStatus.fecha,
            hora: selectedCitaForStatus.hora,
            area: "",
            paciente: selectedCitaForStatus.paciente,
            sexo: "",
            edad: "",
            tipoSesion: selectedCitaForStatus.tipoServicio,
            estado: estado,
            sesiones: selectedCitaForStatus.numeroSesiones?.toString() || "1",
            frecuencia: selectedCitaForStatus.frecuencia || "unica",
            pago: selectedCitaForStatus.pagado ? "SÍ" : "NO",
            fact: "No",
            subtotal: "$0.00",
            iva: "$0.00",
            total: "$0.00",
            precioTerapia: 400,
            montoPago: "0",
            metodoPago: selectedCitaForStatus.metodoPago || "Efectivo",
            obs: "Generado desde estado de cita",
            creadoPor: userName,
            terapeuta: selectedCitaForStatus.terapeuta
         };
         
         const dbRes = await saveAsistenciaDB(nuevaAsistencia);
         if (dbRes?.success === false) {
           alert("Error al guardar asistencia: " + dbRes.error);
         } else {
           alert(`Estado actualizado a '${estado}' y asistencia registrada.`);
         }
      } else {
         alert(`Estado actualizado a '${estado}'.`);
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al actualizar el estado.");
    } finally {
      setIsStatusModalOpen(false);
    }
  };
  
  const handleMoveCita = async (citaId: string, newHora: string, newTerapeuta: string, newFecha?: string) => {
    try {
      const payload: any = { hora: newHora, terapeuta: newTerapeuta };
      if (newFecha) payload.fecha = newFecha;
      
      // Update locally immediately for optimistic UI
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, ...payload } : c));
      
      // Update in DB
      await updateCita(citaId, payload);
    } catch (error) {
      console.error(error);
      alert("Error al mover la cita");
      getAgenda().then(r => { if (r.success && r.data) setCitas(r.data); }); // Revert on error
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

  
  const getDaysOfWeek = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const dNum = String(current.getDate()).padStart(2, '0');
      days.push({ name: dayNames[i], dateStr: `${year}-${month}-${dNum}`, dayNum: current.getDate() });
    }
    return days;
  };

  const getDaysOfMonth = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    for (let i = startDay - 1; i >= 0; i--) {
      const prev = new Date(year, month, -i);
      days.push({ dateStr: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`, num: prev.getDate(), currentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`, num: i, currentMonth: true });
    }
    let endDay = lastDay.getDay();
    if (endDay === 0) endDay = 7;
    let nextDays = 7 - endDay;
    for (let i = 1; i <= nextDays; i++) {
      const next = new Date(year, month + 1, i);
      days.push({ dateStr: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`, num: next.getDate(), currentMonth: false });
    }
    return days;
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

  const getCitaParaCelda = (hora: string, terapeuta: string, dateOverride?: string) => {
    const horaPrefix = hora.split(":")[0];
    return (dateOverride ? citas : citasFiltradas).find(c => c.terapeuta === terapeuta && c.hora.startsWith(horaPrefix) && (!dateOverride || c.fecha === dateOverride));
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

  const handleEditCitaModal = (cita: any) => {
    setSelectedCitaForStatus(cita);
    setIsStatusModalOpen(true);
  };

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

          
            {userRole.toUpperCase() === "TERAPEUTA" && (
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button type="button" onClick={() => setViewMode('day')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'day' ? 'bg-white shadow text-[#1a5276]' : 'text-slate-600'}`}>Día</button>
                <button type="button" onClick={() => setViewMode('week')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'week' ? 'bg-white shadow text-[#1a5276]' : 'text-slate-600'}`}>Semana</button>
                <button type="button" onClick={() => setViewMode('month')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'month' ? 'bg-white shadow text-[#1a5276]' : 'text-slate-600'}`}>Mes</button>
              </div>
            )}

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
        
                {viewMode === 'month' && userRole.toUpperCase() === "TERAPEUTA" ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
            <div className="grid grid-cols-7 bg-[#0e2f44] text-white">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="p-2 text-center text-xs font-bold uppercase border-r border-slate-700/50">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-slate-200">
              {getDaysOfMonth(fechaSeleccionada).map((d, i) => {
                const dayCitas = citas.filter(c => c.fecha === d.dateStr && c.terapeuta === userName);
                return (
                  <div 
                    key={i} 
                    className={`min-h-[120px] p-2 border-b border-r border-slate-200 ${!d.currentMonth ? 'bg-slate-50 opacity-60' : 'bg-white'} ${d.dateStr === hoy ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setFechaSeleccionada(d.dateStr);
                        setViewMode('day');
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${d.dateStr === hoy ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{d.num}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFechaSeleccionada(d.dateStr); handleOpenModal(userName, '09:00'); }} className="text-[#1a5276] hover:bg-blue-50 p-1 rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">+</button>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayCitas.sort((a,b) => a.hora.localeCompare(b.hora)).map(cita => {
                        const st = getEstadoStyle(cita.estado);
                        return (
                          <div 
                            key={cita.id} 
                            onClick={(e) => { e.stopPropagation(); handleEditCitaModal(cita); }}
                            style={st.style}
                            draggable={true}
                            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("citaId", cita.id); }}
                            className={`text-[9px] p-1 rounded font-bold cursor-pointer truncate shadow-sm hover:brightness-95 touch-none ${st.className}`}
                            title={`${cita.hora} - ${cita.paciente}`}
                          >
                            {cita.hora} - {cita.paciente === 'No Disponible' ? 'Bloq.' : cita.paciente.split(' ')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'week' && userRole.toUpperCase() === "TERAPEUTA" ? (
          <div className="overflow-x-auto mt-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-r border-slate-200 bg-[#0e2f44] text-white px-4 py-3 font-semibold uppercase text-xs w-24 sticky left-0 z-20">
                    HORA
                  </th>
                  {getDaysOfWeek(fechaSeleccionada).map(d => (
                    <th key={d.dateStr} className={`border-b border-r border-slate-200 px-2 py-3 font-semibold text-xs ${d.dateStr === hoy ? 'bg-blue-600 text-white' : 'bg-[#0e2f44] text-white'}`}>
                      <div className="uppercase">{d.name}</div>
                      <div className="text-lg">{d.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORAS.map(hora => (
                  <tr key={hora} className="hover:bg-slate-50 transition-colors">
                    <td className="border-b border-r border-slate-200 px-4 py-3 font-bold text-[#0e2f44] bg-slate-50 sticky left-0 z-20 shadow-[1px_0_2px_rgba(0,0,0,0.05)]">
                      {hora}
                    </td>
                    {getDaysOfWeek(fechaSeleccionada).map(d => {
                      const cita = getCitaParaCelda(hora, userName, d.dateStr);
                      return (
                        <td 
                          key={`${hora}-${d.dateStr}`} 
                          className="border-b border-r border-slate-200 p-0 h-16 w-32 relative align-top group" 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedData = e.dataTransfer.getData('citaId');
                            if (draggedData) {
                                setPendingMoveCita({
                                  citaId: draggedData,
                                  newHora: hora,
                                  newTerapeuta: userName,
                                  newFecha: d.dateStr
                                });
                                setIsConfirmMoveModalOpen(true);
                            }
                          }}
                        >
                          {cita ? (
                              (() => {
                                const st = getEstadoStyle(cita.estado);
                                return (
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); handleEditCitaModal(cita); }}
                                    style={st.style}
                                    draggable={true}
                                    onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("citaId", cita.id); }}
                                    className={`absolute left-0 w-full h-full p-1 rounded border text-[10px] font-semibold flex flex-col items-center justify-center cursor-pointer shadow-sm hover:brightness-95 touch-none transition-all ${cita.hora.includes(":30") ? "top-[50%] z-10" : "top-0"} ${st.className}`}>
                                    <span className="truncate w-full text-center mt-0.5 font-bold">
                                      {(cita.estado === "Ocupado" || cita.estado === "No Disponible" || cita.paciente === "No Disponible") ? "No Disp." : cita.paciente.split(' ')[0]}
                                    </span>
                                    <span className="opacity-90 uppercase mt-0.5 truncate w-full text-center">
                                      {(cita.estado === "Ocupado" || cita.estado === "No Disponible" || cita.paciente === "No Disponible") ? "Bloqueado" : (cita.estado || "Agendado")}
                                    </span>
                                  </div>
                                );
                              })()
                          ) : (
                            <div 
                               onClick={() => { setFechaSeleccionada(d.dateStr); handleOpenModal(userName, hora); }}
                              className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-blue-50/60 transition-colors group/cell"
                              title={`Agendar el ${d.name} a las ${hora}`}
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
        ) : (
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
                      <td 
                        key={`${hora}-${t}`} 
                        className="border border-slate-200 p-0 h-16 w-40 relative align-top group" 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const draggedData = e.dataTransfer.getData('citaId');
                          if (draggedData) {
                              setPendingMoveCita({
                                citaId: draggedData,
                                newHora: hora,
                                newTerapeuta: t,
                                newFecha: fechaSeleccionada
                              });
                              setIsConfirmMoveModalOpen(true);
                          }
                        }}
                      >
                        {cita ? (
                            (() => {
                              const st = getEstadoStyle(cita.estado);
                              return (
                                <div 
                                  onClick={(e) => { e.stopPropagation(); handleEditCitaModal(cita); }}
                                  style={st.style}
                                  draggable={true}
                                  onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("citaId", cita.id); }}
                                  className={`absolute left-0 w-full h-full p-2 rounded border text-xs font-semibold flex flex-col items-center justify-center cursor-pointer shadow-sm hover:brightness-95 touch-none transition-all ${cita.hora.includes(":30") ? "top-[50%] z-10" : "top-0"} ${st.className}`}>
                                  
                                  {userRole.toUpperCase() !== "TERAPEUTA" && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCita(cita.id); }} 
                                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold bg-white/70 hover:bg-white rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm cursor-pointer" 
                                    title="Eliminar Cita"
                                  >&times;</button>
                                  )}

                                  <span 
                                    className="truncate w-full text-center mt-1 font-bold"
                                  >
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
        )}
      </div>

      {/* MODAL PARA NUEVA CITA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg text-[#0e2f44]">{(formData as any).id ? 'Editar Cita' : 'Programar Cita'}</h3>
                {(formData as any).id && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedCita(citas.find((c: any) => c.id === (formData as any).id) || null);
                      setIsEditModalOpen(true);
                    }} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1 transition"
                  >
                    ✏️ Asistencia
                  </button>
                )}
              </div>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-8">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-6 text-slate-400 hover:text-slate-600 text-3xl font-bold z-10">&times;</button>
            <AsistenciaForm 
              initialData={{
                fecha: selectedCita.fecha,
                hora: selectedCita.hora,
                terapeuta: selectedCita.terapeuta,
                pacienteNombre: selectedCita.paciente,
                tipoSesion: selectedCita.tipoServicio,
                frecuencia: selectedCita.frecuencia,
                estadoAsistencia: selectedCita.estado,
                metodoPago: selectedCita.metodoPago || "",
                montoPago: selectedCita.pagado ? (therapyPrices[0]?.toString() || "400") : "" // approximate initial data
              }}
              pacientes={pacientes.map((p: any) => ({ ...p, paciente: p.name }))}
              terapeutasFullData={terapeutasFullData}
              agendaCitas={citas}
              availableAreasInput={availableAreas}
              therapyPrices={therapyPrices}
              userRole={userRole}
              userName={userName}
              isPrellenado={true}
              onCancel={() => setIsEditModalOpen(false)}
              onSave={async (formData, subVal, ivaVal, totVal, metodoPagoFinal, isDraft) => {
                // Actualizar cita en agenda (siempre)
                const citaActualizada = {
                    ...selectedCita,
                    paciente: formData.pacienteNombre,
                    fecha: formData.fecha,
                    hora: formData.hora,
                    terapeuta: formData.terapeuta,
                    tipoServicio: formData.tipoSesion,
                    frecuencia: formData.frecuencia,
                    estado: formData.estadoAsistencia,
                    pagado: totVal > 0,
                    metodoPago: metodoPagoFinal
                };
                
                await updateCita(selectedCita.id, citaActualizada);
                
                alert("Información precargada y guardada exitosamente.");
                
                setCitas(citas.map(c => c.id === selectedCita.id ? citaActualizada : c));
                setIsEditModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      
            {/* STATUS MODAL */}
      {isStatusModalOpen && selectedCitaForStatus && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl"
            >&times;</button>
            <h3 className="font-bold text-lg text-[#0e2f44] mb-4 text-center">Estado de Cita</h3>
            <p className="text-center font-semibold mb-6 text-black">{selectedCitaForStatus.paciente}</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => handleStatusChange("Asistió")} className="w-full py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
                Asistió
              </button>
              
              <button onClick={() => handleStatusChange("Canceló con Anticipación")} className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Canceló con Anticipación
              </button>

              <button onClick={() => handleStatusChange("Canceló sin Anticipación")} className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
                Canceló sin Anticipación
              </button>

              <button onClick={() => handleStatusChange("Canceló el Centro")} className="w-full py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors">
                Canceló el Centro
              </button>
              
              <button onClick={() => handleStatusChange("Ocupado")} className="w-full py-2 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors">
                Ocupado
              </button>
            </div>
            
            <hr className="my-6 border-slate-200" />
            
            <div className="flex flex-col gap-3">
              <button onClick={() => {
                setFormData(selectedCitaForStatus as any);
                setIsStatusModalOpen(false);
                setIsModalOpen(true);
              }} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-2">
                ✏️ Editar Hora
              </button>

              <button onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedCita(selectedCitaForStatus);
                setIsEditModalOpen(true);
              }} className="w-full py-2 border-2 border-[#1a5276] text-[#1a5276] font-bold rounded-lg hover:bg-[#1a5276] hover:text-white transition-colors">
                📋 Asistencia (Pre-llenado)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MOVE CITA MODAL */}
      {isConfirmMoveModalOpen && pendingMoveCita && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden text-center p-6">
            <h3 className="font-bold text-lg text-[#0e2f44] mb-4">Confirmar Movimiento</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Estás seguro que deseas mover esta cita a las <strong>{pendingMoveCita.newHora}</strong> del <strong>{pendingMoveCita.newFecha || fechaSeleccionada}</strong>?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                const updated = citas.find((c: any) => c.id === pendingMoveCita.citaId);
                if (updated) {
                  const newCita = pendingMoveCita.newFormData 
                    ? { ...updated, ...pendingMoveCita.newFormData, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta, fecha: pendingMoveCita.newFecha || updated.fecha }
                    : { ...updated, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta, fecha: pendingMoveCita.newFecha || updated.fecha };
                  await updateCita(updated.id, newCita);
                  setCitas(citas.map((c: any) => c.id === updated.id ? newCita : c));
                }
                setIsConfirmMoveModalOpen(false);
                setPendingMoveCita(null);
              }} className="w-full py-2 bg-[#1a5276] text-white font-semibold rounded-lg hover:bg-[#0e2f44] transition-colors">
                Mover solo esta cita
              </button>
              
              <button onClick={async () => {
                const updated = citas.find((c: any) => c.id === pendingMoveCita.citaId);
                if (updated) {
                  const updatedCitas = [...citas];
                  const futureCitas = citas.filter((c: any) => 
                    c.paciente === updated.paciente && 
                    c.terapeuta === updated.terapeuta && 
                    c.fecha >= updated.fecha 
                  );
                  
                  for (const fc of futureCitas) {
                    const newCita = pendingMoveCita.newFormData 
                      ? { ...fc, ...pendingMoveCita.newFormData, id: fc.id, fecha: fc.fecha, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta }
                      : { ...fc, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta };
                    await updateCita(fc.id, newCita);
                    const index = updatedCitas.findIndex((c: any) => c.id === fc.id);
                    if (index !== -1) updatedCitas[index] = newCita;
                  }
                  
                  const newMainCita = pendingMoveCita.newFormData 
                    ? { ...updated, ...pendingMoveCita.newFormData, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta, fecha: pendingMoveCita.newFecha || updated.fecha }
                    : { ...updated, hora: pendingMoveCita.newHora, terapeuta: pendingMoveCita.newTerapeuta, fecha: pendingMoveCita.newFecha || updated.fecha };
                  await updateCita(updated.id, newMainCita);
                  const mainIndex = updatedCitas.findIndex((c: any) => c.id === updated.id);
                  if (mainIndex !== -1) updatedCitas[mainIndex] = newMainCita;

                  setCitas(updatedCitas);
                }
                setIsConfirmMoveModalOpen(false);
                setPendingMoveCita(null);
              }} className="w-full py-2 bg-[#27ae60] text-white font-semibold rounded-lg hover:bg-[#219653] transition-colors">
                Mover esta y futuras (cambiar hora)
              </button>

              <button onClick={() => { setIsConfirmMoveModalOpen(false); setPendingMoveCita(null); }} className="w-full py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
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


