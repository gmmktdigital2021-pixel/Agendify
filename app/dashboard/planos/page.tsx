"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Check, X, Crown, Loader2 } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
  PRO_PIX: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_PIX || "",
  PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY || "",
  PREMIUM_PIX: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_PIX || "",
};

export default function PlanosPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("user_id", session.user.id)
        .single();

      if (sub?.plan_id) setCurrentPlan(sub.plan_id);
    };
    init();
  }, [router]);

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!userId) {
      router.push("/login");
      return;
    }
    console.log("Iniciando checkout:", { priceId, planId, userId });
    setLoadingPrice(priceId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId, userEmail, planId }),
      });
      const data = await response.json();
      console.log("Checkout response:", data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro: " + (data.error || "Tente novamente"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setLoadingPrice(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Para começar",
      features: [
        { text: "Até 20 agendamentos/mês", included: true },
        { text: "Até 20 clientes", included: true },
        { text: "Até 5 serviços", included: true },
        { text: "Link público de agendamento", included: true },
        { text: "Relatórios e gráficos", included: false },
        { text: "Suporte prioritário", included: false },
      ],
      priceMonthly: null,
      pricePix: null,
      planId: "free",
      highlight: false,
    },
    {
      id: "pro",
      name: "Profissional",
      price: "R$ 47",
      period: "/mês",
      description: "Para profissionais em crescimento",
      features: [
        { text: "Até 30 agendamentos/mês", included: true },
        { text: "Até 30 clientes", included: true },
        { text: "Até 10 serviços", included: true },
        { text: "Link público de agendamento", included: true },
        { text: "Relatórios e gráficos", included: true },
        { text: "Suporte prioritário", included: false },
      ],
      priceMonthly: PRICES.PRO_MONTHLY,
      pricePix: PRICES.PRO_PIX,
      planId: "pro",
      highlight: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: "R$ 97",
      period: "/mês",
      description: "Para salões e equipes",
      features: [
        { text: "Agendamentos ilimitados", included: true },
        { text: "Clientes ilimitados", included: true },
        { text: "Serviços ilimitados", included: true },
        { text: "Link público de agendamento", included: true },
        { text: "Relatórios e gráficos", included: true },
        { text: "Suporte prioritário", included: true },
      ],
      priceMonthly: PRICES.PREMIUM_MONTHLY,
      pricePix: PRICES.PREMIUM_PIX,
      planId: "premium",
      highlight: false,
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Crown className="w-7 h-7 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planos e Assinaturas</h1>
          <p className="text-slate-500 text-sm">Plano atual: <span className="font-bold text-brand capitalize">{currentPlan}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
              plan.highlight
                ? "border-brand shadow-xl shadow-brand/10"
                : "border-slate-200 shadow-sm"
            } ${currentPlan === plan.id ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1 rounded-full">
                MAIS POPULAR
              </div>
            )}
            {currentPlan === plan.id && (
              <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Seu plano atual
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h2>
            <p className="text-slate-500 text-sm mb-4">{plan.description}</p>

            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
              <span className="text-slate-400 mb-1">{plan.period}</span>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  {f.included ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className={`text-sm ${f.included ? "text-slate-700" : "text-slate-400"}`}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>

            {plan.id === "free" ? (
              <button
                disabled
                className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-default"
              >
                {currentPlan === "free" ? "Plano atual" : "Gratuito"}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleCheckout(plan.priceMonthly!, plan.planId)}
                  disabled={loadingPrice !== null || currentPlan === plan.id}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-brand text-white hover:bg-purple-700 shadow-lg shadow-brand/25"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  } disabled:opacity-50`}
                >
                  {loadingPrice === plan.priceMonthly ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : currentPlan === plan.id ? (
                    "Plano atual"
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </button>
                <button
                  onClick={() => handleCheckout(plan.pricePix!, plan.planId)}
                  disabled={loadingPrice !== null || currentPlan === plan.id}
                  className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:border-brand hover:text-brand transition-all disabled:opacity-50"
                >
                  {loadingPrice === plan.pricePix ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                    </span>
                  ) : (
                    "Pagar via Pix"
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-slate-400 text-xs mt-8">
        🔒 Pagamento seguro · Cancele quando quiser · Sem fidelidade
      </p>
    </div>
  );
}
