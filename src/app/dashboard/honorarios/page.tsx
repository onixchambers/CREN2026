"use client";
import { useState, useEffect } from "react";
import { getTerapeutas } from "@/app/actions/configuracion";

export default function HonorariosPage() {
  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        setTerapeutas(res.terapeutas);
      }
      setIsLoading(false);
    }
    loadTerapeutas();
  }, []);

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
                <th className="p-4 font-semibold">Sesiones</th>
                <th className="p-4 font-semibold text-right">Ingreso Bruto Generado</th>
                <th className="p-4 font-semibold text-right text-blue-700">Total a Pagar (inc. IVA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terapeutas.map((terapeuta, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-800">
                  <td className="p-4 font-medium text-slate-900">{terapeuta}</td>
                  <td className="p-4 text-xs">
                    <span className="px-2 py-1 bg-slate-100 rounded-md border text-slate-700">Porcentaje (50%)</span>
                  </td>
                  <td className="p-4 text-slate-700">0</td>
                  <td className="p-4 text-right text-slate-700">$0.00</td>
                  <td className="p-4 text-right font-bold text-blue-700">$0.00</td>
                </tr>
              ))}
              {terapeutas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">No hay terapeutas registrados en Configuración</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
