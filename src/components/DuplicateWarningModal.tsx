"use client";
import React from "react";

export interface DuplicatePatientMatch {
  id: string;
  displayId?: string;
  name: string;
  phone?: string;
  fechaNacimiento?: string;
  estatus?: string;
  medicoTratante?: string;
  terapeuta?: string;
  matchReason: string;
  similarityScore?: number;
}

interface DuplicateWarningModalProps {
  isOpen: boolean;
  duplicates: DuplicatePatientMatch[];
  newPatientName: string;
  onCancel: () => void;
  onConfirmSaveAnyway: () => void;
  isSubmitting?: boolean;
}

export function DuplicateWarningModal({
  isOpen,
  duplicates,
  newPatientName,
  onCancel,
  onConfirmSaveAnyway,
  isSubmitting = false,
}: DuplicateWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-amber-200 text-slate-900 flex flex-col max-h-[90vh]">
        {/* ENCABEZADO DE ALERTA */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold shadow-inner">
              ⚠️
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg leading-tight">
                ¡Posible Duplicidad Detectada!
              </h3>
              <p className="text-amber-100 text-xs font-medium">
                Verifica antes de registrar en el sistema
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white text-2xl font-bold p-1 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* CONTENIDO Y LISTA DE DUPLICADOS */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar bg-slate-50/50">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1 shadow-2xs">
            <p className="font-bold text-amber-950 text-sm">
              Se encontraron coincidencias para: <span className="underline decoration-amber-400 font-extrabold text-slate-900">"{newPatientName}"</span>
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              El sistema detectó uno o más pacientes ya existentes con un nombre o número de contacto muy similar (incluyendo posibles errores de escritura o variaciones). Por favor revisa la lista abajo:
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex justify-between items-center">
              <span>Registros Existentes Coincidentes ({duplicates.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Revisa antes de confirmar</span>
            </h4>

            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm md:text-base">
                      {dup.name}
                    </span>
                    {dup.displayId && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                        {dup.displayId}
                      </span>
                    )}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      dup.estatus === "Inactivo" || dup.estatus === "Baja" 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {dup.estatus || "Activo"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 pt-1 font-medium">
                    {dup.fechaNacimiento && (
                      <p>🎂 Nacimiento: <span className="font-semibold text-slate-800">{dup.fechaNacimiento}</span></p>
                    )}
                    {dup.phone && (
                      <p>📞 Teléfono: <span className="font-semibold text-slate-800">{dup.phone}</span></p>
                    )}
                    {(dup.medicoTratante || dup.terapeuta) && (
                      <p className="sm:col-span-2">🩺 Terapeuta/Médico: <span className="font-semibold text-slate-800">{dup.medicoTratante || dup.terapeuta}</span></p>
                    )}
                  </div>
                </div>

                <div className="md:text-right shrink-0">
                  <span className="inline-block bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold px-3 py-1 rounded-lg shadow-2xs">
                    ⚡ {dup.matchReason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACCIONES Y BOTONES */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            🛑 Cancelar y Revisar
          </button>

          <button
            type="button"
            onClick={onConfirmSaveAnyway}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Guardando...</span>
            ) : (
              <>
                <span>⚠️ Guardar de Todos Modos</span>
                <span className="text-[10px] opacity-80">(Confirmar es nuevo paciente)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
