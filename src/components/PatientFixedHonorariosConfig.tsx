"use client";

import { useState, useEffect } from "react";
import { getPatientFixedHonorarios, savePatientFixedHonorarios, getAllPatientsListForHonorarios } from "@/app/actions/configuracion";

export function PatientFixedHonorariosConfig() {
  const [enabled, setEnabled] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, { therapistPay: number; crenAssumesInvoice: boolean; enabled: boolean }>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [patRes, honorRes] = await Promise.all([
        getAllPatientsListForHonorarios(),
        getPatientFixedHonorarios()
      ]);

      if (patRes.success && patRes.patients) {
        setPatients(patRes.patients);
      }

      if (honorRes.success && honorRes.data) {
        setEnabled(!!honorRes.data.enabled);
        setRatesMap(honorRes.data.rates || {});
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await savePatientFixedHonorarios({
        enabled,
        rates: ratesMap
      });
      if (res.success) {
        setMessage({ type: "success", text: "¡Honorarios por paciente guardados correctamente!" });
      } else {
        setMessage({ type: "error", text: res.error || "Error al guardar honorarios." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: "Error: " + e.message });
    } finally {
      setSaving(false);
    }
  };

  const updatePatientRate = (patientName: string, field: "therapistPay" | "crenAssumesInvoice" | "enabled", val: any) => {
    const key = (patientName || "").trim().toLowerCase();
    setRatesMap(prev => {
      const existing = prev[key] || {
        therapistPay: 360,
        crenAssumesInvoice: true,
        enabled: true
      };
      return {
        ...prev,
        [key]: {
          ...existing,
          [field]: val
        }
      };
    });
  };

  const filteredPatients = patients.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.displayId || "").toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold text-sm">Cargando lista de pacientes y honorarios...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-[#0e2f44] flex items-center gap-2">
            <span>🏷️</span> Honorario Fijo / Ganancia Íntegra por Paciente
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configura el pago fijo exacto para la terapeuta por paciente (ej: $360.00 para Santiago Paz Jimenez). La diferencia del costo de la consulta será ganancia para CREN.
          </p>
        </div>

        {/* GANCHO / SWITCH PRINCIPAL */}
        <label className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-amber-100/80 transition-all self-start md:self-auto">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-xs font-black text-amber-900 uppercase">
              {enabled ? "✓ Honorarios por Paciente HABILITADOS" : "☐ Habilitar Gancho por Paciente"}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {enabled ? "Se aplicarán las tarifas de la tabla de abajo" : "Marcar la casilla para activar este esquema"}
            </span>
          </div>
        </label>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-bold border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {message.text}
        </div>
      )}

      {enabled && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Buscar paciente por nombre o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-[#1a5276] w-full sm:w-80 shadow-xs"
            />
            <span className="text-xs font-bold text-slate-500 self-end sm:self-center">
              Mostrando {filteredPatients.length} de {patients.length} pacientes
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e2f44] text-white uppercase text-[10px] tracking-wider font-extrabold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">ACTIVAR</th>
                  <th className="py-3 px-4">PACIENTE</th>
                  <th className="py-3 px-4">GANANCIA ÍNTEGRA TERAPEUTA ($)</th>
                  <th className="py-3 px-4 text-center">FACTURA ASUMIDA POR CREN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map((p) => {
                  const key = (p.name || "").trim().toLowerCase();
                  const rateConfig = ratesMap[key] || {
                    therapistPay: 360,
                    crenAssumesInvoice: true,
                    enabled: true
                  };

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${rateConfig.enabled ? "bg-emerald-50/20" : ""}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={rateConfig.enabled}
                          onChange={(e) => updatePatientRate(p.name, "enabled", e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.displayId && <div className="text-[10px] text-slate-400 font-mono">ID: {p.displayId}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            step="10"
                            value={rateConfig.therapistPay}
                            onChange={(e) => updatePatientRate(p.name, "therapistPay", parseFloat(e.target.value) || 0)}
                            className="w-28 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-emerald-700 outline-none focus:border-emerald-600 bg-white"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rateConfig.crenAssumesInvoice}
                            onChange={(e) => updatePatientRate(p.name, "crenAssumesInvoice", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span>Sí (CREN asume el IVA)</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No se encontraron pacientes para el filtro aplicado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          disabled={saving}
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <span>💾</span>
          <span>{saving ? "Guardando Honorarios..." : "Guardar Configuración por Paciente"}</span>
        </button>
      </div>
    </div>
  );
}
