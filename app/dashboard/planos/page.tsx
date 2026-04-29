"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Check, X, Crown, Loader2 } from "lucide-react";

export default function PlanosPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("🔐 Session:", session?.user?.email ?? "nenhuma");
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? "");
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("user_id", session.user.id)
        .single();
      if (sub?.plan_id) setCurrentPlan(sub.plan_id);
    };
    init();
  }, [router, supabase]);

  const handleCheckout = async (priceId: string, planId: string) => {
    console.log("🛒 handleCheckout chamado", { priceId, planId, userId });
    if (!userId) {
      alert("Sessão não encontrada. Faça login novamente.");
      router.push("/login");
      return;
    }
    setLoadingPrice(priceId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId, userEmail, planId }),
      });
      const data = await response.json();
      console.log("✅ Resposta da API:", data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro: " + (data.error || "Resposta inválida"));
      }
    } catch (err) {
      console.error("❌ Erro:", err);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingPrice(null);
    }
  };

  const plans = [
    {
      id: "free", name: "Gratuito", price: "R$ 0", period: "/mês",
      description: "Para começar",
      features: [
        { text: "20 agendamentos/mês", included: true },
        { text: "Até 5 clientes", included: true },
        { text: "20 serviços", included: true },
        { text: "Relatórios", included: false },
      ],
      priceId: null, planId: "free", cta: "Plano atual", highlight: false,
    },
    {
      id: "pro", name: "Profissional", price: "R$ 47", period: "/mês",
      description: "Para profissionais em crescimento",
      features: [
        { text: "30 agendamentos/mês", included: true },
        { text: "Até 30 clientes", included: true },
        { text: "10 serviços", included: true },
        { text: "Relatórios completos", included: true },
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
      planId: "pro", cta: "Assinar Profissional", highlight: true,
    },
    {
      id: "premium", name: "Premium", price: "R$ 97", period: "/mês",
      description: "Para quem quer crescer sem limites",
      features: [
        { text: "Agendamentos ilimitados", included: true },
        { text: "Clientes ilimitados", included: true },
        { text: "Serviços ilimitados", included: true },
        { text: "Relatórios completos", included: true },
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY,
      planId: "premium", cta: "Assinar Premium", highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu plano</h1>
          <p className="text-gray-500">Cancele quando quiser. Sem contratos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl p-6 shadow-sm border-2 flex flex-col ${plan.highlight ? "border-purple-500 shadow-purple-100 shadow-lg" : "border-gray-100"}`}>
              {plan.highlight && (
                <div className="flex items-center gap-1 text-purple-600 text-sm font-semibold mb-3">
                  <Crown size={14} /> Mais popular
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {f.included ? <Check size={16} className="text-green-500 shrink-0" /> : <X size={16} className="text-red-400 shrink-0" />}
                    <span className={f.included ? "text-gray-700" : "text-gray-400"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              {plan.priceId ? (
                currentPlan === plan.id ? (
                  <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed">Plano atual</button>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.priceId!, plan.planId)}
                    disabled={loadingPrice === plan.priceId}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${plan.highlight ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"} disabled:opacity-50`}
                  >
                    {loadingPrice === plan.priceId ? (<><Loader2 size={16} className="animate-spin" />Processando...</>) : plan.cta}
                  </button>
                )
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed">
                  {currentPlan === "free" ? "Plano atual" : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
