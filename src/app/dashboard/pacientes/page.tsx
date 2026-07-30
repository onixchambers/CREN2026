"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";

type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
  asistencias: number;
  sesiones: string;
  valoraciones: number;
  totalPagado: string;
  precio: string;
  metodo: string;
  ultima: string;
  estado: string;
};

export default function PacientesPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const [allowTherapistEdit, setAllowTherapistEdit] = useState(true);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      const { getPatients } = await import('@/app/actions/pacientes');
      const { getAllowTherapistEdit } = await import('@/app/actions/configuracion');
      const [result, allowed] = await Promise.all([
        getPatients(),
        getAllowTherapistEdit()
      ]);
      if (result.success && result.data) {
        setPacientes(result.data);
      }
      setAllowTherapistEdit(allowed);
    }
    loadData();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const [viewingPatient, setViewingPatient] = useState<any>(null);

  // Filtro de Privacidad: Terapeutas ven pacientes asignados o con sesiones registradas
  const pacientesFiltrados = pacientes.filter(p => {
    if (userRole.toUpperCase() === "TERAPEUTA") {
      const userLower = userName.trim().toLowerCase();
      const medLower = (p.medicoTratante || "").trim().toLowerCase();
      const terLower = (p.terapeuta || "").trim().toLowerCase();
      
      const isMedMatch = medLower && (medLower.includes(userLower) || userLower.includes(medLower));
      const isTerMatch = terLower && (terLower.includes(userLower) || userLower.includes(terLower));
      const hasSession = Array.isArray(p.sessionTherapists) && p.sessionTherapists.some((st: string) => {
        const stLower = st.trim().toLowerCase();
        return stLower.includes(userLower) || userLower.includes(stLower);
      });

      if (!isMedMatch && !isTerMatch && !hasSession) {
        return false;
      }
    }
    return p.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(pacientesFiltrados.length / ITEMS_PER_PAGE);
  const paginatedPacientes = pacientesFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nombre: "", sexo: "", fechaNacimiento: "", precioTerapia: "500", metodoPago: "", estatus: "Activo"
  });
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = (p: any) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para editar pacientes.");
      return;
    }
    setEditingPatient(p);
    setEditForm({
      nombre: p.name || "",
      sexo: p.sexo || "",
      fechaNacimiento: p.fechaNacimiento || "",
      precioTerapia: p.precioTerapia || "500",
      metodoPago: p.metodoPago || "",
      estatus: p.estatus || "Activo"
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    if (!editingPatient || isSaving) return;
    setIsSaving(true);
    const { updatePatientFast, getPatients } = await import('@/app/actions/pacientes');
    const result = await updatePatientFast(editingPatient.id, editForm);
    if (result.success) {
      alert("Paciente actualizado.");
      setEditingPatient(null);
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setPacientes(updated.data);
      }
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (p: any) => {
    if (userRole.toUpperCase() === "TERAPEUTA" && !allowTherapistEdit) {
      alert("La administración no tiene habilitado el permiso para eliminar pacientes.");
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar a ${p.name}?`)) return;
    const { deletePatient, getPatients } = await import('@/app/actions/pacientes');
    const result = await deletePatient(p.id);
    if (result.success) {
      alert("Paciente eliminado.");
      const updated = await getPatients();
      if (updated.success && updated.data) {
        setPacientes(updated.data);
      }
    } else {
      alert(result.error);
    }
  };

  // Cálculo de Saldo (Pendiente en Rojo negativo, A Favor en Verde positivo, $0 gris al día)
  const renderSaldo = (p: any) => {
    const asistencias = p.asistencias || 0;
    const precio = parseFloat(p.precioTerapia || "500") || 500;
    const pagado = parseFloat((p.totalPagado || "0").toString().replace(/[^0-9.]/g, "")) || 0;
    const costoGenerado = asistencias * precio;
    const diferencia = pagado - costoGenerado;

    if (diferencia < 0) {
      return (
        <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          -${Math.abs(diferencia).toFixed(2)}
        </span>
      );
    } else if (diferencia > 0) {
      return (
        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          +${diferencia.toFixed(2)}
        </span>
      );
    } else {
      return (
        <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          $0.00
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-xl font-bold text-[#0e2f44]">Directorio de Pacientes</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* BUSCADOR Y FILTROS */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Buscar Paciente:</label>
            <input
              type="text"
              placeholder="Escribe un nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#2980b9] w-64 text-slate-900 bg-white"
            />
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-[#0e2f44] text-white font-semibold">
              <tr>
                <th className="px-4 py-4 text-left border-b border-[#0e2f44]">PACIENTE</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">SEXO</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">NAC.</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">EDAD</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">ASISTENCIA</th>
                <th className="px-2 py-4 border-b border-[#0e2f44]">VALORACIONES</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">TOTAL PAGADO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">SALDO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">PRECIO TERAPIA</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">MÉTODO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ÚLTIMO PAGO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ESTADO</th>
                <th className="px-4 py-4 border-b border-[#0e2f44]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPacientes.length > 0 ? paginatedPacientes.map((p) => {
                const asistencias = p.asistencias || 0;
                const totalSesiones = parseInt(p.sesiones || p.totalSesiones || "10", 10) || 10;
                const precio = p.precioTerapia || "500";

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewingPatient(p)}>
                    <td className="px-4 py-4 text-left font-bold text-slate-800">
                      <div className="max-w-[170px] leading-tight flex items-center gap-2">
                        {p.foto ? (
                          <img src={p.foto} alt="Foto" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {p.name ? p.name.charAt(0) : "P"}
                          </div>
                        )}
                        <span className="truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-slate-600 font-bold">
                      {p.sexo === 'M' || p.sexo === 'Masculino' ? '♂ M' : '♀ F'}
                    </td>
                    <td className="px-2 py-4 text-slate-500">{p.fechaNacimiento || "—"}</td>
                    <td className="px-2 py-4 text-slate-500">{p.age || "—"}</td>
                    <td className="px-2 py-4">
                      <span className="bg-[#e6f4ea] text-[#1e8e3e] px-2.5 py-1 rounded text-xs font-extrabold shadow-xs">
                        {asistencias}/{totalSesiones}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded text-xs font-bold">
                        {p.valoraciones || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-800 font-extrabold">
                      {p.totalPagado ? `$${p.totalPagado}` : "$0.00"}
                    </td>
                    <td className="px-4 py-4">
                      {renderSaldo(p)}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#1a5276]">
                      ${precio}
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap">
                        {p.metodoPago || "Efectivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-bold">
                      {p.ultima || "$0.00"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        (p.estatus || 'Activo').toLowerCase() === 'activo'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-800 text-white border border-slate-900 shadow-sm'
                      }`}>
                        {p.estatus || 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-center">
                        {(userRole.toUpperCase() !== "TERAPEUTA" || allowTherapistEdit) && (
                          <button onClick={() => openEditModal(p)} title="Editar" className="p-1.5 border border-slate-200 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                        {(userRole.toUpperCase() !== "TERAPEUTA" || allowTherapistEdit) && (
                          <button onClick={() => handleDelete(p)} title="Borrar" className="p-1.5 border border-slate-200 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-400 font-medium border border-t-0 border-slate-200">
                    Sin pacientes asignados o registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
          <div className="text-sm text-slate-500">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, pacientesFiltrados.length)} de {pacientesFiltrados.length}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLES DEL PACIENTE */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer" title="Hacer clic para subir o cambiar foto del paciente">
                  <input
                    type="file"
                    accept="image/*"
                    id="photoUploadInput"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && viewingPatient) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          setViewingPatient((prev: any) => ({ ...prev, foto: base64 }));
                          setPacientes((prev) =>
                            prev.map((p) => (p.id === viewingPatient.id ? { ...p, foto: base64 } : p))
                          );
                          const { updatePatientPhoto } = await import("@/app/actions/pacientes");
                          const res = await updatePatientPhoto(viewingPatient.id, base64);
                          if (!res.success) {
                            alert(res.error || "Error al actualizar la foto.");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="photoUploadInput" className="cursor-pointer relative block">
                    {viewingPatient.foto ? (
                      <img src={viewingPatient.foto} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-[#1a5276] shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xl hover:bg-slate-200 transition-colors">
                        {viewingPatient.name ? viewingPatient.name.charAt(0).toUpperCase() : "📷"}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-bold text-center leading-tight">📷 Cambiar</span>
                    </div>
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{viewingPatient.name}</h3>
                  <p className="text-xs text-slate-500">Médico Tratante: {viewingPatient.medicoTratante || "Sin asignar"}</p>
                </div>
              </div>
              <button onClick={() => setViewingPatient(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-500 block">Fecha Nacimiento:</span>
                <span className="text-slate-800 font-semibold">{viewingPatient.fechaNacimiento || "—"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-500 block">Sexo:</span>
                <span className="text-slate-800 font-semibold">{viewingPatient.sexo || "—"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-500 block">Asistencia Acumulada:</span>
                <span className="text-emerald-700 font-extrabold">{viewingPatient.asistencias || 0}/{viewingPatient.sesiones || 10}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-500 block">Precio por Terapia:</span>
                <span className="text-blue-700 font-extrabold">${viewingPatient.precioTerapia || "500"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 col-span-2">
                <span className="font-bold text-slate-500 block">Saldo Actual:</span>
                <div>{renderSaldo(viewingPatient)}</div>
              </div>
            </div>

            <button onClick={() => setViewingPatient(null)} className="w-full bg-[#1a5276] text-white font-bold py-2 rounded-lg text-xs">
              Cerrar Expediente
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PACIENTE */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">Editar Información de Paciente</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  value={editForm.nombre}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Precio Terapia (MXN)</label>
                  <input
                    type="number"
                    name="precioTerapia"
                    value={editForm.precioTerapia}
                    onChange={handleEditChange}
                    placeholder="500"
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    name="estatus"
                    value={editForm.estatus}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isSaving}
                onClick={saveEdit}
                className="flex-1 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-2 rounded text-xs transition disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                onClick={() => setEditingPatient(null)}
                className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2 rounded text-xs hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
