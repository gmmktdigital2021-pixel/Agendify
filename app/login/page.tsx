"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, MailCheck, Lock, Phone, MessageCircle, Clock, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCadastro = searchParams.get("modo") === "cadastro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSignUpOption, setShowSignUpOption] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.push("/dashboard");
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
      if (!usePassword) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
        });
        if (error) console.warn("Supabase auth error:", error.message);
        setSuccess(true);
      } else {
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
        if (data.session) router.push("/dashboard");
      }
    } catch (err: any) {
      if (!usePassword) setSuccess(true);
      else setAuthError(err.message || "Erro ao fazer login");
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
          throw new Error("Este e-mail já possui conta. Tente a senha original ou recupere via Magic Link.");
        throw signUpError;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (data?.session) router.push("/dashboard");
    } catch (e: any) {
      setAuthError(e.message || "Erro ao criar conta com senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* LADO ESQUERDO — Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-20 bg-white relative">

        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2 mb-12">
          <CalendarCheck className="w-7 h-7 text-brand" />
          <span className="font-extrabold text-xl text-brand">Agendify</span>
        </Link>

        {!success ? (
          <div className="max-w-sm w-full">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              {isCadastro ? "Crie sua conta" : "Bem-vindo de volta!"}
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              {isCadastro ? "Grátis, sem cartão de crédito." : "Acesse sua agenda agora."}
            </p>

            {authError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm mb-5 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              {usePassword && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              )}

              {!showSignUpOption ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-brand/20"
                >
                  {loading ? "Processando..." : (usePassword ? "Entrar com senha" : "Entrar com link mágico")}
                </button>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCreatePassword}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Criando..." : "Criar nova senha agora"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUpOption(false)}
                    className="w-full text-slate-500 py-2.5 rounded-xl text-sm hover:text-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {!showSignUpOption && (
                <button
                  type="button"
                  onClick={() => { setUsePassword(!usePassword); setShowSignUpOption(false); setAuthError(""); }}
                  className="text-sm text-slate-400 hover:text-brand transition-colors flex items-center justify-center gap-1.5 mt-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {usePassword ? "Prefiro usar link mágico" : "Prefiro usar senha"}
                </button>
              )}
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">ou</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <button
              onClick={() => router.push(isCadastro ? '/login' : '/login?modo=cadastro')}
              className="w-full border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm hover:border-brand hover:text-brand transition-all"
            >
              {isCadastro ? "Já tenho uma conta" : "Criar conta grátis"}
            </button>
          </div>
        ) : (
          <div className="max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifique seu e-mail!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Enviamos um link de acesso para <strong>{email}</strong>. O link expira em 10 minutos.
            </p>
            <button
              onClick={() => { setSuccess(false); setUsePassword(false); }}
              className="w-full border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-medium text-sm hover:border-brand hover:text-brand transition-all"
            >
              Tentar outro e-mail
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-12">
          © 2025 Agendify. Todos os direitos reservados.
        </p>
      </div>

      {/* LADO DIREITO — Conteúdo visual */}
      <div className="hidden lg:flex w-1/2 bg-[#0F1628] flex-col justify-between p-12 relative overflow-hidden">

        {/* Efeitos de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/20 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        {/* Topo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-bold mb-16">
            ✨ Plataforma Nº1 para Profissionais de Beleza
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Sua agenda no <br />
            <span className="text-brand">piloto automático.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Receba marcações 24h por dia, elimine faltas e gerencie seus clientes com facilidade.
          </p>
        </div>

        {/* Cards de stats */}
        <div className="relative z-10 space-y-4">

          {/* Card depoimento */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed italic mb-4">
              "Antes perdia 1 hora por dia no Instagram marcando horários. Agora minha agenda se preenche sozinha."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm">C</div>
              <div>
                <p className="text-white font-bold text-sm">Camila R.</p>
                <p className="text-slate-500 text-xs">Cabeleireira · São Paulo</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Clock className="w-4 h-4" />, value: "20h", label: "economizadas/sem" },
              { icon: <MessageCircle className="w-4 h-4" />, value: "90%", label: "menos faltas" },
              { icon: <Phone className="w-4 h-4" />, value: "24h", label: "agendamentos" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <div className="text-brand flex justify-center mb-1">{stat.icon}</div>
                <div className="text-white font-extrabold text-lg">{stat.value}</div>
                <div className="text-slate-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}