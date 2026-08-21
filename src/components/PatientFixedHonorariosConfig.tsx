"use client";

import { useState, useEffect } from "react";
import { getPatientFixedHonorarios, savePatientFixedHonorarios, getAllPatientsListForHonorarios } from "@/app/actions/configuracion";

export function PatientFixedHonorariosConfig() {
  const [enabled, setEnabled] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [ratesMap, setRatesMap] = useState<Record<string, { therapistPay: number; crenAssumesInvoice: boolean; enabled: boolean }>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
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

  const updatePatientRate = (patientName: string, field: "therapistPay" | "enabled", val: any) => {
    const key = (patientName || "").trim().toLowerCase();
    setRatesMap(prev => {
      const existing = prev[key] || {
        therapistPay: 360,
        enabled: false // Desactivado por defecto
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

  const handleToggleAllDisplayed = (activeState: boolean) => {
    setRatesMap(prev => {
      const updated = { ...prev };
      patients.forEach(p => {
        const key = (p.name || "").trim().toLowerCase();
        const existing = updated[key] || {
          therapistPay: 360,
          enabled: false
        };
        updated[key] = {
          ...existing,
          enabled: activeState
        };
      });
      return updated;
    });
  };

  // Contadores
  const activeCount = patients.filter(p => {
    const key = (p.name || "").trim().toLowerCase();
    return !!ratesMap[key]?.enabled;
  }).length;
  const inactiveCount = patients.length - activeCount;

  const filteredPatients = patients.filter(p => {
    const key = (p.name || "").trim().toLowerCase();
    const isAct = !!ratesMap[key]?.enabled;

    if (statusFilter === "ACTIVE" && !isAct) return false;
    if (statusFilter === "INACTIVE" && isAct) return false;

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
            Por defecto todos los pacientes nacen sin gancho activo. Activa el gancho para configurar honorarios fijos íntegros a la terapeuta (ej: $360.00). La diferencia será para CREN.
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
              {enabled ? "Se aplicarán los ganchos activos de la tabla" : "Marcar la casilla para activar este esquema"}
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
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* BUSCADOR */}
            <input
              type="text"
              placeholder="🔍 Buscar paciente por nombre o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3.5 py-1.5 text-xs font-medium outline-none focus:border-[#1a5276] w-full lg:w-72 shadow-xs bg-white"
            />

            {/* BOTONES DE FILTRO (TODOS, ACTIVOS, INACTIVOS) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${statusFilter === "ALL" ? "bg-[#0e2f44] text-white border-[#0e2f44]" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"}`}
              >
                Mostrar Todos ({patients.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${statusFilter === "ACTIVE" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"}`}
              >
                ✓ Solo Activos ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${statusFilter === "INACTIVE" ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"}`}
              >
                ☐ Solo Inactivos ({inactiveCount})
              </button>
            </div>

            {/* ACCIONES MASIVAS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAllDisplayed(true)}
                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer"
                title="Marcar el gancho para todos los pacientes"
              >
                ☑️ Activar Todos
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllDisplayed(false)}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-400 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer"
                title="Desmarcar el gancho para todos los pacientes"
              >
                ☐ Desactivar Todos
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e2f44] text-white uppercase text-[10px] tracking-wider font-extrabold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">GANCHO (ACTIVAR)</th>
                  <th className="py-3 px-4">PACIENTE</th>
                  <th className="py-3 px-4">GANANCIA ÍNTEGRA TERAPEUTA ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map((p) => {
                  const key = (p.name || "").trim().toLowerCase();
                  const rateConfig = ratesMap[key] || {
                    therapistPay: 360,
                    enabled: false // Desactivado por defecto
                  };

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${rateConfig.enabled ? "bg-emerald-50/40" : ""}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={!!rateConfig.enabled}
                          onChange={(e) => updatePatientRate(p.name, "enabled", e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p.displayId || (p.id ? p.id.slice(-6).toUpperCase() : "N/A")}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            step="any"
                            value={rateConfig.therapistPay}
                            onChange={(e) => updatePatientRate(p.name, "therapistPay", parseFloat(e.target.value) || 0)}
                            className="w-28 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-emerald-700 outline-none focus:border-emerald-600 bg-white"
                          />
                        </div>
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
