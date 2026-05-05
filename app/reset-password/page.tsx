"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#7C3AED] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center relative overflow-hidden">
        
        {success ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Senha alterada!</h2>
            <p className="text-slate-500 mb-6">
              Sua senha foi redefinida com sucesso.
            </p>
            <p className="text-sm text-slate-400">Redirecionando para o dashboard...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock size={28} className="text-purple-600" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
              Nova Senha
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Digite a sua nova senha abaixo para acessar sua conta.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm mb-5 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Redefinir Senha"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
