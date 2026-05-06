"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, Lock, Clock, Star, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCadastro = searchParams.get("modo") === "cadastro";
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSignUpOption, setShowSignUpOption] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.push(redirect);
      } catch { }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    setShowSignUpOption(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid credentials") || error.message.toLowerCase().includes("invalid login")) {
          setAuthError("Senha incorreta ou usuário não encontrado.");
          setShowSignUpOption(true);
          setLoading(false);
          return;
        }
        throw error;
      }
      if (data.session) router.push(redirect);
    } catch (err: any) {
      setAuthError(err.message || "Erro ao fazer login");
    } finally {
      if (!showSignUpOption) setLoading(false);
    }
  };

  const handleCreatePassword = async () => {
    setLoading(true);
    setAuthError("");
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered"))
          throw new Error("Este e-mail já possui conta. Tente a senha original ou recupere a senha.");
        throw signUpError;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (data?.session) router.push(redirect);
    } catch (e: any) {
      setAuthError(e.message || "Erro ao criar conta com senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    setLoading(true);
    setAuthError("");
    setResetMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResetMessage("E-mail de recuperação enviado!");
    } catch (err: any) {
      setAuthError(err.message || "Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { createBrowserClient } = await import("@supabase/ssr");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://agendify-plpd.vercel.app/auth/callback",
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#7C3AED] flex font-sans">
      <div className="w-full h-screen flex">

        {/* LADO ESQUERDO — Formulário (branco) */}
        <div className="w-full lg:w-[55%] bg-white flex flex-col justify-center items-center px-10 py-12 relative z-10 shadow-xl">

          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2 mb-10">
            <CalendarCheck className="w-7 h-7 text-brand" />
            <span className="font-extrabold text-xl text-brand">Agendify</span>
          </Link>

          <div className="max-w-sm w-full">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
              {isCadastro ? "Crie sua conta" : "Bem-vindo de volta!"}
            </h1>
            <p className="text-slate-600 text-sm mb-8">
              {isCadastro ? "Grátis, sem cartão de crédito." : "Acesse sua agenda agora."}
            </p>

            {authError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm mb-5 font-medium">
                {authError}
              </div>
            )}
            {resetMessage && (
              <div className="bg-green-50 text-green-600 border border-green-100 p-3 rounded-xl text-sm mb-5 font-medium">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </button>

              {/* Divisor */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">E-mail</label>
                <input
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-slate-300"
                />
              </div>

              {!isForgotPassword && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-slate-300"
                  />
                </div>
              )}

              {!showSignUpOption && !isForgotPassword ? (
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand text-white py-4 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-brand/25"
                  >
                    {loading ? "Processando..." : "Entrar com senha"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setAuthError(""); setResetMessage(""); }}
                    className="text-xs text-slate-500 hover:text-brand hover:underline self-end mt-1"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              ) : showSignUpOption ? (
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleCreatePassword}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Criando..." : "Criar nova senha agora"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUpOption(false)}
                    className="w-full text-slate-400 py-2.5 text-sm hover:text-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-brand text-white py-4 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetMessage(""); setAuthError(""); }}
                    className="w-full text-slate-400 py-2.5 text-sm hover:text-slate-700 transition-colors"
                  >
                    Voltar ao login
                  </button>
                </div>
              )}
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-slate-100" />
              <span className="text-xs text-slate-500 font-medium">ou</span>
              <div className="flex-1 border-t border-slate-100" />
            </div>

            <button
              onClick={() => router.push(isCadastro ? '/login' : '/login?modo=cadastro')}
              className="w-full border-2 border-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-sm hover:border-brand hover:text-brand transition-all"
            >
              {isCadastro ? "Já tenho uma conta" : "Criar conta grátis"}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-10">© 2025 Agendify. Todos os direitos reservados.</p>
        </div>

        {/* LADO DIREITO — Conteúdo visual (roxo) */}
        <div className="hidden lg:flex w-[45%] bg-[#7C3AED] flex-col justify-between p-10 relative overflow-hidden">

          {/* Círculos decorativos */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-36 -mt-36 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/30 rounded-full -ml-24 -mb-24 pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 pointer-events-none" />

          {/* Topo */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold mb-8">
              ✨ Plataforma Nº1 para Beleza
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Sua agenda no <br />
              <span className="text-purple-200">piloto automático.</span>
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed">
              Receba marcações 24h, elimine faltas e cresça seu negócio.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: <Clock className="w-4 h-4" />, value: "20h", label: "economizadas" },
                { icon: <MessageCircle className="w-4 h-4" />, value: "90%", label: "menos faltas" },
                { icon: <Star className="w-4 h-4 fill-current" />, value: "500+", label: "profissionais" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <div className="text-purple-200 flex justify-center mb-1">{stat.icon}</div>
                  <div className="text-white font-extrabold text-base">{stat.value}</div>
                  <div className="text-purple-300 text-[10px]">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Depoimento */}
            <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-300 text-amber-300" />)}
              </div>
              <p className="text-purple-100 text-xs leading-relaxed italic mb-3">
                "Minha agenda se preenche sozinha. Economizo horas todo dia!"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-xs">C</div>
                <div>
                  <p className="text-white font-bold text-xs">Camila R.</p>
                  <p className="text-purple-300 text-[10px]">Cabeleireira · SP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-brand flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
