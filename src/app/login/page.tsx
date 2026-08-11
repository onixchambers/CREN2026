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
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/cren-login-bg.jpg')" }}
    >
      {/* Overlay sutil para oscurecer y dar profundidad */}
      <div className="absolute inset-0 bg-[#09141f]/35 backdrop-blur-[2px]" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col items-center my-auto">
        {/* LOGO SUPERIOR CREN */}
        <div className="text-center mb-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <img 
            src="/logo.png" 
            alt="CREN Logo" 
            className="w-56 sm:w-64 h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-110" 
          />
        </div>

        {/* TARJETA DE INICIO DE SESIÓN GLASSMORPHISM */}
        <div className="w-full bg-[#112435]/75 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-slate-500/25">
          <h2 className="text-xl sm:text-2xl font-extrabold text-center text-white mb-6 tracking-wide drop-shadow-sm">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-xs sm:text-sm mb-5 text-center font-semibold animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                USUARIO
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#091522]/80 border border-slate-600/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all outline-none text-white font-medium text-sm placeholder-slate-500 shadow-inner"
                placeholder="Usuario"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#091522]/80 border border-slate-600/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all outline-none text-white font-medium text-sm placeholder-slate-500 shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#296893] to-[#174669] hover:from-[#3179aa] hover:to-[#1e5884] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-950/50 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/30 text-sm"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? "Entrando..." : "Entrar al Sistema"}
            </button>
          </form>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="text-center mt-6">
          <p className="text-slate-400/90 text-xs sm:text-sm font-medium tracking-wider drop-shadow-sm">
            Sistema Operativo-Financiero
          </p>
        </div>
      </div>
    </div>
  );
}
