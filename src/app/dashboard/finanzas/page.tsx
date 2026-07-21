"use client";
import { useState } from "react";

type Movimiento = {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: "INGRESO" | "GASTO";
  monto: number;
};

export default function FinanzasPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"INGRESO" | "GASTO">("INGRESO");
  
  const [formData, setFormData] = useState({
    descripcion: "", monto: "", fecha: new Date().toISOString().split("T")[0]
  });

  const handleOpenModal = (tipo: "INGRESO" | "GASTO") => {
    setModalType(tipo);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoMovimiento: Movimiento = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      tipo: modalType,
      monto: parseFloat(formData.monto) || 0
    };
    
    setMovimientos([nuevoMovimiento, ...movimientos]);
    setIsModalOpen(false);
    setFormData({ descripcion: "", monto: "", fecha: new Date().toISOString().split("T")[0] });
  };

  const totalIngresos = movimientos.filter(m => m.tipo === "INGRESO").reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = movimientos.filter(m => m.tipo === "GASTO").reduce((acc, m) => acc + m.monto, 0);
  const balanceActual = totalIngresos - totalGastos;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-900">Control Financiero</h2>
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal("INGRESO")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            + Registrar Ingreso
          </button>
          <button onClick={() => handleOpenModal("GASTO")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            - Registrar Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h3 className="font-bold text-slate-800 mb-4">Últimos Movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Descripción</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.length > 0 ? (
                  movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td className="py-3">{mov.fecha}</td>
                      <td className="py-3 font-medium">{mov.descripcion}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${mov.tipo === 'INGRESO' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                          {mov.tipo}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-bold ${mov.tipo === 'INGRESO' ? 'text-slate-700' : 'text-slate-700'}`}>
                        {mov.tipo === 'INGRESO' ? '+' : '-'}${mov.monto.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">No hay movimientos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`text-white p-6 rounded-xl shadow-md ${balanceActual >= 0 ? 'bg-gradient-to-br from-blue-900 to-blue-700' : 'bg-gradient-to-br from-red-600 to-red-400'}`}>
            <h3 className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">Balance Actual</h3>
            <p className="text-4xl font-extrabold">${balanceActual.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Resumen de Totales</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ingresos Totales:</span>
                <span className="font-bold text-green-600">${totalIngresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gastos Totales:</span>
                <span className="font-bold text-red-600">${totalGastos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA MOVIMIENTOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${modalType === 'INGRESO' ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-bold text-lg ${modalType === 'INGRESO' ? 'text-green-800' : 'text-red-800'}`}>
                Registrar {modalType.charAt(0) + modalType.slice(1).toLowerCase()}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleAddMovimiento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                <input required type="text" name="descripcion" value={formData.descripcion} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Ej. Pago de consulta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Monto ($)</label>
                  <input required type="number" step="0.01" min="0.01" name="monto" value={formData.monto} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha</label>
                  <input required type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 py-2 text-white font-semibold rounded-lg transition-colors ${modalType === 'INGRESO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
