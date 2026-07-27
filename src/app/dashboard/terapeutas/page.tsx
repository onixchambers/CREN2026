"use client";

import { useState, useEffect } from "react";
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

export default function TerapeutasPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  // Period filter mode: 'dia' | 'mes' | 'anio'
  const [modoFiltro, setModoFiltro] = useState<"dia" | "mes" | "anio">("mes");
  const [fechaDia, setFechaDia] = useState(todayStr);
  const [fechaMes, setFechaMes] = useState(currentMonthStr);
  const [fechaAnio, setFechaAnio] = useState(currentYearStr);

  const [terapeutas, setTerapeutas] = useState<any[]>([]);
  const [finanzasData, setFinanzasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

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

      const [terRes, finRes] = await Promise.all([
        getTerapeutasFull(),
        getFinanzasMensuales(fechaMes, desde, hasta)
      ]);

      if (terRes.success && terRes.data) setTerapeutas(terRes.data);
      if (finRes.success && finRes.data) setFinanzasData(finRes.data);

      setLoading(false);
    }
    loadData();
  }, [modoFiltro, fechaDia, fechaMes, fechaAnio]);

  const listTerapeutaFinanzas = finanzasData?.terapeutas || [];

  // Mapear un color único y constante para cada terapeuta
  const terapeutaColorMap: { [nombre: string]: string } = {};
  terapeutas.forEach((t, idx) => {
    terapeutaColorMap[t.name] = THERAPIST_COLORS[idx % THERAPIST_COLORS.length];
  });

  // Métricas acumuladas
  const totalSesiones = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.sesiones || 0), 0);
  const totalIngresos = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.ingresoGenerado || 0), 0);
  const totalPagado = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.pago || 0), 0);

  // Terapeuta destacada
  let masSesionesTerapeuta = "Sin registros";
  let maxSesionesCount = 0;
  listTerapeutaFinanzas.forEach((t: any) => {
    if (t.sesiones > maxSesionesCount) {
      maxSesionesCount = t.sesiones;
      masSesionesTerapeuta = t.nombre;
    }
  });

  // Datos para Gráfica Circular de Sesiones por Terapeuta
  const sesionesDonutData = listTerapeutaFinanzas.map((t: any, idx: number) => ({
    label: t.nombre,
    value: t.sesiones || 0,
    color: terapeutaColorMap[t.nombre] || THERAPIST_COLORS[idx % THERAPIST_COLORS.length]
  })).filter((t: any) => t.value > 0);

  // Datos para Gráfica Circular de Honorarios Pagados por Terapeuta
  const honorariosDonutData = listTerapeutaFinanzas.map((t: any, idx: number) => ({
    label: t.nombre,
    value: t.pago || 0,
    color: terapeutaColorMap[t.nombre] || THERAPIST_COLORS[idx % THERAPIST_COLORS.length]
  })).filter((t: any) => t.value > 0);

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
            <span className="text-sm font-black text-slate-800">{total > 1000 ? `$${(total/1000).toFixed(1)}k` : total}</span>
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
          <h2 className="text-2xl font-bold text-slate-800">Panel de Terapeutas y Desempeño</h2>
          <p className="text-sm text-slate-500">Métricas de rendimiento, comisiones y producción por especialista</p>
        </div>

        {/* SELECTOR DE PERIODO (DÍA, MES, AÑO) */}
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
          {/* TARJETAS DE KPIS TERAPEUTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1a5276]"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Terapeutas Registradas</p>
                <p className="text-2xl font-black text-[#0e2f44] mt-1">{terapeutas.length}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Especialistas en catálogo</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mayor Producción</p>
                <p className="text-lg font-black text-slate-800 mt-1 truncate">{masSesionesTerapeuta}</p>
              </div>
              <p className="text-[11px] text-amber-600 mt-3 font-bold">{maxSesionesCount} sesión(es) impartidas</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Sesiones</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{totalSesiones}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Sumatoria de atenciones</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ingresos Generados</p>
                <p className="text-2xl font-black text-green-600 mt-1">${totalIngresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 font-medium">Pago Honorarios: ${totalPagado.toLocaleString('es-MX')}</p>
            </div>
          </div>

          {/* COMBINACIÓN DE GRÁFICAS (CIRCULARES Y BARRAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GRÁFICA CIRCULAR 1: DISTRIBUCIÓN DE SESIONES (COLOR ÚNICO) */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8.99h9c-.47-4.74-4.26-8.52-9-8.99zm0 11.01V22c4.74-.47 8.53-4.25 9-8.99h-9z"/></svg>
                Gráfica Circular: Sesiones por Terapeuta (Color Único)
              </h3>
              <p className="text-xs text-slate-400 mb-5">Proporción de volumen de citas atendidas</p>

              <DonutChart data={sesionesDonutData} />
            </div>

            {/* GRÁFICA CIRCULAR 2: HONORARIOS PAGADOS POR TERAPEUTA */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Gráfica Circular: Honorarios Pagados por Terapeuta
              </h3>
              <p className="text-xs text-slate-400 mb-5">Distribución monetaria de comisiones pagadas</p>

              <DonutChart data={honorariosDonutData} />
            </div>

            {/* GRÁFICA DE BARRAS 1: INGRESOS GENERADOS POR TERAPEUTA (COLOR ÚNICO) */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                Gráfica de Barras: Ingresos Generados (Color Único)
              </h3>
              <p className="text-xs text-slate-400 mb-5">Recaudación total de terapias por cada especialista</p>

              <div className="space-y-4">
                {listTerapeutaFinanzas.map((t: any, idx: number) => {
                  const pct = totalIngresos > 0 ? (t.ingresoGenerado / totalIngresos) * 100 : 0;
                  const color = terapeutaColorMap[t.nombre] || THERAPIST_COLORS[idx % THERAPIST_COLORS.length];
                  return (
                    <div key={t.id || idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{t.nombre}</span>
                        <span className="text-slate-900">${t.ingresoGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(4, pct))}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {listTerapeutaFinanzas.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">Sin ingresos en este periodo.</p>
                )}
              </div>
            </div>

            {/* GRÁFICA DE BARRAS 2: PROMEDIO DE INGRESO POR SESIÓN */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                Gráfica de Barras: Promedio de Ingreso por Sesión
              </h3>
              <p className="text-xs text-slate-400 mb-5">Valor promedio generado por cada cita de terapeuta</p>

              <div className="space-y-4">
                {listTerapeutaFinanzas.map((t: any, idx: number) => {
                  const promedio = t.sesiones > 0 ? (t.ingresoGenerado / t.sesiones) : 0;
                  const color = terapeutaColorMap[t.nombre] || THERAPIST_COLORS[idx % THERAPIST_COLORS.length];
                  return (
                    <div key={t.id || idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{t.nombre}</span>
                        <span className="text-slate-900">${promedio.toLocaleString('es-MX', {minimumFractionDigits: 2})} / sesión</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(5, (promedio / 1000) * 100))}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {listTerapeutaFinanzas.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">Sin registros en este periodo.</p>
                )}
              </div>
            </div>

          </div>

          {/* TABLA DE DIRECTORIO Y HONORARIOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Directorio y Desglose Contable por Terapeuta (Color Asignado)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Color</th>
                    <th className="py-2.5 px-4">Terapeuta</th>
                    <th className="py-2.5 px-4">Especialidad</th>
                    <th className="py-2.5 px-4">Esquema de Pago</th>
                    <th className="py-2.5 px-4 text-center">Retención IVA</th>
                    <th className="py-2.5 px-4 text-center">Sesiones</th>
                    <th className="py-2.5 px-4 text-right">Ingreso Bruto</th>
                    <th className="py-2.5 px-4 text-right text-amber-600">IVA Retenido (16%)</th>
                    <th className="py-2.5 px-4 text-right">Honorario Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listTerapeutaFinanzas.map((t: any, i: number) => {
                    const color = terapeutaColorMap[t.nombre] || THERAPIST_COLORS[i % THERAPIST_COLORS.length];
                    const tieneIVA = t.retieneIVA || t.tieneFacturasEnPeriodo || (t.ivaRetenido && t.ivaRetenido > 0);
                    return (
                      <tr key={t.id || i} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="w-4 h-4 rounded-full inline-block shadow-sm" style={{ backgroundColor: color }}></span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{t.nombre}</td>
                        <td className="py-3 px-4 text-slate-600">{t.especialidad}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {t.tipoPago === "Porcentaje" ? (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {t.porcentaje}% Comisión
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                              Salario Base ${t.salarioBase}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tieneIVA ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                            {tieneIVA ? 'Con IVA' : 'Sin IVA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{t.sesiones}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          ${t.ingresoGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-600">
                          ${(t.ivaRetenido || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#1a5276]">
                          ${t.pago.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    );
                  })}
                  {listTerapeutaFinanzas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">No hay terapeutas registradas.</td>
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
