"use client";
import { useState, useEffect } from "react";


export default function TerapeutasPage() {
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [terapeutasActivos, setTerapeutasActivos] = useState<string[]>([]);
  
  useEffect(() => {
    // 1. Cargar Asistencias
    const aData = localStorage.getItem("asistenciaData");
    if (aData) setAsistencias(JSON.parse(aData));

    // 2. Cargar Terapeutas Reales
    const fetchTerapeutas = async () => {
      const { getTerapeutas } = await import('@/app/actions/configuracion');
      const res = await getTerapeutas();
      if (res.success && res.data) {
        setTerapeutasActivos(res.data.map((t: any) => t.name));
      }
    };
    fetchTerapeutas();
  }, []);

  const hoy = new Date().toISOString().split("T")[0];
  const currentMonthStr = hoy.substring(0, 7); // YYYY-MM
  
  const asistMes = asistencias.filter(a => a.fecha && a.fecha.startsWith(currentMonthStr));

  const numTerapeutas = terapeutasActivos.length;

  // Calcular Sesiones Mes (Contando cada registro de asistencia del mes como 1 o sumando .sesiones)
  // Usamos el número de sesiones del formulario
  const sesionesMes = asistMes.reduce((acc, curr) => acc + parseInt(curr.sesiones || "1"), 0);

  // Calcular Más Sesiones
  const sesionesPorTerapeuta = asistMes.reduce((acc: any, curr) => {
    const t = curr.terapeuta || "Sin Asignar"; // Si en el futuro agregas terapeuta a la asistencia
    acc[t] = (acc[t] || 0) + parseInt(curr.sesiones || "1");
    return acc;
  }, {});

  let masSesiones = "Sin Datos";
  let maxS = 0;
  for (const t in sesionesPorTerapeuta) {
    if (t !== "Sin Asignar" && sesionesPorTerapeuta[t] > maxS) {
      maxS = sesionesPorTerapeuta[t];
      masSesiones = t;
    }
  }

  // Recaudación
  const parseMoney = (m: string) => m ? parseFloat(m.replace(/[^0-9.-]+/g,"")) : 0;
  const totalEsperado = asistMes.reduce((acc, curr) => acc + parseMoney(curr.total), 0);
  const totalRecaudado = asistMes.filter(a => a.estado === "Asistio").reduce((acc, curr) => acc + parseMoney(curr.total), 0);
  const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const KpiCard = ({ title, value, color }: any) => (
    <div className="bg-white rounded p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-24">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`}></div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-extrabold text-[#0e2f44] mt-1">{value}</p>
    </div>
  );

  const ChartPlaceholder = ({ title, legendItems = [] }: any) => (
    <div className="bg-white rounded p-5 border border-slate-200 shadow-sm flex flex-col h-72">
      <h3 className="text-[13px] font-bold text-[#1a5276] mb-4">{title}</h3>
      {legendItems.length > 0 && (
        <div className="flex justify-center gap-4 mb-4 text-[9px] font-medium text-[#0e2f44]">
          {legendItems.map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-6 h-2 ${l.color}`}></div>
              {l.label}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 relative flex items-end">
        {/* Y Axis Grid */}
        <div className="absolute inset-0 flex flex-col justify-between pb-8">
          {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((v) => (
            <div key={v} className="flex items-center w-full">
              <span className="text-[8px] text-slate-400 w-6 text-right pr-2">{v}</span>
              <div className="flex-1 border-t border-slate-100"></div>
            </div>
          ))}
        </div>
        {/* X Axis Labels */}
        <div className="absolute bottom-0 left-6 right-0 flex justify-between px-4">
          {terapeutasActivos.map((t, i) => (
            <div key={i} className="text-[8px] text-slate-500 font-medium">{t}</div>
          ))}
        </div>
        {/* The 0 Line */}
        <div className="absolute bottom-8 left-6 right-0 border-t border-slate-300"></div>
      </div>
    </div>
  );

  const ChartPlaceholderMoney = ({ title, legendItems = [] }: any) => (
    <div className="bg-white rounded p-5 border border-slate-200 shadow-sm flex flex-col h-72">
      <h3 className="text-[13px] font-bold text-[#1a5276] mb-4">{title}</h3>
      {legendItems.length > 0 && (
        <div className="flex justify-center gap-4 mb-4 text-[9px] font-medium text-[#0e2f44]">
          {legendItems.map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-6 h-2 ${l.color}`}></div>
              {l.label}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 relative flex items-end">
        {/* Y Axis Grid */}
        <div className="absolute inset-0 flex flex-col justify-between pb-8">
          {["$1", "$0.9", "$0.8", "$0.7", "$0.6", "$0.5", "$0.4", "$0.3", "$0.2", "$0.1", "$0"].map((v) => (
            <div key={v} className="flex items-center w-full">
              <span className="text-[8px] text-slate-400 w-6 text-right pr-2">{v}</span>
              <div className="flex-1 border-t border-slate-100"></div>
            </div>
          ))}
        </div>
        {/* X Axis Labels */}
        <div className="absolute bottom-0 left-6 right-0 flex justify-between px-4">
          {terapeutasActivos.map((t, i) => (
            <div key={i} className="text-[8px] text-slate-500 font-medium">{t}</div>
          ))}
        </div>
        <div className="absolute bottom-8 left-6 right-0 border-t border-slate-300"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto bg-[#f8f9fa] p-4 rounded-xl">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-5 h-5 text-[#0e2f44]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        <h2 className="text-[17px] font-bold text-[#1a5276]">Panel de Terapeutas</h2>
      </div>

      {/* FILTER BAR & TABS */}
      <div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-400">Mes/Año:</label>
            <input type="month" className="text-xs p-1.5 border border-slate-200 rounded outline-none text-slate-700 bg-white" />
          </div>
          <button className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-[11px] font-semibold transition-colors">
            Limpiar
          </button>
        </div>
        
        <div className="flex items-center gap-6 mt-4 px-2 border-b border-slate-200">
          <button className="text-[11px] font-bold text-[#1a5276] border-b-2 border-[#1a5276] pb-2">Resumen General</button>
          <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 pb-2">Detalle por Terapeuta</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="TERAPEUTAS REGISTRADAS" value={numTerapeutas.toString()} color="bg-[#3498db]" />
        <KpiCard title="MÁS SESIONES" value={masSesiones} color="bg-[#2ecc71]" />
        <KpiCard title="SESIONES MES" value={sesionesMes.toString()} color="bg-[#9b59b6]" />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartPlaceholder title="Sesiones por Terapeuta (Mes)" />
        <ChartPlaceholderMoney title="Utilidad CREN (Mes)" />
        <ChartPlaceholder 
          title="Desglose de Sesiones (Mes)" 
          legendItems={[
            { label: "Valoraciones", color: "bg-[#8e44ad]" },
            { label: "Sesiones Normales", color: "bg-[#f39c12]" }
          ]} 
        />
        <ChartPlaceholderMoney 
          title="Desglose de Sesiones Monto (Mes)" 
          legendItems={[
            { label: "Valoraciones", color: "bg-[#8e44ad]" },
            { label: "Sesiones Normales", color: "bg-[#f39c12]" }
          ]} 
        />
      </div>

      {/* RECAUDACIÓN SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4">
        <div className="space-y-12 pb-8 pl-4">
          <h3 className="text-[14px] font-bold text-[#1a5276] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2ecc71]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            Recaudación de Asistencias (Precio Acordado vs Recibido)
          </h3>
          <div className="flex gap-8">
            <p className="text-sm font-bold text-[#1a5276]">Total Esperado: {formatMoney(totalEsperado)}</p>
            <p className="text-sm font-bold text-[#2ecc71]">Total Recaudado: {formatMoney(totalRecaudado)}</p>
          </div>
        </div>

        <ChartPlaceholderMoney 
          title="Comparativa por Terapeuta: Precio Acordado (Esperado) vs Recibido" 
          legendItems={[
            { label: "Precio Acordado (Esperado)", color: "bg-[#2980b9]" },
            { label: "Recibido (Cobrado)", color: "bg-[#2ecc71]" }
          ]} 
        />
      </div>

    </div>
  );
}
