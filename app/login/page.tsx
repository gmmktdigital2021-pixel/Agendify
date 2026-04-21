"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, MailCheck, Lock, Clock, Star, MessageCircle } from "lucide-react";
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
        if (error) console.warn(error.message);
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
    <div className="min-h-screen bg-[#7C3AED] flex font-sans">
      <div className="w-full h-screen flex">

        {/* LADO ESQUERDO — Formulário (branco) */}
        <div className="w-full lg:w-[55%] bg-white flex flex-col justify-center items-center px-10 py-12 relative z-10 shadow-xl">

          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2 mb-10">
            <CalendarCheck className="w-7 h-7 text-brand" />
            <span className="font-extrabold text-xl text-brand">Agendify</span>
          </Link>

          {!success ? (
            <div className="max-w-sm">
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

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

                {usePassword && (
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

                {!showSignUpOption ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand text-white py-4 rounded-2xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 mt-1 shadow-lg shadow-brand/25"
                  >
                    {loading ? "Processando..." : (usePassword ? "Entrar com senha" : "Entrar com link mágico")}
                  </button>
                ) : (
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
                )}

                {!showSignUpOption && (
                  <button
                    type="button"
                    onClick={() => { setUsePassword(!usePassword); setShowSignUpOption(false); setAuthError(""); }}
                    className="text-xs text-slate-600 hover:text-brand transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3 h-3" />
                    {usePassword ? "Prefiro usar link mágico" : "Prefiro usar senha"}
                  </button>
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
          ) : (
            <div className="max-w-sm text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifique seu e-mail!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enviamos um link para <strong>{email}</strong>. Expira em 10 minutos.
              </p>
              <button
                onClick={() => { setSuccess(false); setUsePassword(false); }}
                className="w-full border-2 border-slate-100 text-slate-500 py-3 rounded-2xl font-medium text-sm hover:border-brand hover:text-brand transition-all"
              >
                Tentar outro e-mail
              </button>
            </div>
          )}

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






