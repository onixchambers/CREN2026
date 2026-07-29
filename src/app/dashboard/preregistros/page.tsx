"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";
import { COUNTRY_CODES } from "@/lib/countryCodes";
import { CountrySelector } from "@/components/CountrySelector";
import {
  generatePreRegistrationToken,
  getPendingPreRegistrations,
  markPreRegistrationAsLoaded,
} from "@/app/actions/preregistro";
import { uploadInformePDFToDrive } from "@/app/actions/informes";
import { generateConsentPdfBase64 } from "@/lib/pdfGenerator";

export default function PreregistrosPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Administrador";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);

  // QR Modal & Preregistros
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [pendingPreRegs, setPendingPreRegs] = useState<any[]>([]);
  const [selectedPreReg, setSelectedPreReg] = useState<any>(null);

  useEffect(() => {
    async function loadPermission() {
      const { getAllowTherapistEdit } = await import("@/app/actions/configuracion");
      const allowed = await getAllowTherapistEdit();
      setAllowTherapistEdit(allowed);
    }
    loadPermission();
    refreshPendingPreRegs();
  }, []);

  const refreshPendingPreRegs = async () => {
    const res = await getPendingPreRegistrations();
    if (res.success && res.data) {
      setPendingPreRegs(res.data);
    }
  };

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    const res = await generatePreRegistrationToken(userName);
    if (res.success && res.token) {
      setQrToken(res.token);
      setShowQrModal(true);
    } else {
      alert(res.error || "Error al generar el QR.");
    }
    setLoadingQr(false);
  };

  const [madreCountryCode, setMadreCountryCode] = useState("+52");
  const [padreCountryCode, setPadreCountryCode] = useState("+52");
  const [otrosCountryCode, setOtrosCountryCode] = useState("+52");

  useEffect(() => {
    async function detectUserCountry() {
      try {
        const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const countryIso = data.country_code || data.country;
          const match = COUNTRY_CODES.find((c) => c.iso === countryIso);
          if (match) {
            setMadreCountryCode(match.code);
            setPadreCountryCode(match.code);
            setOtrosCountryCode(match.code);
          }
        }
      } catch (e) {
        console.log("IP country detection fallback to +52");
      }
    }
    detectUserCountry();
  }, []);

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const [formData, setFormData] = useState({
    nombre: "",
    fechaNacimiento: "",
    sexo: "Masculino",
    fechaIngreso: new Date().toISOString().split("T")[0],
    estatus: "Activo",
    origen: "Google",
    medicoTratante: userName,
    escuela: "",

    madreNombre: "",
    padreNombre: "",
    otrosNombre: "",
    madreContacto: "",
    padreContacto: "",
    otrosContacto: "",
    principalMadre: false,
    principalPadre: false,
    principalOtros: false,
    correoPrincipal: "",

    alergias: false,
    crisis: false,
    convulsiones: false,
    sensibilidad: false,
    riesgoFuga: false,
    noSepara: false,
    otrasAlertas: false,

    // Ganchos que la terapeuta debe verificar manualmente
    reglamentoFirmado: false,
    consentimientoFirmado: false,

    observacionesAdmin: "",
    foto: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const [fichas, setFichas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData((prev) => ({ ...prev, foto: base64String }));
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
      setFormData((prev) => ({ ...prev, foto: "" }));
    }
  };

  useEffect(() => {
    async function loadPatients() {
      const { getPatients } = await import("@/app/actions/pacientes");
      const result = await getPatients();
      if (result.success && result.data) {
        setFichas(result.data);
      }
    }
    loadPatients();
  }, []);

  const getFilteredPatients = () => {
    let filtered = fichas;
    if (userRole.toUpperCase() === "TERAPEUTA") {
      filtered = filtered.filter((f) => f.medicoTratante === userName);
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const searchResults = getFilteredPatients();

  // Cargar datos de Preregistro llenado por paciente en Ficha ID
  const handleLoadPreRegData = (preReg: any) => {
    setSelectedPreReg(preReg);
    setFormData({
      ...formData,
      nombre: preReg.name || "",
      fechaNacimiento: preReg.fechaNacimiento || "",
      sexo: preReg.sexo || "Masculino",
      fechaIngreso: preReg.fechaIngreso || new Date().toISOString().split("T")[0],
      origen: preReg.origen || "Google",
      medicoTratante: preReg.medicoTratante || userName,
      escuela: preReg.escuela || "",

      madreNombre: preReg.madreNombre || "",
      padreNombre: preReg.padreNombre || "",
      otrosNombre: preReg.otrosNombre || "",
      madreContacto: preReg.madreContacto || "",
      padreContacto: preReg.padreContacto || "",
      otrosContacto: preReg.otrosContacto || "",

      principalMadre: preReg.principalMadre || false,
      principalPadre: preReg.principalPadre || false,
      principalOtros: preReg.principalOtros || false,
      correoPrincipal: preReg.correoPrincipal || "",

      alergias: preReg.alergias || false,
      crisis: preReg.crisis || false,
      convulsiones: preReg.convulsiones || false,
      sensibilidad: preReg.sensibilidad || false,
      riesgoFuga: preReg.riesgoFuga || false,
      noSepara: preReg.noSepara || false,
      otrasAlertas: preReg.otrasAlertas || false,

      // Se mantienen DESMARCADOS para que la terapeuta los verifique manualmente
      reglamentoFirmado: false,
      consentimientoFirmado: false,
      observacionesAdmin: "",
      foto: "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (ficha: any) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para editar o modificar fichas de pacientes.");
      return;
    }
    setEditingId(ficha.id);

    const parsePhone = (phoneStr: string, setCode: (c: string) => void) => {
      if (!phoneStr) return "";
      const matched = COUNTRY_CODES.find((c) => phoneStr.startsWith(c.code));
      if (matched) {
        setCode(matched.code);
        return phoneStr.replace(matched.code, "").trim();
      }
      return phoneStr;
    };

    const mContact = parsePhone(ficha.madreContacto, setMadreCountryCode);
    const pContact = parsePhone(ficha.padreContacto, setPadreCountryCode);
    const oContact = parsePhone(ficha.otrosContacto, setOtrosCountryCode);

    setFormData({
      ...formData,
      ...ficha,
      nombre: ficha.name || ficha.nombre || "",
      madreContacto: mContact,
      padreContacto: pContact,
      otrosContacto: oContact,
      foto: ficha.foto || "",
    });
    setPhotoPreview(ficha.foto || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para eliminar pacientes.");
      return;
    }
    if (!confirm("¿Estás seguro de eliminar este paciente permanentemente?")) return;
    const { deletePatient, getPatients } = await import("@/app/actions/pacientes");
    const res = await deletePatient(id);
    if (res.success) {
      alert("Paciente eliminado.");
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setFichas(updated.data);
      }
    } else {
      alert(res.error);
    }
  };

  const handleLimpiar = () => {
    setEditingId(null);
    setSelectedPreReg(null);
    setSearchQuery("");
    setPhotoPreview(null);
    setFormData({
      ...formData,
      nombre: "",
      fechaNacimiento: "",
      sexo: "Masculino",
      origen: "Google",
      medicoTratante: userName,
      escuela: "",
      madreNombre: "",
      padreNombre: "",
      otrosNombre: "",
      madreContacto: "",
      padreContacto: "",
      otrosContacto: "",
      principalMadre: false,
      principalPadre: false,
      principalOtros: false,
      correoPrincipal: "",
      alergias: false,
      crisis: false,
      convulsiones: false,
      sensibilidad: false,
      riesgoFuga: false,
      noSepara: false,
      otrasAlertas: false,
      reglamentoFirmado: false,
      consentimientoFirmado: false,
      observacionesAdmin: "",
      foto: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      alert("El nombre del paciente es obligatorio.");
      return;
    }

    if (!formData.reglamentoFirmado || !formData.consentimientoFirmado) {
      if (!confirm("Atención: Los ganchos de Reglamento y Consentimiento Firmado no están marcados. ¿Deseas guardar de todos modos?")) {
        return;
      }
    }

    const { createPatient, updatePatient, getPatients } = await import("@/app/actions/pacientes");

    const finalFormData = {
      ...formData,
      madreContacto: formData.madreContacto ? (formData.madreContacto.startsWith("+") ? formData.madreContacto : `${madreCountryCode} ${formData.madreContacto}`) : "",
      padreContacto: formData.padreContacto ? (formData.padreContacto.startsWith("+") ? formData.padreContacto : `${padreCountryCode} ${formData.padreContacto}`) : "",
      otrosContacto: formData.otrosContacto ? (formData.otrosContacto.startsWith("+") ? formData.otrosContacto : `${otrosCountryCode} ${formData.otrosContacto}`) : "",
    };

    let result;
    if (editingId) {
      result = await updatePatient(editingId, finalFormData);
    } else {
      result = await createPatient(finalFormData);
    }

    if (result.success) {
      // Subir PDF firmado a Google Drive en la carpeta '[Nombre Terapeuta] Protección de Datos'
      if (selectedPreReg && selectedPreReg.signatureDataUrl) {
        try {
          const htmlBase64 = generateConsentPdfBase64({
            pacienteNombre: formData.nombre,
            fechaNacimiento: formData.fechaNacimiento,
            sexo: formData.sexo,
            medicoTratante: formData.medicoTratante || userName,
            escuela: formData.escuela,
            madreNombre: formData.madreNombre,
            madreContacto: formData.madreContacto,
            padreNombre: formData.padreNombre,
            padreContacto: formData.padreContacto,
            correoPrincipal: formData.correoPrincipal,
            signatureDataUrl: selectedPreReg.signatureDataUrl,
            cryptoHash: selectedPreReg.cryptoHash,
            signedAt: selectedPreReg.updatedAt || selectedPreReg.createdAt,
            ipAddress: selectedPreReg.ipAddress,
          });

          const pdfBlob = new Blob([Buffer.from(htmlBase64, "base64")], { type: "application/pdf" });
          const pdfFile = new File([pdfBlob], `Consentimiento_Firmado_${formData.nombre.replace(/\s+/g, "_")}.pdf`, { type: "application/pdf" });

          const driveFd = new FormData();
          driveFd.append("file", pdfFile);

          // Folder format requested by user: '[Terapeuta] Protección de Datos' (ej. Karla Protección de Datos)
          const subfolderName = `${formData.medicoTratante || userName} Protección de Datos`;
          driveFd.append("terapeutaName", subfolderName);

          const driveRes = await uploadInformePDFToDrive(driveFd);
          if (driveRes.success) {
            console.log("PDF de Protección de Datos guardado en Google Drive:", driveRes.webViewLink);
          }

          // Marcar preregistro como cargado
          await markPreRegistrationAsLoaded(selectedPreReg.id);
          refreshPendingPreRegs();
        } catch (driveErr) {
          console.warn("Error al subir PDF de protección de datos a Google Drive:", driveErr);
        }
      }

      alert(editingId ? "¡Ficha actualizada exitosamente!" : "¡Paciente registrado exitosamente en la base de datos!");
      handleLimpiar();
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setFichas(updated.data);
      }
    } else {
      alert(result.error);
    }
  };

  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/registro-consentimiento?token=${qrToken}&terapeuta=${encodeURIComponent(userName)}` : "";
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;

  const tableFilteredFichas = fichas;
  const totalPages = Math.ceil(tableFilteredFichas.length / 25) || 1;
  const currentTableData = tableFilteredFichas.slice((currentPage - 1) * 25, currentPage * 25);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      {/* HEADER DE PÁGINA */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold text-[#0e2f44]">Ficha de Identificación</h2>
        </div>

        {/* Botón QR Dinámico */}
        <button
          onClick={handleGenerateQr}
          disabled={loadingQr}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow flex items-center gap-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {loadingQr ? "Generando QR..." : "📱 Generar QR de Registro / Consentimiento"}
        </button>
      </div>

      {/* BANNER DE PREREGISTROS PENDIENTES RECIBIDOS */}
      {pendingPreRegs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-amber-900">
                📩 {pendingPreRegs.length} Registro(s) de Consentimiento Firmado(s) Recibidos
              </h3>
            </div>
            <button onClick={refreshPendingPreRegs} className="text-xs text-amber-700 underline font-semibold">
              Actualizar lista
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingPreRegs.map((preReg) => (
              <div key={preReg.id} className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{preReg.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Terapeuta: <strong>{preReg.medicoTratante || "Sin asignar"}</strong> • {formatDateStr(preReg.createdAt ? preReg.createdAt.toString().split("T")[0] : "")}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 mt-0.5">
                    Hash SHA-256: {preReg.cryptoHash ? preReg.cryptoHash.slice(0, 16) + "..." : "Firmado"}
                  </div>
                </div>
                <button
                  onClick={() => handleLoadPreRegData(preReg)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg shadow flex items-center gap-1 transition"
                >
                  <span>⚡ Cargar Datos</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO PRINCIPAL FICHA ID */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5">
          {/* BUSCADOR AUTOCOMPLETADO */}
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
            <h4 className="text-[11px] font-bold text-[#1a5276] uppercase mb-2">Buscador Inteligente (Autocompletar Formulario)</h4>
            <div className="relative">
              <input
                type="text"
                placeholder={userRole.toUpperCase() === "TERAPEUTA" ? "Buscar entre mis pacientes..." : "Buscar cualquier paciente registrado..."}
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#2980b9] text-slate-900"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => {
                        handleEdit(paciente);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="font-bold text-slate-800 text-sm">{paciente.name}</div>
                      <div className="text-xs text-slate-500">
                        {paciente.sexo || "No especificado"} • Nac: {paciente.fechaNacimiento || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
                1. DATOS DEL PACIENTE
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del paciente"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Fecha de Nacimiento</label>
                  <DateInput
                    value={formData.fechaNacimiento}
                    onChange={(val) => setFormData({ ...formData, fechaNacimiento: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Sexo</label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Fecha de Ingreso</label>
                  <DateInput
                    value={formData.fechaIngreso}
                    onChange={(val) => setFormData({ ...formData, fechaIngreso: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Origen del Paciente</label>
                  <select
                    name="origen"
                    value={formData.origen}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none bg-white"
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
                    placeholder="Nombre del médico o terapeuta"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Escuela / Colegio</label>
                  <input
                    type="text"
                    name="escuela"
                    value={formData.escuela}
                    onChange={handleInputChange}
                    placeholder="Nombre de la escuela"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none"
                  />
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
                    placeholder="Nombre de la madre"
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                  <CountrySelector
                    selectedCode={madreCountryCode}
                    onSelectCode={setMadreCountryCode}
                    phoneValue={formData.madreContacto}
                    onPhoneChange={(val) => setFormData({ ...formData, madreContacto: val })}
                    placeholder="Contacto de la madre"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      name="principalMadre"
                      checked={formData.principalMadre}
                      onChange={(e) => {
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
                    placeholder="Nombre del padre"
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                  <CountrySelector
                    selectedCode={padreCountryCode}
                    onSelectCode={setPadreCountryCode}
                    phoneValue={formData.padreContacto}
                    onPhoneChange={(val) => setFormData({ ...formData, padreContacto: val })}
                    placeholder="Contacto del padre"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      name="principalPadre"
                      checked={formData.principalPadre}
                      onChange={(e) => {
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
                    placeholder="Otro contacto"
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                  <CountrySelector
                    selectedCode={otrosCountryCode}
                    onSelectCode={setOtrosCountryCode}
                    phoneValue={formData.otrosContacto}
                    onPhoneChange={(val) => setFormData({ ...formData, otrosContacto: val })}
                    placeholder="Otro teléfono"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      name="principalOtros"
                      checked={formData.principalOtros}
                      onChange={(e) => {
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
                  placeholder="ejemplo@correo.com"
                  className="w-full md:w-1/2 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 3: ALERTAS MÉRICAS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
                3. ALERTAS MÉRICAS OPERATIVAS
              </h3>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="alergias" checked={formData.alergias} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>Alergias</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="crisis" checked={formData.crisis} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>Crisis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="convulsiones" checked={formData.convulsiones} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>Convulsiones</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="sensibilidad" checked={formData.sensibilidad} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>Sensibilidad Sensorial</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="riesgoFuga" checked={formData.riesgoFuga} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>Riesgo Fuga</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded border border-slate-200">
                  <input type="checkbox" name="noSepara" checked={formData.noSepara} onChange={handleInputChange} className="rounded text-blue-600" />
                  <span>No Separa de Mamá</span>
                </label>
              </div>
            </div>

            {/* SECCIÓN 4: VERIFICACIÓN TERAPEUTA Y DOCUMENTOS */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a5276] border-b border-slate-200 pb-2 mb-4">
                4. VERIFICACIÓN DE DOCUMENTOS Y FOTO (VERIFICACIÓN TERAPEUTA / ADMIN)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Foto */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Fotografía del Paciente</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-xs text-slate-600" />
                  {photoPreview && (
                    <img src={photoPreview} alt="Foto Preview" className="w-20 h-20 rounded-full object-cover mt-2 border border-slate-300" />
                  )}
                </div>

                {/* Ganchos manuales de verificación */}
                <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 uppercase">Ganchos de Verificación Manual (Terapeuta):</div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      name="reglamentoFirmado"
                      checked={formData.reglamentoFirmado}
                      onChange={handleInputChange}
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
                      className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                    />
                    <span>Consentimiento Informado Firmado [X]</span>
                  </label>
                </div>

                {/* Observaciones Admin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Observaciones Administrativas (Solo Admin)</label>
                  <textarea
                    name="observacionesAdmin"
                    value={formData.observacionesAdmin}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Notas internas..."
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* BOTONES ACCIÓN */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold px-6 py-2.5 rounded text-sm shadow transition"
              >
                {editingId ? "Actualizar Paciente" : "Guardar Paciente y Generar Documentos"}
              </button>

              <button
                type="button"
                onClick={handleLimpiar}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded text-sm transition"
              >
                Limpiar Formulario
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL DE QR DINÁMICO */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">📱 Código QR Dinámico de Registro</h3>
            <p className="text-xs text-slate-500">
              Muestra este código al paciente/tutor para que escanee con su celular y complete sus datos + firma digital.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block">
              <img src={qrImageSrc} alt="QR Code" className="w-56 h-56 mx-auto rounded shadow" />
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-slate-100 p-2 rounded break-all">
              {qrUrl}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrUrl);
                  alert("¡Enlace copiado al portapapeles!");
                }}
                className="flex-1 bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs hover:bg-slate-700 transition"
              >
                📋 Copiar Enlace
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(`Hola! Completa tu registro y firma digital de consentimiento en CREN aquí: ${qrUrl}`);
                  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                }}
                className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-emerald-700 transition"
              >
                💬 WhatsApp
              </button>
            </div>

            <button onClick={() => setShowQrModal(false)} className="w-full text-xs text-slate-400 font-semibold py-1">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
