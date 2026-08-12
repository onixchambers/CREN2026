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
    <div className="min-h-screen bg-[#0e2f44] flex items-center justify-center p-4">
      <div className="w-full max-w-md -mt-12">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="CREN Logo" className="w-64 h-auto drop-shadow-lg" />
        </div>

        {/* Cuadro principal traslúcido con bordes en blanco */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/40 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-white mb-6 tracking-wide">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-100 p-3 rounded-lg text-sm mb-4 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                Usuario
              </label>
              {/* Input con fondo del color del fondo (#0e2f44) y texto de escritura en BLANCO */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-lg border-2 border-white/40 bg-[#0e2f44] focus:border-white focus:ring-4 focus:ring-white/20 transition-all outline-none text-white font-medium placeholder-slate-300"
                placeholder="Nombre de usuario"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wide mb-2">
                Contraseña
              </label>
              {/* Input con fondo del color del fondo (#0e2f44) y texto de escritura en BLANCO */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-lg border-2 border-white/40 bg-[#0e2f44] focus:border-white focus:ring-4 focus:ring-white/20 transition-all outline-none text-white font-medium placeholder-slate-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5276] hover:bg-[#154360] border border-white/30 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? "Entrando..." : "Entrar al Sistema"}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-[#a5c2d4] text-lg font-medium tracking-wide">Sistema Operativo-Financiero</p>
        </div>
      </div>
    </div>
  );
}
