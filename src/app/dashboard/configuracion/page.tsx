"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSettings, saveSettings } from "@/app/actions/configuracion";
import { MultiSelect } from "@/components/MultiSelect";
import { TimezoneSelector } from "@/components/TimezoneSelector";

export default function ConfiguracionPage() {
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const isMasterAdmin = session?.user?.name?.toLowerCase() === 'onixchambers';
  const isInvitado = userRole.toUpperCase() === 'INVITADO';
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);
  const [referenceKeys, setReferenceKeys] = useState("");
  const [ivaRate, setIvaRate] = useState<number>(16);

  const [resendApiKey, setResendApiKey] = useState("");
  const [resendDays, setResendDays] = useState<number>(1);
  const [resendRepeatDays, setResendRepeatDays] = useState<number>(0);
  const [resendEnabled, setResendEnabled] = useState(false);

  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappDays, setWhatsappDays] = useState<number>(1);
  const [whatsappRepeatDays, setWhatsappRepeatDays] = useState<number>(0);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [googleDriveClientEmail, setGoogleDriveClientEmail] = useState("");
  const [googleDrivePrivateKey, setGoogleDrivePrivateKey] = useState("");
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [timezone, setTimezone] = useState("America/Mexico_City");

  const [showResendKey, setShowResendKey] = useState(false);
  const [showWaKey, setShowWaKey] = useState(false);
  const [showDriveKey, setShowDriveKey] = useState(false);

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewingUserModal, setViewingUserModal] = useState<any | null>(null);
  
  const [gastos, setGastos] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const compressProfileImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 250;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          callback(compressed);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const defaultGastos = ["Contador", "Consultorio 7", "Consultorio 2", "Teléfono", "IMSS", "Celular", "Prest. Monterrey", "Hosting", "Material", "Google One", "Consultorio 5", "Consultorio 6", "Servicios prof.", "Limpieza", "4%", "Seguros", "Prest. Banamex", "Limpieza Prod.", "SAT", "Facturama"];

  useEffect(() => {
    loadSettings(month);
  }, [month]);

  async function loadSettings(m: string) {
    setIsLoading(true);
    try {
      const res = await getSettings(m);
      if (res.success && res.users) {
        setUsuarios(res.users.length > 0 ? res.users : [
          { id: Date.now(), usuario: "Administrador", rol: "Admin", contrasena: "admin2026", especialidad: "" }
        ]);
        setAllowTherapistEdit(res.settings?.allowTherapistEdit ?? true);
        setReferenceKeys(res.settings?.referenceKeys ?? "");
        setIvaRate(res.settings?.ivaRate ?? 16);

        setResendApiKey(res.settings?.resendApiKey || "");
        setResendDays(res.settings?.resendDays ?? 1);
        setResendRepeatDays(res.settings?.resendRepeatDays ?? 0);
        setResendEnabled(res.settings?.resendEnabled ?? false);

        setWhatsappApiKey(res.settings?.whatsappApiKey || "");
        setWhatsappDays(res.settings?.whatsappDays ?? 1);
        setWhatsappRepeatDays(res.settings?.whatsappRepeatDays ?? 0);
        setWhatsappEnabled(res.settings?.whatsappEnabled ?? false);

        setGoogleDriveEnabled(res.settings?.googleDriveEnabled ?? false);
        setGoogleDriveClientEmail(res.settings?.googleDriveClientEmail || "");
        setGoogleDrivePrivateKey(res.settings?.googleDrivePrivateKey || "");
        setGoogleDriveFolderId(res.settings?.googleDriveFolderId || "");
        setTimezone(res.settings?.timezone || "America/Mexico_City");
        
        const exps = res.expenses || [];
        let items: any[] = [];
        if (exps.length > 0) {
          items = exps.map((e: any, i: number) => ({ id: i, label: e.label, val: e.amount?.toString() || "" }));
        } else {
          items = defaultGastos.map((label, i) => ({ id: i, label, val: "" }));
        }
        items.sort((a, b) => (a.label || "").localeCompare(b.label || "", 'es', { sensitivity: 'base' }));
        setGastos(items);
      } else {
        console.error("Failed to load settings from server", res.error);
        alert("Error al cargar configuración: " + (res.error || "Error desconocido"));
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    if (userRole.toUpperCase() === "INVITADO") {
      alert("El usuario con rol de Invitado solo tiene permisos de lectura y no puede modificar ni borrar datos en Configuración.");
      return;
    }
    setIsSaving(true);
    try {
      // Ordenar gastos alfabéticamente antes de guardar
      const sortedGastos = [...gastos].sort((a, b) => (a.label || "").localeCompare(b.label || "", 'es', { sensitivity: 'base' }));
      const allExpenses = sortedGastos.map(g => ({ label: g.label, amount: parseFloat(g.val) || 0 }));

      const res = await saveSettings({
        users: usuarios,
        allowTherapistEdit,
        referenceKeys,
        ivaRate,
        resendApiKey,
        resendDays,
        resendRepeatDays,
        resendEnabled,
        whatsappApiKey,
        whatsappDays,
        whatsappRepeatDays,
        whatsappEnabled,
        googleDriveEnabled,
        googleDriveClientEmail,
        googleDrivePrivateKey,
        googleDriveFolderId,
        timezone,
        month,
        expenses: allExpenses
      } as any);

      if (res.success) {
        alert("¡Configuración guardada exitosamente!");
          window.location.reload();
      } else {
        alert("Hubo un error al guardar: " + (res.error || "Error desconocido"));
      }
    } catch (e: any) {
      console.error("Error saving settings:", e);
      alert("Hubo un error de conexión al guardar los datos: " + (e?.message || e?.toString()));
    } finally {
      setIsSaving(false);
    }
  };

  const addUsuario = () => {
    if (userRole.toUpperCase() === "INVITADO") {
      alert("El usuario con rol de Invitado no tiene permisos para agregar usuarios.");
      return;
    }
    setUsuarios([...usuarios, { id: Date.now(), usuario: "", rol: "Terapeuta", contrasena: "", especialidad: "" }]);
  };

  const removeUsuario = (id: any) => {
    if (userRole.toUpperCase() === "INVITADO") {
      alert("El usuario con rol de Invitado no tiene permisos para eliminar usuarios.");
      return;
    }
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  const addGasto = () => {
    if (userRole.toUpperCase() === "INVITADO") {
      alert("El usuario con rol de Invitado no tiene permisos para agregar gastos.");
      return;
    }
    const newG = [...gastos, { id: Date.now(), label: "", val: "" }];
    newG.sort((a, b) => (a.label || "").localeCompare(b.label || "", 'es', { sensitivity: 'base' }));
    setGastos(newG);
  };

  const removeGasto = (id: any) => {
    if (userRole.toUpperCase() === "INVITADO") {
      alert("El usuario con rol de Invitado no tiene permisos para eliminar gastos.");
      return;
    }
    setGastos(gastos.filter(g => g.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h2 className="text-xl font-bold text-[#1a5276]">Configuración</h2>
        </div>
        {!isInvitado ? (
          <button onClick={handleSave} disabled={isSaving} className="bg-[#27ae60] hover:bg-[#219653] disabled:opacity-50 text-white px-5 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        ) : (
          <div className="bg-blue-100 border border-blue-300 text-blue-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
            <span>👁️</span> Modo Lectura (Invitado) - Sin permisos de creación, edición o borrado
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* USUARIOS */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Usuarios
          </h3>
          
          <div className="space-y-4 mb-4">
            {[...usuarios].sort((a, b) => {
                const getWeight = (r: string) => {
                  const role = (r || "").toLowerCase();
                  if (role === 'admin') return 1;
                  if (role === 'invitado') return 2;
                  if (role === 'terapeuta') return 3;
                  if (role === 'contador') return 4;
                  return 5;
                };
                return getWeight(a.rol) - getWeight(b.rol);
              }).map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Photo Upload Avatar / Click to enlarge */}
                  <div 
                    onClick={() => setViewingUserModal(u)}
                    className="relative group shrink-0 self-end mb-0.5 cursor-pointer" 
                    title="Haz clic para agrandar foto y ver/editar perfil completo"
                  >
                    {u.image ? (
                      <img src={u.image} alt="User Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-[#1a5276] shadow-xs group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs shadow-xs group-hover:scale-105 transition-transform">
                        {u.usuario ? u.usuario.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-bold">🔍</span>
                    </div>
                  </div>

                  {/* Nombre de Usuario */}
                  <div className="flex flex-col gap-1 w-[135px] shrink-0">
                    <label className="text-[11px] font-bold text-slate-600">Usuario</label>
                    <input
                      type="text"
                      disabled={u.usuario?.trim().toLowerCase() === 'onixchambers'}
                      value={u.usuario}
                      className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                      onChange={(e) => {
                        const newName = e.target.value;
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === u.id);
                        const oldName = u.usuario || "";
                        const oldDefault = oldName.trim().toLowerCase().replace(/\s+/g, "") + "123";
                        newU[idx].usuario = newName;
                        const newClean = newName.trim().toLowerCase().replace(/\s+/g, "");
                        if (!u.contrasena || u.contrasena === oldDefault || u.contrasena === "123") {
                          newU[idx].contrasena = newClean ? `${newClean}123` : "";
                        }
                        setUsuarios(newU);
                      }}
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div className="flex flex-col gap-1 w-[190px] shrink-0">
                    <label className="text-[11px] font-bold text-slate-600">Correo</label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={u.email || ""}
                      className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white font-medium"
                      onChange={(e) => {
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === u.id);
                        newU[idx].email = e.target.value;
                        setUsuarios(newU);
                      }}
                    />
                  </div>

                  {/* Contacto / Teléfono */}
                  <div className="flex flex-col gap-1 w-[125px] shrink-0">
                    <label className="text-[11px] font-bold text-slate-600">Contacto</label>
                    <input
                      type="tel"
                      placeholder="Ej. +507 61234567"
                      value={u.phone || ""}
                      className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white font-medium"
                      onChange={(e) => {
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === u.id);
                        newU[idx].phone = e.target.value;
                        setUsuarios(newU);
                      }}
                    />
                  </div>

                  {/* Rol */}
                  <div className="flex flex-col gap-1 w-[110px] shrink-0">
                    <label className="text-[11px] font-bold text-slate-600">Rol</label>
                    <select
                      disabled={u.usuario?.trim().toLowerCase() === 'onixchambers'}
                      value={u.rol}
                      className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-500 outline-none bg-white font-semibold disabled:opacity-50"
                      onChange={(e) => {
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === u.id);
                        newU[idx].rol = e.target.value;
                        setUsuarios(newU);
                      }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Terapeuta">Terapeuta</option>
                      <option value="Contador">Contador</option>
                      <option value="Invitado">Invitado</option>
                    </select>
                  </div>

                  {/* Especialidades (En la misma línea) */}
                  {u.rol === 'Terapeuta' && (
                    <div className="flex flex-col gap-1 w-[190px] shrink-0">
                      <label className="text-[11px] font-bold text-slate-600">Especialidades</label>
                      <MultiSelect 
                        options={["Psicología", "Lenguaje", "Neurodesarrollo", "Fisioterapia", "Asesoría de crianza", "Rehabilitación", "Otro"]}
                        selected={u.especialidad ? u.especialidad.split(',').filter(Boolean) : []}
                        onChange={(selected) => {
                          const newU = [...usuarios];
                          const idx = newU.findIndex(x => x.id === u.id);
                          newU[idx].especialidad = selected.join(',');
                          setUsuarios(newU);
                        }}
                      />
                    </div>
                  )}

                  {/* Botón Borrar */}
                  {u.usuario?.trim().toLowerCase() !== 'onixchambers' && userRole.toUpperCase() !== 'INVITADO' && (
                    <button onClick={() => removeUsuario(u.id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors self-end mb-0.5" title="Eliminar usuario">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isInvitado && (
            <button onClick={addUsuario} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
              <span className="text-lg leading-none">+</span> Usuario
            </button>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* PERMISOS DEL SISTEMA */}
        <div className="p-6 space-y-5">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Permisos del Sistema
          </h3>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Permitir a terapeutas editar Pacientes</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowTherapistEdit} onChange={(e) => setAllowTherapistEdit(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-slate-600">Habilitado</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-xl border border-blue-200">
            <div>
              <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">🕒 Zona Horaria del Sistema (Uso Horario)</label>
              <p className="text-[11px] text-blue-800 mt-0.5">Se utilizará para registrar con exactitud los check-in y check-out de Horarios y las fechas de la clínica.</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <TimezoneSelector
                value={timezone}
                onChange={(tz) => setTimezone(tz)}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <div>
              <label className="block text-xs font-black text-amber-900 uppercase tracking-wide">🏷️ Porcentaje de IVA del Sistema (%)</label>
              <p className="text-[11px] text-amber-800 mt-0.5">Se aplicará globalmente a todas las asistencias, retención de honorarios y reportes de la clínica.</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <input 
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={ivaRate}
                onChange={(e) => setIvaRate(parseFloat(e.target.value) || 0)}
                className="w-24 p-2 border border-amber-300 rounded-lg font-black text-center text-slate-900 bg-white outline-none focus:border-amber-600 text-base shadow-sm"
              />
              <span className="font-extrabold text-amber-900 text-base">%</span>
            </div>
          </div>
        </div>
        <hr className="border-slate-100" />

        {/* NOTIFICACIONES Y RECORDATORIOS DE SALDO PENDIENTE */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-[#1a5276] font-bold flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Notificaciones Automáticas & Recordatorios de Saldo Pendiente
            </h3>
            <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-100">
              Resend & WhatsApp
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CORREO ELECTRÓNICO (RESEND) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Correo Electrónico (Resend)</h4>
                    <p className="text-[11px] text-slate-500">Envío automático de cobro vía Resend API</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={resendEnabled} onChange={(e) => setResendEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">API Key de Resend</label>
                <div className="relative">
                  <input 
                    type={showResendKey ? "text" : "password"}
                    placeholder="re_123456789..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:border-blue-500 outline-none bg-white"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowResendKey(!showResendKey)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showResendKey ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primer Recordatorio</label>
                  <select 
                    value={resendDays}
                    onChange={(e) => setResendDays(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value={1}>1 día después de la sesión</option>
                    <option value={2}>2 días después de la sesión</option>
                    <option value={3}>3 días después de la sesión</option>
                    <option value={5}>5 días después de la sesión</option>
                    <option value={7}>7 días después (1 semana)</option>
                    <option value={15}>15 días después (Quincenal)</option>
                    <option value={30}>30 días después (Mensual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repetir Hasta que Pague</label>
                  <select 
                    value={resendRepeatDays}
                    onChange={(e) => setResendRepeatDays(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value={0}>No repetir (Enviar solo 1 vez)</option>
                    <option value={1}>Cada 24 horas (Diariamente)</option>
                    <option value={2}>Cada 2 días</option>
                    <option value={3}>Cada 3 días</option>
                    <option value={5}>Cada 5 días</option>
                    <option value={7}>Cada 7 días (Semanal)</option>
                    <option value={15}>Cada 15 días (Quincenal)</option>
                    <option value={30}>Cada 30 días (Mensual)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* WHATSAPP */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">WhatsApp</h4>
                    <p className="text-[11px] text-slate-500">Recordatorios automáticos vía WhatsApp API</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Token de WhatsApp</label>
                <div className="relative">
                  <input 
                    type={showWaKey ? "text" : "password"}
                    placeholder="Token o API Key de WhatsApp..."
                    value={whatsappApiKey}
                    onChange={(e) => setWhatsappApiKey(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:border-green-500 outline-none bg-white"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowWaKey(!showWaKey)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showWaKey ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primer Recordatorio</label>
                  <select 
                    value={whatsappDays}
                    onChange={(e) => setWhatsappDays(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:border-green-500 outline-none bg-white"
                  >
                    <option value={1}>1 día después de la sesión</option>
                    <option value={2}>2 días después de la sesión</option>
                    <option value={3}>3 días después de la sesión</option>
                    <option value={5}>5 días después de la sesión</option>
                    <option value={7}>7 días después (1 semana)</option>
                    <option value={15}>15 días después (Quincenal)</option>
                    <option value={30}>30 días después (Mensual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repetir Hasta que Pague</label>
                  <select 
                    value={whatsappRepeatDays}
                    onChange={(e) => setWhatsappRepeatDays(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:border-green-500 outline-none bg-white"
                  >
                    <option value={0}>No repetir (Enviar solo 1 vez)</option>
                    <option value={1}>Cada 24 horas (Diariamente)</option>
                    <option value={2}>Cada 2 días</option>
                    <option value={3}>Cada 3 días</option>
                    <option value={5}>Cada 5 días</option>
                    <option value={7}>Cada 7 días (Semanal)</option>
                    <option value={15}>Cada 15 días (Quincenal)</option>
                    <option value={30}>Cada 30 días (Mensual)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* GOOGLE DRIVE SERVICE ACCOUNT */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Google Drive API (Cuenta de Servicio / Service Account)</h4>
                  <p className="text-[11px] text-slate-500">Guardar automáticamente los informes PDF en Google Drive</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={googleDriveEnabled} onChange={(e) => setGoogleDriveEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico de Cuenta de Servicio (Client Email)</label>
                <input 
                  type="text" 
                  placeholder="ej. servicio-cren@proyecto.iam.gserviceaccount.com"
                  value={googleDriveClientEmail}
                  onChange={(e) => setGoogleDriveClientEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 outline-none bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ID de Carpeta en Google Drive (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="ID de carpeta (ej. 1A2b3C4d5E6f7G...)"
                  value={googleDriveFolderId}
                  onChange={(e) => setGoogleDriveFolderId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-emerald-500 outline-none bg-white font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Clave Privada RSA / Private Key (BEGIN PRIVATE KEY)</label>
                  <button 
                    type="button" 
                    onClick={() => setShowDriveKey(!showDriveKey)}
                    className="text-xs text-emerald-700 hover:underline font-bold"
                  >
                    {showDriveKey ? "Ocultar Key" : "Ver Key"}
                  </button>
                </div>
                <textarea 
                  rows={3}
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                  value={showDriveKey ? googleDrivePrivateKey : (googleDrivePrivateKey ? "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••" : "")}
                  onChange={(e) => setGoogleDrivePrivateKey(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:border-emerald-500 outline-none bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Pega aquí el valor completo de <code>private_key</code> proveniente del archivo JSON de credenciales de Google Cloud Console.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* GASTOS OPERATIVOS */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-[#1a5276] font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Gastos Operativos
            </h3>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Mes a configurar:</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="p-1.5 border border-slate-300 rounded text-xs font-bold text-[#1a5276] focus:border-blue-500 outline-none" />
            </div>
          </div>

          {/* CUADRO RESUMEN DE TOTAL DE GASTOS OPERATIVOS Y OPCIONES DE ORDEN */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0e2f44] text-white p-4 rounded-xl shadow-sm mb-6 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">📊 Suma Total de Gastos Operativos ({month})</span>
              <p className="text-3xl font-black text-green-400 mt-0.5">
                ${gastos.reduce((sum, g) => sum + (parseFloat(g.val) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  const sorted = [...gastos].sort((a, b) => (a.label || "").localeCompare(b.label || "", 'es', { sensitivity: 'base' }));
                  setGastos(sorted);
                }}
                className="text-xs px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                🔤 Nombre (A-Z)
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  const sorted = [...gastos].sort((a, b) => (parseFloat(b.val) || 0) - (parseFloat(a.val) || 0));
                  setGastos(sorted);
                }}
                className="text-xs px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                💰 Monto (Mayor a Menor)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-4">
            {gastos.map((gasto, i) => (
              <div key={gasto.id} className="flex items-center gap-2">
                <input type="text" placeholder="Nombre del gasto" value={gasto.label} onChange={(e) => {
                  const newG = [...gastos];
                  newG[i].label = e.target.value;
                  setGastos(newG);
                }} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-900 font-medium focus:border-blue-500 outline-none text-slate-900" />
                
                <div className="relative w-1/3">
                  <span className="absolute left-2.5 top-2 text-slate-500 text-sm">$</span>
                  <input type="text" placeholder="Monto" value={gasto.val} onChange={(e) => {
                    const newG = [...gastos];
                    newG[i].val = e.target.value;
                    setGastos(newG);
                  }} className="w-full p-2 pl-6 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900" />
                </div>
                
                {userRole.toUpperCase() !== "INVITADO" && (
                  <button onClick={() => removeGasto(gasto.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors" title="Eliminar gasto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {!isInvitado && (
            <button onClick={addGasto} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Agregar Gasto
            </button>
          )}
        </div>
        <hr className="border-slate-100" />

        {/* CLAVES DE REFERENCIA */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Claves de Referencia (Médicos/Escuelas)
          </h3>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded border border-blue-100 flex items-start gap-3 mb-6">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            <p className="text-sm">Configura las claves de validación para las terapeutas (separadas por comas).</p>
          </div>

          <div className="flex items-center gap-4 max-w-xl mb-6">
            <label className="text-sm font-semibold text-slate-700 w-32">Claves de Referencia</label>
            <input type="text" disabled={isInvitado} value={referenceKeys} onChange={(e) => setReferenceKeys(e.target.value)} placeholder="Ej: CREN2026, CLINICA10" className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900 disabled:bg-slate-100 disabled:text-slate-500" />
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        {!isInvitado && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
            <button onClick={handleSave} disabled={isSaving} className="bg-[#27ae60] hover:bg-[#219653] disabled:opacity-50 text-white px-6 py-2.5 rounded text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        )}

      </div>

      {/* MODAL PERFIL ENGRANDECIDO (AL HACER CLIC EN LA FOTO DE CUALQUIER USUARIO) */}
      {viewingUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="text-lg font-bold text-[#1a5276]">Perfil de {viewingUserModal.usuario}</h3>
              </div>
              <button
                onClick={() => setViewingUserModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Foto Agrandada Editable */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative group cursor-pointer" title="Haz clic para cambiar foto de perfil">
                <input
                  type="file"
                  accept="image/*"
                  id="modalPhotoInput"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      compressProfileImage(file, (base64) => {
                        setViewingUserModal((prev: any) => ({ ...prev, image: base64 }));
                        const newU = [...usuarios];
                        const idx = newU.findIndex(x => x.id === viewingUserModal.id);
                        if (idx !== -1) {
                          newU[idx].image = base64;
                          setUsuarios(newU);
                        }
                      });
                    }
                  }}
                />
                <label htmlFor="modalPhotoInput" className="cursor-pointer block relative">
                  {viewingUserModal.image ? (
                    <img
                      src={viewingUserModal.image}
                      alt="User Avatar"
                      className="w-28 h-28 rounded-full object-cover border-4 border-[#1a5276] shadow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-extrabold text-slate-600 text-4xl shadow-inner">
                      {viewingUserModal.usuario ? viewingUserModal.usuario.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-base font-bold">📷</span>
                    <span className="text-white text-[11px] font-semibold">Cambiar Foto</span>
                  </div>
                </label>
              </div>
              <div className="text-center">
                <span className={`inline-block px-2.5 py-0.5 mt-1 rounded text-xs font-extrabold uppercase ${viewingUserModal.rol === 'Admin' ? 'bg-red-500/10 text-red-700 border border-red-200' : viewingUserModal.rol === 'Contador' ? 'bg-amber-500/10 text-amber-700 border border-amber-200' : viewingUserModal.rol === 'Invitado' ? 'bg-blue-500/10 text-blue-700 border border-blue-200' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'}`}>
                  {viewingUserModal.rol}
                </span>
              </div>
            </div>

            {/* Formulario Editable */}
            <div className="space-y-4 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Usuario</label>
                <input
                  type="text"
                  disabled={viewingUserModal.usuario?.trim().toLowerCase() === 'onixchambers'}
                  value={viewingUserModal.usuario}
                  onChange={(e) => {
                    const val = e.target.value;
                    setViewingUserModal((prev: any) => ({ ...prev, usuario: val }));
                    const newU = [...usuarios];
                    const idx = newU.findIndex(x => x.id === viewingUserModal.id);
                    if (idx !== -1) {
                      newU[idx].usuario = val;
                      setUsuarios(newU);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white font-semibold disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={viewingUserModal.email || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setViewingUserModal((prev: any) => ({ ...prev, email: val }));
                    const newU = [...usuarios];
                    const idx = newU.findIndex(x => x.id === viewingUserModal.id);
                    if (idx !== -1) {
                      newU[idx].email = val;
                      setUsuarios(newU);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Contacto / Teléfono</label>
                <input
                  type="tel"
                  placeholder="Ej. +507 61234567"
                  value={viewingUserModal.phone || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setViewingUserModal((prev: any) => ({ ...prev, phone: val }));
                    const newU = [...usuarios];
                    const idx = newU.findIndex(x => x.id === viewingUserModal.id);
                    if (idx !== -1) {
                      newU[idx].phone = val;
                      setUsuarios(newU);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingUserModal(null)}
                className="px-5 py-2.5 bg-[#1a5276] hover:bg-[#0e2f44] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

