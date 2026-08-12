"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      const res = await signIn("credentials", {
        redirect: false,
        username: cleanUser,
        password: cleanPass,
      });

      if (res?.error) {
        setError("Credenciales incorrectas");
        setLoading(false);
      } else if (res?.ok) {
        window.location.assign("/dashboard");
      } else {
        setError("Error al iniciar sesión. Inténtalo nuevamente.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error durante inicio de sesión:", err);
      setError("Error de comunicación con el servidor.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Overlay to ensure high contrast & keep background colors vivid */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/25 to-slate-950/50 backdrop-blur-[1px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl">
            <img src="/logo.png" alt="CREN Logo" className="w-56 h-auto drop-shadow-md" />
          </div>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/70 transition-all">
          <h2 className="text-2xl font-extrabold text-center text-[#1a5276] mb-1 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-center text-[11px] font-bold text-slate-500 mb-6 uppercase tracking-wider">
            Ingrese sus credenciales de acceso
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-700 p-3 rounded-xl text-sm mb-5 text-center font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Usuario / Correo
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white/90 focus:bg-white text-slate-900 font-semibold placeholder-slate-400 focus:border-[#1a5276] focus:ring-4 focus:ring-[#1a5276]/15 transition-all outline-none shadow-sm"
                placeholder="Nombre de usuario o correo"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white/90 focus:bg-white text-slate-900 font-semibold placeholder-slate-400 focus:border-[#1a5276] focus:ring-4 focus:ring-[#1a5276]/15 transition-all outline-none shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#1a5276] via-[#2471a3] to-[#1b4f72] hover:from-[#154360] hover:to-[#1a5276] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-[#1a5276]/30 hover:shadow-xl active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? "Entrando..." : "Entrar al Sistema"}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-white text-sm font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Sistema Operativo-Financiero CREN
          </p>
        </div>
      </div>
    </div>
  );
}
