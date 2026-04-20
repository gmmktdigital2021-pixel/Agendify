"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarCheck, ChevronDown, Menu, X, CalendarDays, Target, BellRing, 
  Star, MessageCircle, Phone, ArrowRight, CheckCircle2, ChevronUp, Zap, Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nichosDropdownOpen, setNichosDropdownOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nichosOptions = [
    { id: "cabeleireiras", title: "Cabeleireiras", link: "/nichos/cabeleireiras" },
    { id: "manicure", title: "Manicure & Nail Art", link: "/nichos/manicure" },
    { id: "sobrancelhas", title: "Design de Sobrancelhas", link: "/nichos/sobrancelhas" },
    { id: "cilios", title: "Designer de Cílios", link: "/nichos/cilios" },
    { id: "maquiadoras", title: "Maquiadoras", link: "/nichos/maquiadoras" },
    { id: "barbearias", title: "Barbearias", link: "/nichos/barbearias" },
    { id: "estetica", title: "Esteticistas & Spa", link: "/nichos/estetica" },
    { id: "depilacao", title: "Depilação", link: "/nichos/depilacao" }
  ];

  const faqs = [
    { question: "O Agendify serve para quem trabalha sozinho?", answer: "Sim! Nossa plataforma foi pensada para profissionais independentes e para salões com equipe." },
    { question: "Como funciona a mensagem de WhatsApp?", answer: "Nós enviamos lembretes automáticos um dia antes e algumas horas antes do agendamento para reduzir as faltas." },
    { question: "Preciso baixar um aplicativo?", answer: "Não, o sistema roda direto no seu navegador ou no do cliente. Rápido e prático para ambos." },
    { question: "Posso cancelar a qualquer momento?", answer: "Com certeza, não temos fidelidade. Você pode assinar e cancelar quando quiser." },
    { question: "Tem suporte caso eu tenha dúvidas?", answer: "Sim! Temos um suporte via WhatsApp dedicado para todos os nossos assinantes." },
    { question: "Como os clientes fazem o agendamento?", answer: "Você compartilhará um link exclusivo seu (ex: agendify.com/seu-nome). O cliente acessa, escolhe o serviço e o horário vago." }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("leads").insert([{ 
        name, 
        whatsapp, 
        email, 
        message 
      }]);
      
      if (error && error.message.includes("URL missing")) {
        console.warn("Supabase não configurado. Mockando sucesso...");
      }

      setSuccess(true);
      setName("");
      setWhatsapp("");
      setEmail("");
      setMessage("");

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setSuccess(true); // Exibe msm em erro p/ fins de mockup visual
      setTimeout(() => setSuccess(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <CalendarCheck className="w-8 h-8 text-brand" />
              <span className="font-bold text-2xl text-brand tracking-tight">Agendify</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#funcionalidades" className="text-slate-600 hover:text-brand font-medium transition-colors">Funcionalidades</Link>
              <div className="relative" onMouseEnter={() => setNichosDropdownOpen(true)} onMouseLeave={() => setNichosDropdownOpen(false)}>
                <button className="flex items-center gap-1 text-slate-600 hover:text-brand font-medium transition-colors py-2 focus:outline-none">
                  Nichos <ChevronDown className="w-4 h-4" />
                </button>
                {nichosDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-xl border border-slate-100 py-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    {nichosOptions.map(no => (
                      <Link key={no.id} href={no.link} className="block px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-brand text-sm transition-colors font-medium">{no.title}</Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="#precos" className="text-slate-600 hover:text-brand font-medium transition-colors">Preços</Link>
              <Link href="/login" className="text-slate-600 hover:text-brand font-medium transition-colors">Entrar</Link>
              <Link href="/login" className="bg-brand text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-brand/90 transition-all hover:-translate-y-0.5">Começar grátis</Link>
            </div>
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 absolute w-full shadow-lg">
            <div className="flex flex-col gap-4">
              <Link href="#funcionalidades" className="text-slate-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</Link>
              <div className="text-slate-700 font-medium">Nichos:</div>
              <div className="pl-4 flex flex-col gap-3">
                {nichosOptions.map(no => (
                  <Link key={no.id} href={no.link} className="text-slate-600 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>{no.title}</Link>
                ))}
              </div>
              <Link href="#precos" className="text-slate-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Preços</Link>
              <Link href="/login" className="text-slate-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
              <Link href="/login" className="bg-brand text-white px-6 py-3 rounded-full font-bold text-center mt-2" onClick={() => setMobileMenuOpen(false)}>Começar grátis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 overflow-hidden relative min-h-[90vh] flex items-center">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Esquerda */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-bold mb-6">
                ✨ A revolução no agendamento
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                Sua agenda e 100%<br className="hidden lg:block"/> <span className="text-brand">organizada.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl">
                Pare de perder tempo respondendo mensagens. Foque nos seus atendimentos enquanto o Agendify marca e lembra seus clientes automaticamente.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                <Link href="/login" className="bg-brand text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all hover:-translate-y-1 text-center">
                  Criar conta grátis
                </Link>
                <Link href="#como-funciona" className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-brand hover:text-brand transition-all text-center flex justify-center items-center">
                  Como funciona
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80" alt="Profissional 1" className="w-10 h-10 rounded-full border-2 border-slate-50 object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" alt="Profissional 2" className="w-10 h-10 rounded-full border-2 border-slate-50 object-cover" />
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80" alt="Profissional 3" className="w-10 h-10 rounded-full border-2 border-slate-50 object-cover" />
                </div>
                <p className="text-sm text-slate-600 font-medium">Usado por +500 <br/>profissionais no Brasil</p>
              </div>
            </div>

            {/* Direita */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none lg:pl-10 z-10">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80" 
                  alt="Profissional de beleza atendendo" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              </div>
              
              <div className="absolute top-20 -left-10 bg-white px-5 py-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Novo agendamento</p>
                  <p className="text-sm font-bold text-slate-800">✅ Reserva confirmada!</p>
                </div>
              </div>

              <div className="absolute bottom-10 -right-4 lg:-right-10 bg-white px-5 py-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-xl">⏱</div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Economia real</p>
                  <p className="text-sm font-bold text-slate-800">20h/semana economizadas</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAIXA SOCIAL PROOF */}
      <section className="py-10 bg-brand text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col text-center md:flex-row md:items-center justify-between gap-6">
            <p className="font-extrabold text-xl md:text-2xl">
              A plataforma favorita para:
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 font-medium text-white/80 shrink-0">
              <span>Cabeleireiras</span> • <span>Maquiadoras</span> • <span>Manicures</span> • <span>Barbearias</span> • <span>Estética</span>
            </div>
          </div>
        </div>
      </section>

      {/* NICHOS */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Perfeito para o seu negócio</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Temos ferramentas adaptadas exatamente para o que você faz todos os dias.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cabeleireiras */}
            <Link href="/nichos/cabeleireiras" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80" alt="Cabeleireiras" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Cabeleireiras</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Manicure */}
            <Link href="/nichos/manicure" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80" alt="Manicure" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Manicure</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Sobrancelhas */}
            <Link href="/nichos/sobrancelhas" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1698335107935-e2c8287c4947?w=400&q=80" alt="Sobrancelhas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Sobrancelhas</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Cílios */}
            <Link href="/nichos/cilios" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?w=400&q=80" alt="Cílios" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Cílios</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Maquiadoras */}
            <Link href="/nichos/maquiadoras" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80" alt="Maquiadoras" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Maquiadoras</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Barbearias */}
            <Link href="/nichos/barbearias" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80" alt="Barbearias" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Barbearias</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Estéticas */}
            <Link href="/nichos/estetica" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" alt="Estéticas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Estéticas</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

            {/* Depilação */}
            <Link href="/nichos/depilacao" className="group rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
               <div className="h-48 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80" alt="Depilação" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="p-6">
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Depilação</h3>
                 <p className="text-brand font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Saiba mais <ArrowRight className="w-4 h-4" /></p>
               </div>
            </Link>

          </div>
        </div>
      </section>

      {/* O FIM DO CAOS DIÁRIO */}
      <section className="py-24 bg-white relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">O fim do caos diário</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6"><CalendarDays className="w-7 h-7" /></div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Agenda Automática</h3>
              <p className="text-slate-500">Seus clientes marcam sozinhos, 24 horas por dia, 7 dias por semana.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6"><Target className="w-7 h-7" /></div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Foco Total</h3>
              <p className="text-slate-500">Sem interrupções. Você foca no atendimento enquanto o Agendify cuida da agenda.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6"><BellRing className="w-7 h-7" /></div>
              <h3 className="font-bold text-xl text-slate-800 mb-3">Zero Faltas</h3>
              <p className="text-slate-500">Lembretes automáticos pelo WhatsApp reduzem faltas em até 90%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Como o Agendify funciona</h2>
            <p className="text-lg text-slate-500">Tão fácil que parece mágica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative pb-10">
            {/* Linha conectora md */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-brand/10 rounded-full z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-brand/20 flex items-center justify-center text-4xl font-extrabold text-brand mb-6 shadow-xl">
                1
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Cadastre seus dias</h3>
              <p className="text-slate-500">Você define que serviços oferece, seu preço e de que horas até que horas vai trabalhar.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-brand/20 flex items-center justify-center text-4xl font-extrabold text-brand mb-6 shadow-xl">
                2
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Compartilhe o link</h3>
              <p className="text-slate-500">Você manda seu link na bio do Insta ou no WhatsApp. Seus clientes clicam e veem sua agenda ao vivo.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-brand/20 flex items-center justify-center text-4xl font-extrabold text-brand mb-6 shadow-xl">
                3
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Veja o dinheiro entrar</h3>
              <p className="text-slate-500">O cliente marca, você recebe notificação. Faltas zeram com o lembrete de WhatsApp que ele recebe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Tudo que o seu negócio precisa</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><Zap className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Link de Agendamento</h3>
               <p className="text-slate-500">Um site seu, moderno, para seus clientes marcarem a qualquer instante.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><Clock className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Horários Inteligentes</h3>
               <p className="text-slate-500">O sistema calcula o tempo de cada serviço e mostra apenas horários onde tudo cabe.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><BellRing className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Avisos no Whatsapp</h3>
               <p className="text-slate-500">Chega de dar bronca de falta. O sistema avisa o cliente no zap antes do horário.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><Target className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Fácil e Simples</h3>
               <p className="text-slate-500">Interface super limpa e fácil de usar. Sem botões complicados.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><CheckCircle2 className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Controle de Fluxo</h3>
               <p className="text-slate-500">Aproveite bem os buracos da sua agenda visualizando por dia, semana e mês.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300">
               <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-brand mb-6"><ArrowRight className="w-6 h-6" /></div>
               <h3 className="font-bold text-xl text-slate-800 mb-3">Redirecionamento</h3>
               <p className="text-slate-500">Se o cliente tiver dúvidas, um botão leva ele direto para falar com você!</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">O que dizem os profissionais</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Camila */}
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
                 <div className="flex text-amber-400 mb-6 gap-1">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/>
                 </div>
                 <p className="text-slate-300 italic mb-8 leading-relaxed">
                   "A melhor coisa que já fiz para meu salão. Ninguém erra o horário e minhas clientes amam a facilidade de agendar direto pelo link do meu insta."
                 </p>
                 <div className="flex items-center gap-4">
                    <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80" alt="Camila" className="w-14 h-14 rounded-full object-cover border-2 border-slate-600" />
                    <div>
                      <h4 className="font-bold text-white">Camila Silva</h4>
                      <p className="text-sm text-slate-400">Cabeleireira</p>
                    </div>
                 </div>
              </div>

              {/* Fernanda */}
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
                 <div className="flex text-amber-400 mb-6 gap-1">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/>
                 </div>
                 <p className="text-slate-300 italic mb-8 leading-relaxed">
                   "Economizo pelo menos duas horas por dia que antes gastava no chat confirmando horários. A plataforma envia os lembretes para mim!"
                 </p>
                 <div className="flex items-center gap-4">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" alt="Fernanda" className="w-14 h-14 rounded-full object-cover border-2 border-slate-600" />
                    <div>
                      <h4 className="font-bold text-white">Fernanda Ramos</h4>
                      <p className="text-sm text-slate-400">Design de Sobrancelhas</p>
                    </div>
                 </div>
              </div>

              {/* Ana Paula */}
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
                 <div className="flex text-amber-400 mb-6 gap-1">
                    <Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/>
                 </div>
                 <p className="text-slate-300 italic mb-8 leading-relaxed">
                   "A interface limpa é vida! Minhas clientes de mais idade conseguem marcar de boa, sem se enrolar. Simplesmente amando."
                 </p>
                 <div className="flex items-center gap-4">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80" alt="Ana Paula" className="w-14 h-14 rounded-full object-cover border-2 border-slate-600" />
                    <div>
                      <h4 className="font-bold text-white">Ana Paula Mendes</h4>
                      <p className="text-sm text-slate-400">Manicure e Pedicure</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="precos" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Planos simples e transparentes</h2>
             <p className="text-lg text-slate-500">Escale seu negócio com ferramentas que cabem no seu bolso.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
             {/* Básico */}
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
               <h3 className="font-bold text-2xl text-slate-800 mb-2">Iniciante</h3>
               <p className="text-slate-500 text-sm mb-6">Comece sua digitalização</p>
               <div className="mb-6">
                 <span className="text-4xl font-extrabold text-slate-900">R$0</span><span className="text-slate-500">/mês</span>
               </div>
               <Link href="/login" className="block w-full py-3 rounded-full border-2 border-slate-200 text-center font-bold text-slate-700 hover:border-brand hover:text-brand transition-colors mb-8">
                 Testar Grátis
               </Link>
               <ul className="flex flex-col gap-4 text-slate-600">
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Agendamentos:</span> Até 20/mês</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Clientes:</span> Até 20</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Serviços:</span> Até 5</li>
               </ul>
             </div>

             {/* Profissional (Destaque) */}
             <div className="bg-white p-8 rounded-3xl border-2 border-brand shadow-2xl relative transform lg:-translate-y-4">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                 Mais Popular
               </div>
               <h3 className="font-bold text-2xl text-slate-800 mb-2">Profissional</h3>
               <p className="text-slate-500 text-sm mb-6">Agendamentos ilimitados e sem limites</p>
               <div className="mb-6">
                 <span className="text-4xl font-extrabold text-brand">R$47</span><span className="text-slate-500">/mês</span>
               </div>
               <Link href="/login" className="block w-full py-3 rounded-full bg-brand text-white text-center font-bold shadow-lg shadow-brand/20 hover:bg-brand/90 hover:scale-105 transition-all mb-8">
                 Assinar Profissional
               </Link>
               <ul className="flex flex-col gap-4 text-slate-700">
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-brand shrink-0" /> <span className="font-medium text-slate-800">Agendamentos:</span> Até 40/mês</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-brand shrink-0" /> <span className="font-medium text-slate-800">Clientes:</span> Até 40</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-brand shrink-0" /> <span className="font-medium text-slate-800">Serviços:</span> Até 10</li>
               </ul>
             </div>

             {/* Premium */}
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
               <h3 className="font-bold text-2xl text-slate-800 mb-2">Premium</h3>
               <p className="text-slate-500 text-sm mb-6">Para times e salões completos</p>
               <div className="mb-6">
                 <span className="text-4xl font-extrabold text-slate-900">R$97</span><span className="text-slate-500">/mês</span>
               </div>
               <Link href="/login" className="block w-full py-3 rounded-full border-2 border-slate-200 text-center font-bold text-slate-700 hover:border-brand hover:text-brand transition-colors mb-8">
                 Assinar Premium
               </Link>
               <ul className="flex flex-col gap-4 text-slate-600">
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Agendamentos:</span> Ilimitado</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Clientes:</span> Ilimitado</li>
                 <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> <span className="font-medium text-slate-800">Serviços:</span> Ilimitado</li>
               </ul>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Perguntas Frequentes</h2>
          </div>

          <div className="flex flex-col gap-4">
             {faqs.map((faq, index) => (
               <div key={index} className="border border-slate-200 rounded-3xl overflow-hidden hover:border-brand/30 transition-colors bg-slate-50">
                 <button 
                   className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-slate-800 focus:outline-none"
                   onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                 >
                   {faq.question}
                   <ChevronDown className={`w-5 h-5 text-brand transition-transform duration-300 ${faqOpen === index ? "rotate-180" : ""}`} />
                 </button>
                 {faqOpen === index && (
                   <div className="px-6 pb-5 text-slate-600 animate-in fade-in fill-mode-both">
                     {faq.answer}
                   </div>
                 )}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* FOOTER FORMULÁRIO DE CONTATO */}
      <section id="contato" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between">
               <div>
                  <h3 className="text-3xl font-extrabold mb-4">Tem alguma dúvida?</h3>
                  <p className="text-slate-400 mb-8 leading-relaxed">
                    Estamos aqui para ajudar o seu negócio a dar o próximo passo digital. Nos mande uma mensagem e responderemos em até 24 horas.
                  </p>
                  
                  <div className="flex flex-col gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-brand"><Phone className="w-5 h-5" /></div>
                        <span className="font-medium">11 99999-9999</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-brand"><MessageCircle className="w-5 h-5" /></div>
                        <span className="font-medium">suporte@agendify.com.br</span>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="md:w-7/12 p-10">
               <h4 className="text-2xl font-bold text-slate-800 mb-6">Mande uma mensagem</h4>
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Nome completo</label>
                   <input type="text" required value={name} onChange={(e)=>setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" placeholder="Seu nome..." />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
                     <input type="tel" required value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" placeholder="(00) 00000-0000" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                     <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all" placeholder="voce@email.com" />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Como podemos te ajudar?</label>
                   <textarea rows={4} required value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none" placeholder="Escreva sua dúvida aqui..."></textarea>
                 </div>

                 <button type="submit" disabled={loading} className="w-full bg-brand text-white py-4 rounded-xl font-bold text-lg hover:bg-brand/90 transition-colors mt-2">
                   {loading ? "Enviando..." : "Enviar mensagem"}
                 </button>
                 
                 {success && (
                   <p className="text-green-600 text-sm font-bold mt-2 text-center bg-green-50 p-2 rounded-lg">
                     Mensagem enviada com sucesso! Logo entraremos em contato.
                   </p>
                 )}
               </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL DE CONVERSÃO EXTREMA */}
      <section className="py-24 bg-gradient-to-r from-purple-700 to-brand relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">O caos acabou. Sua agenda em outro nível.</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Mais de 500 profissionais testaram e transformaram sua rotina em uma rotina inteligente. Crie sua conta grátis agora!</p>
          <Link href="/login" className="bg-white text-brand px-10 py-5 rounded-full font-extrabold text-lg md:text-xl shadow-2xl hover:scale-105 transition-transform inline-flex items-center gap-3">
            Começar Gratuitamente <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2 outline-none">
                <CalendarCheck className="w-8 h-8 text-brand" />
                <span className="font-bold text-2xl text-white tracking-tight">Agendify</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">A plataforma de agendamento online inteligente que trabalha por você 24 horas por dia.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-colors"><MessageCircle className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white transition-colors"><Phone className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Nichos</h4>
              <ul className="flex flex-col gap-3">
                {nichosOptions.slice(0, 5).map(no => <li key={no.id}><Link href={no.link} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{no.title}</Link></li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Produto</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="#funcionalidades" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</Link></li>
                <li><Link href="#precos" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Entrar / Cadastrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Suporte</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="#contato" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Fale Conosco</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Central de Ajuda</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Política de Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm font-medium">
            © 2025 Agendify. Feito com 💜 para profissionais da beleza brasileiros.
          </div>
        </div>
      </footer>
    </div>
  );
}






