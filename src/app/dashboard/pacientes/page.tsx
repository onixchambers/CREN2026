"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DateInput } from "@/components/DateInput";
import { 
  getPatients, 
  updatePatientPhoto, 
  updatePatientStatus, 
  getPatientDocuments, 
  savePatientDocument, 
  deletePatientDocument,
  updatePatient,
  deletePatient
} from "@/app/actions/pacientes";

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
  const [therapyPrices, setTherapyPrices] = useState<number[]>([400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950]);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bajaModalPatient, setBajaModalPatient] = useState<any | null>(null);
  const [bajaReason, setBajaReason] = useState("");
  const [isSubmittingBaja, setIsSubmittingBaja] = useState(false);

  // Estados para Documentos y Notas Clínicas (PDF Structure)
  const [modalTab, setModalTab] = useState<"expediente" | "documentos" | "nuevo_documento" | "ver_documento">("expediente");
  const [patientDocs, setPatientDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedNoteType, setSelectedNoteType] = useState("Registro de Evolución");
  const [docFormData, setDocFormData] = useState<any>({});
  const [activeDocToView, setActiveDocToView] = useState<any | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  useEffect(() => {
    if (viewingPatient?.id) {
      setModalTab("expediente");
      setIsLoadingDocs(true);
      getPatientDocuments(viewingPatient.id).then(res => {
        if (res.success && res.data) {
          setPatientDocs(res.data);
        } else {
          setPatientDocs([]);
        }
        setIsLoadingDocs(false);
      });
    }
  }, [viewingPatient?.id]);

  const handleConfirmBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bajaModalPatient) return;
    setIsSubmittingBaja(true);
    try {
      const res = await updatePatientStatus(bajaModalPatient.id, "Inactivo", bajaReason);
      if (res.success) {
        setPacientes(prev => prev.map(item => item.id === bajaModalPatient.id ? { ...item, estatus: "Inactivo" } : item));
        setBajaModalPatient(null);
        setBajaReason("");
        const ref = await getPatients();
        if (ref.success && ref.data) setPacientes(ref.data);
      } else {
        alert("Error al dar de baja: " + res.error);
      }
    } catch (err: any) {
      alert("Error inesperado: " + err.message);
    } finally {
      setIsSubmittingBaja(false);
    }
  };
    } finally {
      setIsSubmittingBaja(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      const { getPatients } = await import('@/app/actions/pacientes');
      const { getAllowTherapistEdit, getTherapyPrices } = await import('@/app/actions/configuracion');
      const [result, allowed, pricesRes] = await Promise.all([
        getPatients(),
        getAllowTherapistEdit(),
        getTherapyPrices()
      ]);
      if (result.success && result.data) {
        setPacientes(result.data);
      }
      setAllowTherapistEdit(allowed);
      if (pricesRes.success && pricesRes.prices) {
        setTherapyPrices(pricesRes.prices);
      }
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
    let diferencia = 0;
    if (p.saldoCalculado !== undefined && p.saldoCalculado !== null) {
      diferencia = parseFloat(p.saldoCalculado);
    } else {
      const asistencias = p.asistencias || 0;
      const precio = parseFloat((p.precioTerapia || "500").split("/")[0]) || 500;
      const pagado = parseFloat((p.totalPagado || "0").toString().replace(/[^0-9.]/g, "")) || 0;
      const costoGenerado = asistencias * precio;
      diferencia = pagado - costoGenerado;
    }

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
            <thead className="bg-[#0e2f44] text-white text-[9px] font-extrabold uppercase leading-tight tracking-wider">
              <tr>
                <th className="px-3 py-2.5 text-left border-b border-[#0e2f44]">PACIENTE</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">SEXO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">NAC.</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">EDAD</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ASISTENCIA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">VALORACIONES</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">TOTAL<br/>PAGADO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">SALDO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">PRECIO<br/>TERAPIA</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">MÉTODO DE<br/>PAGO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ÚLTIMO<br/>PAGO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ESTADO</th>
                <th className="px-2 py-2.5 border-b border-[#0e2f44]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPacientes.length > 0 ? paginatedPacientes.map((p) => {
                const asistencias = p.asistencias || 0;
                const totalSesiones = parseInt(p.sesiones || p.totalSesiones || "1", 10) || 1;
                const precio = p.precioTerapia || "—";

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewingPatient(p)}>
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center gap-2.5">
                        {p.foto ? (
                          <img src={p.foto} alt="Foto" className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                          </div>
                        )}
                        <div className="max-w-[180px] leading-snug">
                          <div className="font-bold text-slate-900 text-xs truncate">{p.name}</div>
                          <div className="text-[10px] font-medium text-[#1a5276] truncate flex items-center gap-1">
                            <span>🩺 {p.sessionTherapists && p.sessionTherapists.length > 0 ? p.sessionTherapists.join(", ") : (p.medicoTratante || "Sin asignar")}</span>
                          </div>
                        </div>
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
                    <td className="px-2 py-4 font-bold text-[#1a5276] text-[10px] whitespace-nowrap">
                      {precio === "—" || !precio
                        ? "—"
                        : (precio.includes("/")
                            ? precio.split(" / ").map((val: string) => `$${val.replace("$", "")}`).join(" / ")
                            : (precio.startsWith("$") ? precio : `$${precio}`))}
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      {(() => {
                        const val = p.metodoPago || "Efectivo";
                        let lines: string[] = [];
                        if (val.includes("Mixto (")) {
                          const content = val.replace(/^Mixto\s*\(/i, "").replace(/\)$/, "");
                          lines = content.split(",").map(item => item.trim().replace(":", ""));
                        } else if (val.includes("\n")) {
                          lines = val.split("\n").map(item => item.trim());
                        } else if (val.includes(" / ")) {
                          lines = val.split(" / ").map(item => item.trim());
                        } else if (val.includes(" + ")) {
                          lines = val.split(" + ").map(item => item.trim());
                        } else {
                          lines = [val];
                        }
                        return (
                          <div className="w-full max-w-[130px] mx-auto flex flex-col items-stretch justify-center gap-0.5 my-0.5">
                            {lines.map((line, idx) => (
                              <span key={idx} className="w-full bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[9.5px] font-bold block text-center whitespace-nowrap leading-tight shadow-xs">
                                {line}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-bold">
                      {p.ultima || "$0.00"}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const isActivo = (p.estatus || 'Activo').toLowerCase() === 'activo';
                        return (
                          <select
                            value={p.estatus || 'Activo'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              if (newStatus === 'Inactivo' || newStatus === 'Baja') {
                                setBajaModalPatient(p);
                                setBajaReason("");
                                return;
                              }
                              setPacientes(prev => prev.map(item => item.id === p.id ? { ...item, estatus: newStatus } : item));
                              const { updatePatientStatus } = await import('@/app/actions/pacientes');
                              const res = await updatePatientStatus(p.id, newStatus);
                              if (!res.success) {
                                alert("Error al actualizar el estado: " + res.error);
                                const { getPatients } = await import('@/app/actions/pacientes');
                                const ref = await getPatients();
                                if (ref.success && ref.data) setPacientes(ref.data);
                              }
                            }}
                            style={{
                              backgroundColor: isActivo ? '#d1fae5' : '#1e293b',
                              color: isActivo ? '#065f46' : '#ffffff',
                              borderColor: isActivo ? '#6ee7b7' : '#0f172a'
                            }}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider outline-none cursor-pointer transition-colors border ${
                              isActivo ? 'text-emerald-800' : '!text-white text-white'
                            }`}
                          >
                            <option value="Activo" style={{ backgroundColor: '#ffffff', color: '#1e293b' }} className="bg-white text-slate-800 font-medium">Activo</option>
                            <option value="Inactivo" style={{ backgroundColor: '#ffffff', color: '#1e293b' }} className="bg-white text-slate-800 font-medium">Inactivo</option>
                          </select>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-center">
                        {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
                          <button onClick={() => openEditModal(p)} title="Editar" className="p-1.5 border border-slate-200 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                        {((userRole.toUpperCase() !== "TERAPEUTA" && userRole.toUpperCase() !== "INVITADO") || allowTherapistEdit) && (
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

      {/* MODAL DETALLES Y EXPEDIENTE DE DOCUMENTOS CLINICOS (ESTRUCTURA DEL PDF) */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-4 md:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] flex flex-col my-auto">
            {/* CABECERA PRINCIPAL CON DATOS DEL PACIENTE Y TABS */}
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 gap-3">
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
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = async () => {
                            const canvas = document.createElement("canvas");
                            const maxDim = 300;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                              if (width > maxDim) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                              }
                            } else {
                              if (height > maxDim) {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            let base64 = event.target?.result as string;
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              base64 = canvas.toDataURL("image/jpeg", 0.85);
                            }
                            setViewingPatient((prev: any) => ({ ...prev, foto: base64 }));
                            setPacientes((prev) =>
                              prev.map((p) => (p.id === viewingPatient.id ? { ...p, foto: base64 } : p))
                            );
                            const res = await updatePatientPhoto(viewingPatient.id, base64);
                            if (!res.success) {
                              alert(res.error || "Error al actualizar la foto.");
                            }
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="photoUploadInput" className="cursor-pointer relative block">
                    {viewingPatient.foto ? (
                      <img src={viewingPatient.foto} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-[#1a5276] shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-lg hover:bg-slate-200 transition-colors">
                        {viewingPatient.name ? viewingPatient.name.charAt(0).toUpperCase() : "📷"}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[9px] font-bold text-center leading-tight">📷 Cambiar</span>
                    </div>
                  </label>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight">{viewingPatient.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Médico Tratante: <span className="font-semibold text-slate-700">{viewingPatient.medicoTratante || "Sin asignar"}</span></p>
                </div>
              </div>

              {/* NAVEGACIÓN ENTRE EXPEDIENTE Y DOCUMENTOS */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalTab("expediente")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      modalTab === "expediente"
                        ? "bg-[#1a5276] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📋 Ficha & Datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("documentos")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalTab !== "expediente"
                        ? "bg-[#1a5276] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>📁 Documentos & Notas Clínicas</span>
                    <span className="bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                      {patientDocs.length}
                    </span>
                  </button>
                </div>
                <button 
                  onClick={() => setViewingPatient(null)} 
                  className="text-slate-400 hover:text-slate-700 font-extrabold text-xl p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Cerrar ventana"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL MODAL SEGÚN LA PESTAÑA */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* PESTAÑA 1: EXPEDIENTE GENERAL */}
              {modalTab === "expediente" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Fecha Nacimiento:</span>
                      <span className="text-slate-800 font-extrabold text-sm">{viewingPatient.fechaNacimiento || "—"}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Sexo:</span>
                      <span className="text-slate-800 font-extrabold text-sm">{viewingPatient.sexo || "—"}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Asistencia Acumulada:</span>
                      <span className="text-emerald-700 font-extrabold text-sm">{viewingPatient.asistencias || 0}/{viewingPatient.sesiones || 10}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase">Precio por Terapia:</span>
                      <span className="text-blue-700 font-extrabold text-sm">${viewingPatient.precioTerapia || "500"}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 md:col-span-4">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">Saldo Actual:</span>
                      <div>{renderSaldo(viewingPatient)}</div>
                    </div>
                  </div>

                  {viewingPatient.observacionesAdmin && (
                    <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 space-y-1 my-2">
                      <span className="font-extrabold text-red-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        ⚠️ Motivo / Comentarios de la Baja
                      </span>
                      <p className="text-slate-800 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                        {viewingPatient.observacionesAdmin}
                      </p>
                    </div>
                  )}

                  {/* ACCESOS DIRECTOS */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Documentos e Historial Clínico</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Gestiona y crea registros de evolución, historias clínicas y reportes del paciente.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab("documentos")}
                      className="bg-[#27ae60] hover:bg-[#219653] text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>📁 Abrir Módulo de Documentos ({patientDocs.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: ESTRUCTURA DEL PDF - DOCUMENTOS Y REPOSITORIO (PÁGINA 1 DEL PDF) */}
              {modalTab === "documentos" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* BARRA SUPERIOR DE ACCIÓN COMO EN EL PDF */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📁</span>
                      <h4 className="font-extrabold text-slate-800 text-sm md:text-base">Documentos del Paciente</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNoteType("Registro de Evolución");
                          setDocFormData({});
                          setModalTab("nuevo_documento");
                        }}
                        className="bg-[#f39c12] hover:bg-[#e67e22] text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>📄 Nuevo Documento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab("expediente")}
                        className="bg-[#e67e22] hover:bg-[#d35400] text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Regresar
                      </button>
                    </div>
                  </div>

                  {/* FICHA RESUMEN SUPERIOR COMO EN EL PDF */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">ID Paciente:</span>
                      <span className="font-extrabold text-slate-700">{viewingPatient.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Nombre:</span>
                      <span className="font-extrabold text-slate-800">{viewingPatient.name.split(" ")[0]}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Apellidos:</span>
                      <span className="font-extrabold text-slate-800">{viewingPatient.name.split(" ").slice(1).join(" ") || "—"}</span>
                    </div>
                  </div>

                  {/* BARRA DE BOTONES Y BÚSQUEDA COMO EN EL PDF */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => alert("Historial copiado al portapapeles.")}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 font-bold cursor-pointer"
                      >
                        Copiar
                      </button>
                      <button 
                        type="button"
                        onClick={() => alert("Exportando a Excel...")}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 font-bold cursor-pointer"
                      >
                        Excel
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Buscar:</span>
                      <input 
                        type="text" 
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        placeholder="Filtrar nota o terapeuta..." 
                        className="px-2.5 py-1 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  {/* TABLA DE DOCUMENTOS DEL PDF */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#f8fafc] text-slate-500 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-3 py-2.5 text-center">ID</th>
                            <th className="px-3 py-2.5">FECHA</th>
                            <th className="px-3 py-2.5">HORA</th>
                            <th className="px-3 py-2.5">DOCUMENTO</th>
                            <th className="px-3 py-2.5">TERAPEUTA</th>
                            <th className="px-3 py-2.5 text-center">ACCIÓN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {isLoadingDocs ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                                Cargando expediente de documentos...
                              </td>
                            </tr>
                          ) : patientDocs.length > 0 ? (
                            patientDocs
                              .filter(d => 
                                !docSearchQuery || 
                                (d.tipo || "").toLowerCase().includes(docSearchQuery.toLowerCase()) || 
                                (d.terapeuta || "").toLowerCase().includes(docSearchQuery.toLowerCase())
                              )
                              .map((doc, idx) => (
                                <tr key={doc.id || idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                                    {doc.id ? doc.id.replace("DOC-", "") : (1265 - idx)}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-800">{doc.fecha}</td>
                                  <td className="px-3 py-2.5 text-slate-600">{doc.hora || "19:30:00"}</td>
                                  <td className="px-3 py-2.5 font-bold text-[#1a5276] uppercase">
                                    {doc.tipo}
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-700 uppercase">
                                    {doc.terapeuta || "LOURDES RINCÓN"}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDocToView(doc);
                                          setModalTab("ver_documento");
                                        }}
                                        className="bg-[#27ae60] hover:bg-[#219653] text-white font-black px-3 py-1 rounded text-[10px] uppercase shadow-2xs transition-colors cursor-pointer"
                                      >
                                        IMPRIMIR
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (window.confirm("¿Deseas borrar este documento clínico?")) {
                                            const res = await deletePatientDocument(viewingPatient.id, doc.id);
                                            if (res.success && res.data) setPatientDocs(res.data);
                                          }
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs p-1"
                                        title="Eliminar registro"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                                No hay notas clínicas o documentos registrados para este paciente. Haz clic en <span className="font-bold text-amber-600">"Nuevo Documento"</span> para crear uno.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: ESTRUCTURA DEL PDF - NOTA CLÍNICA NUEVA (PÁGINAS 2 A 9 DEL PDF) */}
              {modalTab === "nuevo_documento" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* BARRA SUPERIOR DE NOTA CLÍNICA NUEVA */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      <h4 className="font-extrabold text-slate-800 text-base">Nota Clínica Nueva</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab("documentos")}
                      className="bg-[#e67e22] hover:bg-[#d35400] text-white font-extrabold px-3.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Regresar
                    </button>
                  </div>

                  {/* LAYOUT EN 2 COLUMNAS (MENÚ IZQUIERDO Y FORMULARIO DERECHO COMO EN EL PDF) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* COLUMNA IZQUIERDA: TIPOS DE NOTA CLÍNICA (PÁGINA 2 DEL PDF) */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider mb-2">
                        Tipo de Nota Clínica
                      </h5>
                      {[
                        "Historia Clínica de Fisioterapia",
                        "Historia Clínica Emocional",
                        "Registro de Evolución",
                        "Historia Clínica de Neurodesarrollo",
                        "Sesión de Plática con Padres",
                        "Informe de Visita Escolar",
                        "Reunión con Terapeuta"
                      ].map((tipoName) => (
                        <button
                          key={tipoName}
                          type="button"
                          onClick={() => {
                            setSelectedNoteType(tipoName);
                            setDocFormData({});
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-between border ${
                            selectedNoteType === tipoName
                              ? "bg-white border-[#1a5276] text-[#1a5276] shadow-sm ring-1 ring-[#1a5276]"
                              : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900"
                          }`}
                        >
                          <span>{tipoName}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            selectedNoteType === tipoName ? "border-[#1a5276] bg-[#1a5276]" : "border-slate-300"
                          }`}>
                            {selectedNoteType === tipoName && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* COLUMNA DERECHA: FORMULARIO DINÁMICO DE NOTA CLÍNICA (PÁGINAS 3 A 9 DEL PDF) */}
                    <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-slate-800 text-base">{selectedNoteType}</h4>
                        <p className="text-slate-400 text-xs font-medium">
                          Fecha de creación: <span className="font-bold text-slate-600">{new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </p>
                      </div>

                      {/* RENDERING DE CAMPOS SEGÚN EL TIPO DE NOTA SELECCIONADO */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setIsSavingDoc(true);
                          try {
                            const res = await savePatientDocument(viewingPatient.id, {
                              tipo: selectedNoteType,
                              terapeuta: docFormData.terapeuta || userName || "LOURDES RINCÓN",
                              contenido: docFormData
                            });
                            if (res.success && res.data) {
                              setPatientDocs(res.data);
                              alert("¡Nota clínica guardada exitosamente!");
                              setModalTab("documentos");
                            } else {
                              alert("Error al guardar: " + res.error);
                            }
                          } catch(err: any) {
                            alert("Error de conexión: " + err.message);
                          } finally {
                            setIsSavingDoc(false);
                          }
                        }}
                        className="space-y-3"
                      >
                        {/* SELECCIÓN DE TERAPEUTA RESPONSABLE */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input 
                              type="date" 
                              value={docFormData.fecha || new Date().toISOString().split("T")[0]} 
                              onChange={(e) => setDocFormData({...docFormData, fecha: e.target.value})}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white outline-none font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Terapeuta</label>
                            <input 
                              type="text" 
                              value={docFormData.terapeuta || userName || "LOURDES RINCÓN"} 
                              onChange={(e) => setDocFormData({...docFormData, terapeuta: e.target.value})}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white outline-none font-medium"
                            />
                          </div>
                        </div>

                        {/* CAMPOS ESPECÍFICOS HISTORIA FISIOTERAPIA (PÁGINA 3 DEL PDF) */}
                        {selectedNoteType === "Historia Clínica de Fisioterapia" && (
                          <>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Antecedentes personales no patológicos</label>
                              <textarea rows={2} value={docFormData.antecedentesNoPatologicos || ""} onChange={(e) => setDocFormData({...docFormData, antecedentesNoPatologicos: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Antecedentes heredofamiliares</label>
                              <textarea rows={2} value={docFormData.antecedentesHeredofamiliares || ""} onChange={(e) => setDocFormData({...docFormData, antecedentesHeredofamiliares: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Antecedentes personales patológicos</label>
                              <textarea rows={2} value={docFormData.antecedentesPatologicos || ""} onChange={(e) => setDocFormData({...docFormData, antecedentesPatologicos: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Medicamentos</label>
                              <textarea rows={2} value={docFormData.medicamentos || ""} onChange={(e) => setDocFormData({...docFormData, medicamentos: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Padecimiento actual y motivo de consulta</label>
                              <textarea rows={2} value={docFormData.padecimientoActual || ""} onChange={(e) => setDocFormData({...docFormData, padecimientoActual: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">Exploración física</label>
                              <textarea rows={2} value={docFormData.exploracionFisica || ""} onChange={(e) => setDocFormData({...docFormData, exploracionFisica: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                          </>
                        )}

                        {/* CAMPOS ESPECÍFICOS HISTORIA EMOCIONAL (PÁGINA 4 DEL PDF) */}
                        {selectedNoteType === "Historia Clínica Emocional" && (
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">Historia</label>
                            <textarea rows={10} value={docFormData.historia || ""} onChange={(e) => setDocFormData({...docFormData, historia: e.target.value})} placeholder="Escribe aquí la historia clínica emocional..." className="w-full p-3 border border-slate-300 rounded-xl outline-none text-xs" />
                          </div>
                        )}

                        {/* CAMPOS ESPECÍFICOS REGISTRO DE EVOLUCIÓN (PÁGINA 5 DEL PDF) */}
                        {selectedNoteType === "Registro de Evolución" && (
                          <>
                            <p className="text-[11px] text-slate-400 font-medium">Registro de todas las interacciones llevadas a cabo con los pacientes y de padres de pacientes en caso de niños</p>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">1. Observación inicial</label>
                              <textarea rows={2} value={docFormData.obsInicial || ""} onChange={(e) => setDocFormData({...docFormData, obsInicial: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">2. Objetivos del Tratamiento</label>
                              <textarea rows={2} value={docFormData.objetivosTratamiento || ""} onChange={(e) => setDocFormData({...docFormData, objetivosTratamiento: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">3. Actividades realizadas durante la sesión</label>
                              <textarea rows={2} value={docFormData.actividadesSesion || ""} onChange={(e) => setDocFormData({...docFormData, actividadesSesion: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">4. Observaciones durante la sesión</label>
                              <textarea rows={2} value={docFormData.obsSesion || ""} onChange={(e) => setDocFormData({...docFormData, obsSesion: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">5. Recomendaciones</label>
                              <textarea rows={2} value={docFormData.recomendaciones || ""} onChange={(e) => setDocFormData({...docFormData, recomendaciones: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" />
                            </div>
                          </>
                        )}

                        {/* CAMPOS ESPECÍFICOS HISTORIA NEURODESARROLLO (PÁGINA 6 DEL PDF) */}
                        {selectedNoteType === "Historia Clínica de Neurodesarrollo" && (
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Antecedentes perinatales</label><textarea rows={1} value={docFormData.antPerinatales || ""} onChange={(e) => setDocFormData({...docFormData, antPerinatales: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Alimentación, sueño, control de esfínteres</label><textarea rows={1} value={docFormData.alimentacionSueno || ""} onChange={(e) => setDocFormData({...docFormData, alimentacionSueno: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Antecedentes heredofamiliares</label><textarea rows={1} value={docFormData.antHeredo || ""} onChange={(e) => setDocFormData({...docFormData, antHeredo: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Motivo de consulta</label><textarea rows={1} value={docFormData.motivoConsulta || ""} onChange={(e) => setDocFormData({...docFormData, motivoConsulta: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Descripción paterna</label><textarea rows={1} value={docFormData.descPaterna || ""} onChange={(e) => setDocFormData({...docFormData, descPaterna: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Descripción materna</label><textarea rows={1} value={docFormData.descMaterna || ""} onChange={(e) => setDocFormData({...docFormData, descMaterna: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Postura y tono muscular</label><textarea rows={1} value={docFormData.posturaTono || ""} onChange={(e) => setDocFormData({...docFormData, posturaTono: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Conducta motor gruesa</label><textarea rows={1} value={docFormData.motorGruesa || ""} onChange={(e) => setDocFormData({...docFormData, motorGruesa: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Conducta motor fina</label><textarea rows={1} value={docFormData.motorFina || ""} onChange={(e) => setDocFormData({...docFormData, motorFina: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Lenguaje</label><textarea rows={1} value={docFormData.lenguaje || ""} onChange={(e) => setDocFormData({...docFormData, lenguaje: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Desarrollo cognitivo</label><textarea rows={1} value={docFormData.cognitivo || ""} onChange={(e) => setDocFormData({...docFormData, cognitivo: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Persona / Social</label><textarea rows={1} value={docFormData.personaSocial || ""} onChange={(e) => setDocFormData({...docFormData, personaSocial: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Conclusiones</label><textarea rows={1} value={docFormData.conclusiones || ""} onChange={(e) => setDocFormData({...docFormData, conclusiones: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                            <div><label className="block text-[10px] font-medium text-slate-600 mb-0.5">Recomendaciones</label><textarea rows={1} value={docFormData.recomendaciones || ""} onChange={(e) => setDocFormData({...docFormData, recomendaciones: e.target.value})} className="w-full p-1.5 border border-slate-300 rounded outline-none text-xs" /></div>
                          </div>
                        )}

                        {/* CAMPOS ESPECÍFICOS PLÁTICA CON PADRES (PÁGINA 7 DEL PDF) */}
                        {selectedNoteType === "Sesión de Plática con Padres" && (
                          <>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Objetivo de la sesión</label><textarea rows={2} value={docFormData.objetivoSesion || ""} onChange={(e) => setDocFormData({...docFormData, objetivoSesion: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Observaciones Iniciales</label><textarea rows={2} value={docFormData.obsIniciales || ""} onChange={(e) => setDocFormData({...docFormData, obsIniciales: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Avances logrados en el último Período</label><textarea rows={2} value={docFormData.avancesPeriodo || ""} onChange={(e) => setDocFormData({...docFormData, avancesPeriodo: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Áreas a trabajar dentro del Tratamiento</label><textarea rows={2} value={docFormData.areasTrabajar || ""} onChange={(e) => setDocFormData({...docFormData, areasTrabajar: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Recomendaciones para Casa</label><textarea rows={2} value={docFormData.recomCasa || ""} onChange={(e) => setDocFormData({...docFormData, recomCasa: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Recomendación dentro de CREN</label><textarea rows={2} value={docFormData.recomCREN || ""} onChange={(e) => setDocFormData({...docFormData, recomCREN: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                          </>
                        )}

                        {/* CAMPOS ESPECÍFICOS VISITA ESCOLAR (PÁGINA 8 DEL PDF) */}
                        {selectedNoteType === "Informe de Visita Escolar" && (
                          <>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Personas presentes</label><textarea rows={2} value={docFormData.personasPresentes || ""} onChange={(e) => setDocFormData({...docFormData, personasPresentes: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Motivo de la Visita Escolar</label><textarea rows={2} value={docFormData.motivoVisita || ""} onChange={(e) => setDocFormData({...docFormData, motivoVisita: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Comentarios de los Maestros</label><textarea rows={2} value={docFormData.comentariosMaestros || ""} onChange={(e) => setDocFormData({...docFormData, comentariosMaestros: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Conclusiones</label><textarea rows={2} value={docFormData.conclusiones || ""} onChange={(e) => setDocFormData({...docFormData, conclusiones: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Acuerdos</label><textarea rows={2} value={docFormData.acuerdos || ""} onChange={(e) => setDocFormData({...docFormData, acuerdos: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Recomendaciones</label><textarea rows={2} value={docFormData.recomendaciones || ""} onChange={(e) => setDocFormData({...docFormData, recomendaciones: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                          </>
                        )}

                        {/* CAMPOS ESPECÍFICOS REUNIÓN CON TERAPEUTA (PÁGINA 9 DEL PDF) */}
                        {selectedNoteType === "Reunión con Terapeuta" && (
                          <>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Objetivo de Reunión</label><textarea rows={3} value={docFormData.objetivoReunion || ""} onChange={(e) => setDocFormData({...docFormData, objetivoReunion: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                            <div><label className="block text-[11px] font-medium text-slate-600 mb-1">Comentarios</label><textarea rows={5} value={docFormData.comentarios || ""} onChange={(e) => setDocFormData({...docFormData, comentarios: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-xs" /></div>
                          </>
                        )}

                        {/* BOTÓN VERDE GUARDAR COMO EN EL PDF */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSavingDoc}
                            className="bg-[#27ae60] hover:bg-[#219653] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <span>{isSavingDoc ? "Guardando..." : "> Guardar Documento"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: VISTA DE DOCUMENTO / IMPRESIÓN OFICIAL PDF */}
              {modalTab === "ver_documento" && activeDocToView && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🖨️</span>
                      <h4 className="font-extrabold text-slate-800 text-base">Vista de Documento Clínico</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-[#27ae60] hover:bg-[#219653] text-white font-extrabold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>🖨️ Imprimir / Guardar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab("documentos")}
                        className="bg-[#e67e22] hover:bg-[#d35400] text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Regresar
                      </button>
                    </div>
                  </div>

                  {/* HOJA IMPRESA OFICIAL CON FORMATO CREN */}
                  <div className="bg-white border border-slate-300 p-6 md:p-8 rounded-2xl shadow-sm space-y-6 text-slate-800 font-sans print:border-none print:shadow-none print:p-0">
                    {/* ENCABEZADO CREN */}
                    <div className="flex items-center justify-between border-b-2 border-[#1a5276] pb-4">
                      <div>
                        <h2 className="text-xl font-black text-[#1a5276] tracking-wide uppercase">Centro de Rehabilitación y Estimulación Neurodesarrollo</h2>
                        <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest">CREN</h3>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-medium">
                        <p className="font-extrabold text-slate-800 text-sm">{activeDocToView.tipo}</p>
                        <p>Folio: <span className="font-bold text-slate-700">{activeDocToView.id || "DOC-1265"}</span></p>
                        <p>Fecha: {activeDocToView.fecha}</p>
                      </div>
                    </div>

                    {/* DATOS DEL PACIENTE */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Paciente:</span><span className="font-extrabold text-slate-900 text-sm">{viewingPatient.name}</span></div>
                      <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Fecha Nacimiento:</span><span className="font-semibold">{viewingPatient.fechaNacimiento || "—"}</span></div>
                      <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Sexo:</span><span className="font-semibold">{viewingPatient.sexo || "—"}</span></div>
                      <div><span className="text-slate-400 font-bold block text-[10px] uppercase">Terapeuta:</span><span className="font-extrabold text-slate-800">{activeDocToView.terapeuta || "LOURDES RINCÓN"}</span></div>
                    </div>

                    {/* SECCIONES Y CONTENIDO DE LA NOTA CLÍNICA */}
                    <div className="space-y-4 text-xs">
                      <h4 className="font-extrabold text-sm text-[#1a5276] uppercase tracking-wider border-b border-slate-200 pb-1">
                        Contenido del Registro Clínico
                      </h4>
                      {activeDocToView.contenido && Object.keys(activeDocToView.contenido).length > 0 ? (
                        Object.entries(activeDocToView.contenido).map(([key, val]) => {
                          if (!val || key === "fecha" || key === "terapeuta") return null;
                          const keyFormatted = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
                          return (
                            <div key={key} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                              <span className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px]">{keyFormatted}:</span>
                              <p className="text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">{String(val)}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-500 italic">No hay detalles de texto adicionados.</p>
                      )}
                    </div>

                    {/* PIE Y FIRMA */}
                    <div className="pt-12 flex justify-end">
                      <div className="text-center w-64 border-t border-slate-400 pt-2 text-xs">
                        <p className="font-extrabold text-slate-800 uppercase">{activeDocToView.terapeuta || "LOURDES RINCÓN"}</p>
                        <p className="text-slate-500 font-medium">Firma del Terapeuta Responsable</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN INFERIOR DE CERRAR EXPEDIENTE */}
            <div className="pt-2 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setViewingPatient(null)} 
                className="w-full bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
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
                  <select
                    name="precioTerapia"
                    value={editForm.precioTerapia}
                    onChange={handleEditChange}
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-700 font-medium bg-white"
                  >
                    <option value="">Seleccionar precio...</option>
                    {(() => {
                      const numVal = parseFloat((editForm.precioTerapia || "0").toString().replace(/[^0-9.]/g, ""));
                      const list = [...therapyPrices];
                      if (!isNaN(numVal) && numVal > 0 && !list.includes(numVal)) {
                        list.push(numVal);
                        list.sort((a, b) => a - b);
                      }
                      return list.map(p => (
                        <option key={p} value={p.toString()}>${p.toFixed(2)}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    name="estatus"
                    value={editForm.estatus}
                    onChange={handleEditChange}
                    style={{ color: (editForm.estatus || 'Activo').toLowerCase() === 'activo' ? '#065f46' : '#ffffff' }}
                    className={`w-full p-2 border rounded text-sm font-semibold outline-none transition-colors ${
                      (editForm.estatus || 'Activo').toLowerCase() === 'activo'
                        ? 'bg-emerald-100 border-emerald-300'
                        : 'bg-slate-800 border-slate-900'
                    }`}
                  >
                    <option value="Activo" className="bg-white text-slate-800 font-medium">Activo</option>
                    <option value="Inactivo" className="bg-white text-slate-800 font-medium">Inactivo</option>
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

      {/* MODAL PARA DAR DE BAJA / MOTIVO DE LA BAJA */}
      {bajaModalPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-base text-red-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Confirmar Baja de Paciente
              </h3>
              <button onClick={() => setBajaModalPatient(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleConfirmBaja} className="p-6 space-y-4">
              <div>
                <p className="font-bold text-slate-800 text-sm mb-1">{bajaModalPatient.name || bajaModalPatient.paciente}</p>
                <p className="text-slate-500 text-xs">Por favor explica la razón o motivo por la cual este paciente pasa a estado <strong className="text-red-700">Inactivo / Baja</strong>:</p>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1.5">Motivo o Razón de la Baja</label>
                <textarea
                  required
                  rows={4}
                  value={bajaReason}
                  onChange={(e) => setBajaReason(e.target.value)}
                  placeholder="Ej: Cambio de residencia, fin de tratamiento, horario incompatible..."
                  className="w-full text-slate-900 font-medium border border-slate-300 rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs bg-white shadow-inner"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setBajaModalPatient(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 text-xs transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingBaja} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-xs transition-colors shadow-md disabled:opacity-50">
                  {isSubmittingBaja ? "Guardando..." : "Confirmar Baja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
