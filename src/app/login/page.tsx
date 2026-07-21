"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Credenciales incorrectas");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0e2f44] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <img src="/logo.jpg" alt="CREN Logo" className="w-40 h-auto mb-6 rounded-lg shadow-2xl" />
          <h1 className="text-3xl font-bold text-white tracking-wide">CREN</h1>
          <p className="text-[#a5c2d4] mt-2">Sistema Operativo-Financiero</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5276] hover:bg-[#0e2f44] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Iniciando..." : "Entrar al Sistema"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
