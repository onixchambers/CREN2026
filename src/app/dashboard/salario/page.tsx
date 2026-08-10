"use client";

import { useState, useEffect } from "react";
import { getTerapeutasFull, getPatientFixedHonorarios } from "@/app/actions/configuracion";
import { getAsistenciasDB } from "@/app/actions/asistencia";
import { DateInput } from "@/components/DateInput";

export default function SalarioPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [mesActual, setMesActual] = useState(currentMonthStr);

  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };
  const hoyStr = new Date().toISOString().split("T")[0];

  const [fechaDesde, setFechaDesde] = useState(getFirstDayOfMonth());
  const [fechaHasta, setFechaHasta] = useState(hoyStr);

  const [terapeutas, setTerapeutas] = useState<any[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [fixedHonorarios, setFixedHonorarios] = useState<any>({ enabled: false, rates: {} });
  const [selectedTerapeutaId, setSelectedTerapeutaId] = useState<string>("TODAS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [terRes, asistRes, honorRes] = await Promise.all([
        getTerapeutasFull(),
        getAsistenciasDB(),
        getPatientFixedHonorarios()
      ]);

      if (terRes.success && terRes.data) setTerapeutas(terRes.data);
      if (asistRes.success && asistRes.data) setAsistencias(asistRes.data);
      if (honorRes.success && honorRes.data) setFixedHonorarios(honorRes.data);

      setLoading(false);
    }
    loadData();
  }, []);

  // Filtrar asistencias dentro del rango de fechas activo
  const asistenciasPeriodo = asistencias.filter((a: any) => {
    if (!a.fecha) return false;
    return a.fecha >= fechaDesde && a.fecha <= fechaHasta;
  });

  // Lista de terapeutas a mostrar
  const terapeutasFiltrados = selectedTerapeutaId === "TODAS" 
    ? terapeutas 
    : terapeutas.filter(t => t.id === selectedTerapeutaId || t.name === selectedTerapeutaId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* HEADER PRINCIPAL Y CONTROLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Desglose de Salario y Pagos a Terapeutas</h2>
          <p className="text-sm text-slate-500">Detalle por periodo (Semanal, Quincenal, Mensual) y por Paciente</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-slate-200">
          {/* SELECTOR TERAPEUTA */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Terapeuta:</label>
            <select
              value={selectedTerapeutaId}
              onChange={(e) => setSelectedTerapeutaId(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-[#1a5276] outline-none"
            >
              <option value="TODAS">-- Todas las Terapeutas --</option>
              {terapeutas.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

          {/* CONTROLES DE FECHA */}
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
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Desde:</label>
            <DateInput 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Hasta:</label>
            <DateInput 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-[#1a5276] outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a5276]"></div></div>
      ) : (
        <div className="space-y-12">
          {terapeutasFiltrados.map((t) => {
            // Asistencias del terapeuta en el periodo
            const asistenciasT = asistenciasPeriodo.filter((a: any) => {
              return a.terapeuta === t.name || a.therapistId === t.id;
            });

            // Agrupar asistencias por semana (Días 1-7, 8-14, 15-21, 22-28, 29-31)
            let sem1 = 0, sem2 = 0, sem3 = 0, sem4 = 0, sem5 = 0;
            let q1 = 0, q2 = 0;

            // Agrupar asistencias por paciente
            const pacienteMap = new Map<string, {
              pacienteNombre: string;
              asistenciasCount: number;
              deudaTotal: number;
              subtotalValor: number;
              terapeutaPago: number;
              ivaRetenido: number;
              ivaPaciente: number;
              crenGanancia: number;
              isFixedRate: boolean;
              fixedRateVal: number;
              tipoSesiones: string[];
            }>();

            let ingresoBrutoTotalGen = 0;
            let honorariosTotalGen = 0;
            let ivaTotalRetenidoGen = 0;
            let ivaCrenTotalGen = 0;

            asistenciasT.forEach((a: any) => {
              const day = parseInt((a.fecha || "").split("-")[2] || "1");
              const precioSession = parseFloat(a.total ? a.total.replace(/[^0-9.-]+/g,"") : (a.subtotal ? a.subtotal.replace(/[^0-9.-]+/g,"") : "0")) || 0;
              
              ingresoBrutoTotalGen += precioSession;

              const pName = (a.paciente || a.pacienteNombre || "Paciente Desconocido").trim();
              const pNameLower = pName.toLowerCase();
              const rateConfig = fixedHonorarios?.enabled ? fixedHonorarios?.rates?.[pNameLower] : null;
              const isFixedActive = rateConfig && rateConfig.enabled !== false && typeof rateConfig.therapistPay === "number";

              // Honorario terapeuta por esta sesión
              let pagoSesionTerapeuta = 0;
              let ivaSesionRetenido = 0;
              let ivaCrenSesion = 0;
              let crenGananciaSesion = 0;
              const hasFactura = a.fact === "Sí" || a.fact === "SI" || a.solicitaFactura === true || a.solicitaFactura === "Sí";

              if (isFixedActive) {
                pagoSesionTerapeuta = rateConfig.therapistPay;
                crenGananciaSesion = Math.max(0, precioSession - pagoSesionTerapeuta);

                if (hasFactura) {
                  ivaCrenSesion = precioSession * 0.16;
                }
              } else if (t.tipoPago === "Porcentaje") {
                const sessionTypeStr = `${a.tipoSesion || ""} ${a.tipoServicio || ""} ${a.servicio || ""} ${a.area || ""}`.toLowerCase();
                const isValoracion = sessionTypeStr.includes("valoraci") || sessionTypeStr.includes("evaluaci");
                const percentToUse = isValoracion && typeof t.porcentajeValoracion === "number"
                  ? t.porcentajeValoracion
                  : (t.porcentaje || 50);

                pagoSesionTerapeuta = precioSession * (percentToUse / 100);
                crenGananciaSesion = Math.max(0, precioSession - pagoSesionTerapeuta);
                if (t.retieneIVA) {
                  ivaSesionRetenido = pagoSesionTerapeuta * 0.16;
                }
                
                const crenGross = precioSession - (pagoSesionTerapeuta + ivaSesionRetenido);
                if (hasFactura) {
                  ivaCrenSesion = crenGross * 0.16;
                }
              } else {
                crenGananciaSesion = precioSession;
                if (hasFactura) {
                  ivaCrenSesion = precioSession * 0.16;
                }
              }

              honorariosTotalGen += pagoSesionTerapeuta;
              ivaTotalRetenidoGen += ivaSesionRetenido;
              ivaCrenTotalGen += ivaCrenSesion;

              // Semanas
              if (day >= 1 && day <= 7) sem1 += pagoSesionTerapeuta;
              else if (day >= 8 && day <= 14) sem2 += pagoSesionTerapeuta;
              else if (day >= 15 && day <= 21) sem3 += pagoSesionTerapeuta;
              else if (day >= 22 && day <= 28) sem4 += pagoSesionTerapeuta;
              else sem5 += pagoSesionTerapeuta;

              // Quincenas
              if (day <= 15) q1 += pagoSesionTerapeuta;
              else q2 += pagoSesionTerapeuta;

              // Map paciente
              const deudaVal = typeof a.saldo === "number" && a.saldo < 0 ? Math.abs(a.saldo) : 0;
              const tipoSesionLabel = (a.tipoSesion || a.tipoServicio || a.servicio || "").trim();

              if (!pacienteMap.has(pName)) {
                pacienteMap.set(pName, {
                  pacienteNombre: pName,
                  asistenciasCount: 1,
                  deudaTotal: deudaVal,
                  subtotalValor: precioSession,
                  terapeutaPago: pagoSesionTerapeuta,
                  ivaRetenido: ivaSesionRetenido,
                  ivaPaciente: ivaCrenSesion,
                  crenGanancia: crenGananciaSesion,
                  isFixedRate: isFixedActive,
                  fixedRateVal: isFixedActive ? rateConfig.therapistPay : 0,
                  tipoSesiones: tipoSesionLabel ? [tipoSesionLabel] : []
                });
              } else {
                const item = pacienteMap.get(pName)!;
                item.asistenciasCount += 1;
                item.deudaTotal += deudaVal;
                item.subtotalValor += precioSession;
                item.terapeutaPago += pagoSesionTerapeuta;
                item.ivaRetenido += ivaSesionRetenido;
                item.ivaPaciente += ivaCrenSesion;
                item.crenGanancia += crenGananciaSesion;
                if (tipoSesionLabel && !item.tipoSesiones.includes(tipoSesionLabel)) {
                  item.tipoSesiones.push(tipoSesionLabel);
                }
              }
            });

            // Si el esquema es Salario Base Fijo, el pago no depende exclusivamente de sesiones acumuladas
            let totalAPagarFinal = honorariosTotalGen;
            if (t.tipoPago === "Salario Base") {
              const baseSal = t.salarioBase || 0;
              totalAPagarFinal = baseSal;
              q1 = baseSal / 2;
              q2 = baseSal / 2;
              sem1 = baseSal / 4;
              sem2 = baseSal / 4;
              sem3 = baseSal / 4;
              sem4 = baseSal / 4;
              sem5 = 0;
            }

            const utilidadCrenFinal = ingresoBrutoTotalGen - totalAPagarFinal - ivaTotalRetenidoGen - ivaCrenTotalGen;
            const pacienteList = Array.from(pacienteMap.values());

            return (
              <div key={t.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                {/* 1. SECCIÓN ENCABEZADO DE LA TERAPEUTA (ESTILO EXACTO DE LA IMAGEN) */}
                <div className="p-6 border-b border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-[#0e2f44]">{t.name}</h3>
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">
                        {t.tipoPago === "Salario Base" ? `Salario Base: $${t.salarioBase}/mes` : `Comisión (${t.porcentaje}%)`}
                      </span>
                      {t.retieneIVA && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                          Retención IVA 16%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 font-bold text-xs rounded-lg border border-blue-200">
                        {asistenciasT.length} asistencias
                      </span>
                    </div>
                  </div>

                  {/* LÍNEAS DE RESUMEN Y MONTO DE TOTAL A PAGAR */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between max-w-xl">
                      <span className="font-semibold">TOTAL DE ASISTENCIAS:</span>
                      <span className="font-bold text-slate-800">{asistenciasT.length}</span>
                    </div>
                    <div className="flex justify-between max-w-xl">
                      <span className="font-semibold">INGRESO BRUTO TOTAL GENERADO:</span>
                      <span className="font-bold text-green-600">${ingresoBrutoTotalGen.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between max-w-xl">
                      <span className="font-semibold">HONORARIOS TERAPEUTA:</span>
                      <span className="font-bold text-slate-800">${honorariosTotalGen.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between max-w-xl">
                      <span className="font-semibold text-amber-700">IVA RETENIDO / FACTURADO (16%):</span>
                      <span className="font-bold text-amber-700">
                        {ivaTotalRetenidoGen > 0 || ivaCrenTotalGen > 0 ? (
                          <>Terapeuta: ${ivaTotalRetenidoGen.toLocaleString('es-MX', {minimumFractionDigits: 2})} | CREN: ${ivaCrenTotalGen.toLocaleString('es-MX', {minimumFractionDigits: 2})}</>
                        ) : (
                          `$0.00`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* RESALTADO GRANDE DE TOTAL A PAGAR Y UTILIDAD */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total a Pagar a Terapeuta</span>
                      <p className="text-3xl font-black text-[#10b981] mt-0.5">
                        ${totalAPagarFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase">Utilidad CREN</span>
                      <p className="text-lg font-bold text-[#1a5276]">
                        ${utilidadCrenFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN: DESGLOSE DE PERIODOS DE PAGO (3 TARJETAS LADO A LADO COMO EN LA IMAGEN) */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                  <h4 className="text-xs font-extrabold text-[#1a5276] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#1a5276]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    Desglose de Periodos de Pago
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* TARJETA 1: POR SEMANA */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <h5 className="text-xs font-bold text-slate-600 border-b pb-2 flex items-center gap-1.5">
                        📅 Por Semana
                      </h5>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>1ª Semana (Días 1-7):</span>
                          <strong className="text-slate-900">${sem1.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>2ª Semana (Días 8-14):</span>
                          <strong className="text-slate-900">${sem2.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>3ª Semana (Días 15-21):</span>
                          <strong className="text-slate-900">${sem3.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>4ª Semana (Días 22-28):</span>
                          <strong className="text-slate-900">${sem4.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                        {sem5 > 0 && (
                          <div className="flex justify-between">
                            <span>5ª Semana (Días 29-31):</span>
                            <strong className="text-slate-900">${sem5.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TARJETA 2: POR QUINCENA */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <h5 className="text-xs font-bold text-slate-600 border-b pb-2 flex items-center gap-1.5">
                        📆 Por Quincena (Pagos Días 15 y 30)
                      </h5>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between p-2 bg-blue-50/50 rounded border border-blue-100">
                          <span>1ª Quincena (Días 1-15):</span>
                          <strong className="text-[#1a5276] font-extrabold">${q1.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                        <div className="flex justify-between p-2 bg-blue-50/50 rounded border border-blue-100">
                          <span>2ª Quincena (Días 16-30):</span>
                          <strong className="text-[#1a5276] font-extrabold">${q2.toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong>
                        </div>
                      </div>
                    </div>

                    {/* TARJETA 3: POR MES */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
                      <h5 className="text-xs font-bold text-slate-600 border-b pb-2 flex items-center gap-1.5">
                        🏢 Por Mes
                      </h5>
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-bold">Pago Mensual Total</span>
                        <p className="text-2xl font-black text-[#1a5276] mt-1">
                          ${totalAPagarFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400">*Acumulado según fecha de asistencia de los pacientes</p>
                    </div>
                  </div>
                </div>

                {/* 3. SECCIÓN: DETALLE POR PACIENTE (OCULTO POR DEFECTO CON SUMMARY) */}
                <details className="p-6 group">
                  <summary className="text-xs font-extrabold text-[#1a5276] uppercase tracking-wider mb-4 flex items-center gap-2 cursor-pointer select-none outline-none">
                    <svg className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Ver Detalle por Paciente
                  </summary>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-2">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0e2f44] text-white font-black uppercase text-[11px]">
                        <tr>
                          <th className="py-3 px-4">PACIENTE</th>
                          <th className="py-3 px-4 text-center">ASISTENCIAS</th>
                          <th className="py-3 px-4 text-center">TIPO SESIÓN</th>
                          <th className="py-3 px-4 text-right">DEUDA</th>
                          <th className="py-3 px-4 text-right">TOTAL SESIÓN</th>
                          <th className="py-3 px-4 text-center">ESQUEMA / %</th>
                          <th className="py-3 px-4 text-right">IVA PACIENTE</th>
                          <th className="py-3 px-4 text-right">RETENCIÓN IVA</th>
                          <th className="py-3 px-4 text-right">A PAGAR A TERAPEUTA</th>
                          <th className="py-3 px-4 text-right bg-blue-900 text-cyan-200 font-black">CREN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {pacienteList.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">{p.pacienteNombre}</td>
                            <td className="py-3 px-4 text-center font-bold">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {p.asistenciasCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {p.tipoSesiones && p.tipoSesiones.length > 0 ? (
                                <div className="flex flex-col gap-0.5 items-center">
                                  {p.tipoSesiones.map((ts, i) => {
                                    const isValoracion = ts.toLowerCase().includes("valoraci");
                                    return (
                                      <span
                                        key={i}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize border ${
                                          isValoracion
                                            ? "bg-amber-100 text-amber-700 border-amber-300"
                                            : "bg-purple-50 text-purple-700 border-purple-100"
                                        }`}
                                      >
                                        {ts}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {p.deudaTotal > 0 ? (
                                <span className="font-bold text-red-600">-${p.deudaTotal.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-400">$0.00</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-700">
                              ${p.subtotalValor.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {p.isFixedRate ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]" title="Honorario fijo íntegro configurado por paciente">
                                  Honorario Fijo (${p.fixedRateVal.toFixed(2)})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                                  {t.tipoPago === "Porcentaje" ? `Comisión (${t.porcentaje}%)` : `Salario Base`}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                              ${p.ivaPaciente.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-right text-amber-600 font-semibold">
                              ${p.ivaRetenido.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#10b981]">
                              ${p.terapeutaPago.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-[#1a5276] bg-blue-50/70">
                              ${p.crenGanancia.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                            </td>
                          </tr>
                        ))}
                        {pacienteList.length === 0 && (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400">
                              Sin atenciones registradas para esta terapeuta en el periodo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            );
          })}

          {terapeutasFiltrados.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              No hay terapeutas registradas para mostrar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
