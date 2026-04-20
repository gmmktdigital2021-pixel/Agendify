"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, Zap, Star, Check, X, ChevronDown, ChevronUp, MessageCircle, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [nichosOpen, setNichosOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "", whatsapp: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const nichos = [
    { label: "Cabeleireiras", href: "/nichos/cabeleireiras", emoji: "💇‍♀️" },
    { label: "Manicure & Nail Art", href: "/nichos/manicure", emoji: "💅" },
    { label: "Design de Sobrancelhas", href: "/nichos/sobrancelhas", emoji: "🤨" },
    { label: "Designer de Cílios", href: "/nichos/cilios", emoji: "👁️" },
    { label: "Maquiadoras", href: "/nichos/maquiadoras", emoji: "💄" },
    { label: "Barbearias", href: "/nichos/barbearias", emoji: "✂️" },
    { label: "Estéticas & Spa", href: "/nichos/estetica", emoji: "🧖" },
    { label: "Depilação", href: "/nichos/depilacao", emoji: "🪷" },
  ];

  const faqs = [
    { q: "O plano gratuito tem limite de tempo?", a: "Não! O plano gratuito é para sempre. Você só faz upgrade se quiser mais recursos." },
    { q: "Preciso de cartão de crédito para começar?", a: "Não. Basta criar sua conta com email e senha. Cartão só é necessário nos planos pagos." },
    { q: "Como meus clientes fazem o agendamento?", a: "Você recebe um link público personalizado para compartilhar no Instagram, WhatsApp ou onde quiser. O cliente acessa, escolhe o serviço e o horário e pronto!" },
    { q: "Os lembretes do WhatsApp são automáticos?", a: "Após o agendamento, o cliente é direcionado para o WhatsApp com a mensagem já preenchida. Com um clique ele confirma." },
    { q: "Posso cancelar minha assinatura?", a: "Sim, a qualquer momento, sem multa e sem burocracia." },
    { q: "O Agendify funciona no celular?", a: "Sim! Tanto o painel do profissional quanto a página de agendamento dos clientes são 100% responsivos." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from("leads").insert([{ name: formData.nome, whatsapp: formData.whatsapp, email: formData.email, message: formData.message }]);
      setToast("Mensagem enviada! Entraremos em contato em breve. 💜");
      setFormData({ nome: "", whatsapp: "", email: "", message: "" });
    } catch {
      setToast("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  return (
    <div className="font-sans bg-white min-h-screen">

      {/* NAVBAR */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand" />
            <span className="font-extrabold text-xl text-brand">Agendify</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setNichosOpen(!nichosOpen)} className="flex items-center gap-1 text-slate-600 hover:text-brand font-medium text-sm transition-colors">
                Nichos {nichosOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {nichosOpen && (
                <div className="absolute top-8 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 z-50">
                  {nichos.map(n => (
                    <Link key={n.href} href={n.href} onClick={() => setNichosOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand/5 hover:text-brand text-sm text-slate-700 transition-colors">
                      <span>{n.emoji}</span> {n.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <a href="#funcionalidades" className="text-slate-600 hover:text-brand font-medium text-sm transition-colors">Funcionalidades</a>
            <a href="#precos" className="text-slate-600 hover:text-brand font-medium text-sm transition-colors">Preços</a>
            <a href="#contato" className="text-slate-600 hover:text-brand font-medium text-sm transition-colors">Contato</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-slate-600 hover:text-brand font-medium text-sm transition-colors">Entrar</Link>
            <Link href="/login" className="bg-brand text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">Começar grátis</Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 p-4 flex flex-col gap-3">
            {nichos.map(n => (
              <Link key={n.href} href={n.href} className="text-slate-600 text-sm py-1">{n.emoji} {n.label}</Link>
            ))}
            <Link href="/login" className="bg-brand text-white px-4 py-2 rounded-lg font-bold text-sm text-center mt-2">Começar grátis</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fadeInLeft">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-bold mb-6">
              ⭐ Software de Agendamento Nº1 para Beleza
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
              Sua agenda no <br />
              <span className="text-brand">piloto automático.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Receba marcações 24h por dia, elimine as faltas com lembretes automáticos e foque no que você faz de melhor.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/login" className="bg-brand text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-brand/30 hover:scale-105">
                Começar grátis
              </Link>
              <a href="#funcionalidades" className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-brand hover:text-brand transition-all">
                Ver demonstração
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="flex -space-x-2">
                {["C", "M", "A", "J", "R"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-brand/20 border-2 border-white flex items-center justify-center text-brand font-bold text-xs">{l}</div>
                ))}
              </div>
              <span>+500 profissionais já usam o Agendify</span>
            </div>
          </div>

          <div className="relative animate-fadeInRight">
            <div className="animate-float bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-slate-400 ml-2 font-mono">agendify.app/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[["💜", "Agendamentos", "24"], ["💰", "Faturamento", "R$1.2k"], ["⭐", "Clientes", "18"]].map(([emoji, label, val], i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{emoji}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="font-bold text-slate-800 text-sm">{val}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[["Ana Clara", "Corte + Escova", "09:00", "confirmado"], ["Mariana", "Coloração", "11:00", "pendente"], ["Joana", "Manicure", "14:00", "confirmado"]].map(([nome, servico, hora, status], i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xs">{(nome as string)[0]}</div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{nome}</div>
                        <div className="text-xs text-slate-500">{servico}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-700">{hora}</div>
                      <div className={`text-xs font-bold ${status === 'confirmado' ? 'text-green-500' : 'text-amber-500'}`}>{status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-pulse-soft absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              ✅ Reserva confirmada!
            </div>
            <div className="animate-pulse-soft absolute -bottom-4 -left-4 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              ⏱ 20h/semana economizadas
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA SOCIAL PROOF */}
      <section className="bg-slate-50 py-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-medium mb-3">Usado por profissionais de todo o Brasil</p>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-bold text-sm">
            {["Salões", "Barbearias", "Nail Designers", "Lash Designers", "Maquiadoras", "Estéticas"].map(n => (
              <span key={n}>• {n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* NICHOS */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Para qual profissional é o Agendify?</h2>
          <p className="text-xl text-slate-600">Soluções específicas para cada nicho da beleza</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {nichos.map(n => (
            <Link key={n.href} href={n.href}
              className="group bg-white border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-brand hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-3">{n.emoji}</div>
              <h3 className="font-bold text-slate-800 group-hover:text-brand transition-colors mb-2">{n.label}</h3>
              <span className="text-brand text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Saiba mais →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FIM DO CAOS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">O fim do caos diário</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Esqueça as ligações para marcar horário, as mensagens no WhatsApp às 23h e os clientes que somem sem avisar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "📅", title: "Agenda Automática", desc: "Seus clientes marcam sozinhos, 24 horas por dia, 7 dias por semana." },
              { icon: "🎯", title: "Foco Total", desc: "Sem interrupções. Você foca no atendimento enquanto o Agendify cuida da agenda." },
              { icon: "🔔", title: "Zero Faltas", desc: "Lembretes automáticos pelo WhatsApp reduzem faltas em até 90%." },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg hover:border-brand/30 transition-all duration-300">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{card.title}</h3>
                <p className="text-slate-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-bold mb-4">COMO FUNCIONA</div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Sua agenda no piloto automático em 3 passos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: "1", title: "Crie sua conta", desc: "Cadastre-se grátis em menos de 2 minutos. Sem cartão de crédito." },
            { num: "2", title: "Configure seus serviços", desc: "Adicione seus serviços, horários e personalize sua página pública." },
            { num: "3", title: "Compartilhe seu link", desc: "Envie o link para seus clientes pelo Instagram ou WhatsApp e pronto!" },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-brand text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-6 shadow-lg shadow-brand/30">{step.num}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/login" className="bg-brand text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-brand/30 hover:scale-105 inline-block">
            Começar agora grátis
          </Link>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-bold mb-4">FUNCIONALIDADES</div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Tudo que você precisa para crescer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "Agendamento Online 24h", desc: "Link público personalizado. Clientes agendam a qualquer hora sem precisar te chamar." },
              { icon: "💬", title: "Integração com WhatsApp", desc: "Confirmações e lembretes automáticos enviados direto no WhatsApp do cliente." },
              { icon: "📊", title: "Dashboard Completo", desc: "Acompanhe faturamento, atendimentos e horários livres em tempo real." },
              { icon: "🎨", title: "Página Personalizada", desc: "Customize as cores e foto do seu perfil para combinar com sua marca." },
              { icon: "🗓️", title: "Agenda Semanal", desc: "Visualize toda sua semana de um jeito simples e organize seus horários." },
              { icon: "👥", title: "Gestão de Clientes", desc: "Histórico completo de cada cliente, serviços realizados e muito mais." },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-brand hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2 text-lg">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">O que dizem nossos clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: "Antes eu perdia 1 hora por dia marcando horário no Instagram. Agora minha agenda se preenche sozinha.", name: "Camila R.", role: "Cabeleireira · São Paulo" },
              { text: "Minhas clientes adoram poder marcar online. As faltas diminuíram muito desde que uso o Agendify.", name: "Fernanda M.", role: "Manicure · Rio de Janeiro" },
              { text: "Sistema simples e que funciona de verdade. Recomendo para qualquer profissional de beleza.", name: "Ana Paula S.", role: "Designer de Sobrancelhas · BH" },
            ].map((t, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-200 mb-6 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                  <div>
                    <div className="font-bold text-white text-sm">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-bold mb-4">PREÇOS</div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Escolha o plano ideal para você</h2>
          <p className="text-xl text-slate-600">Comece grátis e faça upgrade quando quiser. Sem fidelidade.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Gratuito */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:-translate-y-2 transition-all duration-300">
            <h3 className="font-bold text-slate-800 text-xl mb-1">Gratuito</h3>
            <p className="text-slate-500 text-sm mb-4">Para começar</p>
            <div className="text-4xl font-extrabold text-slate-900 mb-6">R$ 0<span className="text-lg font-normal text-slate-500">/mês</span></div>
            {[["✅", "Até 30 agendamentos/mês"], ["✅", "Até 20 clientes"], ["✅", "Até 5 serviços"], ["✅", "Link público de agendamento"], ["✅", "Integração WhatsApp"], ["❌", "Relatórios e gráficos"], ["❌", "Clientes ilimitados"], ["❌", "Suporte prioritário"]].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2 mb-3 text-sm">
                <span>{icon}</span><span className={icon === "❌" ? "text-slate-400" : "text-slate-700"}>{text}</span>
              </div>
            ))}
            <Link href="/login" className="block w-full border-2 border-brand text-brand py-3 rounded-xl font-bold text-center mt-6 hover:bg-brand hover:text-white transition-all">Começar grátis</Link>
          </div>

          {/* Profissional */}
          <div className="bg-brand rounded-2xl border-2 border-brand p-8 hover:-translate-y-2 transition-all duration-300 relative shadow-2xl shadow-brand/30">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-xs font-extrabold">MAIS POPULAR</div>
            <h3 className="font-bold text-white text-xl mb-1">Profissional</h3>
            <p className="text-purple-200 text-sm mb-4">Para profissionais em crescimento</p>
            <div className="text-4xl font-extrabold text-white mb-6">R$ 47<span className="text-lg font-normal text-purple-200">/mês</span></div>
            {[["✅", "Agendamentos ilimitados"], ["✅", "Clientes ilimitados"], ["✅", "Serviços ilimitados"], ["✅", "Link público de agendamento"], ["✅", "Integração WhatsApp"], ["✅", "Relatórios e gráficos"], ["✅", "Dashboard completo"], ["❌", "Suporte prioritário"]].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2 mb-3 text-sm">
                <span>{icon}</span><span className={icon === "❌" ? "text-purple-300" : "text-white"}>{text}</span>
              </div>
            ))}
            <Link href="/login" className="block w-full bg-white text-brand py-3 rounded-xl font-bold text-center mt-6 hover:bg-purple-50 transition-all">Assinar agora</Link>
          </div>

          {/* Premium */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:-translate-y-2 transition-all duration-300">
            <h3 className="font-bold text-slate-800 text-xl mb-1">Premium</h3>
            <p className="text-slate-500 text-sm mb-4">Para salões e equipes</p>
            <div className="text-4xl font-extrabold text-slate-900 mb-6">R$ 97<span className="text-lg font-normal text-slate-500">/mês</span></div>
            {[["✅", "Tudo do Profissional"], ["✅", "Múltiplos profissionais"], ["✅", "Suporte prioritário"], ["✅", "Personalização avançada"], ["✅", "Relatórios avançados"], ["✅", "Acesso antecipado a novidades"]].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2 mb-3 text-sm">
                <span>{icon}</span><span className="text-slate-700">{text}</span>
              </div>
            ))}
            <Link href="/login" className="block w-full border-2 border-brand text-brand py-3 rounded-xl font-bold text-center mt-6 hover:bg-brand hover:text-white transition-all">Assinar agora</Link>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-8">🔒 Pagamento seguro · Cancele quando quiser · Sem fidelidade</p>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-brand/10 text-brand px-4 py-2 rounded-full text-sm font-bold mb-4">DÚVIDAS FREQUENTES</div>
            <h2 className="text-4xl font-extrabold text-slate-900">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-800">{faq.q}</span>
                  {faqOpen === i ? <ChevronUp className="w-5 h-5 text-brand flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-6 text-slate-600 border-t border-slate-100 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-r from-purple-700 to-brand text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold mb-4">Pronto para largar o telefone?</h2>
          <p className="text-xl text-purple-100 mb-10">Junte-se a centenas de profissionais que automatizaram sua agenda com o Agendify.</p>
          <Link href="/login" className="bg-white text-brand px-10 py-4 rounded-xl font-extrabold text-lg hover:bg-purple-50 transition-all shadow-xl inline-block hover:scale-105">
            Criar minha agenda grátis
          </Link>
          <p className="text-purple-200 text-sm mt-6">✓ Grátis para sempre · ✓ Sem cartão · ✓ Configurado em 2 minutos</p>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-24 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Fale conosco</h2>
          <p className="text-xl text-slate-600">Tem alguma dúvida? Nossa equipe responde em até 24h.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
              <input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required placeholder="Seu nome" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
              <input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} required placeholder="11999990000" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="seu@email.com" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem</label>
            <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required placeholder="Como podemos ajudar?" rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand resize-none text-slate-800" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all disabled:opacity-50">
            {loading ? "Enviando..." : "Enviar mensagem 💜"}
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="w-6 h-6 text-brand" />
              <span className="font-extrabold text-xl text-white">Agendify</span>
            </div>
            <p className="text-sm leading-relaxed">O software de agendamento feito para profissionais de beleza brasileiros.</p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-brand transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Nichos</h4>
            {nichos.slice(0, 4).map(n => <Link key={n.href} href={n.href} className="block text-sm py-1 hover:text-brand transition-colors">{n.label}</Link>)}
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Produto</h4>
            {[["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"], ["Entrar", "/login"], ["Criar conta", "/login"]].map(([label, href]) => (
              <Link key={href} href={href} className="block text-sm py-1 hover:text-brand transition-colors">{label}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Suporte</h4>
            {[["Central de Ajuda", "#"], ["Contato", "#contato"], ["Política de Privacidade", "#"]].map(([label, href]) => (
              <Link key={label} href={href} className="block text-sm py-1 hover:text-brand transition-colors">{label}</Link>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-sm">
          © 2025 Agendify. Feito com 💜 para profissionais da beleza brasileiros.
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 animate-fadeInUp">
          {toast}
        </div>
      )}
    </div>
  );
}