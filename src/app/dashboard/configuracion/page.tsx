"use client";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
          <p className="text-sm text-slate-500">Ajustes del sistema y base de datos</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-md shadow-sm transition-colors">
          Guardar Cambios
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
        <form className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Datos de la Clínica</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Nombre de la Institución</label>
              <input type="text" defaultValue="CREN 43" className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-bold text-slate-800">Base de Datos</h3>
            <p className="text-sm text-slate-500">Para importar o exportar tus registros masivamente.</p>
            <div className="flex gap-4">
              <button type="button" className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-md hover:bg-blue-100 transition-colors">Exportar Datos (CSV)</button>
              <button type="button" className="px-4 py-2 bg-slate-50 text-slate-700 border font-medium rounded-md hover:bg-slate-100 transition-colors">Restaurar Copia</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
