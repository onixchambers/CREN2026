"use client";

import { useState, useEffect } from "react";
import { getFinanzasMensuales, addGastoOperativo, removeGastoOperativo } from "@/app/actions/finanzas";
import { DateInput } from "@/components/DateInput";

export default function FinanzasPage() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [mesActual, setMesActual] = useState(currentMonth);

  const getFirstDayOfMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  };
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfMonth());
  const [fechaHasta, setFechaHasta] = useState(getTodayStr());

  const [datos, setDatos] = useState({
    ingresosBrutos: 0,
    nomina: 0,
    gastosOperativos: 0,
    gastosList: [] as any[],
    ivaHonorarios: 0,
    totalIvaFacturas: 0,
    utilidadNeta: 0,
    terapeutas: [] as any[]
  });

  const [loading, setLoading] = useState(true);

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const fetchDatos = async () => {
    setLoading(true);
    const res = await getFinanzasMensuales(mesActual, fechaDesde, fechaHasta);
    if (res.success && res.data) {
      setDatos(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDatos();
  }, [mesActual, fechaDesde, fechaHasta]);

  const gastosTotales = datos.nomina + datos.gastosOperativos;
  const balanceActual = datos.ingresosBrutos - gastosTotales;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER CON CONTROLES DE FECHA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control Financiero - Estado de Cuenta</h2>
          <p className="text-sm text-slate-500">Resumen de ingresos por pagos de terapeutas, comisiones y gastos operativos</p>
        </div>
        <div className="flex flex-nowrap items-center gap-2.5 bg-white p-2 rounded-lg shadow-sm border border-slate-200 overflow-x-auto whitespace-nowrap">
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
              onChange={(val) => {
                const next = typeof val === "string" ? val : (val?.target?.value || val);
                setFechaDesde(next);
              }}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-[#2980b9] text-[#1a5276] cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Hasta:</label>
            <DateInput 
              value={fechaHasta} 
              onChange={(val) => {
                const next = typeof val === "string" ? val : (val?.target?.value || val);
                setFechaHasta(next);
              }}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-[#2980b9] text-[#1a5276] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* TARJETAS PRINCIPALES */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* INGRESOS TOTALES */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales</span>
                <p className="text-3xl font-extrabold text-green-600 mt-2">
                  ${datos.ingresosBrutos.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-3">Pagos de terapias registrados en el periodo</p>
            </div>

            {/* IVA RETENIDO / FACTURADO */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">IVA Recaudado / Retenido</span>
                <p className="text-3xl font-extrabold text-amber-600 mt-2">
                  ${((datos.ivaHonorarios || 0) + (datos.totalIvaFacturas || 0)).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="text-xs text-amber-700/80 mt-3 font-medium space-y-0.5">
                <div>• IVA Paciente (CREN): <strong>${(datos.totalIvaFacturas || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></div>
                <div>• IVA Retenido Terapeuta: <strong>${(datos.ivaHonorarios || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></div>
              </div>
            </div>

            {/* GASTOS TOTALES */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos Totales</span>
                <p className="text-3xl font-extrabold text-red-600 mt-2">
                  -${gastosTotales.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="text-xs text-slate-500 mt-3 space-y-0.5">
                <div>• Honorarios terapeutas: <strong>${datos.nomina.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></div>
                <div>• Gastos operativos: <strong>${datos.gastosOperativos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></div>
              </div>
            </div>

            {/* CUADRO AZUL - BALANCE ACTUAL */}
            <div className="bg-gradient-to-br from-[#0e2f44] via-[#1a5276] to-[#2980b9] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Balance Actual</span>
                <p className="text-4xl font-black mt-2">
                  ${balanceActual.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </p>
              </div>
              <p className="text-xs text-white/80 mt-3">
                Calculado: Ingresos (${datos.ingresosBrutos.toLocaleString()}) - Gastos (${gastosTotales.toLocaleString()})
              </p>
            </div>
          </div>

          {/* DESGLOSE TERAPEUTAS / PAGOS */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Ingresos y Honorarios por Terapeuta ({formatDateStr(fechaDesde)} a {formatDateStr(fechaHasta)})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Terapeuta</th>
                    <th className="py-2.5 px-3 text-center">Sesiones</th>
                    <th className="py-2.5 px-3 text-right">Ingresos Registrados</th>
                    <th className="py-2.5 px-3 text-right">Comisión (%)</th>
                    <th className="py-2.5 px-3 text-right text-amber-600">IVA Retenido (16%)</th>
                    <th className="py-2.5 px-3 text-right">Pago a Terapeuta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.terapeutas.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{t.nombre}</p>
                        <p className="text-xs text-slate-400">{t.especialidad}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-xs">
                          {t.sesiones}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-green-600">
                        ${t.ingresoGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-medium text-slate-500">
                        {t.tipoPago === "Porcentaje" ? `${t.porcentaje}%` : `Base $${t.salarioBase}`}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-600">
                        ${(t.ivaRetenido || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1a5276]">
                        ${t.pago.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                  {datos.terapeutas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Sin pagos ni sesiones registradas en este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GASTOS OPERATIVOS */}
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                Gastos Operativos
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {datos.gastosList.map((gasto: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 border border-slate-100 rounded">
                    <span className="font-medium text-slate-700">{gasto.label}</span>
                    <span className="text-red-600 font-bold">${gasto.amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                  </div>
                ))}
                {datos.gastosList.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No hay gastos operativos registrados en Configuración.</p>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-600">Total Gastos Operativos:</span>
              <span className="text-red-600">${datos.gastosOperativos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

