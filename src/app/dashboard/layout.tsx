"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAllowTherapistEdit } from "@/app/actions/configuracion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Administrador";

  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);

  useEffect(() => {
    async function loadPermission() {
      const allowed = await getAllowTherapistEdit();
      setAllowTherapistEdit(allowed);
    }
    loadPermission();
  }, []);

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
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-md text-sm">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${userRole.toUpperCase() === 'ADMIN' ? 'bg-red-500/80' : userRole.toUpperCase() === 'CONTADOR' ? 'bg-amber-500/80' : userRole.toUpperCase() === 'INVITADO' ? 'bg-blue-500/80' : 'bg-green-500/80'}`}>
                {userRole}
              </span>
              <span>{userName}</span>
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
    </div>
  );
}
