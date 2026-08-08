"use client";
import React, { useState, useEffect } from "react";
import { CountrySelector } from "@/components/CountrySelector";
import { updatePatient } from "@/app/actions/pacientes";

// Utilities from preregistros logic
function getDefaultCountryCode(phoneStr: string | null | undefined): string {
  if (!phoneStr) return "+52";
  if (phoneStr.startsWith("+1")) return "+1";
  const match = phoneStr.match(/^(\+\d{2,3})\s/);
  return match ? match[1] : "+52";
}

function stripCountryCode(phoneStr: string | null | undefined, code: string): string {
  if (!phoneStr) return "";
  if (phoneStr.startsWith(code + " ")) {
    return phoneStr.substring(code.length + 1);
  }
  return phoneStr;
}

function getPhonePlaceholder(timezone: string) {
  if (timezone === "America/Bogota") return "300 123 4567";
  if (timezone === "Europe/Madrid") return "612 345 678";
  return "55 1234 5678"; // Mexico default
}

export function EditPatientModal({ 
  patient, 
  onClose, 
  onSaved,
  userRole,
  allowTherapistEdit,
  systemTimezone = "America/Mexico_City"
}: { 
  patient: any;
  onClose: () => void;
  onSaved: (updatedPatient: any) => void;
  userRole: string;
  allowTherapistEdit: boolean;
  systemTimezone?: string;
}) {
  const isAdmin = userRole.toUpperCase() === "ADMIN" || userRole.toUpperCase() === "INVITADO";
  const canEdit = isAdmin || allowTherapistEdit;

  const [formData, setFormData] = useState<any>({
    displayId: patient?.displayId || (patient?.id ? patient.id.slice(-6).toUpperCase() : ""),
    nombre: patient?.name || "",
    fechaNacimiento: patient?.fechaNacimiento || "",
    sexo: patient?.sexo || "",
    fechaIngreso: patient?.fechaIngreso || "",
    origen: patient?.origen || "Google",
    medicoTratante: patient?.medicoTratante || "",
    escuela: patient?.escuela || "",

    pacienteContacto: "",
    madreNombre: patient?.madreNombre || "",
    padreNombre: patient?.padreNombre || "",
    otrosNombre: patient?.otrosNombre || "",
    madreContacto: "",
    padreContacto: "",
    otrosContacto: "",

    principalMadre: patient?.principalMadre || false,
    principalPadre: patient?.principalPadre || false,
    principalOtros: patient?.principalOtros || false,
    correoPrincipal: patient?.correoPrincipal || patient?.email || "",

    alergias: patient?.alergias || false,
    crisis: patient?.crisis || false,
    convulsiones: patient?.convulsiones || false,
    sensibilidad: patient?.sensibilidad || false,
    riesgoFuga: patient?.riesgoFuga || false,
    noSepara: patient?.noSepara || false,
    otrasAlertas: patient?.otrasAlertas || false,
    observacionesAdmin: patient?.observacionesAdmin || "",

    reglamentoFirmado: patient?.reglamentoFirmado || false,
    consentimientoFirmado: patient?.consentimientoFirmado || false,

    precioTerapia: patient?.precioTerapia || "500",
    metodoPago: patient?.metodoPago || "",
    estatus: patient?.estatus || "Activo",
  });

  const [pacienteCountryCode, setPacienteCountryCode] = useState("+52");
  const [madreCountryCode, setMadreCountryCode] = useState("+52");
  const [padreCountryCode, setPadreCountryCode] = useState("+52");
  const [otrosCountryCode, setOtrosCountryCode] = useState("+52");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      const pcCode = getDefaultCountryCode(patient.phone);
      const mcCode = getDefaultCountryCode(patient.madreContacto);
      const pdCode = getDefaultCountryCode(patient.padreContacto);
      const ocCode = getDefaultCountryCode(patient.otrosContacto);

      setPacienteCountryCode(pcCode);
      setMadreCountryCode(mcCode);
      setPadreCountryCode(pdCode);
      setOtrosCountryCode(ocCode);

      setFormData((prev: any) => ({
        ...prev,
        pacienteContacto: stripCountryCode(patient.phone, pcCode),
        madreContacto: stripCountryCode(patient.madreContacto, mcCode),
        padreContacto: stripCountryCode(patient.padreContacto, pdCode),
        otrosContacto: stripCountryCode(patient.otrosContacto, ocCode),
      }));
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const target = e.target as HTMLInputElement;
    const { name, type, value, checked } = target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSubmitting(true);

    const submissionData = {
      ...formData,
      pacienteContacto: formData.pacienteContacto ? `${pacienteCountryCode} ${formData.pacienteContacto}`.trim() : null,
      madreContacto: formData.madreContacto ? `${madreCountryCode} ${formData.madreContacto}`.trim() : null,
      padreContacto: formData.padreContacto ? `${padreCountryCode} ${formData.padreContacto}`.trim() : null,
      otrosContacto: formData.otrosContacto ? `${otrosCountryCode} ${formData.otrosContacto}`.trim() : null,
    };

    try {
      const res = await updatePatient(patient.id, submissionData);
      if (res.success) {
        alert("Paciente actualizado correctamente.");
        onSaved(res.data);
      } else {
        alert("Error: " + res.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-2 md:p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#2980b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Ficha de ID - Editar Paciente
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8 pb-4">
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
              1. DATOS PERSONALES DEL PACIENTE
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-extrabold text-slate-800 mb-1 uppercase flex items-center justify-between">
                  <span>Código / ID del Paciente</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Personalizable</span>
                </label>
                <input
                  type="text"
                  name="displayId"
                  value={formData.displayId}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Ej: 4SAW9Y o CREN-001"
                  className="w-full p-2 border border-amber-300 bg-amber-50/40 font-black text-amber-900 rounded text-sm focus:border-amber-600 outline-none uppercase tracking-wider"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Nombre y apellidos"
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Fecha Nacimiento</label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Sexo</label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white focus:border-[#2980b9] outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                  <option value="—">—</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Origen</label>
                <select
                  name="origen"
                  value={formData.origen}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none bg-white"
                >
                  <option value="Google">Google</option>
                  <option value="Redes Sociales">Redes Sociales</option>
                  <option value="Recomendación">Recomendación</option>
                  <option value="Médico">Médico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Médico Tratante / Terapeuta</label>
                <input
                  type="text"
                  name="medicoTratante"
                  value={formData.medicoTratante}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Nombre del terapeuta"
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Escuela / Colegio</label>
                <input
                  type="text"
                  name="escuela"
                  value={formData.escuela}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Nombre de escuela"
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Estado</label>
                <select
                  name="estatus"
                  value={formData.estatus}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  style={{ color: (formData.estatus || 'Activo').toLowerCase() === 'activo' ? '#065f46' : '#ffffff' }}
                  className={`w-full p-2 border rounded text-sm font-semibold outline-none transition-colors ${
                    (formData.estatus || 'Activo').toLowerCase() === 'activo'
                      ? 'bg-emerald-100 border-emerald-300'
                      : 'bg-slate-800 border-slate-900'
                  }`}
                >
                  <option value="Activo" className="bg-white text-slate-800 font-medium">Activo</option>
                  <option value="Inactivo" className="bg-white text-slate-800 font-medium">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Teléfono / Contacto Directo del Paciente</label>
                <div className="flex gap-2">
                  <CountrySelector
                    value={pacienteCountryCode}
                    onChange={(code) => canEdit && setPacienteCountryCode(code)}
                  />
                  <input
                    type="tel"
                    name="pacienteContacto"
                    value={formData.pacienteContacto}
                    onChange={handleInputChange}
                    readOnly={!canEdit}
                    placeholder={getPhonePlaceholder(systemTimezone)}
                    className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white focus:border-[#2980b9] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTACTOS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
              2. CONTACTOS DE FAMILIARES Y TUTORES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Madre */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Madre (Nombre)</label>
                <input
                  type="text"
                  name="madreNombre"
                  value={formData.madreNombre}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Nombre de la madre"
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none"
                />
                <label className="block text-xs font-bold text-slate-700 uppercase pt-1">Número de Contacto</label>
                <div className="flex gap-2">
                  <CountrySelector
                    value={madreCountryCode}
                    onChange={(code) => canEdit && setMadreCountryCode(code)}
                  />
                  <input
                    type="tel"
                    name="madreContacto"
                    value={formData.madreContacto}
                    onChange={handleInputChange}
                    readOnly={!canEdit}
                    placeholder={getPhonePlaceholder(systemTimezone)}
                    className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none focus:border-[#2980b9]"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="principalMadre"
                    checked={formData.principalMadre}
                    disabled={!canEdit}
                    onChange={(e) => {
                      if (!canEdit) return;
                      setFormData({
                        ...formData,
                        principalMadre: e.target.checked,
                        principalPadre: e.target.checked ? false : formData.principalPadre,
                        principalOtros: e.target.checked ? false : formData.principalOtros,
                      });
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>Contacto Principal</span>
                </label>
              </div>

              {/* Padre */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Padre (Nombre)</label>
                <input
                  type="text"
                  name="padreNombre"
                  value={formData.padreNombre}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Nombre del padre"
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none"
                />
                <label className="block text-xs font-bold text-slate-700 uppercase pt-1">Número de Contacto</label>
                <div className="flex gap-2">
                  <CountrySelector
                    value={padreCountryCode}
                    onChange={(code) => canEdit && setPadreCountryCode(code)}
                  />
                  <input
                    type="tel"
                    name="padreContacto"
                    value={formData.padreContacto}
                    onChange={handleInputChange}
                    readOnly={!canEdit}
                    placeholder={getPhonePlaceholder(systemTimezone)}
                    className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none focus:border-[#2980b9]"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="principalPadre"
                    checked={formData.principalPadre}
                    disabled={!canEdit}
                    onChange={(e) => {
                      if (!canEdit) return;
                      setFormData({
                        ...formData,
                        principalPadre: e.target.checked,
                        principalMadre: e.target.checked ? false : formData.principalMadre,
                        principalOtros: e.target.checked ? false : formData.principalOtros,
                      });
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>Contacto Principal</span>
                </label>
              </div>

              {/* Otros */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Otros (Nombre)</label>
                <input
                  type="text"
                  name="otrosNombre"
                  value={formData.otrosNombre}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Otro contacto"
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none"
                />
                <label className="block text-xs font-bold text-slate-700 uppercase pt-1">Número de Contacto</label>
                <div className="flex gap-2">
                  <CountrySelector
                    value={otrosCountryCode}
                    onChange={(code) => canEdit && setOtrosCountryCode(code)}
                  />
                  <input
                    type="tel"
                    name="otrosContacto"
                    value={formData.otrosContacto}
                    onChange={handleInputChange}
                    readOnly={!canEdit}
                    placeholder={getPhonePlaceholder(systemTimezone)}
                    className="flex-1 p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white outline-none focus:border-[#2980b9]"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="principalOtros"
                    checked={formData.principalOtros}
                    disabled={!canEdit}
                    onChange={(e) => {
                      if (!canEdit) return;
                      setFormData({
                        ...formData,
                        principalOtros: e.target.checked,
                        principalMadre: e.target.checked ? false : formData.principalMadre,
                        principalPadre: e.target.checked ? false : formData.principalPadre,
                      });
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>Contacto Principal</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Correo del Contacto Principal</label>
              <input
                type="email"
                name="correoPrincipal"
                value={formData.correoPrincipal}
                onChange={handleInputChange}
                readOnly={!canEdit}
                placeholder="ejemplo@correo.com"
                className="w-full md:w-1/2 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
              />
            </div>
          </div>

          {/* SECCIÓN 3: ALERTAS MÉDICAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
              3. ALERTAS MÉDICAS OPERATIVAS
            </h3>

            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="alergias" checked={formData.alergias} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>Alergias</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="crisis" checked={formData.crisis} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>Crisis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="convulsiones" checked={formData.convulsiones} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>Convulsiones</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="sensibilidad" checked={formData.sensibilidad} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>Sensibilidad Sensorial</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="riesgoFuga" checked={formData.riesgoFuga} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>Riesgo Fuga</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="noSepara" checked={formData.noSepara} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span>No se separa de mamá</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                <input type="checkbox" name="otrasAlertas" checked={formData.otrasAlertas} disabled={!canEdit} onChange={handleInputChange} className="rounded text-blue-600" />
                <span className="font-bold text-xs">Otras</span>
              </label>
            </div>
          </div>

          {/* SECCIÓN 4: ADMINISTRATIVAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
              4. VERIFICACIÓN Y OBSERVACIONES ADMINISTRATIVAS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="text-xs font-bold text-amber-900 uppercase">Ganchos de Verificación Manual:</div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="reglamentoFirmado"
                    checked={formData.reglamentoFirmado}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>Reglamento Firmado [X]</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentimientoFirmado"
                    checked={formData.consentimientoFirmado}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>Consentimiento Informado Firmado [X]</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Observaciones Administrativas</label>
                <textarea
                  name="observacionesAdmin"
                  value={formData.observacionesAdmin}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  rows={3}
                  placeholder="Notas internas..."
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Precio Terapia (MXN)</label>
                <input
                  type="text"
                  name="precioTerapia"
                  value={formData.precioTerapia}
                  onChange={handleInputChange}
                  readOnly={!canEdit}
                  placeholder="Ej: 500"
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-[#2980b9] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Método de Pago Preferido</label>
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-700 bg-white focus:border-[#2980b9] outline-none"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Por definir">Por definir</option>
                  <option value="Beca">Beca</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-100">
            {canEdit && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-2.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-lg text-sm hover:bg-slate-200 transition shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
