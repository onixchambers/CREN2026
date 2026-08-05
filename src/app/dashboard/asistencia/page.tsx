"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getPatients } from "@/app/actions/pacientes";
import { getAsistenciasDB } from "@/app/actions/asistencia";
import { getAgenda, addCita } from "@/app/actions/agenda";
import { saveAsistenciaDB } from "@/app/actions/asistencia";
import { deleteCita } from "@/app/actions/agenda";
import { getTerapeutasFull, getSystemIvaRate, getTherapyPrices, addTherapyPrice, removeTherapyPrice } from "@/app/actions/configuracion";
import { DateInput } from "@/components/DateInput";
import { AsistenciaForm, AsistenciaFormData } from "@/components/AsistenciaForm";


type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
  medicoTratante?: string;
  saldoCalculado?: string;
  precioTerapia?: string;
  estatus?: string;
};

type Asistencia = {
  id: string;
  fecha: string;
  area: string;
  paciente: string;
  pacienteId?: string;
  sexo: string;
  edad: string;
  tipoSesion: string;
  estado: string;
  sesiones: string;
  frecuencia?: string;
  horaRegistro?: string;
  pago: string;
  metodoPago?: string;
  fact: string;
  subtotal: string;
  total: string;
  saldo?: number;
  precioTerapia?: string;
  montoPago?: string;
  paqueteActual?: number;
  obs: string;
  creadoPor?: string;
  terapeuta?: string;
};

export default function AsistenciaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name || "Administrador";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);
  const [therapyPrices, setTherapyPrices] = useState<number[]>([400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950]);
  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState("");
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [prefacturaModalData, setPrefacturaModalData] = useState<Asistencia | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      const { getAllowTherapistEdit, getTherapyPrices } = await import('@/app/actions/configuracion');
      const [allowed, pricesRes] = await Promise.all([
        getAllowTherapistEdit(),
        getTherapyPrices()
      ]);
      setAllowTherapistEdit(allowed);
      if (pricesRes.success && pricesRes.prices) {
        setTherapyPrices(pricesRes.prices);
      }
    }
    loadInitialData();
  }, []);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleAddPrice = async () => {
    const val = parseFloat(newPriceInput);
    if (isNaN(val) || val <= 0) {
      alert("Por favor ingresa un precio válido mayor a 0.");
      return;
    }
    setIsAddingPrice(true);
    const res = await addTherapyPrice(val);
    if (res.success && res.prices) {
      setTherapyPrices(res.prices);
      setFormData(prev => ({ ...prev, precioTerapia: val.toString() }));
      setNewPriceInput("");
    } else {
      alert(res.error || "Error al agregar el precio.");
    }
    setIsAddingPrice(false);
  };

  const handleRemovePrice = async (price: number) => {
    if (!confirm(`¿Estás seguro de eliminar el precio de $${price.toFixed(2)} de la lista?`)) return;
    const res = await removeTherapyPrice(price);
    if (res.success && res.prices) {
      setTherapyPrices(res.prices);
    } else {
      alert(res.error || "Error al eliminar el precio.");
    }
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [agendaCitas, setAgendaCitas] = useState<any[]>([]);
  
  // Filtros de tabla
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  
  // By default, show records from the 1st of the current month
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  };
  
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia"]);
  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [terapeutasFullData, setTerapeutasFullData] = useState<any[]>([]);

  // Predictivo
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSegundoPago, setShowSegundoPago] = useState(false);
  const [verTodosLosPacientes, setVerTodosLosPacientes] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    fecha: hoy,
    hora: "09:00",
    terapeuta: "",
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
    metodoPago2: "",
    montoPago2: "",
    frecuencia: "Única",
    solicitaFactura: false,
    observaciones: ""
  });

  // Función reutilizable para recargar asistencias desde la BD
  const recargarAsistencias = async () => {
    const [agRes, ivaPct] = await Promise.all([
      getAsistenciasDB(Date.now().toString()),
      getSystemIvaRate()
    ]);
    const ivaDec = (ivaPct || 16) / 100;

    if (agRes.success && agRes.data) {
      const mapped = agRes.data.map((c: any) => {
        const isFact = c.fact === "Sí" || c.fact === true;
        const totVal = parseFloat((c.total || c.subtotal || "0").toString().replace(/[^0-9.-]+/g, "")) || 0;
        let subVal = totVal;
        let ivaVal = 0;

        if (isFact) {
          ivaVal = totVal * ivaDec;
          subVal = totVal - ivaVal;
        }

        return {
          id: c.id,
          fecha: c.fecha,
          area: c.area || "-",
          paciente: c.paciente,
          sexo: c.sexo || "-",
          edad: c.edad || "-",
          terapeuta: c.terapeuta,
          tipoSesion: c.tipoSesion || "-",
          estado: c.estado,
          sesiones: c.sesiones || "1",
          frecuencia: c.frecuencia || "Única",
          horaRegistro: c.horaRegistro || "-",
          paqueteActual: c.paqueteActual || 1,
          pago: c.pago || "-",
          metodoPago: c.metodoPago || "",
          fact: isFact ? "Sí" : "No",
          subtotal: `$${subVal.toFixed(2)}`,
          iva: `$${ivaVal.toFixed(2)}`,
          total: `$${totVal.toFixed(2)}`,
          saldo: c.saldo || 0,
          obs: c.obs || "-",
          creadoPor: c.creadoPor || "-"
        };
      });
      setAsistencias(mapped);
    }
  };

  useEffect(() => {
    async function loadData() {
      // Cargar pacientes de la BD real
      const res = await getPatients();
      if (res.success && res.data) {
        let validPatients = res.data;
        const mapped = validPatients.map((p: any) => ({
          id: p.id,
          paciente: p.name,
          sexo: p.sexo || "—",
          nac: p.fechaNacimiento || "—",
          edad: p.age ? p.age.toString() : "—",
          medicoTratante: p.medicoTratante,
          saldoCalculado: p.saldoCalculado || "0.00",
          precioTerapia: p.precioTerapia?.toString() || "",
          estatus: p.estatus || "Activo"
        }));
        setPacientes(mapped);
      }
      
      // Cargar terapeutas y áreas
      const tRes = await getTerapeutasFull();
      if (tRes.success && tRes.data) {
        setTerapeutasFullData(tRes.data);
        let allAreas: string[] = [];
        tRes.data.forEach((t: any) => {
          if (t.especialidad) {
            const parts = t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
            allAreas = allAreas.concat(parts);
          }
        });
        const areas = Array.from(new Set(allAreas));
        
        if (userRole.toUpperCase() === "TERAPEUTA") {
          const userId = (session?.user as any)?.id;
          let matched = userId ? tRes.data.find((t: any) => t.id === userId) : undefined;
          if (!matched) {
            matched = tRes.data.find((t: any) => t.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(t.name.toLowerCase()));
          }
          const miTerapeutaStr = matched ? matched.name : (userName || tRes.data[0]?.name);
          if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
            let misAreas = areas;
            if (matched && matched.especialidad) {
               misAreas = matched.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
            }
            setAvailableAreas(misAreas.length > 0 ? misAreas : (areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]));
            setTerapeutas([miTerapeutaStr]);
            setFormData(prev => ({...prev, terapeuta: miTerapeutaStr, area: misAreas[0] || ""}));
          } else {
            setAvailableAreas(areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
            if (miTerapeutaStr) {
               setFormData(prev => ({ ...prev, terapeuta: miTerapeutaStr }));
            }
            const names = tRes.data.map((t: any) => t.name);
            if (miTerapeutaStr && !names.includes(miTerapeutaStr)) {
               names.unshift(miTerapeutaStr);
            }
            setTerapeutas(names);
          }
        } else {
          setAvailableAreas(areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
          setTerapeutas(tRes.data.map((t: any) => t.name));
        }
      }
      
      // Cargar agenda para frecuencia por default
      const agendaRes = await getAgenda();
      if (agendaRes.success && agendaRes.data) {
        setAgendaCitas(agendaRes.data);
      }

      // Cargar asistencias reales de la BD
      await recargarAsistencias();
    }
    loadData();
  }, [userName, userRole]);

  const normalizeSexo = (rawSexo: string) => {
    if (!rawSexo || rawSexo === "—") return "—";
    const s = rawSexo.trim().toUpperCase();
    if (s.startsWith("M") || s === "MASCULINO") return "M";
    if (s.startsWith("F") || s === "FEMENINO") return "F";
    return rawSexo;
  };

  const handlePacienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const p = pacientes.find(x => x.paciente === val);
    
    if (p) {
      const patientAsistencias = asistencias.filter(a => a.pacienteId === p.id);
      let totalS = "1";
      if (patientAsistencias.length > 0) {
         const lastAsistencia = patientAsistencias[0]; 
         if (lastAsistencia.sesiones && lastAsistencia.sesiones.includes("/")) {
             totalS = lastAsistencia.sesiones.split("/")[1];
         } else {
             totalS = lastAsistencia.sesiones || "1";
         }
      }
      
      const prevAsistencias = patientAsistencias.filter(a => a.estado === "Asistio").length;
      const currentS = prevAsistencias + 1;
      
      let displaySesiones = "";
      if (parseInt(totalS) > 1) {
          displaySesiones = `${currentS}/${totalS}`;
      } else {
          displaySesiones = currentS.toString();
      }

      const citaHoy = agendaCitas.find((c: any) => c.paciente === p.paciente && c.fecha === formData.fecha);
      let horaAgenda = formData.hora;
      let terapeutaAgenda = p.medicoTratante || formData.terapeuta;
      let tipoSesionAgenda = formData.tipoSesion;

      if (citaHoy) {
         horaAgenda = citaHoy.hora || horaAgenda;
         terapeutaAgenda = citaHoy.terapeuta || terapeutaAgenda;
         tipoSesionAgenda = citaHoy.tipoServicio || tipoSesionAgenda;
      }

      setFormData({
        ...formData,
        pacienteId: p.id,
        pacienteNombre: p.paciente,
        pacienteNac: p.nac !== "—" ? p.nac : "",
        pacienteSexo: normalizeSexo(p.sexo),
        pacienteEdad: p.edad,
        terapeuta: terapeutaAgenda,
        hora: horaAgenda,
        tipoSesion: tipoSesionAgenda,
        saldoDisponible: p.saldoCalculado || "0.00",
        precioTerapia: p.precioTerapia || formData.precioTerapia,
        numeroSesiones: displaySesiones,
        frecuencia: agendaCitas.find((c: any) => c.paciente === p.paciente) ? (() => {
          const f = (agendaCitas.find((c: any) => c.paciente === p.paciente).frecuencia || "").toLowerCase();
          return f === "diario" || f === "diaria" ? "Diaria" : f === "semanal" ? "Semanal" : f === "quincenal" ? "Quincenal" : f === "mensual" ? "Mensual" : formData.frecuencia;
        })() : formData.frecuencia
      });
    } else {
      setFormData({
        ...formData,
        pacienteId: "",
        pacienteNombre: val,
        pacienteNac: "",
        pacienteSexo: "",
        pacienteEdad: "",
        saldoDisponible: "0.00"
      });
    }
  };

  useEffect(() => {
    if (userRole.toUpperCase() !== "TERAPEUTA" && formData.terapeuta && terapeutasFullData.length > 0) {
      const match = terapeutasFullData.find(t => t.name === formData.terapeuta);
      if (match && match.especialidad) {
        const parts = match.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
        setAvailableAreas(parts);
        if (!parts.includes(formData.area)) {
          setFormData(prev => ({ ...prev, area: parts[0] || "" }));
        }
      } else {
        let allAreas: string[] = [];
        terapeutasFullData.forEach(t => {
          if (t.especialidad) {
            allAreas = allAreas.concat(t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean));
          }
        });
        setAvailableAreas(Array.from(new Set(allAreas)));
      }
    }
  }, [formData.terapeuta, terapeutasFullData, userRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLimpiarForm = () => {
    setFormData(prev => ({
      ...prev,
      fecha: hoy,
      terapeuta: (userRole.toUpperCase() === "TERAPEUTA") ? userName : (prev.terapeuta || ""),
      area: (availableAreas.length === 1 && userRole.toUpperCase() === "TERAPEUTA") ? availableAreas[0] : "",
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
      costoSesion: "",
      saldoDisponible: "",
      estadoAsistencia: "",
      metodoPago: "",
      montoPago: "",
      metodoPago2: "",
      montoPago2: "",
      frecuencia: "Única",
      solicitaFactura: false,
      observaciones: ""
    }));
    setShowSegundoPago(false);
    setShowDropdown(false);
  };

  const handleGuardar = async () => {
    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia || !formData.tipoSesion || !formData.terapeuta) {
      alert("Por favor completa los campos principales (Paciente, Terapeuta, Área, Tipo de Sesión, Estado).");
      return;
    }

    const p1 = parseFloat(formData.montoPago || "0");
    const p2 = showSegundoPago ? parseFloat(formData.montoPago2 || "0") : 0;
    const montoPagado = p1 + p2;
    const precioTerapia = parseFloat(formData.precioTerapia || "0");
    const totVal = montoPagado > 0 ? montoPagado : precioTerapia;

    const ivaPct = await getSystemIvaRate();
    const ivaDec = (ivaPct || 16) / 100;

    let subVal = totVal;
    let ivaVal = 0;

    if (formData.solicitaFactura) {
      ivaVal = totVal * ivaDec;
      subVal = totVal - ivaVal;
    }

    let metodoPagoFinal = formData.metodoPago;
    if (showSegundoPago && formData.metodoPago2) {
      metodoPagoFinal = `${formData.metodoPago || 'P1'} $${p1}\n${formData.metodoPago2} $${p2}`;
    } else if (showSegundoPago) {
      metodoPagoFinal = `${formData.metodoPago || 'Efectivo'} $${p1}`;
    } else if (p1 > 0 && formData.metodoPago) {
      metodoPagoFinal = `${formData.metodoPago} $${p1}`;
    }

    const nuevaAsistencia: Asistencia = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      hora: formData.hora,
      area: formData.area,
      paciente: formData.pacienteNombre,
      sexo: formData.pacienteSexo,
      edad: formData.pacienteEdad,
      tipoSesion: formData.tipoSesion,
      estado: formData.estadoAsistencia,
      sesiones: formData.numeroSesiones || "1",
      frecuencia: formData.frecuencia || "Única",
      pago: totVal > 0 ? "SÍ" : (metodoPagoFinal || "No"),
      fact: formData.solicitaFactura ? "Sí" : "No",
      subtotal: `$${subVal.toFixed(2)}`,
      iva: `$${ivaVal.toFixed(2)}`,
      total: `$${totVal.toFixed(2)}`,
      precioTerapia: formData.precioTerapia,
      montoPago: totVal.toString(),
      metodoPago: metodoPagoFinal,
      obs: formData.observaciones || "—",
      creadoPor: userName,
      terapeuta: formData.terapeuta
    };

    // Guardar en Base de Datos Real
    const dbRes = await saveAsistenciaDB(nuevaAsistencia);
    if (dbRes?.success === false) {
      alert("Error al guardar en BD: " + (dbRes as any).error);
      return;
    }
    
    // También guardar en Agenda
    try {
      await addCita({
        paciente: formData.paciente,
        fecha: formData.fecha,
        hora: formData.hora,
        terapeuta: formData.terapeuta,
        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        estado: "Asistio",
        pagado: formData.pagado,
        metodoPago: formData.metodoPago,
        numeroSesiones: 1
      });
    } catch (e) {
      console.error("Error agendando cita al guardar asistencia", e);
    }

    alert("Sesión guardada exitosamente en la base de datos");
    handleLimpiarForm();
    await recargarAsistencias();
    
    // Redirigir a Pacientes y abrir la Nota Clínica Nueva
    if (formData.pacienteId) {
      router.push(`/dashboard/pacientes?action=nota&patientId=${formData.pacienteId}`);
    }
  };

  // --- Lógica de Edición ---
  const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const openEditModal = (a: Asistencia) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para editar registros de asistencia.");
      return;
    }
    setEditingAsistencia(a);
    // Extraer el método de pago base (sin montos) de valores compuestos como "Tarjeta $500"
    let baseMetodo = a.metodoPago || "Efectivo";
    let baseMonto = "";
    const validMethods = ["Efectivo", "Transferencia", "Tarjeta", "Mixto", "Por definir", "Beca"];
    const foundMethod = validMethods.find(m => baseMetodo.startsWith(m));
    if (foundMethod) {
      baseMetodo = foundMethod;
      // Extraer monto si existe (e.g. "Tarjeta $500" → "500")
      const montoMatch = (a.metodoPago || "").match(/\$([\d.]+)/);
      if (montoMatch) baseMonto = montoMatch[1];
    }
    setEditForm({
      fecha: a.fecha,
      area: a.area,
      tipoSesion: a.tipoSesion,
      estado: a.estado,
      sesiones: a.sesiones,
      pago: a.pago,
      metodoPago: baseMetodo,
      montoPago: baseMonto || (a.total || a.subtotal || "").replace(/[^0-9.]/g, ""),
      fact: a.fact === "Sí",
      subtotal: (a.total || a.subtotal).replace('$', ''),
      obs: a.obs,
      terapeuta: a.terapeuta || ""
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setEditForm((prev: any) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setEditForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    if (!editingAsistencia) return;
    
    const totVal = editForm.subtotal ? parseFloat(editForm.subtotal) : 0;
    const ivaPct = await getSystemIvaRate();
    const ivaDec = (ivaPct || 16) / 100;
    let subVal = totVal;
    let ivaVal = 0;
    let finalTotal = totVal;

    if (editForm.fact) {
      ivaVal = subVal * ivaDec;
      finalTotal = subVal + ivaVal;
    }

    let asisActualizada: any = null;
    const nuevasAsistencias = asistencias.map(a => {
      if (a.id === editingAsistencia.id) {
        // Construir metodoPago final con monto, igual que en handleGuardar
        const editMonto = parseFloat(editForm.montoPago || "0");
        let editMetodoPagoFinal = editForm.metodoPago || "Efectivo";
        if (editMonto > 0 && editForm.metodoPago) {
          editMetodoPagoFinal = `${editForm.metodoPago} $${editMonto}`;
        }
        asisActualizada = {
          ...a,
          fecha: editForm.fecha,
          area: editForm.area,
          tipoSesion: editForm.tipoSesion,
          estado: editForm.estado,
          sesiones: editForm.sesiones,
          pago: editMonto > 0 ? "SÍ" : editForm.pago,
          metodoPago: editMetodoPagoFinal,
          fact: editForm.fact ? "Sí" : "No",
          subtotal: `$${subVal.toFixed(2)}`,
          iva: `$${ivaVal.toFixed(2)}`,
          total: `$${finalTotal.toFixed(2)}`,
          obs: editForm.obs || "—",
          creadoPor: a.creadoPor || userName,
          terapeuta: editForm.terapeuta || a.terapeuta
        };
        return asisActualizada;
      }
      return a;
    });

    if (asisActualizada) {
       const dbRes = await saveAsistenciaDB(asisActualizada);
       if (dbRes?.success === false) {
         alert("Error al actualizar BD: " + (dbRes as any).error);
         return;
       }
    }

    await recargarAsistencias();
    alert("Registro actualizado en la base de datos.");
    setEditingAsistencia(null);
  };

  const handleDeleteAsistencia = async (id: string) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para eliminar registros de asistencia.");
      return;
    }
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de asistencia?")) {
      const res = await deleteCita(id);
      if (res.success) {
        const nuevas = asistencias.filter(a => a.id !== id);
        setAsistencias(nuevas);
        alert("Registro eliminado de la base de datos.");
      } else {
        alert("No se pudo eliminar el registro: " + (res as any).error);
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const asistenciasFiltradas = asistencias.filter(a => {
    // Ocultar si el paciente tiene estatus 'Inactivo' en la pestaña de Pacientes
    const matchPatient = pacientes.find(p => 
      (a.pacienteId && p.id === a.pacienteId) || 
      (p.paciente && p.paciente.trim().toLowerCase() === (a.paciente || "").trim().toLowerCase())
    );
    if (matchPatient && (matchPatient.estatus || "Activo").trim().toLowerCase() === "inactivo") {
      return false;
    }

    if (userRole.toUpperCase() === "TERAPEUTA") {
      const teraLower = (a.terapeuta || "").trim().toLowerCase();
      const userLower = userName.trim().toLowerCase();
      const creadoLower = (a.creadoPor || "").trim().toLowerCase();
      
      const isForMe = teraLower.includes(userLower) || userLower.includes(teraLower);
      const isByMe = creadoLower.includes(userLower) || userLower.includes(creadoLower);
      const isMyPatient = pacientes.some(p => 
        p.paciente.trim().toLowerCase() === (a.paciente || "").trim().toLowerCase() && 
        p.medicoTratante && (p.medicoTratante.trim().toLowerCase().includes(userLower) || userLower.includes(p.medicoTratante.trim().toLowerCase()))
      );

      if (!isForMe && !isByMe && !isMyPatient) return false;
    }
    if (filtroEstado !== "Todos" && a.estado !== filtroEstado) return false;
    if (filtroDesde && a.fecha < filtroDesde) return false;
    if (filtroHasta && a.fecha > filtroHasta) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-5 h-5 text-[#0e2f44]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h2 className="text-[17px] font-bold text-[#1a5276]">Asistencia</h2>
      </div>

      {/* CARD 1: NUEVA SESIÓN */}
      <AsistenciaForm 
        pacientes={pacientes}
        terapeutasFullData={terapeutasFullData}
        agendaCitas={agendaCitas}
        availableAreasInput={availableAreas}
        therapyPrices={therapyPrices}
        userRole={userRole}
        userName={userName}
        onAddPrice={() => setShowAddPriceModal(true)}
        onClear={handleLimpiarForm}
        onSave={async (formData, subVal, ivaVal, totVal, metodoPagoFinal) => {
          const nuevaAsistencia = {
            id: Date.now().toString(),
            fecha: formData.fecha,
            hora: formData.hora,
            area: formData.area,
            paciente: formData.pacienteNombre,
            sexo: formData.pacienteSexo,
            edad: formData.pacienteEdad,
            tipoSesion: formData.tipoSesion,
            estado: formData.estadoAsistencia,
            sesiones: formData.numeroSesiones || "1",
            frecuencia: formData.frecuencia || "Única",
            pago: totVal > 0 ? "SÍ" : (metodoPagoFinal || "No"),
            fact: formData.solicitaFactura ? "Sí" : "No",
            subtotal: `$${subVal.toFixed(2)}`,
            iva: `$${ivaVal.toFixed(2)}`,
            total: `$${totVal.toFixed(2)}`,
            precioTerapia: formData.precioTerapia,
            montoPago: totVal.toString(),
            metodoPago: metodoPagoFinal,
            obs: formData.observaciones || "—",
            creadoPor: userName,
            terapeuta: formData.terapeuta
          };

          const dbRes = await saveAsistenciaDB(nuevaAsistencia);
          if (dbRes?.success === false) {
            alert("Error al guardar en BD: " + (dbRes as any).error);
            return;
          }
          
          try {
            await addCita({
              paciente: formData.pacienteNombre,
              fecha: formData.fecha,
              hora: formData.hora,
              terapeuta: formData.terapeuta,
              tipoServicio: formData.tipoSesion,
              frecuencia: formData.frecuencia,
              estado: "Asistio",
              pagado: totVal > 0 ? "SÍ" : "No",
              metodoPago: metodoPagoFinal,
              numeroSesiones: 1
            });
          } catch (e) {
            console.error("Error agendando cita al guardar asistencia", e);
          }

          alert("Sesión guardada exitosamente en la base de datos");
          
          window.location.href = formData.pacienteId ? `/dashboard/pacientes?action=nota&patientId=${formData.pacienteId}` : `/dashboard/asistencia`;
        }}
      />
      
      {/* CARD 2: REGISTROS RECIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 text-[15px]">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Registros Recientes
          </h3>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Desde:</label>
              <DateInput value={filtroDesde} onChange={e => setFiltroDesde(typeof e === "string" ? e : e.target.value)} className="text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Hasta:</label>
              <DateInput value={filtroHasta} onChange={e => setFiltroHasta(typeof e === "string" ? e : e.target.value)} className="text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Estado:</label>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-32 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium">
                <option value="Todos">Todos</option>
                <option value="Asistio">Asistió</option>
                <option value="Cancelo anticipadamente">Canceló anticipadamente</option>
                <option value="Cancelo sin anticipacion">Canceló sin anticipación</option>
                <option value="Cancelo el centro">Canceló el centro</option>
                <option value="Agendado">Agendado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setFiltroDesde(""); setFiltroHasta(""); setFiltroEstado("Todos"); }} className="bg-[#1a5276] text-white hover:bg-[#0e2f44] px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer" title="Ver registros pasados, presentes y futuros">
              Ver Todos (Permanente)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-[#0e2f44] text-white text-[9px] font-extrabold uppercase leading-tight tracking-wider">
              <tr>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">FECHA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">HORA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">TERAPEUTA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ÁREA</th>
                <th className="px-3 py-2.5 text-left border-b border-[#0e2f44]">PACIENTE</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">SEXO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">EDAD</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">TIPO DE<br/>SESIÓN</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ESTADO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">FRECUENCIA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">MÉTODO DE<br/>PAGO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">SALDO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">SUBTOTAL</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">IVA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">TOTAL</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">OBS</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const asistenciasOrdenadas = [...asistenciasFiltradas].sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    const [hA, mA] = (a.hora || "00:00").split(":").map(Number);
    const [hB, mB] = (b.hora || "00:00").split(":").map(Number);
    const minsA = (hA || 0) * 60 + (mA || 0);
    const minsB = (hB || 0) * 60 + (mB || 0);
    return minsA - minsB;
  });
  const currentItems = asistenciasOrdenadas.slice(indexOfFirstItem, indexOfLastItem);
                return currentItems.length > 0 ? currentItems.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-3 text-slate-500 font-medium">{formatDateStr(a.fecha)}</td>
                  <td className="px-2 py-3 text-slate-500 font-medium">{a.horaRegistro || "-"}</td>
                  <td className="px-2 py-3 text-slate-500 max-w-[100px] truncate" title={a.terapeuta}>{a.terapeuta}</td>
                  <td className="px-2 py-3 text-slate-500">{a.area}</td>
                  <td className="px-4 py-3 text-left font-bold text-[#1a5276] max-w-[150px] truncate" title={a.paciente}>{a.paciente}</td>
                  <td className="px-2 py-3 text-slate-500">{a.sexo}</td>
                  <td className="px-2 py-3 text-slate-500">{a.edad}</td>
                  <td className="px-2 py-3 text-slate-500">{a.tipoSesion}</td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado === 'Cancelo anticipadamente' || a.estado === 'Cancelo sin anticipacion' ? 'bg-orange-100 text-orange-700' : a.estado === 'Cancelo el centro' ? 'bg-red-100 text-red-700' : a.estado === 'Alta' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.estado === 'Cancelo anticipadamente' ? 'Canceló C/A' : a.estado === 'Cancelo sin anticipacion' ? 'Canceló S/A' : a.estado === 'Cancelo el centro' ? 'Canceló C' : a.estado === 'Asistio' ? 'Asistió' : a.estado}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.frecuencia || "Única"}</td>
                  <td className="px-2 py-3">
                    {(() => {
                      const val = a.metodoPago || "Efectivo";
                      let lines: string[] = [];
                      if (val.includes("Mixto (")) {
                        const content = val.replace(/^Mixto\s*\(/i, "").replace(/\)$/, "");
                        lines = content.split(",").map(p => p.trim().replace(":", ""));
                      } else if (val.includes("\n")) {
                        lines = val.split("\n").map(p => p.trim());
                      } else if (val.includes(" / ")) {
                        lines = val.split(" / ").map(p => p.trim());
                      } else if (val.includes(" + ")) {
                        lines = val.split(" + ").map(p => p.trim());
                      } else {
                        lines = [val];
                      }
                      return (
                        <div className="w-full max-w-[130px] mx-auto flex flex-col items-stretch justify-center gap-0.5 my-0.5">
                          {lines.map((line, idx) => {
                            const isPorDefinir = line.toLowerCase().includes("por definir");
                            return (
                              <span key={idx} className={`w-full border px-1.5 py-0.5 rounded text-[9.5px] font-bold block text-center whitespace-nowrap leading-tight shadow-xs ${isPorDefinir ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                                {line}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-2 py-3 text-slate-500">{a.pago || "SÍ"}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{a.fact || "SÍ"}</span>
                      <button
                        type="button"
                        onClick={() => setPrefacturaModalData(a)}
                        className="bg-[#27ae60] hover:bg-[#219653] text-white font-black px-2 py-0.5 rounded text-[10px] shadow-2xs transition-colors cursor-pointer flex items-center gap-0.5 uppercase"
                        title="Generar Prefactura en formato PDF CREN"
                      >
                        <span>📄 PDF</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    {(() => {
                      const sVal = typeof a.saldo === "number" ? a.saldo : parseFloat(a.saldo || "0");
                      if (isNaN(sVal) || Math.abs(sVal) < 0.01) {
                        return <span className="text-slate-800 font-semibold">$0.00</span>;
                      } else if (sVal < 0) {
                        return <span className="text-red-600 font-bold">-${Math.abs(sVal).toFixed(2)}</span>;
                      } else {
                        return <span className="text-green-600 font-bold">${sVal.toFixed(2)}</span>;
                      }
                    })()}
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-600">{a.subtotal}</td>
                  <td className="px-2 py-3 font-semibold text-amber-600">{a.iva || "$0.00"}</td>
                  <td className="px-2 py-3 font-bold text-[#1a5276]">{a.total}</td>
                  <td className="px-2 py-3 text-slate-500 max-w-[100px] truncate" title={a.obs}>{a.obs}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
                        <button onClick={() => openEditModal(a)} className="text-slate-400 hover:text-[#1a5276]" title="Editar">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                      )}
                      {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
                        <button onClick={() => handleDeleteAsistencia(a.id)} className="text-slate-400 hover:text-red-600" title="Eliminar">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                    <td colSpan={17} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Sin registros.
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {asistenciasFiltradas.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, asistenciasFiltradas.length)} de {asistenciasFiltradas.length}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-slate-300 rounded text-xs font-bold text-black disabled:opacity-50">Anterior</button>
              {Array.from({ length: Math.ceil(asistenciasFiltradas.length / itemsPerPage) }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 border rounded text-xs font-medium ${currentPage === i + 1 ? 'bg-[#0e2f44] text-white border-[#0e2f44]' : 'border-slate-300 text-slate-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(asistenciasFiltradas.length / itemsPerPage)))} disabled={currentPage === Math.ceil(asistenciasFiltradas.length / itemsPerPage)} className="px-3 py-1 border border-slate-300 rounded text-xs font-bold text-black disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Terapeuta</label>
                  <select name="terapeuta" value={editForm.terapeuta} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" disabled={userRole.toUpperCase() === "TERAPEUTA"}>
                    {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">Seleccionar...</option>}
                    {terapeutas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
                  <DateInput name="fecha" value={editForm.fecha} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área</label>
                  <select name="area" value={editForm.area} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="">Seleccionar especialidad...</option>
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtotal (Monto)</label>
                  <select
                    name="subtotal"
                    value={(() => {
                      const numStr = (editForm.subtotal || "").toString().replace(/[^0-9.]/g, "");
                      return numStr;
                    })()}
                    onChange={handleEditChange}
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 font-medium bg-white"
                  >
                    <option value="">Seleccionar precio...</option>
                    {(() => {
                      const numVal = parseFloat((editForm.subtotal || "0").toString().replace(/[^0-9.]/g, ""));
                      const list = [...therapyPrices];
                      if (!isNaN(numVal) && numVal > 0 && !list.includes(numVal)) {
                        list.push(numVal);
                        list.sort((a, b) => a - b);
                      }
                      return list.map(p => (
                        <option key={p} value={p.toString()}>${p.toFixed(2)}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Método de Pago</label>
                  <select name="metodoPago" value={editForm.metodoPago || "Efectivo"} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Mixto">Mixto</option>
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
      {/* MODAL GESTIÓN DE PRECIOS DE TERAPIA (SOLO ADMIN) */}
      {showAddPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1a5276] text-sm flex items-center gap-1.5">
                <span>🏷️</span> Gestión de Precios de Terapia
              </h3>
              <button onClick={() => setShowAddPriceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* FORMULARIO DE AGREGAR */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-emerald-900">Agregar Nuevo Precio ($ MXN)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="50"
                  min="1"
                  placeholder="Ej. 1200"
                  value={newPriceInput}
                  onChange={(e) => setNewPriceInput(e.target.value)}
                  className="flex-1 text-sm p-2 border border-emerald-300 rounded-lg focus:border-[#27ae60] outline-none text-slate-700 bg-white font-medium"
                />
                <button
                  type="button"
                  disabled={isAddingPrice || !newPriceInput}
                  onClick={handleAddPrice}
                  className="bg-[#27ae60] hover:bg-[#219653] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  {isAddingPrice ? "Guardando..." : "+ Agregar"}
                </button>
              </div>
            </div>

            {/* LISTA DE PRECIOS ACTUALES PARA ELIMINAR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                Precios Habilitados ({therapyPrices.length}):
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {therapyPrices.map((p) => (
                  <div key={p} className="flex items-center justify-between px-3.5 py-2 hover:bg-white transition-colors">
                    <span className="text-sm font-medium text-slate-700">${p.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrice(p)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      title={`Eliminar precio $${p.toFixed(2)}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                ))}
                {therapyPrices.length === 0 && (
                  <p className="text-xs text-slate-400 p-3 text-center">No hay precios registrados</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddPriceModal(false)}
                className="bg-slate-100 text-slate-600 font-semibold px-5 py-2 rounded-lg text-xs hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREFACTURA PDF EN FORMATO CREN */}
      {prefacturaModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center print:p-0 print:m-0 print:static print:bg-white print:block">
          {/* BARRA DE BOTONES FIJA EN PARTE SUPERIOR - siempre visible en móvil */}
          <div className="w-full max-w-2xl flex items-center justify-between gap-2 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-b-2xl shadow-lg z-10 print:hidden">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">📄</span>
                <h4 className="font-extrabold text-slate-800 text-sm truncate">Prefactura CREN</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="bg-[#27ae60] hover:bg-[#219653] text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Descargar PDF"
                >
                  <span>⬇️ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#1c4d6f] hover:bg-[#153a54] text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Imprimir"
                >
                  <span>🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrefacturaModalData(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  ✕
                </button>
              </div>
          </div>

          {/* CONTENIDO SCROLLABLE DE LA PREFACTURA */}
          <div className="flex-1 w-full overflow-y-auto flex justify-center p-2 sm:p-4 print:p-0 print:m-0 print:overflow-visible">
           <div className="max-w-2xl w-full print:max-w-none print:w-[8.5in]">
            {/* HOJA DE PREFACTURA IDÉNTICA A LA HOJA CREN (FORMATO CARTA 8.5" x 11") */}
            <div id="prefactura-sheet" className="border border-slate-300 rounded-xl overflow-hidden bg-white text-slate-900 font-sans print:border-none print:rounded-none print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0">
              {/* BANNER VERDE-AZUL DEGRADADO CREN */}
              <div className="bg-gradient-to-r from-[#1c4d6f] via-[#2c6185] to-[#1c4d6f] text-white p-4 flex items-center justify-between border-b-4 border-[#0e2f44]">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 flex items-center justify-center max-w-[160px] h-14">
                    <img src="/logo-white.png" alt="CREN Logo" className="h-full w-auto object-contain" onError={(e) => {(e.target as any).style.display = 'none';}} />
                  </div>
                  <div>
                    <h1 className="text-sm md:text-base font-bold tracking-wide uppercase leading-tight">Centro de Rehabilitación Especializada y de Neurodesarrollo (CREN)</h1>
                    <p className="text-[10px] text-slate-200 uppercase tracking-wider font-semibold">Prefactura de Honorarios</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-black text-amber-300 text-sm tracking-wider uppercase">RECIBO</p>
                  <p className="text-[10px]">Fecha Emisión: {new Date().toLocaleDateString("es-MX")}</p>
                </div>
              </div>

              {/* CUERPO DE LA PREFACTURA */}
              <div className="p-6 print:p-4 space-y-5 print:space-y-3 text-xs print:flex-1">
                {/* DATOS DE LA CLÍNICA & PACIENTE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-[#1c4d6f] uppercase text-[10px] tracking-wider">DATOS DE LA CLÍNICA Y PRIVACIDAD</h5>
                    <p className="font-bold text-slate-900 text-sm">Centro de Rehabilitación Especializada y de Neurodesarrollo (CREN)</p>
                    <p className="text-slate-700 font-medium leading-snug">Petén 284, PB, Colonia Narvarte, C.P. 03023, Benito Juárez, Ciudad de México</p>
                    <p className="text-slate-500 text-[9.5px] italic">Responsable del tratamiento de sus datos personales.</p>
                    <p className="text-slate-800 font-semibold pt-0.5">Correo: <span className="text-[#1c4d6f]">centrocren@gmail.com</span> | <span className="text-slate-900">Tel.: 55 16 87 1232</span></p>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                    <h5 className="font-extrabold text-[#1c4d6f] uppercase text-[10px] tracking-wider">DATOS DEL PACIENTE</h5>
                    <p className="font-extrabold text-slate-900 text-sm">{prefacturaModalData.paciente}</p>
                    <p className="text-slate-700"><span className="font-semibold text-slate-500">Sexo:</span> {prefacturaModalData.sexo || "—"} | <span className="font-semibold text-slate-500">Edad:</span> {prefacturaModalData.edad || "—"}</p>
                    <p className="text-slate-700"><span className="font-semibold text-slate-500">Terapeuta Responsable:</span> <span className="font-bold text-slate-800">{prefacturaModalData.terapeuta || "LOURDES RINCÓN"}</span></p>
                    <p className="text-slate-700"><span className="font-semibold text-slate-500">Área:</span> {prefacturaModalData.area || "General"}</p>
                  </div>
                </div>

                {/* DETALLE DE LA SESIÓN / PREFACTURA (SIN ESTADO) */}
                <div>
                  <h5 className="font-extrabold text-[#1c4d6f] uppercase text-[10px] tracking-wider mb-2 border-b border-slate-200 pb-1">
                    DESGLOSE DE SERVICIO Y CONCEPTOS RECIBO
                  </h5>
                  <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100/80 font-extrabold text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">FECHA Y HORA</th>
                        <th className="p-2.5">CONCEPTO / SESIÓN</th>
                        <th className="p-2.5 text-right">MÉTODO PAGO</th>
                        <th className="p-2.5 text-right">MONTO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-800">{prefacturaModalData.fecha}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-[#1c4d6f] text-xs">{prefacturaModalData.tipoSesion}</span>
                          <span className="block text-[10px] text-slate-500 font-medium">Número de Sesión: {prefacturaModalData.sesiones}</span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-700">{prefacturaModalData.metodoPago || "Efectivo"}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 text-sm">{prefacturaModalData.subtotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CUADRO DE RESUMEN DE PAGOS Y IVA */}
                <div className="flex justify-end pt-1">
                  <div className="w-64 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-right text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (sin IVA):</span>
                      <span className="font-bold text-slate-800">{prefacturaModalData.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA:</span>
                      <span className="font-bold text-slate-800">{prefacturaModalData.iva || "$0.00"}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Monto Abonado:</span>
                      <span className="font-bold text-green-700">{prefacturaModalData.pago || prefacturaModalData.montoPago || prefacturaModalData.subtotal}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-black text-[#1c4d6f]">
                      <span>Total Prefactura:</span>
                      <span>{prefacturaModalData.total}</span>
                    </div>
                  </div>
                </div>

                {prefacturaModalData.obs && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 text-slate-700">
                    <span className="font-bold text-amber-800 block text-[10px] uppercase">Observaciones:</span>
                    <p className="font-medium text-[11px]">{prefacturaModalData.obs}</p>
                  </div>
                )}
              </div>

              {/* PIE DE PÁGINA VERDE-AZUL DEGRADADO CREN */}
              <div className="bg-gradient-to-r from-[#1c4d6f] via-[#2c6185] to-[#1c4d6f] text-white p-3.5 text-center text-xs space-y-0.5 font-sans border-t-2 border-[#0e2f44]">
                <p className="font-bold text-xs tracking-wide">Centro de Rehabilitación Especializada y de Neurodesarrollo (CREN)</p>
                <p className="text-slate-200 text-[10px]">Petén 284, PB, Col. Narvarte, Benito Juárez, CDMX | centrocren@gmail.com | Tel.: 55 16 87 1232</p>
              </div>
            </div>
           </div>
          </div>
        </div>
      )}
    </div>
  );
}

