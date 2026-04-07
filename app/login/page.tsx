"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, ArrowLeft, MailCheck, Lock } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
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
    // Se usuário já autenticado ao visitar /login: redirecionar automaticamente para /dashboard
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
        }
      } catch {
        // Ignora erro
      }
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
        // Fluxo Original: Magic Link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          },
        });

        if (error) {
          console.warn("Supabase auth error:", error.message);
        }
        setSuccess(true);
      } else {
        // Fluxo Novo: Senha
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

        if (data.session) {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!usePassword) {
        setSuccess(true); 
      } else {
        setAuthError(err.message || "Erro ao fazer login");
      }
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
         if (signUpError.message.toLowerCase().includes("already registered")) {
            throw new Error("Este e-mail já possui conta. Tente a senha original ou recupere via Magic Link.");
         }
         throw signUpError;
      }
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      if (data?.session) {
        router.push("/dashboard");
      }
    } catch (e: any) {
      setAuthError(e.message || "Erro ao criar conta com senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-8 h-8 text-brand" />
          <span className="font-extrabold text-2xl tracking-tight text-brand">Agendify</span>
        </div>
      </div>

      <Card className="p-8 shadow-sm">
        {!success ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                {isCadastro ? "Crie sua conta" : "Acesse sua agenda"}
              </h1>
              <p className="text-sm text-slate-500">
                {isCadastro 
                  ? "Grátis, sem cartão de crédito." 
                  : (usePassword ? "Digite suas credenciais abaixo." : "Enviamos um link mágico para o seu e-mail. Leva menos de 1 minuto.")}
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-sm mb-5 text-center font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input
                label="Seu e-mail"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              {usePassword && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    label="Sua Senha"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {!showSignUpOption ? (
                <Button type="submit" variant="primary" className="h-11 w-full mt-2" disabled={loading}>
                  {loading ? "Processando..." : (usePassword ? "Entrar com senha" : "Entrar com link mágico")}
                </Button>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                   <Button type="button" onClick={handleCreatePassword} variant="primary" className="h-11 w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                     {loading ? "Criando..." : "Criar nova senha agora"}
                   </Button>
                   <Button type="button" onClick={() => setShowSignUpOption(false)} variant="ghost" className="h-10 w-full text-slate-500">
                     Cancelar
                   </Button>
                </div>
              )}
              
              {!showSignUpOption && (
                <div className="text-center mt-1">
                  <button 
                    type="button" 
                    onClick={() => { setUsePassword(!usePassword); setShowSignUpOption(false); setAuthError(""); }} 
                    className="text-sm text-slate-500 hover:text-brand font-medium underline-offset-4 hover:underline transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Lock className="w-3.5 h-3.5" /> 
                    {usePassword ? "Prefiro usar link mágico" : "Prefiro usar senha"}
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 flex items-center justify-center">
              <div className="flex-1 border-t border-slate-100"></div>
              <span className="px-3 text-sm text-slate-400 bg-white">ou</span>
              <div className="flex-1 border-t border-slate-100"></div>
            </div>

            <div className="mt-6">
              <Button 
                variant="secondary" 
                className="w-full h-11 text-brand font-medium"
                onClick={() => router.push(isCadastro ? '/login' : '/login?modo=cadastro')}
              >
                {isCadastro ? "Já tenho uma conta" : "Criar conta grátis"}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verifique seu e-mail!</h2>
            <p className="text-slate-600 text-sm mb-6">
              Enviamos um link de acesso para <strong>{email}</strong>. 
              O link expira em 10 minutos.
            </p>
            <Button 
              variant="ghost" 
              className="text-slate-500 w-full"
              onClick={() => { setSuccess(false); setUsePassword(false); }}
            >
              Tentar outro e-mail
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-8 text-center">
        <Link 
          href="/landing" 
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o início
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 font-sans">
      <React.Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin"></div>}>
        <LoginContent />
      </React.Suspense>
    </div>
  );
}
