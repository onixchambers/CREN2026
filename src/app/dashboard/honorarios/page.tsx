"use client";
import { useState, useEffect } from "react";
import { getTerapeutasFull, updateTerapeutaConfig } from "@/app/actions/configuracion";

export default function HonorariosPage() {
  const [terapeutas, setTerapeutas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [editingTerapeuta, setEditingTerapeuta] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    tipoPago: "Porcentaje",
    porcentaje: 50,
    salarioBase: 0,
    retieneIVA: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTerapeutas();
  }, []);

  async function loadTerapeutas() {
    setIsLoading(true);
    const res = await getTerapeutasFull();
    if (res.success && res.data) {
      setTerapeutas(res.data);
    }
    setIsLoading(false);
  }

  const handleEditClick = (t: any) => {
    setEditingTerapeuta(t);
    setEditForm({
      tipoPago: t.tipoPago || "Porcentaje",
      porcentaje: t.porcentaje ?? 50,
      salarioBase: t.salarioBase ?? 0,
      retieneIVA: t.retieneIVA ?? false,
    });
  };

  const handleSaveConfig = async () => {
    if (!editingTerapeuta) return;
    setIsSaving(true);
    const res = await updateTerapeutaConfig(editingTerapeuta.id, editForm);
    if (res.success) {
      await loadTerapeutas();
      setEditingTerapeuta(null);
    } else {
      alert("Error al guardar la configuración: " + res.error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Honorarios Terapeutas</h2>
          <p className="text-sm text-slate-500">Cálculo de nómina y participaciones</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-md shadow-sm transition-colors">
          Exportar a PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Terapeuta</th>
                <th className="p-4 font-semibold">Esquema</th>
                <th className="p-4 font-semibold">Configuración IVA</th>
                <th className="p-4 font-semibold text-right">Ingreso Bruto Generado</th>
                <th className="p-4 font-semibold text-right text-blue-700">Total a Pagar</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terapeutas.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-800">
                  <td className="p-4 font-medium text-slate-900">{t.name}</td>
                  <td className="p-4 text-xs">
                    {t.tipoPago === "Salario Base" ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-200">Salario: ${t.salarioBase}</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 rounded-md border text-slate-700">Porcentaje ({t.porcentaje}%)</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {t.tipoPago === "Porcentaje" ? (t.retieneIVA ? "Aplica retención (16%)" : "Sin retención de IVA") : "-"}
                  </td>
                  <td className="p-4 text-right text-slate-700">$0.00</td>
                  <td className="p-4 text-right font-bold text-blue-700">
                    {t.tipoPago === "Salario Base" ? `$${t.salarioBase?.toFixed(2) || "0.00"}` : "$0.00"}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleEditClick(t)}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-semibold"
                    >
                      Configurar
                    </button>
                  </td>
                </tr>
              ))}
              {terapeutas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No hay terapeutas registrados en Configuración</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONFIGURACION */}
      {editingTerapeuta && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Configurar Honorarios - {editingTerapeuta.name}</h3>
              <button 
                onClick={() => setEditingTerapeuta(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Pago</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
                  value={editForm.tipoPago}
                  onChange={(e) => setEditForm({...editForm, tipoPago: e.target.value})}
                >
                  <option value="Porcentaje">Porcentaje por Sesión</option>
                  <option value="Salario Base">Salario Base Fijo</option>
                </select>
              </div>

              {editForm.tipoPago === "Porcentaje" && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Porcentaje que recibe (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                      value={editForm.porcentaje}
                      onChange={(e) => setEditForm({...editForm, porcentaje: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <input 
                      type="checkbox" 
                      id="ivaCheck"
                      checked={editForm.retieneIVA}
                      onChange={(e) => setEditForm({...editForm, retieneIVA: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="ivaCheck" className="text-sm text-slate-700 font-medium cursor-pointer">
                      Descontar IVA (16%) de su honorario
                    </label>
                  </div>
                </div>
              )}

              {editForm.tipoPago === "Salario Base" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Salario Base ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    value={editForm.salarioBase}
                    onChange={(e) => setEditForm({...editForm, salarioBase: parseFloat(e.target.value) || 0})}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTerapeuta(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
