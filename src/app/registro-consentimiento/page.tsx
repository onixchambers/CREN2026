"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitPreRegistration } from "@/app/actions/preregistro";
import { CountrySelector } from "@/components/CountrySelector";
import { COUNTRY_CODES } from "@/lib/countryCodes";

function RegistroConsentimientoContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const terapeutaParam = searchParams.get("terapeuta") || "Administrador";

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("Masculino");
  const hoy = new Date().toISOString().split("T")[0];
  const [fechaIngreso, setFechaIngreso] = useState(hoy);
  const [origen, setOrigen] = useState("Google");
  const [medicoTratante, setMedicoTratante] = useState(terapeutaParam);
  const [escuela, setEscuela] = useState("");

  // Detección de País por IP para Selector Telefónico
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
        console.log("Fallback IP detection to +52 Mexico");
      }
    }
    detectUserCountry();
  }, []);

  // Contactos
  const [madreNombre, setMadreNombre] = useState("");
  const [madreContacto, setMadreContacto] = useState("");
  const [principalMadre, setPrincipalMadre] = useState(true);

  const [padreNombre, setPadreNombre] = useState("");
  const [padreContacto, setPadreContacto] = useState("");
  const [principalPadre, setPrincipalPadre] = useState(false);

  const [otrosNombre, setOtrosNombre] = useState("");
  const [otrosContacto, setOtrosContacto] = useState("");
  const [principalOtros, setPrincipalOtros] = useState(false);

  const [correoPrincipal, setCorreoPrincipal] = useState("");

  // Alertas
  const [alergias, setAlergias] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [convulsiones, setConvulsiones] = useState(false);
  const [sensibilidad, setSensibilidad] = useState(false);
  const [riesgoFuga, setRiesgoFuga] = useState(false);
  const [noSepara, setNoSepara] = useState(false);
  const [otrasAlertas, setOtrasAlertas] = useState(false);
  const [observacionesAdmin, setObservacionesAdmin] = useState("");

  // Consentimiento legal México CREN
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState(true);

  // Firma Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Setup Canvas para celular con trazo fino HD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCanvasPos = (canvasDom: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvasDom.getBoundingClientRect();
    const scaleX = canvasDom.width / rect.width;
    const scaleY = canvasDom.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.touches && e.touches[0]) {
      e.preventDefault();
    }

    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const pos = getCanvasPos(canvas, clientX, clientY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Bloqueo de múltiples clics simultáneos
    setErrorMsg("");

    const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();

    if (!nombres.trim() || !apellidos.trim()) {
      setErrorMsg("Por favor ingresa tanto los Nombres como los Apellidos del paciente.");
      return;
    }

    if (!aceptoTerminos) {
      setErrorMsg("Debes aceptar el Aviso de Privacidad de Datos Sensibles de Salud CREN.");
      return;
    }

    if (!hasSignature) {
      setErrorMsg("Por favor firma en el recuadro antes de confirmar.");
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL("image/png") : "";

    setSubmitting(true);

    try {
      const fullMadreContacto = madreContacto ? (madreContacto.startsWith("+") ? madreContacto : `${madreCountryCode} ${madreContacto}`) : "";
      const fullPadreContacto = padreContacto ? (padreContacto.startsWith("+") ? padreContacto : `${padreCountryCode} ${padreContacto}`) : "";
      const fullOtrosContacto = otrosContacto ? (otrosContacto.startsWith("+") ? otrosContacto : `${otrosCountryCode} ${otrosContacto}`) : "";

      const payload = {
        token: tokenParam,
        nombre: nombreCompleto,
        fechaNacimiento,
        sexo,
        fechaIngreso,
        origen,
        medicoTratante,
        escuela,
        madreNombre,
        madreContacto: fullMadreContacto,
        principalMadre,
        padreNombre,
        padreContacto: fullPadreContacto,
        principalPadre,
        otrosNombre,
        otrosContacto: fullOtrosContacto,
        principalOtros,
        correoPrincipal,
        alergias,
        crisis,
        convulsiones,
        sensibilidad,
        riesgoFuga,
        noSepara,
        otrasAlertas,
        observacionesAdmin,
        signatureDataUrl,
      };

      const res = await submitPreRegistration(payload, {
        ip: "Client Mobile",
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "Mobile Browser",
      });

      if (res.success) {
        setSubmittedData({
          paciente: nombre,
          hash: res.cryptoHash,
          fecha: res.signedAt,
        });
      } else {
        setErrorMsg(res.error || "Ocurrió un error al enviar el registro.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error de conexión al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!submittedData) return;
    const text = encodeURIComponent(
      `Hola! He completado el registro y firma digital de consentimiento para el paciente: *${submittedData.paciente}* en CREN.\n\nHash de Auditoría SHA-256:\n${submittedData.hash}\n\nFecha: ${new Date(submittedData.fecha).toLocaleString()}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if (submittedData) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-emerald-600">¡Registro y Firma Exitosos!</h2>
          <p className="text-sm text-slate-600">
            La información y el consentimiento de <strong className="text-slate-900">{submittedData.paciente}</strong> han sido recibidos y validados criptográficamente en CREN.
          </p>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-left space-y-1">
            <div className="text-[11px] font-mono text-slate-500">HASH DE AUDITORÍA (SHA-256):</div>
            <div className="text-[10px] font-mono text-emerald-700 break-all bg-emerald-50 p-2 rounded border border-emerald-200">
              {submittedData.hash}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Marca de tiempo UTC: {new Date(submittedData.fecha).toUTCString()}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleShareWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.159.252-1.034 3.774 3.864-.954.254.152z" />
              </svg>
              Notificar a la Terapeuta por WhatsApp
            </button>
            
            <p className="text-[11px] text-slate-500">
              El documento legal firmado ha sido enviado automáticamente a la aplicación CREN.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center py-6 px-3">
      {/* Header CREN */}
      <div className="max-w-xl w-full mb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-full text-emerald-700 font-bold text-sm mb-2 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          CENTRO DE REHABILITACIÓN ESPECIALIZADA Y NEURODESARROLLO (CREN)
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Ficha de Registro y Consentimiento Digital</h1>
        <p className="text-xs font-medium text-slate-600">Atención: {medicoTratante}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl w-full bg-white border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sección 1: Datos Generales */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1a5276]">1. Datos Generales del Paciente</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Nombres *</label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ingresa los nombres"
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ingresa los apellidos"
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-[#1a5276] outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Sexo</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-[#1a5276] outline-none shadow-xs"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Origen / Referencia</label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-[#1a5276] outline-none shadow-xs"
              >
                <option value="Google">Google</option>
                <option value="Redes Sociales">Redes Sociales</option>
                <option value="Recomendación">Recomendación</option>
                <option value="Médico">Médico</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Escuela / Colegio</label>
              <input
                type="text"
                value={escuela}
                onChange={(e) => setEscuela(e.target.value)}
                placeholder="Nombre de escuela"
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Contactos */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1a5276]">2. Contactos de los Padres / Tutores</h3>
          </div>

          {/* Madre */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">Madre (Nombre)</label>
            <input
              type="text"
              value={madreNombre}
              onChange={(e) => setMadreNombre(e.target.value)}
              placeholder="Nombre de la madre"
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 outline-none"
            />
            <div className="flex gap-2">
              <CountrySelector value={madreCountryCode} onChange={setMadreCountryCode} />
              <input
                type="tel"
                value={madreContacto}
                onChange={(e) => setMadreContacto(e.target.value)}
                placeholder="Número de contacto"
                className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer pt-1">
              <input type="checkbox" checked={principalMadre} onChange={(e) => {
                setPrincipalMadre(e.target.checked);
                if (e.target.checked) { setPrincipalPadre(false); setPrincipalOtros(false); }
              }} className="rounded accent-[#1a5276]" />
              <span>Contacto Principal</span>
            </label>
          </div>

          {/* Padre */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">Padre (Nombre)</label>
            <input
              type="text"
              value={padreNombre}
              onChange={(e) => setPadreNombre(e.target.value)}
              placeholder="Nombre del padre"
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 outline-none"
            />
            <div className="flex gap-2">
              <CountrySelector value={padreCountryCode} onChange={setPadreCountryCode} />
              <input
                type="tel"
                value={padreContacto}
                onChange={(e) => setPadreContacto(e.target.value)}
                placeholder="Número de contacto"
                className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer pt-1">
              <input type="checkbox" checked={principalPadre} onChange={(e) => {
                setPrincipalPadre(e.target.checked);
                if (e.target.checked) { setPrincipalMadre(false); setPrincipalOtros(false); }
              }} className="rounded accent-[#1a5276]" />
              <span>Contacto Principal</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Correo Electrónico Principal</label>
            <input
              type="email"
              value={correoPrincipal}
              onChange={(e) => setCorreoPrincipal(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Sección 3: Alertas Médicas */}
        <div className="space-y-2">
          <div className="border-b border-slate-200 pb-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1a5276]">3. Alertas Médicas Importantes</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={alergias} onChange={(e) => setAlergias(e.target.checked)} className="accent-[#1a5276]" />
              <span>Alergias</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={crisis} onChange={(e) => setCrisis(e.target.checked)} className="accent-[#1a5276]" />
              <span>Crisis</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={convulsiones} onChange={(e) => setConvulsiones(e.target.checked)} className="accent-[#1a5276]" />
              <span>Convulsiones</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={sensibilidad} onChange={(e) => setSensibilidad(e.target.checked)} className="accent-[#1a5276]" />
              <span>Sensibilidad Sensorial</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={riesgoFuga} onChange={(e) => setRiesgoFuga(e.target.checked)} className="accent-[#1a5276]" />
              <span>Riesgo Fuga</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={noSepara} onChange={(e) => setNoSepara(e.target.checked)} className="accent-[#1a5276]" />
              <span>No se separa de mamá</span>
            </label>
            <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 cursor-pointer col-span-2 sm:col-span-1">
              <input type="checkbox" checked={otrasAlertas} onChange={(e) => setOtrasAlertas(e.target.checked)} className="accent-[#1a5276]" />
              <span>Otros</span>
            </label>
          </div>
          {otrasAlertas && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">Escribir otra alerta u observación:</label>
              <input
                type="text"
                value={observacionesAdmin}
                onChange={(e) => setObservacionesAdmin(e.target.value)}
                placeholder="Especificar otra condición u observación..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Sección 4: Aviso de Privacidad Oficial CREN */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1a5276]">4. Aviso de Privacidad CREN (CDMX)</h3>
            <button
              type="button"
              onClick={() => setShowLegalDoc(!showLegalDoc)}
              className="text-[11px] text-[#1a5276] underline font-bold hover:text-blue-800"
            >
              {showLegalDoc ? "Ocultar Aviso" : "Ver Aviso Completo"}
            </button>
          </div>

          {/* Visor del Aviso de Privacidad Oficial CREN */}
          {showLegalDoc && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 max-h-64 overflow-y-auto text-[11px] text-slate-700 space-y-3 leading-relaxed font-normal shadow-inner">
              <div className="bg-emerald-100/70 border border-emerald-300 p-2.5 rounded text-emerald-900 font-bold text-[11px] text-center">
                CENTRO DE REHABILITACIÓN ESPECIALIZADA Y NEURODESARROLLO (CREN)<br/>
                Calle Petén #284, PB, Col. Narvarte, C.P. 03023, Benito Juárez, Ciudad de México<br/>
                Contacto: centrocren@gmail.com | Tel.: 55 16 87 1232
              </div>

              <div>
                <strong className="text-slate-900">1. Datos personales que recabamos</strong>
                <p>Para las finalidades que se mencionan más adelante, recabamos las siguientes categorías de datos personales:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>De identificación y contacto:</strong> Nombre completo, fecha de nacimiento, edad, teléfono y correo electrónico.</li>
                  <li><strong>De facturación (opcional):</strong> Registro Federal de Contribuyentes (RFC), domicilio fiscal y datos de pago.</li>
                  <li><strong>Clínicos (sensibles):</strong> Historial clínico, antecedentes médicos, diagnósticos, resultados de evaluaciones, planes de terapia y notas de evolución. Por la naturaleza sensible de estos datos, requerimos su consentimiento expreso y por escrito para su tratamiento.</li>
                  <li><strong>De menores de edad:</strong> En caso de que el paciente sea menor de edad, recabamos los datos personales del padre, madre o tutor.</li>
                </ul>
              </div>

              <div>
                <strong className="text-slate-900">2. Finalidades del tratamiento de sus datos</strong>
                <p><strong>A. Finalidades primarias (necesarias):</strong> Son las que dan origen a la relación jurídica entre usted y CREN.</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Crear y conservar su expediente clínico de acuerdo con la NOM-004-SSA3-2012.</li>
                  <li>Realizar valoraciones, diagnósticos y proporcionar la atención terapéutica (terapia física, psicológica y de lenguaje).</li>
                  <li>Comunicarnos con usted para la programación de citas y asuntos relacionados con su tratamiento.</li>
                  <li>Procesar facturas y cumplir con obligaciones legales.</li>
                </ul>
                <p className="mt-1"><strong>B. Finalidades secundarias (no necesarias):</strong></p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Enviar información sobre talleres, conferencias, promociones o materiales educativos.</li>
                  <li>Realizar encuestas de satisfacción y análisis estadísticos internos para mejorar nuestros servicios.</li>
                </ul>
                <p className="mt-1">Usted tiene el derecho de oponerse al tratamiento de sus datos para las finalidades secundarias enviando un correo a <strong>centrocren@gmail.com</strong>.</p>
              </div>

              <div>
                <strong className="text-slate-900">3. Consentimiento expreso para datos sensibles</strong>
                <p>Debido a que tratamos datos personales sensibles, como su información de salud, requerimos su consentimiento expreso para las finalidades primarias. Este consentimiento se solicita por escrito en su expediente clínico al momento de su primera consulta.</p>
              </div>

              <div>
                <strong className="text-slate-900">4. Transferencia de datos</strong>
                <p>Sus datos personales podrán ser transferidos a terceros únicamente en los siguientes casos:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><strong>Con profesionales de la salud:</strong> Con su consentimiento, podemos compartir su información con otros especialistas para realizar interconsultas o estudios.</li>
                  <li><strong>Con aseguradoras:</strong> Con su consentimiento, podemos compartir su información cuando sea necesario para obtener resultados o gestionar un reembolso.</li>
                  <li><strong>Con autoridades competentes:</strong> Si la ley lo exige, sus datos podrán ser transferidos a autoridades sin su consentimiento.</li>
                </ul>
                <p>Fuera de los casos mencionados, CREN no comparte sus datos con terceros.</p>
              </div>

              <div>
                <strong className="text-slate-900">5. Conservación y seguridad de los datos</strong>
                <p>Sus datos se conservarán durante 5 años a partir de la última fecha de atención, según lo establece la NOM-004-SSA3-2012. Después de este periodo, la información será eliminada de forma segura.</p>
              </div>

              <div>
                <strong className="text-slate-900">6. Derechos ARCO y revocación del consentimiento</strong>
                <p>Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), o revocar su consentimiento enviando una solicitud a <strong>centrocren@gmail.com</strong> o contactando a nuestro responsable de privacidad. Plazo de respuesta: 20 días hábiles.</p>
              </div>

              <div>
                <strong className="text-slate-900">7. Cambios a este aviso de privacidad</strong>
                <p>Este Aviso de Privacidad puede ser modificado por cambios en la ley o en nuestras políticas internas. La versión vigente estará disponible en la recepción de CREN y en nuestro sitio web: www.crentrocren.com (Fecha de última actualización: 2 de septiembre de 2025).</p>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={aceptoTerminos}
              onChange={(e) => setAceptoTerminos(e.target.checked)}
              className="mt-0.5 rounded accent-[#1a5276]"
            />
            <span className="text-xs text-slate-800 font-semibold leading-snug">
              <strong>Aceptación Expresa:</strong> Confirmo que he leído, entiendo y acepto en su totalidad el Aviso de Privacidad de Datos Personales Sensibles de Salud del Centro de Rehabilitación Especializada y de Neurodesarrollo (CREN).
            </span>
          </label>

          {/* Lienzo Canvas Firma Táctil */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-800">Dibuje su firma aquí con el dedo o stylus *</label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-rose-600 font-bold underline hover:text-rose-800"
                >
                  Limpiar Firma
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-400 touch-none relative shadow-xs">
              <canvas
                ref={canvasRef}
                width={800}
                height={350}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 cursor-crosshair bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-semibold">
                  ✍️ Trace su firma táctil aquí
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generando Registro y Certificado...</span>
            </>
          ) : (
            <>
              <span>✍️ CONFIRMAR Y ENVIAR REGISTRO</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegistroConsentimientoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4">Cargando formulario de consentimiento...</div>}>
      <RegistroConsentimientoContent />
    </Suspense>
  );
}
