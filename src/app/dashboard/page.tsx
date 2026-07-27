"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getAsistenciasDB } from "@/app/actions/asistencia";
import { getPatients } from "@/app/actions/pacientes";
import { getFinanzasMensuales } from "@/app/actions/finanzas";
import { getTerapeutasFull } from "@/app/actions/configuracion";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [loading, setLoading] = useState(true);

  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [terapeutas, setTerapeutas] = useState<any[]>([]);
  const [finanzas, setFinanzas] = useState<any>({
    ingresosBrutos: 0,
    nomina: 0,
    gastosOperativos: 0,
    utilidadNeta: 0
  });

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role || "ADMIN";
      if (role.toUpperCase() === "TERAPEUTA") {
        router.push("/dashboard/agenda");
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      const [asistRes, pacRes, finRes, terRes] = await Promise.all([
        getAsistenciasDB(),
        getPatients(),
        getFinanzasMensuales(currentMonth),
        getTerapeutasFull()
      ]);

      if (asistRes.success && asistRes.data) setAsistencias(asistRes.data);
      if (pacRes.success && pacRes.data) setPacientes(pacRes.data);
      if (finRes.success && finRes.data) setFinanzas(finRes.data);
      if (terRes.success && terRes.data) setTerapeutas(terRes.data);

      setLoading(false);
    }
    loadAllData();
  }, [currentMonth]);

  if (status === "loading" || (status === "authenticated" && ((session?.user as any)?.role || "ADMIN").toUpperCase() === "TERAPEUTA")) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5276]"></div>
        <span className="ml-3 text-slate-500 font-medium">Cargando Dashboard...</span>
      </div>
    );
  }

  // Métricas acumuladas del mes actual
  const asistMes = asistencias.filter(a => a.fecha && a.fecha.startsWith(currentMonth));
  const asistidasMesCount = asistMes.filter(a => a.estado === "Asistio").length;
  const canceladasMesCount = asistMes.filter(a => a.estado && a.estado.includes("Cancelo")).length;

  // Ingresos por Método de Pago
  const pagoMetodosMap: { [metodo: string]: number } = {};
  asistMes.forEach(a => {
    let m = a.pago || "Sin especificar";
    if (m.includes("Mixto")) m = "Mixto";
    const sub = typeof a.saldo === "number" ? (parseFloat(a.total ? a.total.replace("$","") : "0")) : parseFloat(a.subtotal ? a.subtotal.replace("$","") : "0");
    const amount = isNaN(sub) ? 0 : sub;
    pagoMetodosMap[m] = (pagoMetodosMap[m] || 0) + amount;
  });

  // Distribución por Áreas
  const areasMap: { [area: string]: number } = {};
  asistMes.forEach(a => {
    const area = a.area || "Sin Área";
    areasMap[area] = (areasMap[area] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard General CREN</h2>
          <p className="text-sm text-slate-500">Métricas operativas y contables en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-bold text-[#1a5276]">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          Periodo Actual: {currentMonth}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <>
          {/* TARJETAS DE KPIS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: INGRESOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ingresos del Mes</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    ${finanzas.ingresosBrutos.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Pagos totales de terapias</p>
            </div>

            {/* KPI 2: SESIONES ATENDIDAS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sesiones Atendidas</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {asistidasMesCount}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Cancelaciones: {canceladasMesCount}</p>
            </div>

            {/* KPI 3: PACIENTES ACTIVOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pacientes Registrados</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {pacientes.length}
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">En expediente general</p>
            </div>

            {/* KPI 4: TERAPEUTAS ACTIVOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Terapeutas Activos</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {terapeutas.length}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Especialistas registrados</p>
            </div>
          </div>

          {/* GRÁFICAS VISUALES Y RECOMENDADAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GRÁFICA 1: INGRESOS POR MÉTODO DE PAGO */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                  Distribución de Ingresos por Método de Pago
                </h3>
                <p className="text-xs text-slate-400 mb-5">Porcentaje de recaudación en el mes activo</p>

                <div className="space-y-4">
                  {Object.keys(pagoMetodosMap).length > 0 ? (
                    Object.entries(pagoMetodosMap).map(([metodo, monto], idx) => {
                      const pct = finanzas.ingresosBrutos > 0 ? (monto / finanzas.ingresosBrutos) * 100 : 0;
                      const colors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500"];
                      return (
                        <div key={metodo} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{metodo}</span>
                            <span className="text-slate-900">${monto.toLocaleString('es-MX', {minimumFractionDigits: 2})} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Sin datos de ingresos en el periodo.</p>
                  )}
                </div>
              </div>
            </div>

            {/* GRÁFICA 2: DISTRIBUCIÓN POR ÁREA DE TERAPIA */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Volumen de Sesiones por Área de Atención
                </h3>
                <p className="text-xs text-slate-400 mb-5">Cantidad de citas atendidas por especialidad</p>

                <div className="space-y-4">
                  {Object.keys(areasMap).length > 0 ? (
                    Object.entries(areasMap).map(([area, cant], idx) => {
                      const pct = asistMes.length > 0 ? (cant / asistMes.length) * 100 : 0;
                      const colors = ["bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-teal-500", "bg-rose-500"];
                      return (
                        <div key={area} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{area}</span>
                            <span className="text-slate-900">{cant} sesión(es) ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Sin sesiones registradas en el periodo.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* TABLA DE ACTIVIDAD RECIENTE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                Última Actividad de Asistencia y Pagos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Fecha</th>
                    <th className="py-2.5 px-4">Paciente</th>
                    <th className="py-2.5 px-4">Terapeuta</th>
                    <th className="py-2.5 px-4">Área</th>
                    <th className="py-2.5 px-4">Estado</th>
                    <th className="py-2.5 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asistencias.slice(0, 8).map((a, i) => (
                    <tr key={a.id || i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-600">{a.fecha}</td>
                      <td className="py-2.5 px-4 font-bold text-[#1a5276]">{a.paciente}</td>
                      <td className="py-2.5 px-4 text-slate-600">{a.terapeuta}</td>
                      <td className="py-2.5 px-4 text-slate-600">{a.area}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {a.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                        {a.total || "$0.00"}
                      </td>
                    </tr>
                  ))}
                  {asistencias.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">Sin actividad registrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
