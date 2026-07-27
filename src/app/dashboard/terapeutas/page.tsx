"use client";

import { useState, useEffect } from "react";
import { getFinanzasMensuales } from "@/app/actions/finanzas";
import { getTerapeutasFull } from "@/app/actions/configuracion";
import { DateInput } from "@/components/DateInput";

export default function TerapeutasPage() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [mesActual, setMesActual] = useState(currentMonth);

  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };
  const hoyStr = new Date().toISOString().split("T")[0];

  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfMonth());
  const [fechaHasta, setFechaHasta] = useState(hoyStr);

  const [terapeutas, setTerapeutas] = useState<any[]>([]);
  const [finanzasData, setFinanzasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [terRes, finRes] = await Promise.all([
        getTerapeutasFull(),
        getFinanzasMensuales(mesActual, fechaDesde, fechaHasta)
      ]);

      if (terRes.success && terRes.data) setTerapeutas(terRes.data);
      if (finRes.success && finRes.data) setFinanzasData(finRes.data);

      setLoading(false);
    }
    loadData();
  }, [mesActual, fechaDesde, fechaHasta]);

  const listTerapeutaFinanzas = finanzasData?.terapeutas || [];

  // Calcular métricas clave
  const totalSesiones = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.sesiones || 0), 0);
  const totalIngresos = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.ingresoGenerado || 0), 0);
  const totalPagado = listTerapeutaFinanzas.reduce((acc: number, t: any) => acc + (t.pago || 0), 0);

  // Terapeuta destacada (con más sesiones)
  let masSesionesTerapeuta = "Sin registros";
  let maxSesionesCount = 0;
  listTerapeutaFinanzas.forEach((t: any) => {
    if (t.sesiones > maxSesionesCount) {
      maxSesionesCount = t.sesiones;
      masSesionesTerapeuta = t.nombre;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Terapeutas y Desempeño</h2>
          <p className="text-sm text-slate-500">Métricas de rendimiento, comisiones y producción por especialista</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Mes:</label>
            <input 
              type="month" 
              value={mesActual}
              onChange={(e) => {
                setMesActual(e.target.value);
                const [y, m] = e.target.value.split("-");
                setFechaDesde(`${y}-${m}-01`);
                const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                setFechaHasta(`${y}-${m}-${lastDay.toString().padStart(2, '0')}`);
              }}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold outline-none focus:border-[#2980b9] text-[#1a5276]"
            />
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Desde:</label>
            <DateInput 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-[#2980b9] text-[#1a5276]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Hasta:</label>
            <DateInput 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-[#2980b9] text-[#1a5276]"
            />
          </div>
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
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mayor Producción de Sesiones</p>
                <p className="text-lg font-black text-slate-800 mt-1 truncate">{masSesionesTerapeuta}</p>
              </div>
              <p className="text-[11px] text-amber-600 mt-3 font-bold">{maxSesionesCount} sesión(es) impartidas</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Sesiones Periodo</p>
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

          {/* GRÁFICAS RECOMENDADAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GRÁFICA 1: PRODUCTIVIDAD DE SESIONES */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Comparativo de Sesiones Atendidas por Terapeuta
                </h3>
                <p className="text-xs text-slate-400 mb-5">Cantidad de citas completadas en el periodo</p>

                <div className="space-y-4">
                  {listTerapeutaFinanzas.map((t: any, idx: number) => {
                    const pct = totalSesiones > 0 ? (t.sesiones / totalSesiones) * 100 : 0;
                    return (
                      <div key={t.id || idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{t.nombre} ({t.especialidad})</span>
                          <span className="text-[#1a5276] font-bold">{t.sesiones} sesión(es) ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {listTerapeutaFinanzas.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No hay sesiones registradas para terapeutas.</p>
                  )}
                </div>
              </div>
            </div>

            {/* GRÁFICA 2: RECAUDACIÓN BRUTA VS PAGOS */}
            <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                  Ingresos Generados vs Honorarios Pagados
                </h3>
                <p className="text-xs text-slate-400 mb-5">Proporción de ingresos generados vs comisión recibida</p>

                <div className="space-y-4">
                  {listTerapeutaFinanzas.map((t: any, idx: number) => {
                    const pctPago = t.ingresoGenerado > 0 ? (t.pago / t.ingresoGenerado) * 100 : 0;
                    return (
                      <div key={t.id || idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{t.nombre}</span>
                          <span className="text-slate-600">
                            Generado: <strong className="text-green-600">${t.ingresoGenerado.toLocaleString()}</strong> | Pago: <strong className="text-blue-700">${t.pago.toLocaleString()}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(4, 100 - pctPago))}%` }} title="Margen CREN"></div>
                          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(4, pctPago))}%` }} title="Comisión Terapeuta"></div>
                        </div>
                      </div>
                    );
                  })}
                  {listTerapeutaFinanzas.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">Sin ingresos registrados en este periodo.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* TABLA DE DIRECTORIO Y HONORARIOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Directorio y Desglose Contable por Terapeuta
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Terapeuta</th>
                    <th className="py-2.5 px-4">Especialidad</th>
                    <th className="py-2.5 px-4">Esquema de Pago</th>
                    <th className="py-2.5 px-4 text-center">Retención IVA</th>
                    <th className="py-2.5 px-4 text-center">Sesiones</th>
                    <th className="py-2.5 px-4 text-right">Ingreso Bruto</th>
                    <th className="py-2.5 px-4 text-right">Honorario Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listTerapeutaFinanzas.map((t: any, i: number) => (
                    <tr key={t.id || i} className="hover:bg-slate-50">
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.retieneIVA ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                          {t.retieneIVA ? 'Sí (16%)' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{t.sesiones}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        ${t.ingresoGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#1a5276]">
                        ${t.pago.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                  {listTerapeutaFinanzas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">No hay terapeutas registradas.</td>
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
