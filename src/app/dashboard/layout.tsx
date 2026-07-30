"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAllowTherapistEdit } from "@/app/actions/configuracion";
import { getPhonePlaceholder } from "@/lib/phonePlaceholder";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Administrador";
  const [profileData, setProfileData] = useState<{ email?: string; image?: string; phone?: string }>({});
  const userEmail = profileData.email || session?.user?.email;
  const userImage = profileData.image || session?.user?.image;

  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);
  const [systemTimezone, setSystemTimezone] = useState("America/Panama");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    }
    loadPermission();
  }, [session]);

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

    // Eliminar la pestaña 'Contraseña' cuando se ingresa como Administrador
    if (roleUpper === "ADMIN" || roleUpper === "ADMINISTRADOR") {
      return tab.path !== "/dashboard/contrasena";
    }

    // El usuario INVITADO NO tiene acceso a Configuración
    if (roleUpper === "INVITADO" && tab.path === "/dashboard/configuracion") {
      return false;
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
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img 
              src="/cren-logo.png" 
              alt="CREN Logo" 
              className="w-11 h-11 min-w-11 min-h-11 flex-shrink-0 rounded-full object-cover shadow-sm border border-white/20" 
            />
            <div>
              <h1 className="text-lg font-bold">CREN</h1>
              <p className="text-xs opacity-80">Sistema Operativo</p>
            </div>
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
                <input
                  type="tel"
                  placeholder={getPhonePlaceholder(systemTimezone)}
                  value={profileData.phone || ""}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                />
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
    </div>
  );
}
