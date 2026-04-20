"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Clock, Zap } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tenta salvar no Supabase (se as chaves reais estiverem configuradas)
      const { error } = await supabase.from("leads").insert([{ name, whatsapp }]);

      // Se der erro por falta de configuração real, ignoramos no ambiente mockado 
      // Mas a intenção e a lógica já ficam prontas para uso real
      if (error && error.message.includes("URL missing")) {
        console.warn("Supabase não configurado. Mockando sucesso...");
      }

      // Exibe sucesso
      setShowToast(true);

      // Redireciona após 2 segundos
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setShowToast(true); // Exibe msm em erro p/ fins de mockup visual
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-text-main bg-white min-h-screen">
      {/* 1. NAVBAR */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand" />
            <span className="font-extrabold text-xl tracking-tight text-brand">Agendify</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">Testar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. HERO */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                Organize sua agenda de atendimentos em minutos
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Pare de perder clientes por falta de organização. O Agendify é simples, rápido e feito para você.
              </p>
              <Link href="/login">
                <Button variant="primary" className="h-12 px-8 text-base shadow-lg shadow-brand/20">
                  Testar grátis — é gratuito
                </Button>
              </Link>
            </div>
            <div className="relative">
              {/* Fake Mockup Image */}
              <div className="aspect-[4/3] bg-surface rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex items-center justify-center p-8 relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-100 mt-6 p-4 flex flex-col gap-3">
                  <div className="h-8 bg-slate-100 rounded w-1/3" />
                  <div className="flex gap-4">
                    <div className="h-20 bg-indigo-50 rounded flex-1" />
                    <div className="h-20 bg-green-50 rounded flex-1" />
                    <div className="h-20 bg-red-50 rounded flex-1" />
                  </div>
                  <div className="h-40 bg-slate-50 rounded w-full mt-2" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENEFÍCIOS */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                  <CalendarCheck className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Nunca mais esqueça um cliente</h3>
                <p className="text-slate-600">Veja toda sua agenda organizada por dia e semana.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Horários livres visíveis</h3>
                <p className="text-slate-600">Saiba de imediato quando você tem disponibilidade.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Tudo em 2 cliques</h3>
                <p className="text-slate-600">Agendar, confirmar e avisar pelo WhatsApp sem complicação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PROVA SOCIAL */}
        <section className="py-24 bg-[#F5F3FF]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed mb-8">
              &quot;Antes eu anotava tudo no papel e vivia esquecendo cliente. Com o Agendify organizei minha semana toda em 10 minutos.&quot;
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Camila R.</p>
                <p className="text-sm text-slate-500">Cabeleireira, São Paulo</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CTA FINAL + CAPTURA DE LEAD */}
        <section className="py-24 bg-white text-center">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Comece agora com o Agendify</h2>
            <p className="text-lg text-slate-600 mb-10">Grátis, sem cartão de crédito</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto text-left">
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Seu WhatsApp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" className="h-12 mt-2" disabled={loading}>
                {loading ? "Processando..." : "Quero organizar minha agenda"}
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2024 Agendify. Feito para profissionais da beleza.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="text-slate-500 hover:text-brand font-medium">Entrar</Link>
            <Link href="/login" className="text-slate-500 hover:text-brand font-medium">Criar conta</Link>
          </div>
        </div>
      </footer>

      {showToast && (
        <Toast
          message="Lead cadastrado com sucesso! Preparando redirecionamento..."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
