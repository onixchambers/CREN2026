"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getAsistenciasDB } from "@/app/actions/asistencia";
import { getPatients } from "@/app/actions/pacientes";
import { getFinanzasMensuales } from "@/app/actions/finanzas";
import { getTerapeutasFull } from "@/app/actions/configuracion";
import { DateInput } from "@/components/DateInput";

const THERAPIST_COLORS = [
  "#2563eb", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#e11d48", // Rose
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  // Period filter mode: 'dia' | 'mes' | 'anio'
  const [modoFiltro, setModoFiltro] = useState<"dia" | "mes" | "anio">("mes");
  const [fechaDia, setFechaDia] = useState(todayStr);
  const [fechaMes, setFechaMes] = useState(currentMonthStr);
  const [fechaAnio, setFechaAnio] = useState(currentYearStr);

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

      // Range for finanzas depending on mode
      let desde = "";
      let hasta = "";
      if (modoFiltro === "dia") {
        desde = fechaDia;
        hasta = fechaDia;
      } else if (modoFiltro === "mes") {
        const [y, m] = fechaMes.split("-");
        desde = `${y}-${m}-01`;
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        hasta = `${y}-${m}-${lastDay.toString().padStart(2, '0')}`;
      } else {
        desde = `${fechaAnio}-01-01`;
        hasta = `${fechaAnio}-12-31`;
      }

      const [asistRes, pacRes, finRes, terRes] = await Promise.all([
        getAsistenciasDB(),
        getPatients(),
        getFinanzasMensuales(fechaMes, desde, hasta),
        getTerapeutasFull()
      ]);

      if (asistRes.success && asistRes.data) setAsistencias(asistRes.data);
      if (pacRes.success && pacRes.data) setPacientes(pacRes.data);
      if (finRes.success && finRes.data) setFinanzas(finRes.data);
      if (terRes.success && terRes.data) setTerapeutas(terRes.data);

      setLoading(false);
    }
    loadAllData();
  }, [modoFiltro, fechaDia, fechaMes, fechaAnio]);

  if (status === "loading" || (status === "authenticated" && ((session?.user as any)?.role || "ADMIN").toUpperCase() === "TERAPEUTA")) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5276]"></div>
        <span className="ml-3 text-slate-500 font-medium">Cargando Dashboard...</span>
      </div>
    );
  }

  // Filtrar asistencias según el modo seleccionado
  const asistFiltradas = asistencias.filter(a => {
    if (!a.fecha) return false;
    if (modoFiltro === "dia") return a.fecha === fechaDia;
    if (modoFiltro === "mes") return a.fecha.startsWith(fechaMes);
    if (modoFiltro === "anio") return a.fecha.startsWith(fechaAnio);
    return true;
  });

  const asistidasCount = asistFiltradas.filter(a => a.estado === "Asistio").length;
  const canceladasCount = asistFiltradas.filter(a => a.estado && a.estado.includes("Cancelo")).length;

  // Asignar colores fijos a cada terapeuta
  const terapeutaColorMap: { [nombre: string]: string } = {};
  terapeutas.forEach((t, idx) => {
    terapeutaColorMap[t.name] = THERAPIST_COLORS[idx % THERAPIST_COLORS.length];
  });

  // Datos para Gráfica Circular de Participación de Terapeutas en Ingresos
  const terapeutaIngresosData = (finanzas.terapeutas || []).map((t: any, idx: number) => ({
    label: t.nombre,
    value: t.ingresoGenerado || 0,
    color: terapeutaColorMap[t.nombre] || THERAPIST_COLORS[idx % THERAPIST_COLORS.length]
  })).filter((t: any) => t.value > 0);

  // Datos para Gráfica Circular de Estado de Asistencia
  const estadoAsistenciaData = [
    { label: "Asistió", value: asistidasCount, color: "#10b981" },
    { label: "Canceló", value: canceladasCount, color: "#ef4444" },
    { label: "Otros / Pendientes", value: asistFiltradas.length - (asistidasCount + canceladasCount), color: "#3b82f6" }
  ].filter(d => d.value > 0);

  // Ingresos por Método de Pago
  const pagoMetodosMap: { [metodo: string]: number } = {};
  asistFiltradas.forEach(a => {
    let m = a.pago || "Sin especificar";
    if (m.includes("Mixto")) m = "Mixto";
    const sub = typeof a.saldo === "number" ? (parseFloat(a.total ? a.total.replace("$","") : "0")) : parseFloat(a.subtotal ? a.subtotal.replace("$","") : "0");
    const amount = isNaN(sub) ? 0 : sub;
    pagoMetodosMap[m] = (pagoMetodosMap[m] || 0) + amount;
  });

  // Distribución por Áreas
  const areasMap: { [area: string]: number } = {};
  asistFiltradas.forEach(a => {
    const area = a.area || "Sin Área";
    areasMap[area] = (areasMap[area] || 0) + 1;
  });

  // Componente Reutilizable Donut Chart (Gráfica Circular)
  const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="text-center py-8 text-slate-400 text-xs">Sin registros para el periodo seleccionado</div>;

    let accumulated = 0;
    const gradientStops = data.map(d => {
      const startPct = (accumulated / total) * 100;
      accumulated += d.value;
      const endPct = (accumulated / total) * 100;
      return `${d.color} ${startPct}% ${endPct}%`;
    }).join(", ");

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div 
          className="w-36 h-36 rounded-full relative flex items-center justify-center shadow-inner shrink-0 transition-all"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
            <span className="text-base font-black text-slate-800">{total > 1000 ? `$${(total/1000).toFixed(1)}k` : total}</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 w-full">
          {data.map((d, i) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="font-semibold text-slate-700 truncate">{d.label}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  {typeof d.value === 'number' && d.value > 100 ? `$${d.value.toLocaleString()}` : d.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* HEADER CON CONTROLES DE FECHA (DÍA, MES, AÑO) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard General CREN</h2>
          <p className="text-sm text-slate-500">Métricas operativas y financieras por Día, Mes o Año</p>
        </div>

        {/* SELECTOR DE PERIODO */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setModoFiltro("dia")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${modoFiltro === "dia" ? "bg-[#1a5276] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
            >
              Día
            </button>
            <button 
              onClick={() => setModoFiltro("mes")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${modoFiltro === "mes" ? "bg-[#1a5276] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
            >
              Mes
            </button>
            <button 
              onClick={() => setModoFiltro("anio")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${modoFiltro === "anio" ? "bg-[#1a5276] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
            >
              Año
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

          {/* INPUT CORRESPONDIENTE AL MODO */}
          {modoFiltro === "dia" && (
            <DateInput 
              value={fechaDia} 
              onChange={(e) => setFechaDia(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            />
          )}

          {modoFiltro === "mes" && (
            <input 
              type="month"
              value={fechaMes}
              onChange={(e) => setFechaMes(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            />
          )}

          {modoFiltro === "anio" && (
            <select
              value={fechaAnio}
              onChange={(e) => setFechaAnio(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <>
          {/* KPIS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* INGRESOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Ingresos {modoFiltro === 'dia' ? 'del Día' : modoFiltro === 'mes' ? 'del Mes' : 'del Año'}
                  </p>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    ${finanzas.ingresosBrutos.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Recaudación bruta registrada</p>
            </div>

            {/* SESIONES ATENDIDAS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sesiones Atendidas</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{asistidasCount}</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Cancelaciones: {canceladasCount}</p>
            </div>

            {/* PACIENTES ACTIVOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pacientes Registrados</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{pacientes.length}</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">En expediente activo</p>
            </div>

            {/* TERAPEUTAS ACTIVOS */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Terapeutas Activos</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{terapeutas.length}</p>
                </div>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Catálogo de especialistas</p>
            </div>
          </div>

          {/* COMBINACIÓN DE GRÁFICAS (BARRAS Y CIRCULARES) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GRÁFICA CIRCULAR 1: PARTICIPACIÓN DE TERAPEUTAS EN INGRESOS (CON COLOR UNICO) */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8.99h9c-.47-4.74-4.26-8.52-9-8.99zm0 11.01V22c4.74-.47 8.53-4.25 9-8.99h-9z"/></svg>
                Gráfica Circular: Ingresos por Terapeuta (Color Único)
              </h3>
              <p className="text-xs text-slate-400 mb-5">Aporte contable de cada especialista en el periodo</p>

              <DonutChart data={terapeutaIngresosData} />
            </div>

            {/* GRÁFICA CIRCULAR 2: ESTADO DE ASISTENCIA */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Gráfica Circular: Estado de Asistencia
              </h3>
              <p className="text-xs text-slate-400 mb-5">Proporción de citas asistidas vs canceladas</p>

              <DonutChart data={estadoAsistenciaData} />
            </div>

            {/* GRÁFICA DE BARRAS 1: INGRESOS POR MÉTODO DE PAGO */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                Gráfica de Barras: Métodos de Pago
              </h3>
              <p className="text-xs text-slate-400 mb-5">Recaudación monetaria agrupada por forma de pago</p>

              <div className="space-y-4">
                {Object.keys(pagoMetodosMap).length > 0 ? (
                  Object.entries(pagoMetodosMap).map(([metodo, monto], idx) => {
                    const pct = finanzas.ingresosBrutos > 0 ? (monto / finanzas.ingresosBrutos) * 100 : 0;
                    const barColors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500"];
                    return (
                      <div key={metodo} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">{metodo}</span>
                          <span className="text-slate-900">${monto.toLocaleString('es-MX', {minimumFractionDigits: 2})} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div className={`h-full ${barColors[idx % barColors.length]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">Sin ingresos en este periodo.</p>
                )}
              </div>
            </div>

            {/* GRÁFICA DE BARRAS 2: SESIONES POR ÁREA */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                Gráfica de Barras: Sesiones por Área
              </h3>
              <p className="text-xs text-slate-400 mb-5">Citas brindadas por especialidad médica</p>

              <div className="space-y-4">
                {Object.keys(areasMap).length > 0 ? (
                  Object.entries(areasMap).map(([area, cant], idx) => {
                    const pct = asistFiltradas.length > 0 ? (cant / asistFiltradas.length) * 100 : 0;
                    const barColors = ["bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-teal-500", "bg-rose-500"];
                    return (
                      <div key={area} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">{area}</span>
                          <span className="text-slate-900">{cant} sesión(es) ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div className={`h-full ${barColors[idx % barColors.length]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">Sin sesiones registradas en este periodo.</p>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
