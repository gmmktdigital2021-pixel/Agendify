"use client";

import React, { useEffect, useState } from "react";
import { Check, Zap, Crown, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Subscription = {
  plan_id: string;
  status: string;
  current_period_end?: string;
};

export default function PlanosPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const router = useRouter();

  const PRICES = {
    PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
    PRO_PIX: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PIX || '',
    PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY || '',
    PREMIUM_PIX: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_PIX || '',
  }

  useEffect(() => {
    async function fetchPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (data) setSubscription(data);
      setLoading(false);
    }
    fetchPlan();
  }, []);

  const handleCheckout = async (priceId: string) => {
    console.log('PRICES:', PRICES)
    setLoadingPrice(priceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?modo=cadastro')
        return
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: session.user.id,
          userEmail: session.user.email,
          planId: priceId === PRICES.PRO_MONTHLY || priceId === PRICES.PRO_PIX ? 'pro' : 'premium'
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao criar sessão de pagamento. Tente novamente.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingPrice(null)
    }
  }

  const currentPlan = subscription?.status === 'active' || subscription?.status === 'trialing' ? subscription.plan_id : 'free';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-extrabold text-slate-800">
          Gerencie sua <span className="text-brand">Assinatura</span>
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Faça um upgrade para destravar recursos exclusivos e automatizar 100% da sua agenda de atendimentos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* FREE PLAN */}
        <div className={`bg-white rounded-3xl p-8 shadow-sm border-2 transition-all ${currentPlan === 'free' ? 'border-slate-300 relative scale-105 shadow-xl' : 'border-slate-100 hover:border-slate-200'}`}>
          {currentPlan === 'free' && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
               Seu plano atual
             </div>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Gratuito</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">R$ 0</span>
              <span className="text-slate-500 font-medium">/mês</span>
            </div>
            <p className="text-sm text-slate-500 mt-3">Para quem está começando e precisa do básico.</p>
          </div>
          
          <ul className="space-y-4 mb-8">
            {["Até 50 agendamentos/mês", "1 Profissional", "Página pública simples", "Lembretes manuais"].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          
          <button disabled className="w-full py-4 rounded-xl font-bold text-slate-400 bg-slate-100 cursor-not-allowed">
            {currentPlan === 'free' ? 'Plano Ativo' : 'Plano Básico'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className={`bg-white rounded-3xl p-8 border-2 transition-all ${currentPlan === 'pro' || currentPlan === 'pro_pix' ? 'border-brand relative scale-105 shadow-2xl shadow-brand/20' : 'border-slate-100 hover:border-brand/30'}`}>
          {currentPlan.startsWith('pro') && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
               <Check className="w-3 h-3" /> Seu plano atual
             </div>
          )}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5" /> Mais popular
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Profissional</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">R$ 47</span>
              <span className="text-slate-500 font-medium">/mês</span>
            </div>
            <p className="text-sm text-slate-500 mt-3">Para profissionais que querem automatizar tudo.</p>
          </div>
          
          <ul className="space-y-4 mb-8">
            {["Agendamentos ilimitados", "Lembretes automáticos via WhatsApp", "Múltiplos serviços", "Relatórios financeiros"].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          
          {currentPlan.startsWith('pro') ? (
            <button disabled className="w-full py-4 rounded-xl font-bold text-brand bg-brand/10 cursor-not-allowed">
              Plano Ativo
            </button>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={() => handleCheckout(PRICES.PRO_MONTHLY)}
                disabled={loadingPrice !== null}
                className="w-full py-4 rounded-xl font-bold text-white bg-brand hover:bg-brand-hover transition-colors shadow-lg shadow-brand/30 flex items-center justify-center"
              >
                {loadingPrice === PRICES.PRO_MONTHLY ? 'Processando...' : 'Assinar Mensal'}
              </button>
              <button 
                onClick={() => handleCheckout(PRICES.PRO_PIX)}
                disabled={loadingPrice !== null}
                className="w-full py-3 rounded-xl font-bold text-brand bg-white border-2 border-brand/20 hover:bg-brand/5 transition-colors flex items-center justify-center text-sm"
              >
                {loadingPrice === PRICES.PRO_PIX ? 'Processando...' : 'Comprar Anual (Pix)'}
              </button>
            </div>
          )}
        </div>

        {/* PREMIUM PLAN */}
        <div className={`bg-slate-900 rounded-3xl p-8 border-2 transition-all ${currentPlan === 'premium' || currentPlan === 'premium_pix' ? 'border-amber-500 relative scale-105 shadow-2xl shadow-amber-500/20' : 'border-slate-800 hover:border-slate-700'}`}>
          {currentPlan.startsWith('premium') && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
               <Crown className="w-3 h-3" /> Seu plano atual
             </div>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">R$ 97</span>
              <span className="text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-sm text-slate-400 mt-3">Para clínicas e salões com múltiplos profissionais.</p>
          </div>
          
          <ul className="space-y-4 mb-8">
            {["Tudo do Profissional", "Até 10 profissionais na mesma conta", "Agenda individual por profissional", "Suporte prioritário"].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          
          {currentPlan.startsWith('premium') ? (
            <button disabled className="w-full py-4 rounded-xl font-bold text-slate-900 bg-amber-500 cursor-not-allowed">
              Plano Ativo
            </button>
          ) : (
            <div className="space-y-3">
              <button 
                onClick={() => handleCheckout(PRICES.PREMIUM_MONTHLY)}
                disabled={loadingPrice !== null}
                className="w-full py-4 rounded-xl font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center"
              >
                {loadingPrice === PRICES.PREMIUM_MONTHLY ? 'Processando...' : 'Assinar Mensal'}
              </button>
              <button 
                onClick={() => handleCheckout(PRICES.PREMIUM_PIX)}
                disabled={loadingPrice !== null}
                className="w-full py-3 rounded-xl font-bold text-amber-500 bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center text-sm"
              >
                {loadingPrice === PRICES.PREMIUM_PIX ? 'Processando...' : 'Comprar Anual (Pix)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
