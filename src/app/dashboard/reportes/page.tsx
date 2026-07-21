"use client";

export default function ReportesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Centro de Reportes</h2>
          <p className="text-sm text-slate-500">Reporte anual y métricas avanzadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-center min-h-64">
          <p className="text-slate-500">Gráfico Anual (Simulación)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-center min-h-64">
          <p className="text-slate-500">Métricas por Servicio (Simulación)</p>
        </div>
      </div>
    </div>
  );
}
