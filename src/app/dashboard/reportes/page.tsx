"use client";

import { useState, useEffect } from "react";
import { getFinanzasMensuales } from "@/app/actions/finanzas";
import { getAsistenciasDB } from "@/app/actions/asistencia";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function ReportesPage() {
  const currentYearStr = new Date().toISOString().substring(0, 4);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [loading, setLoading] = useState(true);

  const [reporteMensualData, setReporteMensualData] = useState<any[]>([]);
  const [totalesAnuales, setTotalesAnuales] = useState({
    asistencias: 0,
    ingresoBruto: 0,
    honorarios: 0,
    ivaHonorarios: 0,
    ivaCren: 0,
    gastosOperativos: 0,
    utilidadCren: 0
  });

  useEffect(() => {
    async function loadYearData() {
      setLoading(true);

      const asistRes = await getAsistenciasDB();
      const allAsistencias = asistRes.success && asistRes.data ? asistRes.data : [];

      const monthPromises = MONTH_NAMES.map(async (_, idx) => {
        const monthNumStr = (idx + 1).toString().padStart(2, '0');
        const monthKey = `${selectedYear}-${monthNumStr}`;

        // Obtener finanzas del mes
        const finRes = await getFinanzasMensuales(monthKey);
        const finData = finRes.success && finRes.data ? finRes.data : {
          ingresosBrutos: 0,
          nomina: 0,
          gastosOperativos: 0,
          ivaHonorarios: 0,
          totalIvaFacturas: 0,
          utilidadNeta: 0
        };

        // Obtener asistencias del mes
        const asistMes = allAsistencias.filter((a: any) => a.fecha && a.fecha.startsWith(monthKey));
        const totalAsistenciasMes = asistMes.reduce((acc: number, curr: any) => {
          return acc + parseInt(curr.sesiones || "1");
        }, 0);

        const utilidadCren = finData.ingresosBrutos - (finData.nomina + finData.ivaHonorarios + finData.gastosOperativos);

        return {
          mesNum: monthNumStr,
          mesNombre: MONTH_NAMES[idx],
          totalAsistencias: totalAsistenciasMes,
          ingresoBrutoTotal: finData.ingresosBrutos,
          honorariosTerapeutas: finData.nomina,
          ivaHonorarios: finData.ivaHonorarios,
          ivaCren: finData.totalIvaFacturas,
          gastosOperativos: finData.gastosOperativos,
          utilidadCren: utilidadCren
        };
      });

      const rows = await Promise.all(monthPromises);
      setReporteMensualData(rows);

      // Calcular acumulados anuales
      const acc = rows.reduce((tot, r) => ({
        asistencias: tot.asistencias + r.totalAsistencias,
        ingresoBruto: tot.ingresoBruto + r.ingresoBrutoTotal,
        honorarios: tot.honorarios + r.honorariosTerapeutas,
        ivaHonorarios: tot.ivaHonorarios + r.ivaHonorarios,
        ivaCren: tot.ivaCren + r.ivaCren,
        gastosOperativos: tot.gastosOperativos + r.gastosOperativos,
        utilidadCren: tot.utilidadCren + r.utilidadCren
      }), {
        asistencias: 0,
        ingresoBruto: 0,
        honorarios: 0,
        ivaHonorarios: 0,
        ivaCren: 0,
        gastosOperativos: 0,
        utilidadCren: 0
      });

      setTotalesAnuales(acc);
      setLoading(false);
    }

    loadYearData();
  }, [selectedYear]);

  // Datos para Gráfica Circular (Distribución del Ingreso Anual)
  const donutData = [
    { label: "Honorarios Terapeutas", value: totalesAnuales.honorarios, color: "#2563eb" },
    { label: "Gastos Operativos", value: totalesAnuales.gastosOperativos, color: "#ef4444" },
    { label: "IVA Retenido (Terapeuta)", value: totalesAnuales.ivaHonorarios, color: "#f59e0b" },
    { label: "IVA Facturado (CREN)", value: totalesAnuales.ivaCren, color: "#8b5cf6" },
    { label: "Utilidad CREN", value: Math.max(0, totalesAnuales.utilidadCren), color: "#10b981" }
  ].filter(d => d.value > 0);

  const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="text-center py-8 text-slate-400 text-xs">Sin ingresos registrados en este año</div>;

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
          className="w-36 h-36 rounded-full relative flex items-center justify-center shadow-inner shrink-0"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
            <span className="text-xs font-black text-slate-800">${(total/1000).toFixed(1)}k</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 w-full">
          {data.map((d, i) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="font-semibold text-slate-700">{d.label}</span>
                </div>
                <span className="font-bold text-slate-900">${d.value.toLocaleString()} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Centro de Reportes Financieros CREN</h2>
          <p className="text-sm text-slate-500">Reporte mensualizado consolidado por ejercicio fiscal</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase">Año Fiscal:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-[#1a5276] outline-none focus:border-[#2980b9]"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <>
          {/* TARJETAS ANUALES ACUMULADAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ingreso Bruto Anual</p>
              <p className="text-2xl font-black text-green-600 mt-1">
                ${totalesAnuales.ingresoBruto.toLocaleString('es-MX', {minimumFractionDigits: 2})}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Recaudación acumulada {selectedYear}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Asistencias Año</p>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {totalesAnuales.asistencias}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Sesiones impartidas en el centro</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Honorarios Pagados</p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                ${totalesAnuales.honorarios.toLocaleString('es-MX', {minimumFractionDigits: 2})}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Nómina / Comisiones pagadas</p>
            </div>

            <div className="bg-gradient-to-br from-[#0e2f44] via-[#1a5276] to-[#2980b9] text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
              <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Utilidad CREN Acumulada</p>
              <p className="text-2xl font-black text-white mt-1">
                ${totalesAnuales.utilidadCren.toLocaleString('es-MX', {minimumFractionDigits: 2})}
              </p>
              <p className="text-[11px] text-white/80 mt-2 font-medium">Utilidad neta final del ejercicio</p>
            </div>
          </div>

          {/* TABLA PRINCIPAL BASADA EN LA IMAGEN DEL CLIENTE */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                {/* CABECERA AZUL OSCURA DE LA IMAGEN DEL USUARIO */}
                <thead className="bg-[#0e2f44] text-white font-black uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-4 border-r border-slate-700/50">MES</th>
                    <th className="py-4 px-4 text-center border-r border-slate-700/50">TOTAL ASISTENCIAS</th>
                    <th className="py-4 px-4 text-right border-r border-slate-700/50">INGRESO BRUTO TOTAL</th>
                    <th className="py-4 px-4 text-right border-r border-slate-700/50">HONORARIOS TERAPEUTAS</th>
                    <th className="py-4 px-4 text-right border-r border-slate-700/50">IVA TERAPEUTA</th>
                    <th className="py-4 px-4 text-right border-r border-slate-700/50">IVA CREN</th>
                    <th className="py-4 px-4 text-right border-r border-slate-700/50">GASTOS OPERATIVOS</th>
                    <th className="py-4 px-4 text-right">UTILIDAD CREN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reporteMensualData.map((row) => (
                    <tr key={row.mesNum} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 uppercase">{row.mesNombre} {selectedYear}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                          {row.totalAsistencias}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        ${row.ingresoBrutoTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ${row.honorariosTerapeutas.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600">
                        ${row.ivaHonorarios.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-600">
                        ${row.ivaCren.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        ${row.gastosOperativos.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className={`py-3 px-4 text-right font-black ${row.utilidadCren >= 0 ? 'text-[#1a5276]' : 'text-red-700'}`}>
                        ${row.utilidadCren.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* FILA DE TOTALES ANUALES */}
                <tfoot className="bg-[#1a5276] text-white font-black text-xs uppercase border-t-2 border-[#0e2f44]">
                  <tr>
                    <td className="py-4 px-4">TOTAL ACUMULADO {selectedYear}</td>
                    <td className="py-4 px-4 text-center">{totalesAnuales.asistencias}</td>
                    <td className="py-4 px-4 text-right text-green-300">
                      ${totalesAnuales.ingresoBruto.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 px-4 text-right">
                      ${totalesAnuales.honorarios.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 px-4 text-right text-amber-300">
                      ${totalesAnuales.ivaHonorarios.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 px-4 text-right text-purple-300">
                      ${totalesAnuales.ivaCren.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 px-4 text-right text-red-300">
                      ${totalesAnuales.gastosOperativos.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 px-4 text-right text-yellow-300 text-sm">
                      ${totalesAnuales.utilidadCren.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* GRÁFICAS VISUALES Y COMPARATIVAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* GRÁFICA DE BARRAS: INGRESO BRUTO VS UTILIDAD CREN MES A MES */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                Gráfica de Barras: Comparativo Mensual (Ingreso Bruto vs Utilidad CREN)
              </h3>
              <p className="text-xs text-slate-400 mb-5">Evolución mes a mes durante el ejercicio {selectedYear}</p>

              <div className="space-y-3">
                {reporteMensualData.map((r) => {
                  const maxVal = Math.max(...reporteMensualData.map(m => m.ingresoBrutoTotal), 1);
                  const pctIngreso = (r.ingresoBrutoTotal / maxVal) * 100;
                  const pctUtilidad = (Math.max(0, r.utilidadCren) / maxVal) * 100;

                  return (
                    <div key={r.mesNum} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-slate-700">{r.mesNombre}</span>
                        <span className="text-slate-600">
                          Bruto: <strong className="text-green-600">${r.ingresoBrutoTotal.toLocaleString()}</strong> | Utilidad: <strong className="text-[#1a5276]">${r.utilidadCren.toLocaleString()}</strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex gap-0.5">
                        <div className="h-full bg-green-500 rounded-l-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(2, pctIngreso))}%` }}></div>
                        <div className="h-full bg-[#1a5276] rounded-r-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(2, pctUtilidad))}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRÁFICA CIRCULAR: DISTRIBUCIÓN DEL INGRESO ANUAL */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#1a5276] text-base mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8.99h9c-.47-4.74-4.26-8.52-9-8.99zm0 11.01V22c4.74-.47 8.53-4.25 9-8.99h-9z"/></svg>
                  Gráfica Circular: Distribución del Ingreso Anual
                </h3>
                <p className="text-xs text-slate-400 mb-5">Destino contable del dinero ingresado en {selectedYear}</p>

                <DonutChart data={donutData} />
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
