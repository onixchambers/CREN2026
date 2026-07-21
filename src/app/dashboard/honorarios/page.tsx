"use client";

export default function HonorariosPage() {
  const honorarios = [
    { terapeuta: "Dra. Ana López", totalSesiones: 12, ingresoBruto: 6000, honorario: 3000, iva: 480, totalPagar: 3480, tipo: "Porcentaje (50%)" },
    { terapeuta: "Lic. Carlos Ruiz", totalSesiones: 40, ingresoBruto: 20000, honorario: 12000, iva: 0, totalPagar: 12000, tipo: "Salario Fijo" }
  ];

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
              {honorarios.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium">{h.terapeuta}</td>
                  <td className="p-4 text-xs">
                    <span className="px-2 py-1 bg-slate-100 rounded-md border">{h.tipo}</span>
                  </td>
                  <td className="p-4">{h.totalSesiones}</td>
                  <td className="p-4 text-right">${h.ingresoBruto.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold text-blue-700">${h.totalPagar.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
