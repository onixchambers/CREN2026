"use client";

import { useState, useEffect } from "react";
import { 
  getGlobalFunds, 
  saveGlobalFund, 
  deleteGlobalFund, 
  addPaymentToFund,
  deletePaymentFromFund 
} from "@/app/actions/globalFunds";
import { getAllPatientsListForHonorarios } from "@/app/actions/configuracion";
import { DateInput } from "./DateInput";

interface PatientOption {
  id: string;
  name: string;
  displayId: string;
  estatus?: string | null;
}

interface FundPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  notes: string;
  registeredBy: string;
  createdAt: string;
}

interface GlobalFund {
  id: string;
  name: string;
  patientIds: string[];
  payments: FundPayment[];
}

export function GlobalFundsConfig() {
  const [funds, setFunds] = useState<GlobalFund[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI views / forms
  const [activeTab, setActiveTab] = useState<"LIST" | "FORM_FUND" | "FORM_PAY" | "TRANSACTIONS">("LIST");
  const [selectedFund, setSelectedFund] = useState<GlobalFund | null>(null);
  
  // Form state: Fund
  const [fundName, setFundName] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  
  // Form state: Payment
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState("Transferencia");
  const [payNotes, setPayNotes] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const [fundsRes, patRes] = await Promise.all([
        getGlobalFunds(),
        getAllPatientsListForHonorarios()
      ]);
      
      if (fundsRes.success && fundsRes.funds) {
        setFunds(fundsRes.funds);
      }
      if (patRes.success && patRes.patients) {
        setPatients(patRes.patients);
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: "Error de conexión: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateNewFund = () => {
    setSelectedFund(null);
    setFundName("");
    setSelectedPatientIds([]);
    setPatientSearch("");
    setStatusMsg(null);
    setActiveTab("FORM_FUND");
  };

  const handleEditFund = (fund: GlobalFund) => {
    setSelectedFund(fund);
    setFundName(fund.name);
    setSelectedPatientIds(fund.patientIds || []);
    setPatientSearch("");
    setStatusMsg(null);
    setActiveTab("FORM_FUND");
  };

  const handleSaveFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundName.trim()) {
      setStatusMsg({ type: "error", text: "El nombre del fondo es requerido." });
      return;
    }
    if (selectedPatientIds.length === 0) {
      setStatusMsg({ type: "error", text: "Debes seleccionar al menos un paciente." });
      return;
    }

    setActionLoading(true);
    setStatusMsg(null);
    try {
      const res = await saveGlobalFund({
        id: selectedFund?.id,
        name: fundName.trim(),
        patientIds: selectedPatientIds
      });

      if (res.success) {
        setStatusMsg({ type: "success", text: "Fondo familiar guardado con éxito." });
        await loadData();
        setActiveTab("LIST");
      } else {
        setStatusMsg({ type: "error", text: res.error || "Error al guardar el fondo." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFund = async (fund: GlobalFund) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el fondo "${fund.name}"? Los pacientes vinculados volverán a tener saldos individuales.`)) {
      return;
    }
    setActionLoading(true);
    setStatusMsg(null);
    try {
      const res = await deleteGlobalFund(fund.id);
      if (res.success) {
        setStatusMsg({ type: "success", text: "Fondo familiar eliminado." });
        await loadData();
      } else {
        setStatusMsg({ type: "error", text: res.error || "Error al eliminar el fondo." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayClick = (fund: GlobalFund) => {
    setSelectedFund(fund);
    setPayAmount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayMethod("Transferencia");
    setPayNotes("");
    setStatusMsg(null);
    setActiveTab("FORM_PAY");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setStatusMsg({ type: "error", text: "Ingresa un monto de abono válido y mayor a cero." });
      return;
    }

    setActionLoading(true);
    setStatusMsg(null);
    try {
      const res = await addPaymentToFund(selectedFund.id, {
        amount: amt,
        date: payDate,
        method: payMethod,
        notes: payNotes.trim()
      });

      if (res.success) {
        setStatusMsg({ type: "success", text: "Abono registrado con éxito en el fondo." });
        await loadData();
        setActiveTab("LIST");
      } else {
        setStatusMsg({ type: "error", text: res.error || "Error al registrar el abono." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTransactions = (fund: GlobalFund) => {
    setSelectedFund(fund);
    setHistorySubTab("ABONOS");
    setStatusMsg(null);
    setActiveTab("TRANSACTIONS");
  };

  const handleDeleteTransaction = async (paymentId: string) => {
    if (!selectedFund) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar este abono?")) return;

    setActionLoading(true);
    setStatusMsg(null);
    try {
      const res = await deletePaymentFromFund(selectedFund.id, paymentId);
      if (res.success) {
        setStatusMsg({ type: "success", text: "Abono eliminado con éxito." });
        const fundsRes = await getGlobalFunds();
        if (fundsRes.success && fundsRes.funds) {
          setFunds(fundsRes.funds);
          const updated = fundsRes.funds.find((f: any) => f.id === selectedFund.id);
          if (updated) setSelectedFund(updated);
        }
      } else {
        setStatusMsg({ type: "error", text: res.error || "Error al eliminar el abono." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const togglePatientSelection = (patId: string) => {
    setSelectedPatientIds(prev => 
      prev.includes(patId) ? prev.filter(id => id !== patId) : [...prev, patId]
    );
  };

  const filteredPatients = patients.filter(p => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.displayId.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 text-center text-slate-500 font-medium text-xs">
        Cargando configuración de fondos compartidos...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-[#0e2f44] flex items-center gap-2">
            <span>💰</span> Fondos Globales / Pre-pagos Familiares
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Administra abonos globales para hermanos o familias. El saldo se compartirá y se irá descontando conforme se registren las terapias.
          </p>
        </div>

        {activeTab === "LIST" && (
          <button 
            type="button"
            onClick={handleCreateNewFund}
            className="px-4 py-2 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span> Nuevo Fondo Familiar
          </button>
        )}
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold border ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {statusMsg.text}
        </div>
      )}

      {activeTab === "LIST" && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e2f44] text-white uppercase text-[10px] tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-4">FONDO / FAMILIA</th>
                <th className="py-3.5 px-4">PACIENTES VINCULADOS</th>
                <th className="py-3.5 px-4 text-right">TOTAL ABONADO</th>
                <th className="py-3.5 px-4 text-right">SALDO DISPONIBLE</th>
                <th className="py-3.5 px-4 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {funds.map((f) => {
                const totalAbonado = f.totalAbonado !== undefined ? f.totalAbonado : (f.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                const saldoDisp = f.saldoDisponible !== undefined ? f.saldoDisponible : totalAbonado;
                const isNeg = saldoDisp < 0;

                const linkedNames = f.patientIds.map(id => {
                  const pat = patients.find(p => p.id === id);
                  return pat ? pat.name : "Paciente Desconocido";
                });

                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1a5276] text-sm">{f.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {f.id}</div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {linkedNames.map((name, idx) => (
                          <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 text-sm">
                      ${totalAbonado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm">
                      <span className={`px-2.5 py-1 rounded-lg ${isNeg ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {isNeg ? `-$${Math.abs(saldoDisp).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : `$${saldoDisp.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddPayClick(f)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold hover:bg-emerald-100 transition-colors"
                          title="Abonar fondos"
                        >
                          💸 Abonar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewTransactions(f)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold hover:bg-blue-100 transition-colors"
                          title="Historial de Movimientos"
                        >
                          📜 Historial ({f.payments?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditFund(f)}
                          className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold hover:bg-amber-100 transition-colors"
                          title="Editar Vinculaciones"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFund(f)}
                          disabled={actionLoading}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Eliminar Fondo"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {funds.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No hay fondos familiares registrados. Haz clic en <strong>"+ Nuevo Fondo Familiar"</strong> para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM: CREATE / EDIT FUND */}
      {activeTab === "FORM_FUND" && (
        <form onSubmit={handleSaveFund} className="space-y-4 max-w-xl bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h4 className="font-bold text-[#1a5276] text-sm">
              {selectedFund ? `Editar Fondo: ${selectedFund.name}` : "Crear Nuevo Fondo Familiar"}
            </h4>
            <button type="button" onClick={() => setActiveTab("LIST")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre del Fondo / Familia</label>
              <input 
                type="text" 
                placeholder="Ej. Familia Robles Olvera / Hermanos Torres" 
                value={fundName} 
                onChange={(e) => setFundName(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#1a5276] bg-white font-medium text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Seleccionar Pacientes Vinculados ({selectedPatientIds.length})
              </label>
              <input 
                type="text" 
                placeholder="Buscar paciente para vincular..." 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#1a5276] bg-white mb-2"
              />

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white p-2 space-y-1">
                {filteredPatients.map((p) => {
                  const isSelected = selectedPatientIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => togglePatientSelection(p.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 border border-blue-200 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          readOnly 
                          className="rounded text-[#1a5276] focus:ring-[#1a5276]" 
                        />
                        <span>{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {p.displayId}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setActiveTab("LIST")} 
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={actionLoading}
              className="px-5 py-2 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
            >
              {actionLoading ? "Guardando..." : "Guardar Fondo"}
            </button>
          </div>
        </form>
      )}

      {/* FORM: ADD PAYMENT */}
      {activeTab === "FORM_PAY" && selectedFund && (
        <form onSubmit={handleSavePayment} className="space-y-4 max-w-md bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h4 className="font-bold text-emerald-800 text-sm">
              Registrar Abono a: <span className="underline">{selectedFund.name}</span>
            </h4>
            <button type="button" onClick={() => setActiveTab("LIST")} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Monto del Abono ($ MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  placeholder="Ej. 10000" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-sm p-2 py-2.5 pl-7 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 bg-white font-bold text-emerald-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha</label>
                <DateInput 
                  value={payDate} 
                  onChange={(val) => setPayDate(typeof val === "string" ? val : val?.target?.value || val)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Método de Pago</label>
                <select 
                  value={payMethod} 
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 bg-white text-slate-900 font-medium"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Por definir">Por definir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Observaciones / Notas</label>
              <textarea 
                rows={2}
                placeholder="Ej. Depósito mensual hermanos Robles Olvera"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 bg-white text-slate-900 font-medium resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setActiveTab("LIST")} 
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={actionLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
            >
              {actionLoading ? "Registrando..." : "Registrar Abono"}
            </button>
          </div>
        </form>
      )}

      {/* VIEW: TRANSACTIONS / USAGES LIST */}
      {activeTab === "TRANSACTIONS" && selectedFund && (() => {
        const totAbonado = selectedFund.totalAbonado !== undefined ? selectedFund.totalAbonado : (selectedFund.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totConsumido = selectedFund.totalConsumido !== undefined ? selectedFund.totalConsumido : 0;
        const sDisponible = selectedFund.saldoDisponible !== undefined ? selectedFund.saldoDisponible : (totAbonado - totConsumido);
        const isNeg = sDisponible < 0;

        return (
          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h4 className="font-bold text-[#1a5276] text-base">
                  Historial de Movimientos - <span className="underline">{selectedFund.name}</span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">Registro completo de abonos recibidos y consumos por terapias</p>
              </div>
              <button type="button" onClick={() => setActiveTab("LIST")} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition self-start sm:self-auto">
                ← Volver a Lista
              </button>
            </div>

            {/* TARJETAS RESUMEN DE SALDOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Abonado</span>
                <span className="text-lg font-black text-slate-800">
                  ${totAbonado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Consumido en Terapias</span>
                <span className="text-lg font-black text-amber-600">
                  -${totConsumido.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl border shadow-2xs ${isNeg ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <span className="block text-[10px] font-bold uppercase tracking-wide">Saldo Disponible Restante</span>
                <span className={`text-xl font-black ${isNeg ? 'text-red-700' : 'text-emerald-700'}`}>
                  {isNeg ? `-$${Math.abs(sDisponible).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : `$${sDisponible.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            {/* SUB-TABS: ABONOS VS CONSUMOS */}
            <div className="flex gap-2 border-b border-slate-200 pb-2 pt-2">
              <button
                type="button"
                onClick={() => setHistorySubTab("ABONOS")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  historySubTab === "ABONOS"
                    ? "bg-[#1a5276] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                📥 Abonos Recibidos ({selectedFund.payments?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistorySubTab("CONSUMOS")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  historySubTab === "CONSUMOS"
                    ? "bg-[#1a5276] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                📤 Consumos por Terapias ({selectedFund.usages?.length || 0})
              </button>
            </div>

            {/* TABLA DE ABONOS RECIBIDOS */}
            {historySubTab === "ABONOS" && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e2f44] text-white uppercase text-[9px] tracking-wider font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">FECHA</th>
                      <th className="py-2.5 px-3">MÉTODO</th>
                      <th className="py-2.5 px-3 text-right">MONTO</th>
                      <th className="py-2.5 px-3">NOTAS</th>
                      <th className="py-2.5 px-3">REGISTRÓ</th>
                      <th className="py-2.5 px-3 text-center">ELIMINAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {(selectedFund.payments || []).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-800">{p.date}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{p.method}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-600">+${p.amount.toFixed(2)}</td>
                        <td className="py-2 px-3 max-w-[200px] truncate" title={p.notes}>{p.notes || "—"}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400 font-mono text-[10px]">{p.registeredBy}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(p.id)}
                            disabled={actionLoading}
                            className="text-red-500 hover:text-red-700 font-bold p-1 rounded transition-colors disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!selectedFund.payments || selectedFund.payments.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          No se han registrado abonos en este fondo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA DE CONSUMOS POR TERAPIAS */}
            {historySubTab === "CONSUMOS" && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e2f44] text-white uppercase text-[9px] tracking-wider font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">FECHA Y HORA</th>
                      <th className="py-2.5 px-3">PACIENTE QUE LA UTILIZÓ</th>
                      <th className="py-2.5 px-3">TERAPEUTA / ÁREA</th>
                      <th className="py-2.5 px-3 text-right">COSTO DESCONTADO</th>
                      <th className="py-2.5 px-3 text-center">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {(selectedFund.usages || []).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-800">
                          {u.date} <span className="text-[10px] text-slate-400 font-normal">({u.hora || "09:00"})</span>
                        </td>
                        <td className="py-2 px-3 font-bold text-blue-900">
                          {u.patientName}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-700">{u.therapistName}</span>
                          <span className="text-[10px] text-slate-400 block">{u.area}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-red-600">
                          -${u.cost.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            {u.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!selectedFund.usages || selectedFund.usages.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          Aún no hay consumos registrados por terapias de los miembros de este fondo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
