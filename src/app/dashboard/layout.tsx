"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userName = session?.user?.name || "Administrador";

  const allTabs = [
    { name: "Agenda", path: "/dashboard/agenda", adminOnly: false },
    { name: "Ficha ID", path: "/dashboard/preregistros", adminOnly: false },
    { name: "Pacientes", path: "/dashboard/pacientes", adminOnly: false },
    { name: "Asistencia", path: "/dashboard/asistencia", adminOnly: false },
    { name: "Estado de Cuenta", path: "/dashboard/finanzas", adminOnly: true },
    { name: "Informes", path: "/dashboard/informes", adminOnly: false },
    { name: "Horarios", path: "/dashboard/horarios", adminOnly: false },
    { name: "Dashboard", path: "/dashboard", adminOnly: true },
    { name: "Terapeutas", path: "/dashboard/terapeutas", adminOnly: true },
    { name: "Honorarios", path: "/dashboard/honorarios", adminOnly: true },
    { name: "Reportes", path: "/dashboard/reportes", adminOnly: true },
    { name: "Estado Resultados", path: "/dashboard/estado-resultados", adminOnly: true },
    { name: "Configuración", path: "/dashboard/configuracion", adminOnly: true },
  ];

  // Filter tabs based on role
  const tabs = allTabs.filter(tab => {
    if (userRole === "TERAPEUTA" && tab.adminOnly) {
      return false;
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
              src="/logo.jpg" 
              alt="CREN Logo" 
              className="w-12 h-12 min-w-12 min-h-12 flex-shrink-0 rounded-full object-contain mix-blend-screen" 
            />
            <div>
              <h1 className="text-lg font-bold">CREN</h1>
              <p className="text-xs opacity-80">Sistema Operativo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-md text-sm">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${userRole === 'ADMIN' ? 'bg-red-500/80' : 'bg-green-500/80'}`}>
                {userRole}
              </span>
              <span>{userName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-900 text-white rounded-full text-xs font-semibold transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 px-6 bg-black/10 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-green-400 text-white bg-white/10"
                    : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
