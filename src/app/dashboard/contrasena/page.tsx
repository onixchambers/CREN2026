"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { changeUserPassword } from "@/app/actions/configuracion";

export default function CambiarContrasenaPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword) {
      setErrorMessage("Por favor ingresa tu contraseña actual.");
      return;
    }

    if (!newPassword) {
      setErrorMessage("Por favor ingresa tu nueva contraseña.");
      return;
    }

    if (newPassword.length < 3) {
      setErrorMessage("La nueva contraseña debe tener al menos 3 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("La nueva contraseña no puede ser igual a la contraseña actual.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await changeUserPassword(userName, currentPassword, newPassword);
      if (res.success) {
        setSuccessMessage("¡Tu contraseña ha sido actualizada exitosamente!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage(res.error || "Ocurrió un error al actualizar la contraseña.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2 bg-[#1a5276]/10 text-[#1a5276] rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a5276]">Cambiar Contraseña</h2>
          <p className="text-xs text-slate-500">Actualiza la clave de acceso de tu usuario ({userName})</p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Renglón 1: Contraseña Actual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Contraseña Actual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full p-3 pr-10 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                {showCurrent ? "🙈 Ocultar" : "👁️ Ver"}
              </button>
            </div>
          </div>

          {/* Renglón 2: Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
                className="w-full p-3 pr-10 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                {showNew ? "🙈 Ocultar" : "👁️ Ver"}
              </button>
            </div>
          </div>

          {/* Renglón 3: Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full p-3 pr-10 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                {showConfirm ? "🙈 Ocultar" : "👁️ Ver"}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#1a5276] hover:bg-[#143d59] disabled:opacity-50 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>🔑 Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center">
            * Nota: Los cambios de contraseña serán visibles inmediatamente para el Administrador del sistema en la pestaña de Configuración.
          </p>
        </div>
      </div>
    </div>
  );
}
