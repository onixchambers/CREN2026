"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitPreRegistration } from "@/app/actions/preregistro";

function RegistroConsentimientoContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const terapeutaParam = searchParams.get("terapeuta") || "Administrador";

  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("Masculino");
  const hoy = new Date().toISOString().split("T")[0];
  const [fechaIngreso, setFechaIngreso] = useState(hoy);
  const [origen, setOrigen] = useState("Google");
  const [medicoTratante, setMedicoTratante] = useState(terapeutaParam);
  const [escuela, setEscuela] = useState("");

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

  // Consentimiento legal México
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState(true);

  // Firma Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Setup Canvas para celular
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getTouchPos = (canvasDom: HTMLCanvasElement, touchEvent: TouchEvent) => {
    const rect = canvasDom.getBoundingClientRect();
    return {
      x: touchEvent.touches[0].clientX - rect.left,
      y: touchEvent.touches[0].clientY - rect.top,
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
    if (e.touches && e.touches[0]) {
      const pos = getTouchPos(canvas, e.nativeEvent);
      ctx.moveTo(pos.x, pos.y);
    } else {
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.touches && e.touches[0]) {
      e.preventDefault();
      const pos = getTouchPos(canvas, e.nativeEvent);
      ctx.lineTo(pos.x, pos.y);
    } else {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
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
    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg("Por favor ingresa el Nombre Completo del paciente.");
      return;
    }

    if (!aceptoTerminos) {
      setErrorMsg("Debes aceptar el Consentimiento Informado de Datos Sensibles de Salud.");
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
      const payload = {
        token: tokenParam,
        nombre,
        fechaNacimiento,
        sexo,
        fechaIngreso,
        origen,
        medicoTratante,
        escuela,
        madreNombre,
        madreContacto,
        principalMadre,
        padreNombre,
        padreContacto,
        principalPadre,
        otrosNombre,
        otrosContacto,
        principalOtros,
        correoPrincipal,
        alergias,
        crisis,
        convulsiones,
        sensibilidad,
        riesgoFuga,
        noSepara,
        otrasAlertas,
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
          CENTRO DE REHABILITACIÓN NEUROLÓGICA (CREN)
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

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y Apellidos del paciente"
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#1a5276] outline-none shadow-xs"
            />
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
              <span className="bg-slate-200 border border-slate-300 text-xs px-2.5 py-2 rounded-lg text-slate-800 font-bold flex items-center">🇵🇦 +507</span>
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
              <span className="bg-slate-200 border border-slate-300 text-xs px-2.5 py-2 rounded-lg text-slate-800 font-bold flex items-center">🇵🇦 +507</span>
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
              <span>No Separa de Mamá</span>
            </label>
          </div>
        </div>

        {/* Sección 4: Consentimiento Legal México & Firma */}
        <div className="space-y-3 pt-2">
          <div className="border-b border-slate-200 pb-1 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1a5276]">4. Términos y Condiciones de Uso de la Aplicación Móvil</h3>
            <button
              type="button"
              onClick={() => setShowLegalDoc(!showLegalDoc)}
              className="text-[11px] text-[#1a5276] underline font-bold hover:text-blue-800"
            >
              {showLegalDoc ? "Ocultar Contrato" : "Ver Contrato Completo"}
            </button>
          </div>

          {/* Visor de Términos Legales Completos de México */}
          {showLegalDoc && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 max-h-64 overflow-y-auto text-[11px] text-slate-700 space-y-3 leading-relaxed font-normal shadow-inner">
              <div className="bg-amber-100/70 border border-amber-300 p-2.5 rounded text-slate-900 font-bold text-[11px]">
                AVISO IMPORTANTE DE ACEPTACIÓN EXPRESA: AL DESCARGAR, INSTALAR, ACCEDER, REGISTRARSE O UTILIZAR ESTA APLICACIÓN MÓVIL, USTED RECONOCE QUE HA LEÍDO, ENTENDIDO Y ACEPTADO EN SU TOTALIDAD LOS PRESENTES TÉRMINOS Y CONDICIONES, LOS CUALES CONSTITUYEN UN CONTRATO DE ADHESIÓN CON VALIDEZ JURÍDICA Y EFECTOS VINCULANTES CONFORME AL CÓDIGO DE COMERCIO Y LA LEY FEDERAL DE PROTECCIÓN AL CONSUMIDOR DE MÉXICO.
              </div>

              <div>
                <strong className="text-slate-900">1. Marco Legal y Marco Conceptual</strong>
                <p>El presente contrato de adhesión regula el acceso y uso de la aplicación móvil (en adelante, la "Aplicación"), operada por Centro de Rehabilitación Neurológica CREN (en adelante, el "Prestador" o la "Empresa"), dentro del territorio de los Estados Unidos Mexicanos. Este documento se formula en riguroso cumplimiento de la legislación mexicana aplicable, incluyendo de manera enunciativa más no limitativa:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Ley Federal de Protección al Consumidor (LFPC) y sus disposiciones relativas a las transacciones efectuadas a través del uso de medios electrónicos, ópticos o de cualquier otra tecnología (Capítulo VIII BIS).</li>
                  <li>Código de Comercio de México, en lo conducente a la contratación electrónica, mensajes de datos y firma digital o electrónica (Artículos 89 al 114).</li>
                  <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.</li>
                  <li>Código Civil Federal respecto a la validez de las obligaciones contractuales y el consentimiento prestado por medios electrónicos.</li>
                </ul>
              </div>

              <div>
                <strong className="text-slate-900">2. Elegibilidad y Capacidad Jurídica</strong>
                <p>Para crear una cuenta y hacer uso de los servicios de la Aplicación, el Usuario debe contar con plena capacidad legal para contratar conforme a las leyes de los Estados Unidos Mexicanos (ser mayor de 18 años). Al aceptar estos Términos, el Usuario declara bajo protesta de decir verdad que cumple con dicho requisito de edad e idoneidad jurídica. En caso de ser menor de edad o incapaz, la Aplicación solo podrá ser utilizada bajo la directa supervisión, autorización y responsabilidad de sus padres o tutores legales.</p>
              </div>

              <div>
                <strong className="text-slate-900">3. Registro de Cuenta, Seguridad y Firma Electrónica</strong>
                <p><strong>3.1. Creación de Cuenta y Veracidad de la Información:</strong> El Usuario se obliga a proporcionar información veraz, exacta, completa y actualizada durante el registro. El uso de identidades falsas o la suplantación de terceros constituye una violación grave de este instrumento.</p>
                <p><strong>3.2. Custodia de Credenciales:</strong> El Usuario es el único responsable de mantener la confidencialidad de su clave de acceso. Todas las actividades realizadas desde su cuenta se presumirán legalmente efectuadas por el Usuario titular.</p>
                <p><strong>3.3. Equiparación de Firma Electrónica conforme al Código de Comercio:</strong> En términos del artículo 89 y demás relativos del Código de Comercio mexicano, la aceptación de los presentes Términos y Condiciones mediante la pulsación del botón de registro/aceptación o trazado de firma digital dentro de la Aplicación, constituye una Firma Electrónica Simplificada o Expresa que produce los mismos efectos jurídicos que la firma autógrafa, garantizando la autenticidad e integridad del consentimiento prestado.</p>
              </div>

              <div>
                <strong className="text-slate-900">4. Licencia de Uso de la Aplicación y Propiedad Intelectual</strong>
                <p>La Empresa otorga al Usuario una licencia limitada, no exclusiva, intransferible y revocable para uso personal y no comercial. Todos los derechos de propiedad industrial e intelectual sobre la Aplicación son propiedad exclusiva de la Empresa, protegidos por la Ley Federal del Derecho de Autor y la Ley Federal de Protección a la Propiedad Industrial de México.</p>
              </div>

              <div>
                <strong className="text-slate-900">5. Condiciones Económicas, Pagos y Facturación (SAT)</strong>
                <p>Precios exhibidos en Pesos Mexicanos (MXN) e incluirán el IVA correspondiente. Facturación fiscal disponible conforme a las normativas del Servicio de Administración Tributaria (SAT).</p>
              </div>

              <div>
                <strong className="text-slate-900">6. Reglas de Conducta y Usos Prohibidos</strong>
                <p>Queda prohibido utilizar la Aplicación para fines ilícitos, introducir virus o malware, acosar o realizar transacciones contrarias a la LFPIORPI.</p>
              </div>

              <div>
                <strong className="text-slate-900">7. Protección de Datos Personales y Privacidad</strong>
                <p>El tratamiento de los datos personales proporcionados por el Usuario se regirá estrictamente por lo dispuesto en nuestro Aviso de Privacidad Integral, redactado con apego a la LFPDPPP.</p>
              </div>

              <div>
                <strong className="text-slate-900">8. Limitación de Responsabilidad y Garantías</strong>
                <p>La responsabilidad total de la Empresa frente al Usuario por cualquier reclamación estará limitada conforme a los montos y alcances de la LFPC.</p>
              </div>

              <div>
                <strong className="text-slate-900">9. Cancelación, Modificaciones y Suspensión de Servicio</strong>
                <p>La Empresa se reserva el derecho de modificar o actualizar los presentes Términos y Condiciones en cualquier momento.</p>
              </div>

              <div>
                <strong className="text-slate-900">10. Jurisdicción, Competencia y Legislación Aplicable</strong>
                <p><strong>10.1. Conciliación ante PROFECO:</strong> En caso de cualquier controversia, las partes acuerdan someterse en primera instancia ante la Procuraduría Federal del Consumidor (PROFECO) de los Estados Unidos Mexicanos.</p>
                <p><strong>10.2. Tribunales Competentes:</strong> Las partes se someten expresamente a la jurisdicción y competencia de las leyes federales y de los Tribunales Competentes con sede en la Ciudad de México.</p>
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
              <strong>Aceptación Expresa:</strong> Confirmo que he leído, entiendo y acepto en su totalidad los Términos y Condiciones de Uso de la Aplicación Móvil y el Tratamiento de Datos Personales Sensibles de Salud conforme a la legislación mexicana.
            </span>
          </label>

          {/* Lienzo Canvas Firma */}
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
                className="w-full h-40 cursor-crosshair bg-white"
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
          className="w-full bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
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
