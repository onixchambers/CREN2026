"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getTerapeutasFull, updateTerapeutaConfig, getAllowTherapistEdit } from "@/app/actions/configuracion";
import { getFinanzasMensuales } from "@/app/actions/finanzas";
import { DateInput } from "@/components/DateInput";
import { PatientFixedHonorariosConfig } from "@/components/PatientFixedHonorariosConfig";

export default function HonorariosPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [editingTerapeuta, setEditingTerapeuta] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    tipoPago: "Porcentaje",
    porcentaje: 50,
    porcentajeValoracion: 50,
    salarioBase: 0,
    retieneIVA: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [mesActual, fechaDesde, fechaHasta]);

  async function loadData() {
    setIsLoading(true);
    const [terRes, finRes, allowed] = await Promise.all([
      getTerapeutasFull(),
      getFinanzasMensuales(mesActual, fechaDesde, fechaHasta),
      getAllowTherapistEdit()
    ]);

    if (terRes.success && terRes.data) setTerapeutas(terRes.data);
    if (finRes.success && finRes.data) setFinanzasData(finRes.data);
    setAllowTherapistEdit(allowed);

    setIsLoading(false);
  }

  const handleEditClick = (t: any) => {
    setEditingTerapeuta(t);
    setEditForm({
      tipoPago: t.tipoPago || "Porcentaje",
      porcentaje: t.porcentaje ?? 50,
      porcentajeValoracion: t.porcentajeValoracion ?? (t.porcentaje ?? 50),
      salarioBase: t.salarioBase ?? 0,
      retieneIVA: t.retieneIVA ?? false,
    });
  };

  const handleSaveConfig = async () => {
    if (!editingTerapeuta) return;
    if ((userRole.toUpperCase() === "TERAPEUTA" || userRole.toUpperCase() === "INVITADO") && !allowTherapistEdit) {
      alert("La administración no ha habilitado el permiso para modificar la configuración de honorarios.");
      return;
    }
    setIsSaving(true);
    const res = await updateTerapeutaConfig(editingTerapeuta.id, editForm);
    if (res.success) {
      await loadData();
      setEditingTerapeuta(null);
    } else {
      alert("Error al guardar la configuración: " + res.error);
    }
    setIsSaving(false);
  };

  // Mapear datos financieros reales acumulados por terapeuta
  const finanzasMap = new Map<string, any>();
  if (finanzasData && finanzasData.terapeutas) {
    finanzasData.terapeutas.forEach((t: any) => {
      finanzasMap.set(t.id, t);
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Honorarios Terapeutas</h2>
          <p className="text-sm text-slate-500">Cálculo de nómina, comisiones y retención de IVA (16%)</p>
        </div>

        {/* CONTROLES DE FECHA */}
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

      <PatientFixedHonorariosConfig />

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b uppercase text-xs">
                <tr>
                  <th className="p-4 font-semibold">Terapeuta</th>
                  <th className="p-4 font-semibold">Esquema</th>
                  <th className="p-4 font-semibold">Retención IVA</th>
                  <th className="p-4 font-semibold text-center">Sesiones</th>
                  <th className="p-4 font-semibold text-right">Ingreso Bruto</th>
                  <th className="p-4 font-semibold text-right text-amber-600">IVA Retenido (16%)</th>
                  <th className="p-4 font-semibold text-right text-blue-700">Total a Pagar</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terapeutas.map((t, i) => {
                  const finData = finanzasMap.get(t.id) || {};
                  const sesionesCount = finData.sesiones || 0;
                  const ingresoGenerado = finData.ingresoGenerado || 0;
                  const pagoNeto = finData.pago || (t.tipoPago === "Salario Base" ? (t.salarioBase || 0) : 0);
                  const ivaRetenido = t.retieneIVA ? (pagoNeto * 0.16) : 0;
                  const tieneIVA = t.retieneIVA === true;

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-800">
                      <td className="p-4 font-bold text-slate-900">{t.name}</td>
                      <td className="p-4 text-xs">
                        {t.tipoPago === "Salario Base" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 font-semibold w-fit">
                              Salario Base: ${t.salarioBase}/mes
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium pl-0.5">
                              📅 Pago quincenal los días 15 y 30 (${((t.salarioBase || 0) / 2).toFixed(2)}/quincena)
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200 font-semibold">
                            Porcentaje ({t.porcentaje}%)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        {t.tipoPago === "Porcentaje" ? (
                          tieneIVA ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                              Con IVA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                              Sin IVA
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">{sesionesCount}</td>
                      <td className="p-4 text-right font-semibold text-green-600">
                        ${ingresoGenerado.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-right font-semibold text-amber-600">
                        ${ivaRetenido.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-right font-black text-[#1a5276] text-base">
                        ${pagoNeto.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-center">
                        {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) ? (
                          <button 
                            onClick={() => handleEditClick(t)}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-semibold transition-colors cursor-pointer"
                          >
                            Configurar
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">Sin permiso</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {terapeutas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">No hay terapeutas registrados en Configuración</td>
                  </tr>
                )}
              </tbody>
              {terapeutas.length > 0 && (
                <tfoot className="bg-gradient-to-r from-[#0e2f44] via-[#164e63] to-[#0891b2] text-white font-bold text-sm shadow-md">
                  <tr className="border-t-2 border-[#155e75]">
                    <td colSpan={3} className="p-4 uppercase tracking-wider text-xs text-slate-300 font-black">
                      TOTALES GENERALES
                    </td>
                    <td className="p-4 text-center font-black text-base text-blue-300">
                      {terapeutas.reduce((acc, t) => acc + (finanzasMap.get(t.id)?.sesiones || 0), 0)}
                    </td>
                    <td className="p-4 text-right font-black text-base text-green-400">
                      ${terapeutas.reduce((acc, t) => acc + (finanzasMap.get(t.id)?.ingresoGenerado || 0), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-right font-black text-base text-amber-400">
                      ${terapeutas.reduce((acc, t) => {
                        const finData = finanzasMap.get(t.id) || {};
                        const pagoNeto = finData.pago || (t.tipoPago === "Salario Base" ? (t.salarioBase || 0) : 0);
                        const ivaRet = finData.ivaRetenido !== undefined ? finData.ivaRetenido : (t.retieneIVA ? (pagoNeto * 0.16) : 0);
                        return acc + ivaRet;
                      }, 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-right font-black text-lg text-white">
                      ${terapeutas.reduce((acc, t) => {
                        const finData = finanzasMap.get(t.id) || {};
                        const pagoNeto = finData.pago || (t.tipoPago === "Salario Base" ? (t.salarioBase || 0) : 0);
                        return acc + pagoNeto;
                      }, 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACION */}
      {editingTerapeuta && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Configurar Honorarios - {editingTerapeuta.name}</h3>
              <button 
                onClick={() => setEditingTerapeuta(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Pago</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 font-medium"
                  value={editForm.tipoPago}
                  onChange={(e) => setEditForm({ ...editForm, tipoPago: e.target.value })}
                >
                  <option value="Porcentaje">Porcentaje de Sesión</option>
                  <option value="Salario Base">Salario Base Fijo</option>
                </select>
              </div>

              {editForm.tipoPago === "Porcentaje" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Porcentaje Sesión Normal (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-semibold"
                      value={editForm.porcentaje}
                      onChange={(e) => setEditForm({ ...editForm, porcentaje: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#1a5276] uppercase mb-1 flex items-center justify-between">
                      <span>Porcentaje por Valoración (%)</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold">Valoraciones / Evaluaciones</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full p-2 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-600 font-bold bg-blue-50/50 text-[#1a5276]"
                      value={editForm.porcentajeValoracion}
                      onChange={(e) => setEditForm({ ...editForm, porcentajeValoracion: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Porcentaje especial que cobrará la terapeuta en consultas clasificadas como Valoración o Evaluación.</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <input 
                      type="checkbox"
                      id="retieneIVA"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      checked={editForm.retieneIVA}
                      onChange={(e) => setEditForm({ ...editForm, retieneIVA: e.target.checked })}
                    />
                    <label htmlFor="retieneIVA" className="text-xs font-semibold text-amber-900 cursor-pointer">
                      Descontar IVA (16%) de sus honorarios
                    </label>
                  </div>
                </>
              )}

              {editForm.tipoPago === "Salario Base" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Salario Base ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 font-semibold"
                    value={editForm.salarioBase}
                    onChange={(e) => setEditForm({ ...editForm, salarioBase: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTerapeuta(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
