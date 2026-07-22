"use client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    const aData = localStorage.getItem("asistenciaData");
    if (aData) setAsistencias(JSON.parse(aData));

    const pData = localStorage.getItem("pacientesData");
    if (pData) setPacientes(JSON.parse(pData));
  }, []);

  // Helper functions for dates
  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  
  const isToday = (dStr: string) => dStr === todayStr;
  
  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff)).toISOString().split("T")[0];
  };
  const weekStartStr = getWeekStart(now);

  const isThisWeek = (dStr: string) => {
    return dStr >= weekStartStr && dStr <= todayStr;
  };

  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const isThisMonth = (dStr: string) => {
    return dStr.startsWith(currentMonthStr);
  };

  const parseMoney = (m: string) => {
    if (!m) return 0;
    return parseFloat(m.replace(/[^0-9.-]+/g,""));
  };

  // --- HOY ---
  const asistHoy = asistencias.filter(a => isToday(a.fecha));
  const ingresosHoy = asistHoy.reduce((acc, curr) => acc + parseMoney(curr.total), 0);
  const sesionesHoy = asistHoy.reduce((acc, curr) => acc + parseInt(curr.sesiones || "1"), 0);
  const cancelacionesHoy = asistHoy.filter(a => a.estado === "Cancelado").length;
  const pendientesHoy = asistHoy.filter(a => a.estado === "Pendiente").length;
  const totalHoyCount = asistHoy.length;

  // --- SEMANA ---
  const asistSemana = asistencias.filter(a => isThisWeek(a.fecha));
  const ingresosSemana = asistSemana.reduce((acc, curr) => acc + parseMoney(curr.total), 0);
  const sesionesSemana = asistSemana.reduce((acc, curr) => acc + parseInt(curr.sesiones || "1"), 0);
  const cancelacionesSemana = asistSemana.filter(a => a.estado === "Cancelado").length;
  // terapeutas activos (mocked or extracted from terapeutas)
  const terapeutasSemana = new Set(asistSemana.map(a => a.terapeuta)).size;

  // --- MES ---
  const asistMes = asistencias.filter(a => isThisMonth(a.fecha));
  const ingresosBrutosMes = asistMes.reduce((acc, curr) => acc + parseMoney(curr.total), 0);
  const ivaMes = asistMes.reduce((acc, curr) => curr.fact === "Sí" ? acc + (parseMoney(curr.total) - parseMoney(curr.subtotal)) : acc, 0);
  const ingresosNetosMes = ingresosBrutosMes - ivaMes;
  const sesionesMes = asistMes.reduce((acc, curr) => acc + parseInt(curr.sesiones || "1"), 0);
  const valoracionesMes = asistMes.filter(a => a.tipoSesion === "Valoracion").length;

  // --- PACIENTES ---
  const pHoy = pacientes.filter(p => isToday(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;
  const pSemana = pacientes.filter(p => isThisWeek(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;
  const pMes = pacientes.filter(p => isThisMonth(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;
  const pTotal = pacientes.length;

  const KpiCard = ({ title, value, subtext, color }: any) => (
    <div className="bg-white rounded p-4 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`}></div>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-xl font-extrabold text-[#0e2f44]">{value}</p>
      {subtext && <p className="text-[9px] text-slate-400 mt-1">{subtext}</p>}
    </div>
  );

  const ChartPlaceholder = ({ title, legend = false, lines = true }: any) => (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm h-64 flex flex-col">
      <h3 className="text-xs font-bold text-[#1a5276] mb-4">{title}</h3>
      <div className="flex-1 border-l border-b border-slate-200 relative">
        {lines && [1, 2, 3, 4, 5].map(i => (
          <div key={i} className="absolute left-0 right-0 border-t border-slate-100" style={{ bottom: `${i * 20}%` }}></div>
        ))}
        {/* Placeholder line at 0 */}
        <div className="absolute left-0 right-0 bottom-0 border-t-2 border-[#2ecc71] flex items-center justify-between px-2">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] border border-white translate-y-[-50%]"></div>)}
        </div>
      </div>
      {legend && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[8px] text-slate-500 font-medium">
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-[#2ecc71]"></span> Asistió</div>
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-amber-400"></span> Canceló anticipación</div>
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-red-500"></span> Canceló sin anticipación</div>
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-purple-500"></span> Canceló el centro</div>
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-blue-500"></span> Alta</div>
          <div className="flex items-center gap-1"><span className="w-4 h-1.5 bg-slate-400"></span> Baja</div>
        </div>
      )}
    </div>
  );

  const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto bg-[#f8f9fa] p-4 rounded-xl">
      
      {/* SECCIÓN: DASHBOARD (HOY) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
          <h2 className="text-[13px] font-bold text-[#1a5276]">Dashboard</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <KpiCard title="INGRESOS HOY" value={formatMoney(ingresosHoy)} subtext={`${sesionesHoy} sesiones`} color="bg-[#2ecc71]" />
          <KpiCard title="CANCELACIONES" value={cancelacionesHoy.toString()} color="bg-[#e74c3c]" />
          <KpiCard title="SESIONES" value={sesionesHoy.toString()} color="bg-[#3498db]" />
          <KpiCard title="PENDIENTES" value={pendientesHoy.toString()} color="bg-[#00bcd4]" />
          <KpiCard title="TOTAL HOY" value={totalHoyCount.toString()} color="bg-[#9b59b6]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartPlaceholder title="Ingresos por Método (Hoy)" lines={false} />
          <ChartPlaceholder title="Sesiones por Estado (Hoy)" legend={true} lines={false} />
        </div>
      </div>

      {/* SECCIÓN: RESUMEN SEMANAL */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <h2 className="text-[13px] font-bold text-[#1a5276]">Resumen Semanal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KpiCard title="INGRESOS SEMANA" value={formatMoney(ingresosSemana)} color="bg-[#2ecc71]" />
          <KpiCard title="SESIONES" value={sesionesSemana.toString()} color="bg-[#3498db]" />
          <KpiCard title="CANCELACIONES" value={cancelacionesSemana.toString()} color="bg-[#e74c3c]" />
          <KpiCard title="TERAPEUTAS ACTIVOS" value={terapeutasSemana.toString()} color="bg-[#f1c40f]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartPlaceholder title="Ingresos por Terapeuta (Semana)" />
          <ChartPlaceholder title="Ingresos Diarios (Semana)" />
        </div>
      </div>

      {/* SECCIÓN: RESUMEN MENSUAL */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <h2 className="text-[13px] font-bold text-[#1a5276]">Resumen Mensual</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded px-3 py-1 text-xs text-[#1a5276] font-semibold flex items-center gap-2">
            julio de 2026
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <KpiCard title="INGRESOS BRUTOS" value={formatMoney(ingresosBrutosMes)} color="bg-[#3498db]" />
          <KpiCard title="IVA HONORARIOS" value={formatMoney(ivaMes)} color="bg-[#f1c40f]" />
          <KpiCard title="INGRESOS NETOS (UTILIDAD)" value={formatMoney(ingresosNetosMes)} color="bg-[#2ecc71]" />
          <KpiCard title="SESIONES MES" value={sesionesMes.toString()} color="bg-[#9b59b6]" />
          <KpiCard title="VALORACIONES" value={valoracionesMes.toString()} color="bg-[#3498db]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartPlaceholder title="Ingresos por Servicio" />
          <ChartPlaceholder title="Ingresos por Terapeuta" />
        </div>
      </div>

      {/* SECCIÓN: INGRESOS POR MÉTODO */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[#f1c40f]" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          <h2 className="text-[13px] font-bold text-[#1a5276]">Ingresos por Método de Pago (Mes)</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-[9px] uppercase">
            <thead className="bg-[#0e2f44] text-white font-semibold">
              <tr>
                <th className="px-4 py-2">MÉTODO DE PAGO</th>
                <th className="px-4 py-2">SESIONES</th>
                <th className="px-4 py-2">MONTO RECIBIDO</th>
                <th className="px-4 py-2">MONTO ESPERADO</th>
                <th className="px-4 py-2">EFECTIVIDAD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400 font-medium">No hay datos disponibles para este mes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN: REGISTRO DE NUEVOS PACIENTES */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <h2 className="text-[13px] font-bold text-[#1a5276]">Registro de Nuevos Pacientes</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded px-3 py-1 text-xs text-[#1a5276] font-semibold flex items-center gap-2">
            julio de 2026
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KpiCard title="NUEVOS HOY" value={pHoy.toString()} subtext="Ninguno" color="bg-[#3498db]" />
          
          <div className="bg-white rounded p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#9b59b6]"></div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">NUEVOS ESTA SEMANA</p>
              <p className="text-xl font-extrabold text-[#0e2f44]">{pSemana}</p>
              <p className="text-[9px] text-slate-400 mt-1">Ninguno</p>
            </div>
            <select className="mt-2 w-full text-[9px] border border-slate-200 rounded px-2 py-1 outline-none">
              <option>Ninguno</option>
            </select>
          </div>

          <div className="bg-white rounded p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2ecc71]"></div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">NUEVOS ESTE MES</p>
              <p className="text-xl font-extrabold text-[#0e2f44]">{pMes}</p>
              <p className="text-[9px] text-slate-400 mt-1">Ninguno</p>
            </div>
            <select className="mt-2 w-full text-[9px] border border-slate-200 rounded px-2 py-1 outline-none">
              <option>Ninguno</option>
            </select>
          </div>

          <KpiCard title="TOTAL PACIENTES ÚNICOS" value={pTotal.toString()} subtext="Todos los terapeutas" color="bg-[#1abc9c]" />
        </div>
      </div>

    </div>
  );
}
