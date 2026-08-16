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
import { exportAsistenciasToDriveAction } from "@/app/actions/excelDriveSync";

// Force Vercel redeploy trigger: 2026-08-16T00:09:30-05:00


type Paciente = {
  id: string;
  displayId?: string;
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
  displayId?: string;
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
  hora?: string;
  iva?: string;
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
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [autoDriveSyncEnabled, setAutoDriveSyncEnabled] = useState(false);
  const [autoDriveSyncTime, setAutoDriveSyncTime] = useState("20:00");
  const [driveToast, setDriveToast] = useState<string | null>(null);
  const [systemTimezone, setSystemTimezone] = useState("America/Mexico_City");
  const [liveSystemTime, setLiveSystemTime] = useState("");

  useEffect(() => {
    if (driveToast) {
      const timer = setTimeout(() => setDriveToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [driveToast]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("cren_autoDriveSyncEnabled");
      const savedTime = localStorage.getItem("cren_autoDriveSyncTime");
      if (savedEnabled !== null) setAutoDriveSyncEnabled(savedEnabled === "true");
      if (savedTime) setAutoDriveSyncTime(savedTime);
    }
    async function fetchTimezone() {
      try {
        const { getSettings } = await import("@/app/actions/configuracion");
        const res = await getSettings("2026-08");
        if (res.success && res.settings?.timezone) {
          setSystemTimezone(res.settings.timezone);
        }
      } catch (e) {}
    }
    fetchTimezone();
  }, []);

  // Reloj en tiempo real según zona horaria del sistema
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("es-MX", {
          timeZone: systemTimezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setLiveSystemTime(formatter.format(now));
      } catch (e) {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        setLiveSystemTime(`${h}:${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [systemTimezone]);

  useEffect(() => {
    if (!autoDriveSyncEnabled) return;

    const checkInterval = setInterval(() => {
      if (!liveSystemTime || !autoDriveSyncTime) return;

      const currentBlueHHMM = liveSystemTime.slice(0, 5).trim();
      const targetGreenHHMM = autoDriveSyncTime.trim();

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const todayStr = `${y}-${m}-${d}`;
      const lastKey = `${todayStr}_${targetGreenHHMM}`;

      const isMatch = currentBlueHHMM === targetGreenHHMM;
      const lastSentKey = localStorage.getItem("lastAutoDriveExportKey");

      if (isMatch && lastSentKey !== lastKey) {
        localStorage.setItem("lastAutoDriveExportKey", lastKey);
        const btn = document.getElementById("btn-export-drive") as HTMLButtonElement | null;
        if (btn && !btn.disabled) {
          console.log(`Coincidencia detectada (Azul: ${currentBlueHHMM} == Verde: ${targetGreenHHMM}). Presionando botón verde automáticamente...`);
          btn.click();
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [autoDriveSyncEnabled, autoDriveSyncTime, liveSystemTime]);

  const handleToggleAutoDriveSync = async (enabled: boolean) => {
    setAutoDriveSyncEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("cren_autoDriveSyncEnabled", String(enabled));
    }
    const { updateAutoDriveSyncSettings } = await import("@/app/actions/excelDriveSync");
    await updateAutoDriveSyncSettings(enabled, autoDriveSyncTime);
  };

  const handleTimeAutoDriveSyncChange = async (timeVal: string) => {
    setAutoDriveSyncTime(timeVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("cren_autoDriveSyncTime", timeVal);
    }
    const { updateAutoDriveSyncSettings } = await import("@/app/actions/excelDriveSync");
    await updateAutoDriveSyncSettings(autoDriveSyncEnabled, timeVal);
  };

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
    if (isNaN(val) || val < 0) {
      alert("Por favor ingresa un precio válido igual o mayor a 0.");
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
  const getLocalToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split("T")[0];
  };
  const hoy = getLocalToday();
  
  // By default, show records from the 1st of the current month
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  };
  
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [filtroTerapeuta, setFiltroTerapeuta] = useState("Todos");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("Todos");
  const [filtroTipoSesion, setFiltroTipoSesion] = useState("Todos");
  const [filtroFrecuencia, setFiltroFrecuencia] = useState("Todos");
  const [availableAreas, setAvailableAreas] = useState<string[]>(["Psicología", "Lenguaje", "Fisioterapia"]);
  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [terapeutasFullData, setTerapeutasFullData] = useState<any[]>([]);

  // Predictivo
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSegundoPago, setShowSegundoPago] = useState(false);
  const [showEditSegundoPago, setShowEditSegundoPago] = useState(false);
  
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
          hora: c.hora || (c.horaRegistro && c.horaRegistro !== "-" ? c.horaRegistro : "") || "09:00",
          area: c.area || "-",
          paciente: c.paciente,
          pacienteId: c.pacienteId || "",
          displayId: c.displayId || "",
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
      const res = await getPatients();
      if (res.success && res.data) {
        let validPatients = res.data;
        const mapped = validPatients.map((p: any) => ({
          id: p.id,
          displayId: p.displayId || p.id,
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

      const prefill = sessionStorage.getItem("prefillAsistencia");
      if (prefill) {
        try {
          const pd = JSON.parse(prefill);
          let pMatch = null;
          const pacRes = await getPatients();
          if (pacRes.success && pacRes.data) {
             const pac = pacRes.data.find((x: any) => x.name === pd.pacienteNombre);
             if (pac) {
               pMatch = {
                  id: pac.id,
                  paciente: pac.name,
                  sexo: pac.sexo || "—",
                  nac: pac.fechaNacimiento || "—",
                  edad: pac.age ? pac.age.toString() : "—",
                  saldoCalculado: pac.saldoCalculado || "0.00",
                  precioTerapia: pac.precioTerapia?.toString() || ""
               };
             }
          }
          
          const mapTipoSesion = (val: string) => {
            if (!val) return "";
            const low = val.toLowerCase();
            if (low === "individual") return "Individual";
            if (low === "valoracion") return "Valoracion";
            if (low === "taller" || low === "taller grupal" || low === "terapia grupal") return "Terapia Grupal";
            if (low === "escuela") return "Escuela";
            if (low === "reposicion") return "Reposicion";
            if (low === "orientacion padres") return "Orientacion Padres";
            return "Otros";
          };

          const mapEstadoAsistencia = (val: string) => {
            if (!val) return "Asistio";
            const low = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (low.includes("asistio")) return "Asistio";
            if (low.includes("anticipadamente") || low.includes("con anticipacion")) return "Cancelo anticipadamente";
            if (low.includes("sin anticipacion")) return "Cancelo sin anticipacion";
            if (low.includes("centro")) return "Cancelo el centro";
            if (low.includes("agendado")) return "Agendado";
            if (low.includes("alta")) return "Alta";
            if (low.includes("baja")) return "Baja";
            return val;
          };

          const mapFrecuencia = (val: string) => {
            if (!val) return "Única";
            const low = val.toLowerCase();
            if (low === "unica" || low === "única" || low.includes("ocasional")) return "Única";
            if (low === "diario" || low === "diaria") return "Diaria";
            if (low === "semanal") return "Semanal";
            if (low === "quincenal") return "Quincenal";
            if (low === "mensual") return "Mensual";
            return "Única";
          };

          let areaVal = pd.area || "";
          if (!areaVal && pd.terapeuta && tRes.success && tRes.data) {
            const tMatch = tRes.data.find((x: any) => (x.name || "").trim().toLowerCase() === (pd.terapeuta || "").trim().toLowerCase());
            if (tMatch?.especialidad) {
              areaVal = tMatch.especialidad;
            }
          }

          setFormData(prev => ({
             ...prev,
             agendaId: pd.agendaId,
             pacienteId: pMatch ? pMatch.id : "",
             pacienteNombre: pd.pacienteNombre,
             pacienteNac: pMatch ? pMatch.nac : "",
             pacienteSexo: pMatch ? (pMatch.sexo.toUpperCase().startsWith("M") ? "M" : (pMatch.sexo.toUpperCase().startsWith("F") ? "F" : pMatch.sexo)) : "",
             pacienteEdad: pMatch ? pMatch.edad : "",
             fecha: pd.fecha,
             hora: pd.hora,
             terapeuta: pd.terapeuta,
             area: areaVal || prev.area,
             tipoSesion: mapTipoSesion(pd.tipoSesion),
             estadoAsistencia: mapEstadoAsistencia(pd.estadoAsistencia),
             numeroSesiones: pd.numeroSesiones,
             frecuencia: mapFrecuencia(pd.frecuencia),
             saldoDisponible: pMatch ? pMatch.saldoCalculado : "0.00",
             precioTerapia: pMatch && pMatch.precioTerapia ? pMatch.precioTerapia : prev.precioTerapia,
             metodoPago: pd.metodoPago || "",
             montoPago: pd.pagado ? (pMatch?.precioTerapia || "400") : ""
          }));
          sessionStorage.removeItem("prefillAsistencia");
        } catch (e) {
          console.error(e);
        }
      }
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
        frecuencia: (() => {
          const cita = agendaCitas.find((c: any) => c.paciente === p.paciente);
          if (cita) {
            const f = (cita.frecuencia || "").toLowerCase();
            return f === "diario" || f === "diaria" ? "Diaria" : f === "semanal" ? "Semanal" : f === "quincenal" ? "Quincenal" : f === "mensual" ? "Mensual" : formData.frecuencia;
          }
          return formData.frecuencia;
        })()
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
    const montoIngresado = p1 + p2;
    const precioTerapia = parseFloat(formData.precioTerapia || "0");
    const estNorm = (estadoFinal || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");

    // Para "Asistió" y "Canceló S/A": si no ingresó monto explícito pero hay precioTerapia, se asume que pagó el precio de la terapia
    let montoPagado = montoIngresado;
    if (!isFreeCancel && montoIngresado === 0 && precioTerapia > 0 && !formData.montoPago) {
      montoPagado = precioTerapia;
    }

    const totVal = isFreeCancel ? montoIngresado : (montoPagado > 0 ? montoPagado : precioTerapia);

    const ivaPct = await getSystemIvaRate();
    const ivaDec = (ivaPct || 16) / 100;

    let subVal = totVal;
    let ivaVal = 0;

    const solicitaFacturaChecked = Boolean(formData.solicitaFactura);

    if (solicitaFacturaChecked && totVal > 0) {
      ivaVal = totVal * ivaDec;
      subVal = totVal - ivaVal;
    }

    let defaultMetodo = isFreeCancel ? "Ninguno" : "Efectivo";
    let metodoPagoFinal = formData.metodoPago || defaultMetodo;
    if (isFreeCancel && (metodoPagoFinal === "Efectivo" || !formData.metodoPago)) {
      metodoPagoFinal = "Ninguno";
    }
    if (showSegundoPago && formData.metodoPago2) {
      metodoPagoFinal = `${formData.metodoPago || defaultMetodo} $${p1}\n${formData.metodoPago2} $${p2}`;
    } else if (showSegundoPago) {
      metodoPagoFinal = `${formData.metodoPago || defaultMetodo} $${p1}`;
    } else if (p1 > 0 && formData.metodoPago) {
      metodoPagoFinal = `${formData.metodoPago} $${p1}`;
    }

    const fuePagado = !isCanceled && (montoPagado > 0 || (precioTerapia === 0 && formData.precioTerapia === "0"));

    const nuevaAsistencia: Asistencia = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      hora: formData.hora,
      area: formData.area,
      paciente: formData.pacienteNombre,
      sexo: formData.pacienteSexo,
      edad: formData.pacienteEdad,
      tipoSesion: formData.tipoSesion,
      estado: estadoFinal,
      sesiones: formData.numeroSesiones || "1",
      frecuencia: formData.frecuencia || "Única",
      pago: fuePagado ? "SÍ" : "NO",
      solicitaFactura: solicitaFacturaChecked,
      fact: solicitaFacturaChecked ? "Sí" : "No",
      subtotal: `$${subVal.toFixed(2)}`,
      iva: `$${ivaVal.toFixed(2)}`,
      total: `$${totVal.toFixed(2)}`,
      precioTerapia: formData.precioTerapia,
      montoPago: montoPagado.toString(),
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
      const citaExistente = agendaCitas.find((c: any) => 
        c.paciente === formData.pacienteNombre && 
        c.fecha === formData.fecha && 
        c.hora === formData.hora
      );

      if (citaExistente) {
        await updateCita(citaExistente.id, {
          ...citaExistente,
          estado: estadoFinal,
          pagado: fuePagado,
          metodoPago: metodoPagoFinal,
          terapeuta: formData.terapeuta
        });
      } else {
        await addCita({
          paciente: formData.pacienteNombre,
          fecha: formData.fecha,
          hora: formData.hora,
          terapeuta: formData.terapeuta,
          tipoServicio: formData.tipoSesion,
          frecuencia: formData.frecuencia,
          estado: estadoFinal,
          pagado: fuePagado,
          metodoPago: metodoPagoFinal,
          numeroSesiones: parseInt(formData.numeroSesiones) || 1
        });
      }
    } catch (e) {
      console.error("Error agendando cita al guardar asistencia", e);
    }

    alert("Sesión guardada exitosamente en la base de datos");
    handleLimpiarForm();
    await recargarAsistencias();
    
    // Redirigir a Pacientes y abrir la Nota Clínica Nueva (Registro de Evolución)
    let targetId = formData.pacienteId;
    if (!targetId && formData.pacienteNombre) {
      const pacRes = await getPatients();
      if (pacRes.success && pacRes.data) {
        const pMatch = pacRes.data.find((x: any) => x.name.trim().toLowerCase() === formData.pacienteNombre.trim().toLowerCase());
        if (pMatch) targetId = pMatch.id;
      }
    }

    const agendaIdVal = formData.agendaId || "";
    const fechaVal = formData.fecha || "";
    const horaVal = formData.hora || "";
    const terapeutaVal = formData.terapeuta || "";

    sessionStorage.setItem("triggerAutoOpenNote", "true");
    if (targetId) {
      sessionStorage.setItem("autoOpenNotePatientId", targetId);
      sessionStorage.setItem("autoOpenNoteAgendaId", agendaIdVal);
      sessionStorage.setItem("autoOpenNoteFecha", fechaVal);
      sessionStorage.setItem("autoOpenNoteHora", horaVal);
      sessionStorage.setItem("autoOpenNoteTerapeuta", terapeutaVal);
    } else if (formData.pacienteNombre) {
      sessionStorage.setItem("autoOpenNotePatientName", formData.pacienteNombre);
      sessionStorage.setItem("autoOpenNoteAgendaId", agendaIdVal);
      sessionStorage.setItem("autoOpenNoteFecha", fechaVal);
      sessionStorage.setItem("autoOpenNoteHora", horaVal);
      sessionStorage.setItem("autoOpenNoteTerapeuta", terapeutaVal);
    }
    window.location.href = "/dashboard/pacientes";
  };

  // --- Lógica de Revisión ---
  const handleRevisionToggle = async (a: Asistencia) => {
    const isPorDefinir = (a.metodoPago || "").toLowerCase().replace(/\s+/g, "").includes("pordefinir");
    
    if (isPorDefinir) {
      const confirmDelete = window.confirm("¿Desea eliminar el gancho?");
      if (!confirmDelete) return;
    }

    const targetMetodo = isPorDefinir ? "Transferencia" : "Por definir";

    const updated: Asistencia = {
      ...a,
      metodoPago: targetMetodo
    };

    setAsistencias(prev => prev.map(item => item.id === a.id ? updated : item));

    const dbRes = await saveAsistenciaDB(updated);
    if (dbRes?.success === false) {
      alert("Error al actualizar la revisión: " + (dbRes as any).error);
    }
    await recargarAsistencias();
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
    
    const estNorm = (a.estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");
    let baseMetodo = a.metodoPago || (isFreeCancel ? "Ninguno" : "Efectivo");
    if (isFreeCancel && (baseMetodo === "Efectivo" || !a.metodoPago)) {
      baseMetodo = "Ninguno";
    }
    let baseMonto = "";
    let baseMetodo2 = "";
    let baseMonto2 = "";
    let isMixto = false;

    if (a.metodoPago && a.metodoPago.includes("\n")) {
      isMixto = true;
      const lines = a.metodoPago.split("\n");
      const m1 = lines[0].match(/^(.*?)\s*\$([\d.]+)/);
      if (m1) {
        baseMetodo = m1[1].trim();
        baseMonto = m1[2];
      }
      const m2 = lines[1]?.match(/^(.*?)\s*\$([\d.]+)/);
      if (m2) {
        baseMetodo2 = m2[1].trim();
        baseMonto2 = m2[2];
      }
    } else if (a.metodoPago) {
      const validMethods = ["Efectivo", "Transferencia", "Tarjeta", "Mixto", "Por definir", "Beca", "Ninguno"];
      const foundMethod = validMethods.find(m => baseMetodo.startsWith(m));
      if (foundMethod) {
        baseMetodo = foundMethod;
        const montoMatch = (a.metodoPago || "").match(/\$([\d.]+)/);
        if (montoMatch) baseMonto = montoMatch[1];
      }
    }

    const getFormattedHora = (rawHora?: string, rawHoraReg?: string) => {
      let h = (rawHora || rawHoraReg || "").trim();
      if (!h || h === "-") return "09:00";
      if (h.length >= 5 && h.includes(":")) {
        return h.substring(0, 5);
      }
      return "09:00";
    };

    const initialPrecio = a.precioTerapia || a.costoSesion || (a.total || a.subtotal || "").replace(/[^0-9.]/g, "");

    setShowEditSegundoPago(isMixto);
    setEditForm({
      fecha: a.fecha,
      hora: getFormattedHora(a.hora, a.horaRegistro),
      area: a.area,
      tipoSesion: a.tipoSesion,
      estado: a.estado,
      sesiones: a.sesiones,
      pago: a.pago || "SÍ",
      metodoPago: baseMetodo,
      montoPago: baseMonto || (a.montoPago || ""),
      metodoPago2: baseMetodo2 || "Transferencia",
      montoPago2: baseMonto2 || "",
      fact: a.fact === "Sí",
      subtotal: initialPrecio,
      obs: a.obs,
      terapeuta: a.terapeuta || ""
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setEditForm((prev: any) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "estado") {
      const sNorm = (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isFreeCancel = (sNorm.includes("con anticip") || sNorm.includes("anticipad") || sNorm.includes("centro")) && !sNorm.includes("sin anticip");
      setEditForm((prev: any) => ({
        ...prev,
        estado: value,
        metodoPago: isFreeCancel ? "Ninguno" : (prev.metodoPago === "Ninguno" ? "Efectivo" : prev.metodoPago),
        montoPago: isFreeCancel ? "0" : prev.montoPago
      }));
    } else {
      setEditForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    if (!editingAsistencia) return;
    
    const m1 = parseFloat(editForm.montoPago || "0");
    const m2 = showEditSegundoPago ? parseFloat(editForm.montoPago2 || "0") : 0;
    const montoPagado = m1 + m2;

    const rawPrecio = (editForm.subtotal || editingAsistencia.precioTerapia || editingAsistencia.costoSesion || "").toString().replace(/[^0-9.]/g, "");
    const precioTerapiaNum = parseFloat(rawPrecio) || (montoPagado > 0 ? montoPagado : 0);

    const ivaPct = await getSystemIvaRate();
    const ivaDec = (ivaPct || 16) / 100;
    const estNormEdit = (editForm.estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isFreeCancelEdit = (estNormEdit.includes("con anticip") || estNormEdit.includes("anticipad") || estNormEdit.includes("centro")) && !estNormEdit.includes("sin anticip");

    let totVal = isFreeCancelEdit ? 0 : (precioTerapiaNum > 0 ? precioTerapiaNum : montoPagado);
    let subVal = totVal;
    let ivaVal = 0;

    if (!isFreeCancelEdit && editForm.fact && totVal > 0) {
      ivaVal = totVal * ivaDec;
      subVal = totVal - ivaVal;
    }

    const cleanMethod = (raw: string, defaultVal: string = "Efectivo") => {
      if (!raw) return defaultVal;
      const valid = ["Efectivo", "Transferencia", "Tarjeta", "Por definir", "Beca", "Ninguno"];
      const found = valid.find(v => raw.toLowerCase().replace(/\s+/g, "").includes(v.toLowerCase().replace(/\s+/g, "")));
      return found || defaultVal;
    };

    let defaultEditMetodo = isFreeCancelEdit ? "Ninguno" : "Efectivo";
    let m1Method = cleanMethod(editForm.metodoPago, defaultEditMetodo);
    let editMetodoPagoFinal = isFreeCancelEdit ? "Ninguno" : `${m1Method} $${m1}`;

    if (!isFreeCancelEdit && showEditSegundoPago && editForm.metodoPago2 && m2 > 0) {
      let m2Method = cleanMethod(editForm.metodoPago2, "Transferencia");
      editMetodoPagoFinal = `${m1Method} $${m1}\n${m2Method} $${m2}`;
    }

    const fuePagado = !isFreeCancelEdit && (montoPagado >= precioTerapiaNum || editForm.pago === "SÍ");

    let asisActualizada: any = null;
    const nuevasAsistencias = asistencias.map(a => {
      if (a.id === editingAsistencia.id) {
        asisActualizada = {
          ...a,
          fecha: editForm.fecha,
          hora: editForm.hora,
          area: editForm.area,
          tipoSesion: editForm.tipoSesion,
          estado: editForm.estado,
          sesiones: editForm.sesiones,
          pago: fuePagado ? "SÍ" : "NO",
          metodoPago: editMetodoPagoFinal,
          montoPago: m1.toString(),
          metodoPago2: showEditSegundoPago ? editForm.metodoPago2 : "",
          montoPago2: showEditSegundoPago ? m2.toString() : "",
          costoSesion: precioTerapiaNum.toString(),
          precioTerapia: precioTerapiaNum.toString(),
          solicitaFactura: Boolean(editForm.fact),
          fact: editForm.fact ? "Sí" : "No",
          subtotal: `$${subVal.toFixed(2)}`,
          iva: `$${ivaVal.toFixed(2)}`,
          total: `$${totVal.toFixed(2)}`,
          obs: editForm.obs || "—",
          creadoPor: a.creadoPor || userName,
          terapeuta: editForm.terapeuta || a.terapeuta
        };
        return asisActualizada;
      }
      return a;
    });

    setAsistencias(nuevasAsistencias);

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
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de asistencia de los recientes?")) {
      const res = await deleteCita(id);
      if (res.success) {
        const nuevas = asistencias.filter(a => a.id !== id);
        setAsistencias(nuevas);
        alert("Registro de asistencia eliminado de la base de datos.\n\n(La ficha ID y los datos del paciente permanecen intactos).");
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
      ((p.name || p.paciente) && (p.name || p.paciente).trim().toLowerCase() === (a.paciente || "").trim().toLowerCase())
    );
    if (matchPatient && (matchPatient.estatus || "Activo").trim().toLowerCase() === "inactivo") {
      return false;
    }


    let match = true;
    const norm = (st: string) => (st || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (filtroEstado !== "Todos") {
      const fNorm = norm(filtroEstado);
      const aNorm = norm(a.estado);

      if (fNorm.includes("anticip") && !fNorm.includes("sin anticip")) {
        const isCancelAnticipado = (aNorm.includes("anticip") || aNorm.includes("c/a")) && !aNorm.includes("sin anticip");
        if (!isCancelAnticipado) match = false;
      } else if (fNorm.includes("sin anticip") || fNorm.includes("s/a")) {
        const isCancelSinAnticipado = aNorm.includes("sin anticip") || aNorm.includes("s/a");
        if (!isCancelSinAnticipado) match = false;
      } else if (fNorm.includes("centro")) {
        const isCancelCentro = aNorm.includes("centro");
        if (!isCancelCentro) match = false;
      } else if (fNorm.includes("asist")) {
        const isAsistio = aNorm.includes("asist");
        if (!isAsistio) match = false;
      } else {
        if (aNorm !== fNorm) match = false;
      }
    }
    if (filtroDesde && a.fecha < filtroDesde) match = false;
    if (filtroHasta && a.fecha > filtroHasta) match = false;
    
    if (filtroPaciente) {
      const searchNorm = norm(filtroPaciente);
      const patNorm = norm(a.paciente);
      if (!patNorm.includes(searchNorm)) match = false;
    }
    
    if (filtroMetodoPago !== "Todos") {
      const pago = norm(a.metodoPago);
      if (!pago.includes(norm(filtroMetodoPago))) match = false;
    }
    if (filtroTipoSesion !== "Todos") {
      if (norm(a.tipoSesion) !== norm(filtroTipoSesion)) match = false;
    }
    if (filtroFrecuencia !== "Todos") {
      if (norm(a.frecuencia) !== norm(filtroFrecuencia)) match = false;
    }
    
    if (filtroTerapeuta !== "Todos") {
      if (norm(a.terapeuta) !== norm(filtroTerapeuta)) match = false;
    }

    if (userRole.toUpperCase() === "TERAPEUTA") {
      const tNorm = norm(a.terapeuta);
      const uNorm = norm(userName);
      const cNorm = norm(a.creadoPor);
      if (tNorm !== uNorm && !tNorm.includes(uNorm) && !uNorm.includes(tNorm) && !cNorm.includes(uNorm)) {
        match = false;
      }
    }
    
    return match;
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
        initialData={formData}
        pacientes={pacientes.filter(p => userRole.toUpperCase() !== "TERAPEUTA" || (p.medicoTratante && p.medicoTratante.toLowerCase().includes(userName.toLowerCase())))}
        terapeutasFullData={terapeutasFullData}
        agendaCitas={agendaCitas}
        availableAreasInput={availableAreas}
        therapyPrices={therapyPrices}
        userRole={userRole}
        userName={userName}
        onAddPrice={() => setShowAddPriceModal(true)}
        onClear={handleLimpiarForm}
        onSave={async (formData, subVal, ivaVal, totVal, metodoPagoFinal) => {
          const parseMoney = (val: any) => parseFloat((val || "0").toString().replace(/[^0-9.-]/g, "")) || 0;
          const solicitaFacturaChecked = Boolean(formData.solicitaFactura);
          const estNorm = (formData.estadoAsistencia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");

          const p1 = parseMoney(formData.montoPago);
          const p2 = parseMoney(formData.montoPago2);
          const montoIngresado = p1 + p2;
          const precioTerapia = parseMoney(formData.precioTerapia);

          let montoPagado = montoIngresado;
          if (!isFreeCancel && montoIngresado === 0 && precioTerapia > 0 && !formData.montoPago) {
            montoPagado = precioTerapia;
          }

          const totalFinal = isFreeCancel ? montoIngresado : (montoPagado > 0 ? montoPagado : precioTerapia);

          const ivaPct = await getSystemIvaRate();
          const ivaDec = (ivaPct || 16) / 100;

          let sVal = totalFinal;
          let iVal = 0;
          if (solicitaFacturaChecked && totalFinal > 0) {
            iVal = totalFinal * ivaDec;
            sVal = totalFinal - iVal;
          }

          const fuePagado = !isFreeCancel && (montoPagado > 0 || (precioTerapia === 0 && (formData.precioTerapia === "0" || formData.precioTerapia === "$0.00")));

          let metodoFinal = metodoPagoFinal || formData.metodoPago || "Efectivo";
          if (!metodoFinal.includes("$") && totalFinal > 0) {
            metodoFinal = `${metodoFinal} $${totalFinal}`;
          }

          const nuevaAsistencia = {
            id: Date.now().toString(),
            fecha: formData.fecha,
            hora: formData.hora,
            area: formData.area,
            paciente: formData.pacienteNombre,
            sexo: formData.pacienteSexo,
            edad: formData.pacienteEdad,
            tipoSesion: formData.tipoSesion,
            estado: formData.estadoAsistencia || "Asistio",
            sesiones: formData.numeroSesiones || "1",
            frecuencia: formData.frecuencia || "Única",
            pago: fuePagado ? "SÍ" : "NO",
            solicitaFactura: solicitaFacturaChecked,
            fact: solicitaFacturaChecked ? "Sí" : "No",
            subtotal: `$${sVal.toFixed(2)}`,
            iva: `$${iVal.toFixed(2)}`,
            total: `$${totalFinal.toFixed(2)}`,
            precioTerapia: precioTerapia > 0 ? precioTerapia.toString() : formData.precioTerapia,
            montoPago: p1.toString(),
            metodoPago: metodoFinal,
            metodoPago2: formData.metodoPago2 || "",
            montoPago2: p2 > 0 ? p2.toString() : "",
            obs: formData.observaciones || "—",
            creadoPor: userName,
            terapeuta: formData.terapeuta
          };

          try {
            await addCita({
              paciente: formData.pacienteNombre,
              fecha: formData.fecha,
              hora: formData.hora,
              terapeuta: formData.terapeuta,
              tipoServicio: formData.tipoSesion,
              frecuencia: formData.frecuencia,
              estado: formData.estadoAsistencia || "Asistio",
              pagado: fuePagado ? "SÍ" : "No",
              metodoPago: metodoFinal,
              numeroSesiones: 1
            });
          } catch (e) {
            console.error("Error agendando cita al guardar asistencia", e);
          }

          const dbRes = await saveAsistenciaDB(nuevaAsistencia);
          if (dbRes?.success === false) {
            alert("Error al guardar en BD: " + (dbRes as any).error);
            return;
          }

          if (formData.pacienteId || formData.pacienteNombre) {
            const url = `/dashboard/pacientes?autoNote=true&patientId=${encodeURIComponent(formData.pacienteId || "")}&patientName=${encodeURIComponent(formData.pacienteNombre || "")}&agendaId=${encodeURIComponent(formData.agendaId || "")}&fecha=${encodeURIComponent(formData.fecha || "")}&hora=${encodeURIComponent(formData.hora || "")}&terapeuta=${encodeURIComponent(formData.terapeuta || "")}`;
            window.location.href = url;
          } else {
            window.location.href = "/dashboard/asistencia";
          }
        }}
      />
      {driveToast && (
        <div className="fixed top-5 right-5 z-[9999] bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-base shrink-0">
            ✓
          </div>
          <div>
            <h4 className="font-extrabold text-xs">Google Drive Sincronizado</h4>
            <p className="text-[11px] text-emerald-100">{driveToast}</p>
          </div>
          <button onClick={() => setDriveToast(null)} className="ml-2 text-emerald-200 hover:text-white font-bold text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* CARD 2: REGISTROS RECIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 text-[15px]">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Registros Recientes
          </h3>
          {(userRole.toUpperCase() === "ADMIN" || userRole.toUpperCase() === "INVITADO") && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-300 text-xs transition-all shadow-2xs">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-bold text-[11px]">
                  <input
                    type="checkbox"
                    checked={autoDriveSyncEnabled}
                    onChange={(e) => handleToggleAutoDriveSync(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span>⏰ Envío Auto Diario:</span>
                </label>
                <input
                  type="time"
                  disabled={!autoDriveSyncEnabled}
                  value={autoDriveSyncTime}
                  onChange={(e) => handleTimeAutoDriveSyncChange(e.target.value)}
                  className="px-1.5 py-0.5 text-xs font-extrabold border border-slate-300 rounded bg-white text-slate-800 disabled:opacity-50 disabled:bg-slate-50 outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                />
                {liveSystemTime && (
                  <span className="font-mono text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs" title="Hora actual del sistema">
                    ⏱️ {liveSystemTime}
                  </span>
                )}
                {autoDriveSyncEnabled && (
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded border border-emerald-300 animate-pulse" title="Hora programada de envío">
                    Prog. {autoDriveSyncTime} hs
                  </span>
                )}
              </div>

              <button
                id="btn-export-drive"
                type="button"
                disabled={isExportingDrive}
                onClick={async () => {
                  setIsExportingDrive(true);
                  try {
                    const res = await exportAsistenciasToDriveAction();
                    if (res.success) {
                      setDriveToast("¡Excel 'Informes PDF CREN' generado y enviado exitosamente a Google Drive!");
                      if (res.webViewLink) window.open(res.webViewLink, "_blank");
                    } else {
                      setDriveToast("⚠️ " + (res.error || "Error al sincronizar con Google Drive"));
                    }
                  } catch (err: any) {
                    setDriveToast("⚠️ Error: " + err.message);
                  } finally {
                    setIsExportingDrive(false);
                  }
                }}
                className="bg-[#107c41] hover:bg-[#0b5c30] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                title="Generar Excel 'Informes PDF CREN' con todos los Registros Recientes y enviarlo a Google Drive"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                <span>{isExportingDrive ? "Enviando a Google Drive..." : "Enviar Excel a Google Drive (Informes PDF CREN)"}</span>
              </button>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Terapeuta:</label>
              <select value={filtroTerapeuta} onChange={e => setFiltroTerapeuta(e.target.value)} className="w-24 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium">
                <option value="Todos">Todos</option>
                {terapeutas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Método Pago:</label>
              <select value={filtroMetodoPago} onChange={e => setFiltroMetodoPago(e.target.value)} className="w-24 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium">
                <option value="Todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Mixto">Mixto</option>
                <option value="Por definir">Por definir</option>
                <option value="Beca">Beca</option>
                <option value="Ninguno">Ninguno</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Tipo Sesión:</label>
              <select value={filtroTipoSesion} onChange={e => setFiltroTipoSesion(e.target.value)} className="w-24 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium">
                <option value="Todos">Todos</option>
                <option value="Individual">Individual</option>
                <option value="Escuela">Escuela</option>
                <option value="Reposicion">Reposición</option>
                <option value="Terapia Grupal">Terapia grupal</option>
                <option value="Orientacion Padres">Orientación padres</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Frecuencia:</label>
              <select value={filtroFrecuencia} onChange={e => setFiltroFrecuencia(e.target.value)} className="w-24 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium">
                <option value="Todos">Todos</option>
                <option value="Única">Única</option>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500">Paciente:</label>
              <input type="text" value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)} placeholder="Buscar..." className="w-32 text-xs p-1.5 border border-slate-300 rounded outline-none text-slate-700 bg-white font-medium" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setFiltroDesde(""); setFiltroHasta(""); setFiltroEstado("Todos"); setFiltroPaciente(""); setFiltroTerapeuta("Todos"); setFiltroMetodoPago("Todos"); setFiltroTipoSesion("Todos"); setFiltroFrecuencia("Todos"); }} className="bg-[#1a5276] text-white hover:bg-[#0e2f44] px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer" title="Ver registros pasados, presentes y futuros">
              Ver Todos (Permanente)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-center border-collapse table-auto">
            <thead className="bg-[#0e2f44] text-white text-[8.5px] xl:text-[9.5px] font-extrabold uppercase leading-tight tracking-tight">
              <tr>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">FECHA</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">HORA</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">TERAPEUTA</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">ÁREA</th>
                <th className="px-1.5 py-2 text-left border-b border-[#0e2f44] whitespace-nowrap">PACIENTE</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">SEXO</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">EDAD</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">TIPO SESIÓN</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">ESTADO</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">FREC.</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">MÉTODO PAGO</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">PAGO</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">FACT.</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">SALDO</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">SUBTOTAL</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">IVA</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">TOTAL</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">OBS</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">REVISIÓN</th>
                <th className="px-1 py-2 border-b border-[#0e2f44] whitespace-nowrap">ACCIONES</th>
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
                  <td className="px-1 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">{formatDateStr(a.fecha)}</td>
                  <td className="px-1 py-2 text-slate-500 font-medium text-[11px] whitespace-nowrap">{a.hora || a.horaRegistro || "-"}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px] max-w-[85px] truncate" title={a.terapeuta}>{a.terapeuta}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px] whitespace-nowrap">{a.area}</td>
                  <td className="px-1.5 py-2 text-left font-bold text-[#1a5276] text-[11px] max-w-[130px] truncate" title={a.paciente}>{a.paciente}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px]">{a.sexo}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px]">{a.edad}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px] whitespace-nowrap">{a.tipoSesion}</td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold whitespace-nowrap ${(a.estado || "").toLowerCase().includes("centro") ? 'bg-[#fef08a] text-[#78350f] border border-amber-300' : (a.estado || "").toLowerCase().includes("sin anticipa") ? 'bg-red-100 text-red-900 border border-red-300' : (a.estado || "").toLowerCase().includes("anticipad") || (a.estado || "").toLowerCase().includes("con anticipa") ? 'bg-orange-100 text-orange-900 border border-orange-300' : (a.estado || "").toLowerCase().includes("asist") ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-400'}`}>
                      {(a.estado || "").toLowerCase().includes("centro") ? 'Canceló el centro' : (a.estado || "").toLowerCase().includes("sin anticipa") ? 'Canceló S/A' : (a.estado || "").toLowerCase().includes("anticipad") || (a.estado || "").toLowerCase().includes("con anticipa") ? 'Canceló C/A' : (a.estado || "").toLowerCase().includes("asist") ? 'Asistió' : a.estado}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-slate-500 text-[11px] whitespace-nowrap">{a.frecuencia || "Única"}</td>
                  <td className="px-1 py-2 whitespace-nowrap">
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

                      const cleanLineForPill = (lineStr: string) => {
                        if (!lineStr) return "";
                        const validMethods = ["Efectivo", "Transferencia", "Tarjeta", "Por definir", "Beca", "Ninguno"];
                        const methodFound = validMethods.find(m => lineStr.toLowerCase().includes(m.toLowerCase()));
                        if (!methodFound) return lineStr.trim();
                        const match = lineStr.match(/\$([\d.]+)/);
                        if (match) {
                          return `${methodFound} $${match[1]}`;
                        }
                        return methodFound;
                      };

                      return (
                        <div className="w-full max-w-[110px] mx-auto flex flex-col items-stretch justify-center gap-0.5 my-0.5">
                          {lines.map((line, idx) => {
                            const cleaned = cleanLineForPill(line);
                            const isPorDefinir = cleaned.toLowerCase().replace(/\s+/g, "").includes("pordefinir");
                            const isNinguno = cleaned.toLowerCase().includes("ninguno");
                            return (
                              <span key={idx} className={`w-full border px-1 py-0.5 rounded text-[9px] font-bold block text-center whitespace-nowrap leading-tight shadow-xs ${isPorDefinir ? 'bg-red-500/20 text-red-800 border-red-300' : isNinguno ? 'bg-gray-500/20 text-slate-800 border-slate-300' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                                {cleaned}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-1 py-2 text-slate-500 text-[11px]">{a.pago || "SÍ"}</td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-bold text-slate-600 uppercase">{a.fact || "SÍ"}</span>
                      <button
                        type="button"
                        onClick={() => setPrefacturaModalData(a)}
                        className="bg-[#27ae60] hover:bg-[#219653] text-white font-black px-1.5 py-0.5 rounded text-[9px] shadow-2xs transition-colors cursor-pointer flex items-center gap-0.5 uppercase"
                        title="Generar Prefactura en formato PDF CREN"
                      >
                        <span>📄 PDF</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-[11px] whitespace-nowrap">
                    {(() => {
                      const estNormRow = (a.estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const isFreeCancelRow = (estNormRow.includes("con anticip") || estNormRow.includes("anticipad") || estNormRow.includes("centro")) && !estNormRow.includes("sin anticip");
                      const rawS = typeof a.saldo === "number" ? a.saldo : parseFloat(a.saldo || "0");
                      const sVal = isFreeCancelRow ? 0 : rawS;
                      if (isNaN(sVal) || Math.abs(sVal) < 0.01) {
                        return <span className="text-slate-800 font-semibold">$0.00</span>;
                      } else if (sVal < 0) {
                        return <span className="text-red-600 font-bold">-${Math.abs(sVal).toFixed(2)}</span>;
                      } else {
                        return <span className="text-green-600 font-bold">${sVal.toFixed(2)}</span>;
                      }
                    })()}
                  </td>
                  <td className="px-1 py-2 font-medium text-slate-600 text-[11px] whitespace-nowrap">{a.subtotal}</td>
                  <td className="px-1 py-2 font-semibold text-amber-600 text-[11px] whitespace-nowrap">{a.iva || "$0.00"}</td>
                  <td className="px-1 py-2 font-bold text-[#1a5276] text-[11px] whitespace-nowrap">{a.total}</td>
                  <td className="px-1 py-2 text-slate-500 text-[11px] max-w-[80px] truncate" title={a.obs}>{a.obs}</td>
                  <td className="px-1 py-2 text-center whitespace-nowrap">
                    {(() => {
                      const isPorDefinir = (a.metodoPago || "").toLowerCase().replace(/\s+/g, "").includes("pordefinir");
                      return (
                        <input
                          type="checkbox"
                          checked={isPorDefinir}
                          onChange={() => handleRevisionToggle(a)}
                          className="w-4 h-4 rounded border-slate-300 text-[#1a5276] focus:ring-[#1a5276] cursor-pointer accent-[#1a5276]"
                          title={isPorDefinir ? "Desmarcar revisión (Cambia Método de Pago a Transferencia)" : "Marcar gancho (Cambia Método de Pago a Por definir)"}
                        />
                      );
                    })()}
                  </td>
                  <td className="px-1 py-2 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
                        <button onClick={() => openEditModal(a)} className="text-slate-400 hover:text-[#1a5276]" title="Editar">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                      )}
                      {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
                        <button onClick={() => handleDeleteAsistencia(a.id)} className="text-slate-400 hover:text-red-600" title="Eliminar">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                    <td colSpan={20} className="px-4 py-8 text-center text-slate-400 font-medium">
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
                  <select name="terapeuta" value={editForm.terapeuta} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" disabled={userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit}>
                    <option value="">Seleccionar...</option>
                    {terapeutas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
                    <DateInput name="fecha" value={editForm.fecha} onChange={(val) => setEditForm((prev: any) => ({ ...prev, fecha: val }))} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hora</label>
                    <input type="time" name="hora" value={editForm.hora || ""} onChange={handleEditChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
                  </div>
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
                    <option value="Valoracion">Valoración</option>
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Precio de Terapia</label>
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
                {/* FILA ÚNICA EN MISMO RENGLÓN: ESTADO DE PAGO, MÉTODO DE PAGO, MONTO PAGADO Y PAGO MIX */}
                <div className="grid grid-cols-12 gap-1.5 items-end">
                  <div className="col-span-3">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase h-[24px] flex items-end mb-1 leading-tight">
                      Estado de Pago
                    </label>
                    <select
                      name="pago"
                      value={editForm.pago || "SÍ"}
                      onChange={handleEditChange}
                      className="w-full text-xs px-1.5 py-1.5 border border-slate-300 rounded-lg focus:border-[#2980b9] outline-none text-slate-900 font-bold bg-white cursor-pointer"
                    >
                      <option value="SÍ">SÍ (Pagado)</option>
                      <option value="NO">NO (Pendiente)</option>
                      <option value="Por definir">Por definir</option>
                      <option value="Beca">Beca</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase h-[24px] flex items-end mb-1 leading-tight">
                      Método de Pago
                    </label>
                    <select
                      name="metodoPago"
                      value={editForm.metodoPago || "Efectivo"}
                      onChange={(e) => {
                        handleEditChange(e);
                        if (e.target.value === "Mixto") setShowEditSegundoPago(true);
                      }}
                      className={`w-full text-xs px-1.5 py-1.5 border border-slate-300 rounded-lg focus:border-[#2980b9] outline-none font-medium cursor-pointer ${editForm.metodoPago === 'Ninguno' ? 'bg-gray-500/20 text-slate-800' : 'bg-white text-slate-900'}`}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Mixto">Mixto (MIX)</option>
                      <option value="Por definir">Por definir</option>
                      <option value="Beca">Beca</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase h-[24px] flex items-end mb-1 leading-tight">
                      Monto Pagado
                    </label>
                    <div className="relative w-full">
                      <span className="absolute left-1.5 top-1.5 text-slate-500 text-[10px] font-extrabold">$</span>
                      <input
                        type="number"
                        name="montoPago"
                        value={editForm.montoPago || ""}
                        onChange={handleEditChange}
                        placeholder="0"
                        className="w-full text-[11px] font-extrabold py-1.5 pl-4 pr-1 border border-slate-300 rounded-lg focus:border-[#2980b9] outline-none text-slate-900 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="h-[24px] mb-1"></div>
                    <button
                      type="button"
                      onClick={() => setShowEditSegundoPago(!showEditSegundoPago)}
                      className="w-full text-xs py-1.5 px-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {showEditSegundoPago ? "❌ ELM2ª" : "➕ MIX"}
                    </button>
                  </div>
                </div>

                {showEditSegundoPago && (
                  <div className="grid grid-cols-12 gap-1.5 p-2 bg-blue-50/60 rounded-lg border border-blue-200 animate-in fade-in items-end">
                    <div className="col-span-4">
                      <label className="block text-[9px] font-extrabold text-blue-900 uppercase mb-1 truncate">
                        Método 2
                      </label>
                      <select
                        name="metodoPago2"
                        value={editForm.metodoPago2 || "Transferencia"}
                        onChange={handleEditChange}
                        className="w-full text-xs px-1.5 py-1.5 border border-blue-300 rounded-lg focus:border-[#2980b9] outline-none text-slate-900 bg-white font-medium cursor-pointer"
                      >
                        <option value="Transferencia">Transferencia</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Por definir">Por definir</option>
                        <option value="Ninguno">Ninguno</option>
                      </select>
                    </div>
                    <div className="col-span-8">
                      <label className="block text-[9px] font-extrabold text-blue-900 uppercase mb-1 truncate">
                        Monto Pagado 2
                      </label>
                      <div className="relative w-full">
                        <span className="absolute left-1.5 top-1.5 text-blue-700 text-[10px] font-extrabold">$</span>
                        <input
                          type="number"
                          name="montoPago2"
                          value={editForm.montoPago2 || ""}
                          onChange={handleEditChange}
                          placeholder="0"
                          className="w-full text-[11px] font-extrabold py-1.5 pl-4 pr-1 border border-blue-300 rounded-lg focus:border-[#2980b9] outline-none text-slate-900 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* SOLICITAR FACTURA DESPLAZADO A LA DERECHA */}
                <div className="flex justify-end items-center gap-1.5 mt-1.5 pr-1">
                  <input type="checkbox" name="fact" id="edit_fact_chk" checked={editForm.fact} onChange={handleEditChange} className="w-3.5 h-3.5 rounded border-slate-300 accent-[#1a5276] cursor-pointer" />
                  <label htmlFor="edit_fact_chk" className="text-xs font-bold text-[#1a5276] cursor-pointer select-none">¿Solicitó factura?</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                  <textarea 
                    name="obs" 
                    value={editForm.obs} 
                    onChange={handleEditChange} 
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    rows={2}
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900 resize-none overflow-hidden" 
                  />
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
                  min="0"
                  placeholder="Ej. 0.00 o 1200"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-slate-900 text-sm">{prefacturaModalData.paciente}</p>
                      {(() => {
                        const targetName = (prefacturaModalData.paciente || "").trim().toLowerCase();
                        const patMatch = pacientes.find(p => (p.id && p.id === prefacturaModalData.pacienteId) || (p.paciente && p.paciente.trim().toLowerCase() === targetName));
                        const pId = patMatch?.displayId || prefacturaModalData.displayId || patMatch?.id || prefacturaModalData.pacienteId;
                        return pId ? (
                          <span className="text-[11px] font-extrabold text-[#1c4d6f] bg-amber-100/90 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                            ID: {pId}
                          </span>
                        ) : null;
                      })()}
                    </div>
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
                      <span>Total Recibo:</span>
                      <span>{prefacturaModalData.total}</span>
                    </div>
                  </div>
                </div>
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

