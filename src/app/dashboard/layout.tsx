"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAllowTherapistEdit } from "@/app/actions/configuracion";
import { CountrySelector } from "@/components/CountrySelector";
import { getPhonePlaceholder, parsePhone } from "@/lib/phonePlaceholder";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Administrador";
  const [profileData, setProfileData] = useState<{ email?: string; image?: string; phone?: string }>({});
  const userEmail = profileData.email || session?.user?.email;
  const userImage = profileData.image || session?.user?.image;

  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);
  const [systemTimezone, setSystemTimezone] = useState("America/Mexico_City");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const formatDateTimeInTimezone = (dateInput: any, tzStr: string = "America/Mexico_City") => {
    if (!dateInput) return "";
    try {
      const d = new Date(dateInput);
      const timeZone = tzStr || "America/Mexico_City";
      return d.toLocaleString("es-MX", {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return new Date(dateInput).toLocaleString("es-MX");
    }
  };

  // Estados para Mensaje Flotante a Terapeutas
  const [broadcastMessage, setBroadcastMessage] = useState<any | null>(null);
  const [showTherapistPopup, setShowTherapistPopup] = useState(false);
  const [showAdminBroadcastModal, setShowAdminBroadcastModal] = useState(false);
  const [broadcastTitleInput, setBroadcastTitleInput] = useState("");
  const [broadcastMessageInput, setBroadcastMessageInput] = useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Selección de Destinatarios (Todos o Seleccionados)
  const [therapistsList, setTherapistsList] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<"ALL" | "SELECT">("ALL");
  const [selectedTherapists, setSelectedTherapists] = useState<string[]>([]);

  useEffect(() => {
    async function loadPermission() {
      const allowed = await getAllowTherapistEdit();
      setAllowTherapistEdit(allowed);

      const { getCurrentUserProfile, getSystemTimezone } = await import("@/app/actions/configuracion");
      const [res, tz] = await Promise.all([
        getCurrentUserProfile(),
        getSystemTimezone()
      ]);
      setSystemTimezone(tz);
      if (res.success && res.user) {
        setProfileData({ email: res.user.email, image: res.user.image, phone: res.user.phone });
      }

      const { getTherapistsList, getTherapistBroadcastMessage } = await import("@/app/actions/configuracion");
      const [tRes, bRes] = await Promise.all([
        getTherapistsList(),
        getTherapistBroadcastMessage()
      ]);

      if (tRes.success && tRes.therapists) {
        setTherapistsList(tRes.therapists);
      }

      if (bRes.success && bRes.broadcast) {
        setBroadcastMessage(bRes.broadcast);
        setBroadcastTitleInput(bRes.broadcast.title || "");
        setBroadcastMessageInput(bRes.broadcast.message || "");
        const targets = bRes.broadcast.targets || ["TODOS"];
        if (targets.includes("TODOS")) {
          setTargetType("ALL");
          setSelectedTherapists([]);
        } else {
          setTargetType("SELECT");
          setSelectedTherapists(targets);
        }

        const roleUpper = (userRole || "").toUpperCase();
        if (roleUpper === "TERAPEUTA" && bRes.broadcast.active === true) {
          const isTargeted = targets.includes("TODOS") || targets.some((t: string) => {
            const normT = t.toLowerCase().trim();
            const normUser = (userName || "").toLowerCase().trim();
            return normT.includes(normUser) || normUser.includes(normT);
          });

          if (isTargeted) {
            const seenId = localStorage.getItem("seen_therapist_bcast_id");
            if (seenId !== bRes.broadcast.id) {
              setShowTherapistPopup(true);
            }
          }
        }
      }
    }
    loadPermission();
  }, [session, userRole, userName]);

  const refreshBroadcast = async () => {
    try {
      const { getTherapistBroadcastMessage } = await import("@/app/actions/configuracion");
      const bRes = await getTherapistBroadcastMessage();
      if (bRes.success && bRes.broadcast) {
        setBroadcastMessage(bRes.broadcast);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (showAdminBroadcastModal) {
      const interval = setInterval(() => {
        refreshBroadcast();
      }, 4000);
      return () => clearInterval(interval);
    }

    const roleUpper = (userRole || "").toUpperCase();
    if (roleUpper === "TERAPEUTA") {
      const interval = setInterval(async () => {
        try {
          const { getTherapistBroadcastMessage } = await import("@/app/actions/configuracion");
          const bRes = await getTherapistBroadcastMessage();
          if (bRes.success && bRes.broadcast) {
            setBroadcastMessage(bRes.broadcast);
            if (bRes.broadcast.active === false) {
              setShowTherapistPopup(false);
            }
          }
        } catch (e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showAdminBroadcastModal, userRole]);

  const handleOpenAdminBroadcastModal = async () => {
    setShowAdminBroadcastModal(true);
    await refreshBroadcast();
  };

  const handleCloseTherapistPopup = async () => {
    if (broadcastMessage?.id) {
      localStorage.setItem("seen_therapist_bcast_id", broadcastMessage.id);
      try {
        const { markTherapistBroadcastAsRead } = await import("@/app/actions/configuracion");
        const res = await markTherapistBroadcastAsRead(broadcastMessage.id, userName);
        if (res.success && res.readBy) {
          setBroadcastMessage((prev: any) => prev ? { ...prev, readBy: res.readBy } : prev);
        }
      } catch (e) {}
    }
    setShowTherapistPopup(false);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitleInput.trim() || !broadcastMessageInput.trim()) {
      alert("Por favor ingresa un título y un mensaje.");
      return;
    }
    if (targetType === "SELECT" && selectedTherapists.length === 0) {
      alert("Por favor selecciona al menos una terapeuta o elige 'Todos los Terapeutas'.");
      return;
    }

    const finalTargets = targetType === "ALL" ? ["TODOS"] : selectedTherapists;
    setIsSendingBroadcast(true);
    try {
      const { saveTherapistBroadcastMessage } = await import("@/app/actions/configuracion");
      const res = await saveTherapistBroadcastMessage(broadcastTitleInput, broadcastMessageInput, finalTargets);
      if (res.success) {
        alert("¡Mensaje enviado correctamente a las terapeutas! Aparecerá en ventana flotante cuando inicien sesión.");
        setBroadcastMessage(res.broadcast);
        setShowAdminBroadcastModal(false);
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error al enviar mensaje: " + err.message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleClearBroadcast = async () => {
    if (!confirm("¿Deseas retirar el mensaje actual enviado a las terapeutas?")) return;
    setIsSendingBroadcast(true);
    try {
      const { clearTherapistBroadcastMessage } = await import("@/app/actions/configuracion");
      const res = await clearTherapistBroadcastMessage();
      if (res.success) {
        alert("Mensaje retirado correctamente.");
        setBroadcastMessage((prev: any) => prev ? { ...prev, active: false } : null);
        setBroadcastTitleInput("");
        setBroadcastMessageInput("");
        setShowAdminBroadcastModal(false);
      } else {
        alert("Error: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const allTabs = [
    { name: "Agenda", path: "/dashboard/agenda", adminOnly: false },
    { name: "Asistencia", path: "/dashboard/asistencia", adminOnly: false },
    { name: "Ficha ID", path: "/dashboard/preregistros", adminOnly: false },
    { name: "Pacientes", path: "/dashboard/pacientes", adminOnly: false },
    { name: "Informes", path: "/dashboard/informes", adminOnly: false },
    { name: "Horarios", path: "/dashboard/horarios", adminOnly: false },
    { name: "Estado de Cuenta", path: "/dashboard/finanzas", adminOnly: true },
    { name: "Dashboard", path: "/dashboard", adminOnly: true },
    { name: "Terapeutas", path: "/dashboard/terapeutas", adminOnly: true },
    { name: "Honorarios", path: "/dashboard/honorarios", adminOnly: true },
    { name: "Salario", path: "/dashboard/salario", adminOnly: true },
    { name: "Reportes", path: "/dashboard/reportes", adminOnly: true },
    { name: "Estado Resultados", path: "/dashboard/estado-resultados", adminOnly: true },
    { name: "Contraseña", path: "/dashboard/contrasena", adminOnly: false },
    { name: "Configuración", path: "/dashboard/configuracion", adminOnly: true },
  ];

  // Filter tabs based on role permissions
  const tabs = allTabs.filter(tab => {
    const roleUpper = userRole.toUpperCase();

    // Eliminar la pestaña 'Contraseña' cuando se ingresa como Administrador o Invitado
    if (roleUpper === "ADMIN" || roleUpper === "ADMINISTRADOR" || roleUpper === "INVITADO") {
      if (tab.path === "/dashboard/contrasena") return false;
    }

    if (roleUpper === "TERAPEUTA") {
      if (tab.path === "/dashboard/pacientes") return true;
      if (tab.adminOnly) return false;
    }

    if (roleUpper === "CONTADOR") {
      const allowedPaths = [
        "/dashboard/finanzas",
        "/dashboard",
        "/dashboard/terapeutas",
        "/dashboard/honorarios",
        "/dashboard/salario",
        "/dashboard/reportes",
        "/dashboard/estado-resultados",
        "/dashboard/contrasena"
      ];
      return allowedPaths.includes(tab.path);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0e2f44] via-[#1a5276] to-[#2980b9] text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="CREN Logo" 
              className="h-14 md:h-[58px] max-h-[58px] w-auto flex-shrink-0 object-contain drop-shadow-md py-0.5" 
            />
            <span className="text-[8.5px] md:text-[9.5px] font-bold text-white/85 uppercase tracking-tighter border-l border-white/30 pl-2 py-0 leading-none whitespace-nowrap">
              Sistema Financiero
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setShowProfileModal(true)}
              className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-xs border border-white/10 shadow-xs cursor-pointer transition-all"
              title="Haz clic para ver y editar tu perfil"
            >
              {userImage ? (
                <img src={userImage} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-white/40 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-white text-[10px] shrink-0">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${userRole.toUpperCase() === 'ADMIN' ? 'bg-red-500/80' : userRole.toUpperCase() === 'CONTADOR' ? 'bg-amber-500/80' : userRole.toUpperCase() === 'INVITADO' ? 'bg-blue-500/80' : 'bg-emerald-500/80'}`}>
                {userRole}
              </span>
              <span className="font-bold">{userName}</span>
              {userEmail && (
                <span className="text-[11px] opacity-90 border-l border-white/20 pl-2 text-cyan-100 font-mono">
                  {userEmail}
                </span>
              )}
            </div>
            {(userRole.toUpperCase() === "ADMIN" || userRole.toUpperCase() === "ADMINISTRADOR" || userRole.toUpperCase() === "INVITADO") && (
              <button
                onClick={handleOpenAdminBroadcastModal}
                className="px-3 py-1.5 bg-amber-500/90 hover:bg-amber-500 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-amber-300/30"
                title="Enviar mensaje flotante a las terapeutas"
              >
                <span>📢</span>
                <span className="hidden sm:inline">Mensaje a Terapeutas</span>
              </button>
            )}

            {userRole.toUpperCase() === "TERAPEUTA" && broadcastMessage && broadcastMessage.active === true && (
              <button
                onClick={() => setShowTherapistPopup(true)}
                className="px-3 py-1.5 bg-amber-500/90 hover:bg-amber-500 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-amber-300/30 animate-pulse"
                title="Ver aviso de la Administración"
              >
                <span>📢</span>
                <span className="hidden sm:inline">Aviso de Dirección</span>
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-900 text-white rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex px-6 overflow-x-auto scrollbar-none bg-[#0a2333]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "border-emerald-400 text-white bg-white/10 font-bold"
                    : "border-transparent text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
        {children}
      </main>

      {/* MODAL MI PERFIL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="text-lg font-bold text-[#1a5276]">Mi Perfil</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Avatar grande editable */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative group cursor-pointer" title="Haz clic para cambiar tu foto de perfil">
                <input
                  type="file"
                  accept="image/*"
                  id="userHeaderPhotoInput"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
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
                            setProfileData((prev) => ({ ...prev, image: compressed }));
                          }
                        };
                        img.src = event.target?.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="userHeaderPhotoInput" className="cursor-pointer block relative">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="Profile Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#1a5276] shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-extrabold text-slate-600 text-3xl shadow-inner">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-base font-bold">📷</span>
                    <span className="text-white text-[10px] font-semibold">Cambiar</span>
                  </div>
                </label>
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-slate-800 text-base">{userName}</h4>
                <span className={`inline-block px-2.5 py-0.5 mt-1 rounded text-[10px] font-extrabold uppercase ${userRole.toUpperCase() === 'ADMIN' ? 'bg-red-500/10 text-red-700 border border-red-200' : userRole.toUpperCase() === 'CONTADOR' ? 'bg-amber-500/10 text-amber-700 border border-amber-200' : userRole.toUpperCase() === 'INVITADO' ? 'bg-blue-500/10 text-blue-700 border border-blue-200' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'}`}>
                  {userRole}
                </span>
              </div>
            </div>

            {/* Campos Editables: Correo y Contacto */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <span>✉️</span> Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={profileData.email || ""}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <span>📞</span> Número de Contacto
                </label>
                <div className="flex gap-2 items-center">
                  <CountrySelector
                    value={parsePhone(profileData.phone, systemTimezone).code}
                    onChange={(newCode) => {
                      const parsed = parsePhone(profileData.phone, systemTimezone);
                      setProfileData((prev) => ({ ...prev, phone: `${newCode} ${parsed.number}`.trim() }));
                    }}
                  />
                  <input
                    type="tel"
                    placeholder={getPhonePlaceholder(systemTimezone).replace(/^Ej\.\s*/, "")}
                    value={parsePhone(profileData.phone, systemTimezone).number}
                    onChange={(e) => {
                      const parsed = parsePhone(profileData.phone, systemTimezone);
                      const newNum = e.target.value;
                      setProfileData((prev) => ({ ...prev, phone: newNum ? `${parsed.code} ${newNum}` : "" }));
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isSavingProfile}
                onClick={async () => {
                  setIsSavingProfile(true);
                  const { updateOwnUserProfile } = await import("@/app/actions/configuracion");
                  const res = await updateOwnUserProfile({
                    email: profileData.email || "",
                    phone: profileData.phone || "",
                    image: profileData.image || ""
                  });
                  setIsSavingProfile(false);
                  if (res.success) {
                    setShowProfileModal(false);
                  } else {
                    alert(res.error || "Error al actualizar perfil");
                  }
                }}
                className="px-5 py-2 bg-[#1a5276] hover:bg-[#0e2f44] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                {isSavingProfile ? "Guardando..." : "Guardar Perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VENTANA FLOTANTE PARA TERAPEUTAS (POP-UP AL INGRESAR) */}
      {showTherapistPopup && broadcastMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 px-6 py-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl bg-white/20 p-2 rounded-xl backdrop-blur-xs">📢</span>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Aviso Importante de la Dirección</h3>
                  <p className="text-[11px] text-amber-100 font-medium">De: {broadcastMessage.sender || "Administración"}</p>
                </div>
              </div>
              <button
                onClick={handleCloseTherapistPopup}
                className="text-white/80 hover:text-white font-extrabold text-xl p-1 rounded-lg transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 bg-amber-50/30">
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
                  {broadcastMessage.title}
                </h4>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {broadcastMessage.message}
                </p>
              </div>

              <div className="text-[11px] text-amber-900/80 font-medium flex items-center justify-between border-t border-amber-200/50 pt-2">
                <span>📅 Fecha y Hora de Envío:</span>
                <strong className="font-mono text-amber-950">{formatDateTimeInTimezone(broadcastMessage.date, systemTimezone || "America/Mexico_City")}</strong>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleCloseTherapistPopup}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
              >
                Entendido, cerrar aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPOSICIÓN DE MENSAJE PARA ADMINISTRADOR / INVITADO */}
      {showAdminBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-900">
            <div className="bg-[#0e2f44] px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="font-bold text-base">Enviar Mensaje Flotante a Terapeutas</h3>
              </div>
              <button
                onClick={() => setShowAdminBroadcastModal(false)}
                className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                💡 Este mensaje aparecerá en una <strong>ventana emergente flotante</strong> para las terapeutas seleccionadas en cuanto ingresen a la aplicación.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destinatarios</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "ALL"}
                      onChange={() => setTargetType("ALL")}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    🌐 Todos los Terapeutas
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "SELECT"}
                      onChange={() => setTargetType("SELECT")}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    👤 Seleccionar Específicos
                  </label>
                </div>

                {targetType === "SELECT" && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto space-y-1.5">
                    {therapistsList.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Cargando terapeutas...</p>
                    ) : (
                      therapistsList.map((tName) => {
                        const isChecked = selectedTherapists.includes(tName);
                        return (
                          <label key={tName} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-100 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTherapists(prev => [...prev, tName]);
                                } else {
                                  setSelectedTherapists(prev => prev.filter(item => item !== tName));
                                }
                              }}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            {tName}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título del Mensaje</label>
                <input
                  type="text"
                  required
                  value={broadcastTitleInput}
                  onChange={(e) => setBroadcastTitleInput(e.target.value)}
                  placeholder="Ej: Aviso de Reunión / Cambio de Horarios..."
                  className="w-full text-slate-900 border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contenido del Mensaje</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessageInput}
                  onChange={(e) => setBroadcastMessageInput(e.target.value)}
                  placeholder="Escribe aquí las instrucciones o avisos para las terapeutas..."
                  className="w-full text-slate-900 border border-slate-300 rounded-lg p-3 text-xs outline-none focus:border-amber-500 font-medium bg-white shadow-inner"
                />
              </div>

              {broadcastMessage && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
                      <span>👁️</span> Confirmación de Lectura ({Array.isArray(broadcastMessage.readBy) ? broadcastMessage.readBy.length : 0})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      Destinatarios: {Array.isArray(broadcastMessage.targets) && broadcastMessage.targets.includes("TODOS") ? "Todos los Terapeutas" : `${broadcastMessage.targets?.length || 0} seleccionados`}
                    </span>
                  </div>

                  {(!Array.isArray(broadcastMessage.readBy) || broadcastMessage.readBy.length === 0) ? (
                    <p className="text-xs text-emerald-700/80 italic">Aún ninguna terapeuta ha leído/confirmado el aviso.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {broadcastMessage.readBy.map((r: any, idx: number) => {
                        const formattedTime = r.readAt ? formatDateTimeInTimezone(r.readAt, systemTimezone || "America/Mexico_City") : "";
                        return (
                          <span key={idx} className="bg-white border border-emerald-300 text-emerald-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                            <span className="text-emerald-600 font-extrabold">✓</span> {r.name} {formattedTime && <span className="text-[10px] text-slate-600 font-semibold border-l border-emerald-200 pl-1.5 ml-0.5">({formattedTime})</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2 justify-end">
                {broadcastMessage && broadcastMessage.active && (
                  <button
                    type="button"
                    onClick={handleClearBroadcast}
                    disabled={isSendingBroadcast}
                    className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 text-xs transition-colors cursor-pointer mr-auto"
                  >
                    Retirar Aviso Actual
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAdminBroadcastModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSendingBroadcast ? "Guardando..." : "🚀 Publicar a Terapeutas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
