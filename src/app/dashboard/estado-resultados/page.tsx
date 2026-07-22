"use client";

export default function EstadoResultadosPage() {
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const datos = {
    ingresosBrutos: 0,
    nomina: 0,
    gastosOperativos: 0,
    ivaHonorarios: 0,
    utilidadNeta: 0
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estado de Resultados</h2>
          <p className="text-sm text-slate-500">Reporte contable mensual</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-center text-slate-800 mb-6">Estado de Resultados (Simulación)</h3>
        
        <table className="w-full text-left text-sm border-collapse">
          <tbody>
            {/* Ingresos */}
            <tr className="bg-slate-50 border-b">
              <td className="p-3 font-bold text-slate-700 uppercase" colSpan={2}>INGRESOS</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 pl-6">Ingreso Bruto Total</td>
              <td className="p-3 text-right font-medium">${datos.ingresosBrutos.toLocaleString()}</td>
            </tr>
            <tr><td colSpan={2} className="h-4"></td></tr>

            {/* Egresos */}
            <tr className="bg-slate-50 border-b border-t">
              <td className="p-3 font-bold text-slate-700 uppercase" colSpan={2}>EGRESOS</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 pl-6 text-red-600">Honorarios / Nómina</td>
              <td className="p-3 text-right text-red-600">(${datos.nomina.toLocaleString()})</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 pl-6 text-red-600">Gastos Operativos Fijos</td>
              <td className="p-3 text-right text-red-600">(${datos.gastosOperativos.toLocaleString()})</td>
            </tr>
            <tr><td colSpan={2} className="h-4"></td></tr>

            {/* Impuestos */}
            <tr className="bg-slate-50 border-b border-t">
              <td className="p-3 font-bold text-slate-700 uppercase" colSpan={2}>IMPUESTOS</td>
            </tr>
            <tr className="border-b">
              <td className="p-3 pl-6 text-red-600">IVA Honorarios</td>
              <td className="p-3 text-right text-red-600">(${datos.ivaHonorarios.toLocaleString()})</td>
            </tr>
            <tr><td colSpan={2} className="h-6"></td></tr>

            {/* Utilidad */}
            <tr className="bg-blue-50 border-t-2 border-b-2 border-blue-200 text-lg">
              <td className="p-4 font-bold text-blue-900">UTILIDAD CREN (Ingreso Neto)</td>
              <td className="p-4 text-right font-bold text-blue-900">${datos.utilidadNeta.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

