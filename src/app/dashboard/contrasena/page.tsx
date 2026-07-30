"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { changeUserPassword } from "@/app/actions/configuracion";

export default function CambiarContrasenaPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Administrador";
  const userRole = ((session?.user as any)?.role || "ADMIN").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showAdminConfirmModal, setShowAdminConfirmModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePreSubmit = (e: React.FormEvent) => {
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

    if (isAdmin) {
      // Si el perfil es Administrador, solicita la confirmación formal de cambio de contraseña
      setShowAdminConfirmModal(true);
    } else {
      executePasswordChange();
    }
  };

  const executePasswordChange = async () => {
    setShowAdminConfirmModal(false);
    setIsLoading(true);

    try {
      const res = await changeUserPassword(userName, currentPassword, newPassword);
      if (res.success) {
        setSuccessMessage(`¡La contraseña del usuario ${isAdmin ? "Administrador" : userName} ha sido actualizada exitosamente!`);
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
          <p className="text-xs text-slate-500">
            Actualiza la clave de acceso para tu cuenta de {isAdmin ? "Administrador" : "usuario"} ({userName})
          </p>
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

        <form onSubmit={handlePreSubmit} className="space-y-5">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
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
              className="w-full py-3 bg-[#1a5276] hover:bg-[#143d59] disabled:opacity-50 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
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
            * Nota: Los cambios de contraseña surtirán efecto de inmediato en tu cuenta.
          </p>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA ADMINISTRADOR */}
      {showAdminConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Confirmación de Seguridad</h3>
                <p className="text-xs text-slate-500">Perfil de Administrador ({userName})</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas cambiar la contraseña del perfil de <strong>Administrador</strong> por la nueva clave especificada?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={executePasswordChange}
                className="flex-1 py-2.5 bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Sí, Confirmar y Actualizar
              </button>
              <button
                onClick={() => setShowAdminConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
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
