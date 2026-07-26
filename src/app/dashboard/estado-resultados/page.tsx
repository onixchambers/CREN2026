"use client";

import { useState, useEffect } from "react";
import { getFinanzasMensuales, addGastoOperativo, removeGastoOperativo } from "@/app/actions/finanzas";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function EstadoResultadosPage() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [mesActual, setMesActual] = useState(currentMonth);
  
  const [datos, setDatos] = useState({
    ingresosBrutos: 0,
    nomina: 0,
    gastosOperativos: 0,
    gastosList: [] as any[],
    ivaHonorarios: 0,
    utilidadNeta: 0,
    terapeutas: [] as any[]
  });

  const [loading, setLoading] = useState(true);

  // Formularios
  const [nuevoGasto, setNuevoGasto] = useState({ label: "", amount: "" });

  const fetchDatos = async () => {
    setLoading(true);
    const res = await getFinanzasMensuales(mesActual);
    if (res.success && res.data) {
      setDatos(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDatos();
  }, [mesActual]);

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGasto.label || !nuevoGasto.amount) return;
    
    await addGastoOperativo(mesActual, nuevoGasto.label, parseFloat(nuevoGasto.amount));
    setNuevoGasto({ label: "", amount: "" });
    fetchDatos();
  };

  const handleRemoveGasto = async (id: string) => {
    if (confirm("¿Eliminar este gasto?")) {
      await removeGastoOperativo(id);
      fetchDatos();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estado de Resultados y Finanzas</h2>
          <p className="text-sm text-slate-500">Reporte mensual contable y operativo del CREN</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <label className="text-sm font-bold text-slate-500 uppercase">Mes de Consulta:</label>
          <input 
            type="month" 
            value={mesActual}
            onChange={(e) => setMesActual(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#2980b9] text-[#1a5276]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-black text-[#1a5276] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                Balance General ({mesActual})
              </h3>
              
              <table className="w-full text-left text-sm border-collapse">
                <tbody>
                  {/* Ingresos */}
                  <tr className="bg-green-50/50">
                    <td className="p-3 font-bold text-slate-500 uppercase text-xs tracking-wider" colSpan={2}>1. INGRESOS</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 pl-6 font-semibold text-slate-700">Ingreso Bruto Terapias</td>
                    <td className="p-3 text-right font-bold text-green-700">${datos.ingresosBrutos.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr><td colSpan={2} className="h-4"></td></tr>

                  {/* Egresos */}
                  <tr className="bg-red-50/50">
                    <td className="p-3 font-bold text-slate-500 uppercase text-xs tracking-wider" colSpan={2}>2. EGRESOS</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 pl-6 text-slate-600">Honorarios Terapeutas</td>
                    <td className="p-3 text-right text-red-600 font-medium">-${datos.nomina.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 pl-6 text-slate-600">Gastos Operativos (Fijos)</td>
                    <td className="p-3 text-right text-red-600 font-medium">-${datos.gastosOperativos.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr><td colSpan={2} className="h-4"></td></tr>

                  {/* Impuestos */}
                  <tr className="bg-amber-50/50">
                    <td className="p-3 font-bold text-slate-500 uppercase text-xs tracking-wider" colSpan={2}>3. IMPUESTOS RETENIDOS</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 pl-6 text-slate-600">IVA Honorarios (16%)</td>
                    <td className="p-3 text-right text-amber-600 font-medium">-${datos.ivaHonorarios.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr><td colSpan={2} className="h-6"></td></tr>

                  {/* Utilidad */}
                  <tr className="bg-[#1a5276] text-white rounded-lg overflow-hidden">
                    <td className="p-4 font-bold text-lg rounded-l-lg">UTILIDAD NETA CREN</td>
                    <td className="p-4 text-right font-black text-xl rounded-r-lg">${datos.utilidadNeta.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GASTOS OPERATIVOS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Detalle Gastos Operativos
                </h4>
              </div>
              <div className="p-4">
                <form onSubmit={handleAddGasto} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Ej. Luz" 
                    value={nuevoGasto.label} 
                    onChange={e => setNuevoGasto({...nuevoGasto, label: e.target.value})}
                    className="flex-grow border border-slate-300 rounded px-3 py-1.5 text-sm" required 
                  />
                  <input 
                    type="number" 
                    placeholder="Monto $" 
                    value={nuevoGasto.amount} 
                    onChange={e => setNuevoGasto({...nuevoGasto, amount: e.target.value})}
                    className="w-24 border border-slate-300 rounded px-3 py-1.5 text-sm" required step="0.01" min="0" 
                  />
                  <button type="submit" className="bg-[#1a5276] text-white px-3 py-1.5 rounded text-sm font-bold">+</button>
                </form>

                <div className="space-y-2">
                  {datos.gastosList.map((gasto: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded">
                      <span className="font-medium text-slate-700">{gasto.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-red-600 font-bold">${gasto.amount.toLocaleString()}</span>
                        {gasto.id.length > 2 && ( // only allow delete on db items, not mock defaults
                          <button onClick={() => handleRemoveGasto(gasto.id)} className="text-slate-400 hover:text-red-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: PANEL DE TERAPEUTAS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-[#1a5276] flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  Panel de Honorarios y Terapeutas
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Terapeuta</th>
                      <th className="px-4 py-3 text-center">Sesiones Dadas</th>
                      <th className="px-4 py-3 text-right">Ingreso Generado</th>
                      <th className="px-4 py-3 text-right">Esquema</th>
                      <th className="px-4 py-3 text-right">Pago a Terapeuta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datos.terapeutas.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{t.nombre}</p>
                          <p className="text-xs text-slate-400">{t.especialidad}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                            {t.sesiones}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                          ${t.ingresoGenerado.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[11px] font-bold text-slate-500 border border-slate-200 px-2 py-1 rounded">
                            {t.tipoPago === "Porcentaje" ? `${t.porcentaje}%` : `Base $${t.salarioBase}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#1a5276]">
                          ${t.pago.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                    {datos.terapeutas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No hay terapeutas registradas. Ve a Configuración para agregar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 font-bold text-right text-slate-600">TOTALES:</td>
                      <td className="px-4 py-3 text-right font-black text-green-700">
                        ${datos.terapeutas.reduce((acc, curr) => acc + curr.ingresoGenerado, 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                      <td></td>
                      <td className="px-4 py-3 text-right font-black text-[#1a5276]">
                        ${datos.nomina.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* AVISO METRICAS */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">Reporte Anual y Métricas Avanzadas</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Las métricas avanzadas y comparativas anuales estarán disponibles cuando el sistema haya recopilado al menos 2 meses completos de operaciones para poder generar gráficas de crecimiento. Por el momento, el módulo financiero opera en modo de balance general mensual (MVP).
                </p>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
