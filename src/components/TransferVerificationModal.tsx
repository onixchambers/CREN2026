"use client";

import { useState, useEffect } from "react";
import { BANCOS_MEXICO, CREN_BANK_INFO, BancoSPEI } from "@/lib/constants/bancos";

interface TransferVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  montoDefault?: number | string;
  fechaDefault?: string;
  claveRastreoInitial?: string;
  bancoEmisorInitial?: string;
  onSaveVerification: (data: {
    claveRastreo: string;
    bancoEmisor: string;
    bancoEmisorClave: string;
    cuentaBeneficiaria: string;
    bancoReceptor: string;
    monto: number;
    fecha: string;
    verificado: boolean;
  }) => void;
}

export function TransferVerificationModal({
  isOpen,
  onClose,
  montoDefault = "500.00",
  fechaDefault = new Date().toISOString().split("T")[0],
  claveRastreoInitial = "",
  bancoEmisorInitial = "AZTECA",
  onSaveVerification
}: TransferVerificationModalProps) {
  const [claveRastreo, setClaveRastreo] = useState(claveRastreoInitial);
  const [bancoEmisorNombre, setBancoEmisorNombre] = useState(bancoEmisorInitial);
  const [fecha, setFecha] = useState(fechaDefault);
  const [montoStr, setMontoStr] = useState(String(montoDefault));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClaveRastreo(claveRastreoInitial || "");
      setBancoEmisorNombre(bancoEmisorInitial || "AZTECA");
      setFecha(fechaDefault || new Date().toISOString().split("T")[0]);
      
      const parsedMonto = parseFloat(String(montoDefault).replace(/[^0-9.-]/g, "")) || 0;
      setMontoStr(parsedMonto > 0 ? parsedMonto.toString() : "500.00");
    }
  }, [isOpen, montoDefault, fechaDefault, claveRastreoInitial, bancoEmisorInitial]);

  if (!isOpen) return null;

  const selectedBancoObj = BANCOS_MEXICO.find(b => b.nombre === bancoEmisorNombre) || BANCOS_MEXICO[0];

  const handleCopyPayload = () => {
    const payloadText = JSON.stringify({
      fecha: fecha,
      criterio: "clave_rastreo",
      claveRastreo: claveRastreo || "N/A",
      emisor: selectedBancoObj.clave,
      bancoEmisorNombre: selectedBancoObj.nombre,
      receptor: CREN_BANK_INFO.claveSpei,
      bancoReceptor: CREN_BANK_INFO.banco,
      cuentaBeneficiaria: CREN_BANK_INFO.cuentaBeneficiaria,
      monto: parseFloat(montoStr) || 0
    }, null, 2);

    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenBanxicoCEP = () => {
    // Abrir el portal oficial CEP de Banxico
    window.open("https://www.banxico.org.mx/cep/", "_blank", "noopener,noreferrer");
  };

  const handleOpenBanxicoCEPSPID = () => {
    // Abrir la variante CEP-SPID de Banxico
    window.open("https://www.banxico.org.mx/cep-spid/", "_blank", "noopener,noreferrer");
  };

  const handleConfirm = () => {
    const m = parseFloat(montoStr) || 0;
    onSaveVerification({
      claveRastreo: claveRastreo.trim(),
      bancoEmisor: selectedBancoObj.nombre,
      bancoEmisorClave: selectedBancoObj.clave,
      cuentaBeneficiaria: CREN_BANK_INFO.cuentaBeneficiaria,
      bancoReceptor: CREN_BANK_INFO.banco,
      monto: m,
      fecha,
      verificado: Boolean(claveRastreo.trim())
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#0e2f44] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl">
              🏦
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">Verificación de Pago SPEI / Banxico</h3>
              <p className="text-[11px] text-emerald-200 font-medium">Comprobante Electrónico de Pago (CEP / Banxico)</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* CREN BENEFICIARIO BANNER */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Cuenta Beneficiaria CREN (Receptora)</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">{CREN_BANK_INFO.banco}</span>
            </div>
            <div className="font-mono font-black text-slate-900 text-base flex items-center gap-2">
              <span>{CREN_BANK_INFO.cuentaBeneficiaria}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(CREN_BANK_INFO.cuentaBeneficiaria)}
                className="text-[10px] bg-white border border-slate-300 hover:bg-slate-100 px-2 py-0.5 rounded font-sans font-bold text-slate-600 transition-colors"
                title="Copiar CLABE CREN"
              >
                📋 Copiar CLABE
              </button>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">{CREN_BANK_INFO.titular}</div>
          </div>

          {/* FORM FIELDS */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Banco Emisor del Pago <span className="text-red-500">*</span>
              </label>
              <select
                value={bancoEmisorNombre}
                onChange={(e) => setBancoEmisorNombre(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl outline-none focus:border-[#1a5276] bg-white font-semibold text-slate-900 shadow-2xs"
              >
                {BANCOS_MEXICO.map(b => (
                  <option key={b.clave} value={b.nombre}>
                    {b.nombre} ({b.clave})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
                Clave de Rastreo / Número de Referencia SPEI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 88161234567890123456"
                value={claveRastreo}
                onChange={(e) => setClaveRastreo(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl outline-none focus:border-[#1a5276] bg-white font-mono font-bold text-slate-900 shadow-2xs"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Ingresa la clave de rastreo proporcionada por la banca móvil del familiar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Monto a Verificar ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="any"
                    value={montoStr}
                    onChange={(e) => setMontoStr(e.target.value)}
                    className="w-full text-xs p-2.5 pl-7 border border-slate-300 rounded-xl outline-none focus:border-[#1a5276] bg-white font-bold text-emerald-700 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Fecha Transferencia</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:border-[#1a5276] bg-white font-semibold text-slate-800 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ACCIONES DIRECTAS DE BANXICO */}
          <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenBanxicoCEP}
                className="w-full py-2.5 px-3 bg-[#1a5276] hover:bg-[#0e2f44] text-white text-[11px] font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>🚀</span> Consultar Banxico CEP
              </button>
              <button
                type="button"
                onClick={handleOpenBanxicoCEPSPID}
                className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>🏛️</span> Banxico CEP-SPID
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <span>✓</span> Guardar Comprobante SPEI
          </button>
        </div>
      </div>
    </div>
  );
}
