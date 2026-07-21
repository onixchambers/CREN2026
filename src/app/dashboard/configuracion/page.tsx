"use client";
import { useState } from "react";

export default function ConfiguracionPage() {
  const [usuarios, setUsuarios] = useState([
    { id: 1, usuario: "Administrador", rol: "Admin", contrasena: "admin2026" },
    { id: 2, usuario: "Elizabeth", rol: "Terapeuta", contrasena: "elizabeth123" },
    { id: 3, usuario: "Fernanda", rol: "Terapeuta", contrasena: "fernanda123" },
    { id: 4, usuario: "Karla", rol: "Terapeuta", contrasena: "karla123" },
    { id: 5, usuario: "Lesly", rol: "Terapeuta", contrasena: "lesly123" },
    { id: 6, usuario: "Lulú", rol: "Terapeuta", contrasena: "lulu123" },
    { id: 7, usuario: "Sheribeth", rol: "Terapeuta", contrasena: "sheribeth123" },
  ]);

  const addUsuario = () => {
    setUsuarios([...usuarios, { id: Date.now(), usuario: "", rol: "Terapeuta", contrasena: "" }]);
  };

  const removeUsuario = (id: number) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  const gastosCol1 = [
    { label: "Contador", val: "2170" },
    { label: "Consultorio 7", val: "10788" },
    { label: "Consultorio 2", val: "10788" },
    { label: "Teléfono", val: "740" },
    { label: "IMSS", val: "5769.89" },
    { label: "Celular", val: "424" },
    { label: "Prest. Monterrey", val: "3301.24" },
    { label: "Hosting", val: "250" },
    { label: "Material", val: "900" },
    { label: "Google One", val: "90" },
  ];

  const gastosCol2 = [
    { label: "Consultorio 5", val: "14964" },
    { label: "Consultorio 6", val: "9860" },
    { label: "Servicios prof.", val: "8000" },
    { label: "Limpieza", val: "3200" },
    { label: "4%", val: "620" },
    { label: "Seguros", val: "327.17" },
    { label: "Prest. Banamex", val: "298.73" },
    { label: "Limpieza Prod.", val: "600" },
    { label: "SAT", val: "8000" },
    { label: "Facturama", val: "137.5" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2 pb-2">
        <svg className="w-6 h-6 text-[#1a5276]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <h2 className="text-xl font-bold text-[#1a5276]">Configuración</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* USUARIOS */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Usuarios
          </h3>
          
          <div className="space-y-4 mb-4">
            {usuarios.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <label className="text-sm text-slate-500 w-16">Usuario</label>
                  <input type="text" value={u.usuario} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none" onChange={(e) => {
                    const newU = [...usuarios];
                    const idx = newU.findIndex(x => x.id === u.id);
                    newU[idx].usuario = e.target.value;
                    setUsuarios(newU);
                  }} />
                </div>
                
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <label className="text-sm text-slate-500 w-8">Rol</label>
                  <div className="relative flex-1">
                    <select value={u.rol} className="w-full p-2 pl-8 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none appearance-none bg-white" onChange={(e) => {
                      const newU = [...usuarios];
                      const idx = newU.findIndex(x => x.id === u.id);
                      newU[idx].rol = e.target.value;
                      setUsuarios(newU);
                    }}>
                      <option value="Admin">Admin</option>
                      <option value="Terapeuta">Terapeuta</option>
                    </select>
                    {u.rol === 'Admin' ? (
                      <svg className="w-4 h-4 text-amber-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <label className="text-sm text-slate-500 w-20">Contraseña</label>
                  <input type="text" value={u.contrasena} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none" onChange={(e) => {
                    const newU = [...usuarios];
                    const idx = newU.findIndex(x => x.id === u.id);
                    newU[idx].contrasena = e.target.value;
                    setUsuarios(newU);
                  }} />
                </div>
                
                {u.rol !== 'Admin' ? (
                  <button onClick={() => removeUsuario(u.id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                ) : (
                  <div className="w-8 h-8"></div> // Spacer to keep layout aligned
                )}
              </div>
            ))}
          </div>

          <button onClick={addUsuario} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
            <span className="text-lg leading-none">+</span> Usuario
          </button>
        </div>
        <hr className="border-slate-100" />

        {/* TERAPEUTAS */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Terapeutas
          </h3>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
            <span className="text-lg leading-none">+</span> Terapeuta
          </button>
        </div>
        <hr className="border-slate-100" />

        {/* PERMISOS DEL SISTEMA */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Permisos del Sistema
          </h3>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Permitir a terapeutas editar Pacientes</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-slate-600">Habilitado</span>
            </label>
          </div>
        </div>
        <hr className="border-slate-100" />


        {/* GASTOS OPERATIVOS */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Gastos Operativos
          </h3>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-slate-700">Mes a configurar:</span>
            <input type="month" defaultValue="2026-07" className="p-1.5 border border-slate-300 rounded text-sm text-slate-700 focus:border-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {/* Col 1 */}
            <div className="space-y-4">
              {gastosCol1.map((gasto, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 font-medium">{gasto.label}</div>
                  <input type="text" defaultValue={gasto.val} className="w-1/2 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none" />
                </div>
              ))}
            </div>
            
            {/* Col 2 */}
            <div className="space-y-4">
              {gastosCol2.map((gasto, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 font-medium">{gasto.label}</div>
                  <input type="text" defaultValue={gasto.val} className="w-1/2 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-slate-100" />

        {/* CLAVES DE REFERENCIA */}
        <div className="p-6">
          <h3 className="text-[#1a5276] font-bold flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Claves de Referencia (Médicos/Escuelas)
          </h3>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded border border-blue-100 flex items-start gap-3 mb-6">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            <p className="text-sm">Configura las claves de validación para las terapeutas (separadas por comas).</p>
          </div>

          <div className="flex items-center gap-4 max-w-xl">
            <label className="text-sm font-semibold text-slate-700 w-32">Claves de Referencia</label>
            <input type="text" placeholder="Ej: CREN2026, CLINICA10" className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
