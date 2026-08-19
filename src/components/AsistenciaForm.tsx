"use client";
import { useState, useEffect } from "react";
import { DateInput } from "@/components/DateInput";
import { getSystemIvaRate } from "@/app/actions/configuracion";
import { checkDuplicatePatient } from "@/app/actions/pacientes";
import { DuplicateWarningModal } from "@/components/DuplicateWarningModal";

export type AsistenciaFormData = {
  fecha: string;
  hora: string;
  terapeuta: string;
  area: string;
  tipoSesion: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteNac: string;
  pacienteSexo: string;
  pacienteEdad: string;
  precioTerapia: string;
  tipoPaquete: string;
  numeroSesiones: string;
  costoTotal: string;
  costoSesion: string;
  saldoDisponible: string;
  estadoAsistencia: string;
  metodoPago: string;
  montoPago: string;
  metodoPago2: string;
  montoPago2: string;
  frecuencia: string;
  solicitaFactura: boolean;
  observaciones: string;
};

interface AsistenciaFormProps {
  initialData?: Partial<AsistenciaFormData>;
  pacientes: any[];
  terapeutasFullData: any[];
  agendaCitas: any[];
  availableAreasInput: string[];
  therapyPrices: number[];
  userRole: string;
  userName: string;
  onSave: (data: AsistenciaFormData, subVal: number, ivaVal: number, totVal: number, metodoPagoFinal: string, isDraft?: boolean) => void;
  onCancel?: () => void;
  onAddPrice?: () => void;
  onClear?: () => void;
  isPrellenado?: boolean;
}

export const normalizeEstadoAsistencia = (val: string) => {
  if (!val) return "Asistio";
  const s = val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.includes("centro")) return "Cancelo el centro";
  if (s.includes("sin anticipacion") || s.includes("sin anticipa")) return "Cancelo sin anticipacion";
  if (s.includes("con anticipacion") || s.includes("anticipad") || s.includes("con anticipa")) return "Cancelo con anticipacion";
  if (s.includes("asist") || s === "asistio" || s === "asistió") return "Asistio";
  if (s.includes("agend") || s === "agendado") return "Agendado";
  return "Asistio";
};

export function AsistenciaForm({
  initialData,
  pacientes,
  terapeutasFullData,
  agendaCitas,
  availableAreasInput,
  therapyPrices,
  userRole,
  userName,
  onSave,
  onCancel,
  onAddPrice,
  onClear,
  isPrellenado = false
}: AsistenciaFormProps) {
  const getLocalToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split("T")[0];
  };
  const hoy = getLocalToday();

  const [formData, setFormData] = useState<AsistenciaFormData>({
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
    estadoAsistencia: "Asistio",
    metodoPago: "",
    montoPago: "",
    metodoPago2: "",
    montoPago2: "",
    frecuencia: "Única",
    solicitaFactura: false,
    observaciones: "",
    ...initialData
  });

  const [availableAreas, setAvailableAreas] = useState<string[]>(availableAreasInput);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSegundoPago, setShowSegundoPago] = useState(false);
  const [verTodosLosPacientes, setVerTodosLosPacientes] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    duplicates: any[];
    isDraft: boolean;
  }>({ isOpen: false, duplicates: [], isDraft: false });

  useEffect(() => {
    if (initialData) {
      const normEstado = initialData.estadoAsistencia ? normalizeEstadoAsistencia(initialData.estadoAsistencia) : "";
      const estNormInit = normEstado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isFreeCancelInit = (estNormInit.includes("con anticip") || estNormInit.includes("anticipad") || estNormInit.includes("centro")) && !estNormInit.includes("sin anticip");
      
      let resolvedArea = initialData.area;
      if (!resolvedArea && (initialData.terapeuta || userRole.toUpperCase() === "TERAPEUTA")) {
        const tName = initialData.terapeuta || userName;
        const matched = terapeutasFullData.find(t => t.name === tName || t.name.toLowerCase().includes(tName.toLowerCase()));
        if (matched && matched.especialidad) {
          const parts = matched.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
          if (parts.length > 0) resolvedArea = parts[0];
        }
      }

      const defaultMetodoInit = isFreeCancelInit ? (initialData.metodoPago && initialData.metodoPago !== "Efectivo" ? initialData.metodoPago : "Ninguno") : (initialData.metodoPago || "");

      setFormData(prev => ({ 
        ...prev, 
        ...initialData,
        metodoPago: defaultMetodoInit,
        solicitaFactura: prev.solicitaFactura || Boolean(initialData.solicitaFactura),
        estadoAsistencia: initialData.estadoAsistencia ? normalizeEstadoAsistencia(initialData.estadoAsistencia) : (prev.estadoAsistencia || "Asistio"),
        area: resolvedArea || prev.area || "Fisioterapia"
      }));

      if (initialData.metodoPago2) {
        setShowSegundoPago(true);
      }
    }
  }, [initialData, terapeutasFullData, userRole, userName]);

  useEffect(() => {
    if (terapeutasFullData.length > 0) {
      const activeTerapeuta = formData.terapeuta || (userRole.toUpperCase() === "TERAPEUTA" ? userName : null);
      
      let matched = null;
      if (activeTerapeuta) {
        const activeName = activeTerapeuta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        matched = terapeutasFullData.find(t => {
          const tName = (t.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return tName.includes(activeName) || activeName.includes(tName);
        });
      }

      let parts: string[] = [];
      if (matched && matched.especialidad) {
        parts = matched.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
      } else {
        terapeutasFullData.forEach(t => {
          if (t.especialidad) {
            parts = parts.concat(t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean));
          }
        });
        parts = Array.from(new Set(parts));
      }

      if (parts.length > 0) {
        setAvailableAreas(parts);
      }

      if (matched && matched.especialidad && (!formData.area || !parts.includes(formData.area))) {
        setFormData(prev => ({ ...prev, area: parts[0] || matched.especialidad }));
      } else if (userRole.toUpperCase() === "TERAPEUTA" && !formData.terapeuta) {
        const miTerapeuta = matched ? matched.name : (userName || terapeutasFullData[0]?.name);
        setFormData(prev => ({
          ...prev,
          terapeuta: miTerapeuta,
          area: formData.area || parts[0] || "Fisioterapia"
        }));
      } else if (formData.terapeuta && parts.length > 0 && (!formData.area || !parts.includes(formData.area))) {
        setFormData(prev => ({ ...prev, area: parts[0] || "" }));
      }
    }
  }, [formData.terapeuta, terapeutasFullData, userRole, userName]);

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
      const citaHoy = agendaCitas.find((c: any) => c.paciente === p.paciente && c.fecha === formData.fecha);
      let horaAgenda = formData.hora;
      let terapeutaAgenda = p.medicoTratante || formData.terapeuta;
      let tipoSesionAgenda = formData.tipoSesion;

      let estadoAsistenciaAgenda = formData.estadoAsistencia;

      if (citaHoy) {
         horaAgenda = citaHoy.hora || horaAgenda;
         terapeutaAgenda = citaHoy.terapeuta || terapeutaAgenda;
         tipoSesionAgenda = citaHoy.tipoServicio || tipoSesionAgenda;
         if (citaHoy.estado) {
           estadoAsistenciaAgenda = normalizeEstadoAsistencia(citaHoy.estado);
         }
      }

      let areaAgenda = formData.area;
      if (terapeutaAgenda && terapeutasFullData.length > 0) {
        const matchedT = terapeutasFullData.find(t => t.name === terapeutaAgenda || t.name.toLowerCase().includes(terapeutaAgenda.toLowerCase()));
        if (matchedT && matchedT.especialidad) {
          const tParts = matchedT.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
          if (tParts.length > 0) areaAgenda = tParts[0];
        }
      }

      setFormData(prev => ({
        ...prev,
        pacienteId: p.id,
        pacienteNombre: p.paciente,
        pacienteNac: p.nac !== "?" ? p.nac : "",
        pacienteSexo: normalizeSexo(p.sexo),
        pacienteEdad: p.edad,
        terapeuta: terapeutaAgenda,
        area: areaAgenda || prev.area || "Fisioterapia",
        hora: horaAgenda,
        tipoSesion: tipoSesionAgenda,
        estadoAsistencia: normalizeEstadoAsistencia(estadoAsistenciaAgenda),
        metodoPago: (() => {
          const normE = normalizeEstadoAsistencia(estadoAsistenciaAgenda).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const isFC = (normE.includes("con anticip") || normE.includes("anticipad") || normE.includes("centro")) && !normE.includes("sin anticip");
          return isFC ? "Ninguno" : prev.metodoPago;
        })(),
        saldoDisponible: p.saldoCalculado || "0.00",
        precioTerapia: p.precioTerapia || prev.precioTerapia,
        numeroSesiones: "1", 
        frecuencia: agendaCitas.find((c: any) => c.paciente === p.paciente) ? (() => {
          const f = (agendaCitas.find((c: any) => c.paciente === p.paciente).frecuencia || "").toLowerCase();
          return f === "diario" || f === "diaria" ? "Diaria" : f === "semanal" ? "Semanal" : f === "quincenal" ? "Quincenal" : f === "mensual" ? "Mensual" : prev.frecuencia;
        })() : prev.frecuencia
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pacienteId: "",
        pacienteNombre: val,
        pacienteNac: "",
        pacienteSexo: "",
        pacienteEdad: "",
        saldoDisponible: "0.00"
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "estadoAsistencia") {
      const norm = normalizeEstadoAsistencia(value);
      const sNorm = norm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isFreeCancel = (sNorm.includes("con anticip") || sNorm.includes("anticipad") || sNorm.includes("centro")) && !sNorm.includes("sin anticip");
      setFormData(prev => ({
        ...prev,
        estadoAsistencia: value,
        metodoPago: isFreeCancel ? "Ninguno" : (prev.metodoPago === "Ninguno" ? "Efectivo" : prev.metodoPago),
        montoPago: isFreeCancel ? "0" : prev.montoPago
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async (isDraft: boolean = false, forceSave: boolean = false) => {
    if (!formData.pacienteNombre || !formData.area || !formData.estadoAsistencia || !formData.tipoSesion || !formData.terapeuta) {
      alert("Por favor completa los campos principales (Paciente, Terapeuta, Área, Tipo de Sesión, Estado).");
      return;
    }

    if (!formData.pacienteId && !forceSave) {
      const dupCheck = await checkDuplicatePatient({
        nombre: formData.pacienteNombre,
        fechaNacimiento: formData.pacienteNac
      });

      if (dupCheck.success && dupCheck.hasDuplicates && dupCheck.duplicates.length > 0) {
        setDuplicateWarning({
          isOpen: true,
          duplicates: dupCheck.duplicates,
          isDraft
        });
        return;
      }
    }

    const parseMoney = (val: any) => parseFloat((val || "0").toString().replace(/[^0-9.-]/g, "")) || 0;
    const p1 = parseMoney(formData.montoPago);
    const p2 = showSegundoPago ? parseMoney(formData.montoPago2) : 0;
    const montoPagado = p1 + p2;
    const precioTerapia = parseMoney(formData.precioTerapia);

    const estNorm = normalizeEstadoAsistencia(formData.estadoAsistencia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");

    const isPagoEmpty = formData.montoPago === undefined || formData.montoPago === null || formData.montoPago.toString().trim() === "";

    if (!isFreeCancel && isPagoEmpty) {
      alert("Por favor ingresa un monto en el campo Pago (puedes ingresar 0 si el paciente aún no realiza su pago).");
      return;
    }

    let montoEfectivo = montoPagado;
    if (!isFreeCancel && montoPagado === 0 && precioTerapia > 0 && !formData.montoPago) {
      montoEfectivo = precioTerapia;
    }

    let totVal = isFreeCancel ? montoPagado : (montoEfectivo > 0 ? montoEfectivo : precioTerapia);

    const ivaPct = await getSystemIvaRate();
    const ivaDec = (ivaPct || 16) / 100;

    let subVal = totVal;
    let ivaVal = 0;
    let finalTotal = totVal;

    if (formData.solicitaFactura && totVal > 0) {
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
    } else if (formData.metodoPago && !formData.metodoPago.includes("$") && totVal > 0) {
      metodoPagoFinal = `${formData.metodoPago} $${totVal}`;
    }

    setDuplicateWarning({ isOpen: false, duplicates: [], isDraft: false });
    onSave(formData, subVal, ivaVal, finalTotal, metodoPagoFinal, isDraft);
  };

  const terapeutasOptions = (userRole.toUpperCase() === "TERAPEUTA" && formData.terapeuta) ? [formData.terapeuta] : terapeutasFullData.map(t => t.name);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
      <div className="p-5">
        <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4 text-[15px]">
          <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Asistencia
        </h3>

        <div className="bg-[#eef5fa] text-[#2980b9] p-3 rounded-md text-xs flex items-center gap-2 mb-6 border border-[#d1e6f5]">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          Selecciona tu área y el precio de la terapia. Registra la asistencia y el pago correspondiente.
        </div>

        <div className="space-y-5">
          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">FECHA</label>
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
                    ←
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
                    →
                  </button>
                </div>
              </div>
              <DateInput
                name="fecha"
                value={formData.fecha}
                onChange={(val) => {
                  const nextDate = typeof val === "string" ? val : (val?.target?.value || val);
                  setFormData(prev => ({ ...prev, fecha: nextDate }));
                }}
                className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900 bg-white cursor-pointer font-medium"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">HORA</label>
              <input 
                type="time" 
                name="hora" 
                value={formData.hora} 
                onChange={handleChange} 
                className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900 bg-white cursor-pointer font-medium" 
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TERAPEUTA</label>
              <select name="terapeuta" value={formData.terapeuta} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" disabled={userRole.toUpperCase() === "TERAPEUTA"}>
                {userRole.toUpperCase() !== "TERAPEUTA" && <option value="">Seleccionar...</option>}
                {terapeutasOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ÁREA</label>
              <select name="area" value={formData.area} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                <option value="">Seleccionar especialidad...</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="relative md:col-span-6">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">NOMBRE PACIENTE</label>
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
                type="text" 
                name="pacienteNombre" 
                autoComplete="off"
                value={formData.pacienteNombre} 
                onChange={(e) => {
                  handlePacienteChange(e);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Escribir para buscar paciente..."
                className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" 
              />
              {showDropdown && (
                <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {pacientes
                    .filter(p => {
                      if (userRole.toUpperCase() === "TERAPEUTA" && !verTodosLosPacientes) {
                        const isDocMatch = p.medicoTratante && p.medicoTratante.toLowerCase().includes(userName.toLowerCase());
                        if (!isDocMatch) return false;
                      }

                      const inputNorm = formData.pacienteNombre.toLowerCase().trim();
                      if (!inputNorm) return true;

                      const pNameNorm = p.paciente.toLowerCase().trim();
                      if (pNameNorm.includes(inputNorm) || inputNorm.includes(pNameNorm)) return true;

                      const inputTokens = inputNorm.split(/\s+/).filter(Boolean);
                      const pTokens = pNameNorm.split(/\s+/).filter(Boolean);
                      return inputTokens.every(tok => pTokens.some((pt: string) => pt.includes(tok) || tok.includes(pt)));
                    })
                    .map(p => (
                      <li 
                        key={p.id} 
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          let horaAgenda = formData.hora;
                          let terapeutaAgenda = p.medicoTratante || formData.terapeuta;
                          let tipoSesionAgenda = formData.tipoSesion;
                          let fechaAgenda = formData.fecha;

                          let citaMatch = agendaCitas.find((c: any) => c.paciente === p.paciente && c.fecha === formData.fecha);
                          if (!citaMatch) {
                            citaMatch = agendaCitas.find((c: any) => c.paciente === p.paciente && (c.estado === "Agendado" || c.estado === "Asistió"));
                          }

                          let estadoAgenda = formData.estadoAsistencia;
                          if (citaMatch && citaMatch.estado) {
                            estadoAgenda = normalizeEstadoAsistencia(citaMatch.estado);
                          }

                          let areaAgenda = formData.area;
                          if (terapeutaAgenda && terapeutasFullData.length > 0) {
                            const matchedT = terapeutasFullData.find(t => t.name === terapeutaAgenda || t.name.toLowerCase().includes(terapeutaAgenda.toLowerCase()));
                            if (matchedT && matchedT.especialidad) {
                              const tParts = matchedT.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
                              if (tParts.length > 0) areaAgenda = tParts[0];
                            }
                          }

                          setFormData(prev => ({
                            ...prev,
                            fecha: fechaAgenda,
                            pacienteId: p.id,
                            pacienteNombre: p.paciente,
                            pacienteNac: p.nac !== "—" ? p.nac : "",
                            pacienteSexo: normalizeSexo(p.sexo),
                            pacienteEdad: p.edad,
                            saldoDisponible: p.saldoCalculado || "0.00",
                            precioTerapia: p.precioTerapia || prev.precioTerapia,
                            numeroSesiones: "1",
                            hora: horaAgenda,
                            terapeuta: terapeutaAgenda,
                            area: areaAgenda || prev.area || "Fisioterapia",
                            estadoAsistencia: normalizeEstadoAsistencia(estadoAgenda),
                            tipoSesion: tipoSesionAgenda,
                            frecuencia: agendaCitas.find((c: any) => c.paciente === p.paciente) ? (() => {
                              const f = (agendaCitas.find((c: any) => c.paciente === p.paciente).frecuencia || "").toLowerCase();
                              return f === "diario" || f === "diaria" ? "Diaria" : f === "semanal" ? "Semanal" : f === "quincenal" ? "Quincenal" : f === "mensual" ? "Mensual" : prev.frecuencia;
                            })() : prev.frecuencia
                          }));
                          setShowDropdown(false);
                        }}
                      >
                        <span>{p.paciente}</span>
                        {p.nac && p.nac !== "—" && <span className="text-[10px] text-slate-400 font-mono">({p.nac})</span>}
                      </li>
                    ))}
                  {pacientes.filter(p => {
                    if (userRole.toUpperCase() === "TERAPEUTA" && !verTodosLosPacientes) {
                      const isDocMatch = p.medicoTratante && p.medicoTratante.toLowerCase().includes(userName.toLowerCase());
                      if (!isDocMatch) return false;
                    }
                    const inputNorm = formData.pacienteNombre.toLowerCase().trim();
                    if (!inputNorm) return true;

                    const pNameNorm = p.paciente.toLowerCase().trim();
                    if (pNameNorm.includes(inputNorm) || inputNorm.includes(pNameNorm)) return true;

                    const inputTokens = inputNorm.split(/\s+/).filter(Boolean);
                    const pTokens = pNameNorm.split(/\s+/).filter(Boolean);
                    return inputTokens.every(tok => pTokens.some((pt: string) => pt.includes(tok) || tok.includes(pt)));
                  }).length === 0 && (
                    <li className="px-3 py-2 text-sm text-slate-400 italic">No se encontraron pacientes coincidentes</li>
                  )}
                </ul>
              )}
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FECHA DE NACIMIENTO</label>
              <input type="date" name="pacienteNac" value={formData.pacienteNac} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SEXO DEL PACIENTE</label>
              <select name="pacienteSexo" value={formData.pacienteSexo} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                <option value="">Seleccionar...</option>
                <option value="M">M (Masculino)</option>
                <option value="F">F (Femenino)</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="—">—</option>
              </select>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TIPO DE SESIÓN</label>
              <select name="tipoSesion" value={formData.tipoSesion} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900 font-medium">
                <option value="">Seleccionar...</option>
                <option value="Valoracion">Valoración</option>
                <option value="Individual">Individual</option>
                <option value="Escuela">Escuela</option>
                <option value="Reposicion">Reposición</option>
                <option value="Terapia Grupal">Terapia grupal</option>
                <option value="Orientacion Padres">Orientación padres</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">FRECUENCIA</label>
              <select name="frecuencia" value={formData.frecuencia} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                <option value="Única">Única</option>
                <option value="Diaria">Diaria</option>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">PRECIO DE TERAPIA</label>
                {onAddPrice && (userRole.toUpperCase() === "ADMIN" || userRole.toUpperCase() === "ADMINISTRADOR" || userRole.toUpperCase() === "INVITADO") && (
                  <button
                    type="button"
                    onClick={onAddPrice}
                    className="text-[10px] font-bold text-[#27ae60] hover:text-[#219653] hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Agregar nuevo precio de terapia"
                  >
                    <span>+ Agregar</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <select name="precioTerapia" value={(() => {
                  if (!formData.precioTerapia) return "";
                  const num = parseFloat(String(formData.precioTerapia).replace(/[^0-9.-]/g, ""));
                  return isNaN(num) ? "" : num.toString();
                })()} onChange={handleChange} className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white font-medium">
                  <option value="">Seleccionar precio...</option>
                  <option value="0">$0.00</option>
                  {therapyPrices.map(p => (
                    <option key={p} value={p.toString()}>${p.toFixed(2)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">COSTO DE SESIÓN</label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                <input type="text" readOnly value={(() => {
                  const precioF = parseFloat(String(formData.precioTerapia || "0").replace(/[^0-9.-]/g, "")) || 0;
                  return precioF.toFixed(2);
                })()} className="w-full text-sm p-2 pl-6 border border-slate-300 rounded bg-slate-50 outline-none text-slate-600 font-bold" />
              </div>
            </div>
          </div>

          {/* ROW 4 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SALDO DISPONIBLE</label>
              {(() => {
                const parseMoney = (val: any) => parseFloat((val || "0").toString().replace(/[^0-9.-]/g, "")) || 0;
                const saldoPrevioF = parseMoney(formData.saldoDisponible);
                
                // Buscar si esta sesión ya existe en la base de datos para no duplicar su costo/pago en el saldo en tiempo real
                let existingCost = 0;
                let existingPayment = 0;
                const patientObj = pacientes.find(p => p.id === formData.pacienteId);
                if (patientObj && Array.isArray(patientObj.sessions)) {
                  const matchSession = patientObj.sessions.find((s: any) => {
                    let sDate = s.date;
                    if (sDate instanceof Date) {
                      sDate = sDate.toISOString().split("T")[0];
                    } else if (typeof sDate === "string") {
                      sDate = sDate.split("T")[0];
                    }
                    let noteDate = sDate;
                    if (s.notes) {
                      try {
                        const parsed = JSON.parse(s.notes);
                        if (parsed.fecha) noteDate = parsed.fecha;
                      } catch (e) {}
                    }
                    return noteDate === formData.fecha;
                  });

                  if (matchSession && matchSession.notes) {
                    try {
                      const n = JSON.parse(matchSession.notes);
                      const sDate = n.fecha || (matchSession.date instanceof Date ? matchSession.date.toISOString().split("T")[0] : String(matchSession.date).split("T")[0]);
                      const isBeforeCutoff = sDate && sDate <= "2026-06-30";
                      if (!isBeforeCutoff) {
                        existingPayment = parseFloat(n.montoPago || "0");
                        if ((isNaN(existingPayment) || existingPayment === 0) && n.metodoPago) {
                          const dollarMatches = n.metodoPago.match(/\$([\d.]+)/g);
                          if (dollarMatches) {
                            existingPayment = dollarMatches.reduce((sum: number, val: string) => sum + (parseFloat(val.replace("$", "")) || 0), 0);
                          }
                        }

                        existingCost = parseFloat(n.costoSesion || n.precioTerapia || "0");
                        const est = (n.estadoAsistencia || "").toLowerCase();
                        const isAttended = est === "asistio" || est === "cancelo sin anticipacion" || matchSession.status === "COMPLETED";
                        if ((isNaN(existingCost) || existingCost === 0) && isAttended) {
                          existingCost = existingPayment || parseFloat(patientObj.precioTerapia || "0");
                        }

                        const rawEstPago = (n.estadoAsistencia || n.estado || "").toString();
                        const estNormPago = rawEstPago.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const isFreeCancelPago = (estNormPago.includes("con anticip") || estNormPago.includes("anticipad") || estNormPago.includes("centro")) && !estNormPago.includes("sin anticip");
                        if (!isFreeCancelPago && existingPayment === 0 && existingCost > 0 &&
                          (n.pago === "SÍ" || n.pago === "SI" || n.pagado === true || n.pagado === "true")) {
                          existingPayment = existingCost;
                        }
                      }
                    } catch (e) {}
                  }
                }

                const trueSaldoPrevio = saldoPrevioF - (existingPayment - existingCost);

                const p1 = parseMoney(formData.montoPago);
                const p2 = showSegundoPago ? parseMoney(formData.montoPago2) : 0;
                const montoIngresado = p1 + p2;
                const costoSesionF = parseMoney(formData.precioTerapia);
                const estNorm = normalizeEstadoAsistencia(formData.estadoAsistencia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");

                const costoAplica = isFreeCancel ? 0 : costoSesionF;
                const saldoF = trueSaldoPrevio + montoIngresado - costoAplica;
                const isNeg = saldoF < 0;
                const formattedVal = isNeg ? `-$${Math.abs(saldoF).toFixed(2)}` : `$${saldoF.toFixed(2)}`;

                return (
                  <div className="relative">
                    <input type="text" readOnly value={formattedVal} className={`w-full text-sm p-2 border ${isNeg ? 'border-red-300 bg-red-50 text-red-700 font-extrabold' : 'border-green-300 bg-green-50 text-green-700 font-bold'} rounded outline-none`} />
                  </div>
                );
              })()}
            </div>
            <div className="md:col-span-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ESTADO ASISTENCIA</label>
              <select disabled={isPrellenado} name="estadoAsistencia" value={formData.estadoAsistencia} onChange={handleChange} className={`w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none ${isPrellenado ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}>
                <option value="">Seleccionar...</option>
                <option value="Agendado">Agendado</option>
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
            <div className="flex items-center gap-2 max-w-2xl mb-1">
              <label className="flex-1 text-[10px] font-bold text-slate-400 uppercase">MÉTODO DE PAGO (PAGOS MIXTOS DISPONIBLES)</label>
              <label className="w-32 text-[10px] font-bold text-slate-400 uppercase">PAGO</label>
              <div className="w-9"></div>
            </div>
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2">
                {(() => {
                  const estNorm = normalizeEstadoAsistencia(formData.estadoAsistencia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");
                  const isNinguno = formData.metodoPago === "Ninguno" || isFreeCancel;
                  return (
                    <select name="metodoPago" value={formData.metodoPago} onChange={handleChange} className={`flex-1 text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none ${isNinguno ? 'bg-gray-500/20 text-slate-800 font-medium' : 'text-slate-900 bg-white'}`}>
                      <option value="">Método 1...</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Por definir">Por definir</option>
                      <option value="Beca">Beca</option>
                      <option value="Ninguno">Ninguno</option>
                    </select>
                  );
                })()}
                <div className="relative w-32">
                  <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                  <input type="number" name="montoPago" value={formData.montoPago} onChange={handleChange} className="w-full text-sm p-2 pl-6 border border-slate-300 rounded bg-slate-50 outline-none text-slate-900" />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    if (!showSegundoPago) {
                      setShowSegundoPago(true);
                      const costo = parseFloat(formData.precioTerapia || "0");
                      const p1 = parseFloat(formData.montoPago || "0");
                      const resto = Math.max(0, costo - p1);
                      if (resto > 0 && !formData.montoPago2) {
                        setFormData(prev => ({ ...prev, montoPago2: resto.toString() }));
                      }
                    } else {
                      setShowSegundoPago(false);
                      setFormData(prev => ({ ...prev, metodoPago2: "", montoPago2: "" }));
                    }
                  }}
                  className={`p-2 border rounded transition-colors ${showSegundoPago ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  title={showSegundoPago ? "Quitar segundo método de pago" : "Agregar segundo método de pago (Pago Mixto)"}
                >
                  {showSegundoPago ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  )}
                </button>
              </div>

              {showSegundoPago && (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <select name="metodoPago2" value={formData.metodoPago2} onChange={handleChange} className="flex-1 text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900">
                    <option value="">Método 2 (Pago Mixto)...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Por definir">Por definir</option>
                    <option value="Beca">Beca</option>
                    <option value="Ninguno">Ninguno</option>
                  </select>
                  <div className="relative w-32">
                    <span className="absolute left-2 top-1.5 text-slate-500">$</span>
                    <input type="number" name="montoPago2" value={formData.montoPago2} onChange={handleChange} placeholder="Restante" className="w-full text-sm p-2 pl-6 border border-slate-300 rounded bg-slate-50 outline-none text-slate-900" />
                  </div>
                  <div className="w-9"></div>
                </div>
              )}
            </div>
          </div>

          {/* TOTALS & ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 items-end">
            <div className="flex items-center gap-2 pb-2 md:col-span-2">
              <input type="checkbox" name="solicitaFactura" id="asistencia_fact_chk" checked={Boolean(formData.solicitaFactura)} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 accent-[#1a5276] cursor-pointer" />
              <label htmlFor="asistencia_fact_chk" className="text-xs font-semibold text-[#1a5276] cursor-pointer select-none">¿Solicita factura?</label>
            </div>
            {(() => {
              const p1 = parseFloat((formData.montoPago || "0").replace(/[^0-9.-]/g, ""));
              const p2 = showSegundoPago ? parseFloat((formData.montoPago2 || "0").replace(/[^0-9.-]/g, "")) : 0;
              const montoIngresado = p1 + p2;
              const precioTerapia = parseFloat((formData.precioTerapia || "0").replace(/[^0-9.-]/g, ""));
              const estNorm = normalizeEstadoAsistencia(formData.estadoAsistencia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const isFreeCancel = (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro")) && !estNorm.includes("sin anticip");

              let montoEfectivo = montoIngresado;
              if (!isFreeCancel && montoIngresado === 0 && precioTerapia > 0 && !formData.montoPago) {
                montoEfectivo = precioTerapia;
              }

              const totalCalc = isFreeCancel ? montoIngresado : (montoEfectivo > 0 ? montoEfectivo : precioTerapia);
              
              let subCalc = totalCalc;
              let ivaCalc = 0;
              if (formData.solicitaFactura && totalCalc > 0) {
                ivaCalc = totalCalc * 0.16;
                subCalc = totalCalc - ivaCalc;
              }

              return (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SUBTOTAL (SIN IVA)</label>
                    <input type="text" readOnly value={`$${subCalc.toFixed(2)}`} className="w-full text-sm p-2 border border-slate-200 rounded bg-slate-100 outline-none text-slate-700 font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">IVA (16%)</label>
                    <input type="text" readOnly value={`$${ivaCalc.toFixed(2)}`} className="w-full text-sm p-2 border border-slate-200 rounded bg-slate-100 outline-none text-amber-700 font-bold" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TOTAL CON IVA</label>
                    <input type="text" readOnly value={`$${totalCalc.toFixed(2)}`} className="w-full text-sm p-2 border border-slate-200 rounded bg-slate-100 outline-none text-slate-900 font-extrabold" />
                  </div>
                </>
              );
            })()}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">OBSERVACIONES</label>
              <input type="text" name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Notas adicionales..." className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-900" />
            </div>
          </div>

          
          {/* BUTTONS */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => handleGuardar(false)} className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Finalizar Sesión
            </button>

            {onCancel && (
              <button type="button" onClick={onCancel} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                Cancelar
              </button>
            )}
            {!onCancel && (
              <button type="button" onClick={() => {
                if (onClear) {
                  onClear();
                } else {
                  setFormData({
                    ...formData,
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
                    solicitaFactura: false,
                    observaciones: ""
                  });
                  setShowSegundoPago(false);
                }
              }} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.36 2.72l1.92 1.92c.39.39.39 1.02 0 1.41L13.6 13.73l-3.3.47.47-3.3 7.68-7.68c.39-.39 1.02-.39 1.41 0zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <DuplicateWarningModal
        isOpen={duplicateWarning.isOpen}
        duplicates={duplicateWarning.duplicates}
        newPatientName={formData.pacienteNombre}
        onCancel={() => setDuplicateWarning({ isOpen: false, duplicates: [], isDraft: false })}
        onConfirmSaveAnyway={() => handleGuardar(duplicateWarning.isDraft, true)}
      />
    </div>
  );
}
