"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarCheck, ChevronDown, Menu, X, CalendarDays, Target, BellRing, Star, MessageCircle, Phone
} from "lucide-react";

export default function NichoPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nichosDropdownOpen, setNichosDropdownOpen] = useState(false);

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
              <Link href="/#funcionalidades" className="text-slate-600 hover:text-brand font-medium transition-colors">Funcionalidades</Link>
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
              <Link href="/#precos" className="text-slate-600 hover:text-brand font-medium transition-colors">Preços</Link>
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
              <Link href="/#funcionalidades" className="text-slate-700 font-medium">Funcionalidades</Link>
              <div className="text-slate-700 font-medium">Nichos:</div>
              <div className="pl-4 flex flex-col gap-3">
                {nichosOptions.map(no => (
                  <Link key={no.id} href={no.link} className="text-slate-600 text-sm font-medium">{no.title}</Link>
                ))}
              </div>
              <Link href="/#precos" className="text-slate-700 font-medium">Preços</Link>
              <Link href="/login" className="text-slate-700 font-medium">Entrar</Link>
              <Link href="/login" className="bg-brand text-white px-6 py-3 rounded-xl font-bold text-center mt-2">Começar grátis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO NICHO */}
      <section className="pt-32 pb-20 overflow-hidden relative min-h-[90vh] flex items-center">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-bold mb-6">
                Software para Maquiadoras
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                O look perfeito, <br className="hidden lg:block"/><span className="text-brand">sem falhar marcações.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl">
                Agende sessões, eventos e produções. Nunca mais perca um booking importante porque estava focada num rosto.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                <Link href="/login" className="bg-brand text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all hover:-translate-y-1 text-center">
                  Começar grátis
                </Link>
                <Link href="#funcionalidadesNicho" className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-brand hover:text-brand transition-all text-center flex justify-center items-center">
                  Saber mais
                </Link>
              </div>
            </div>
            {/* MOCKUP */}
            <div className="relative w-full max-w-md mx-auto lg:max-w-none">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 lg:ml-10">
                <div className="bg-slate-100 px-4 py-3 flex gap-2 items-center border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="p-6 bg-[#F3F4F6] flex gap-4 h-[400px]">
                  <div className="w-16 bg-white rounded-xl shadow-sm flex flex-col gap-4 py-4 items-center">
                    <div className="w-8 h-8 bg-brand/20 rounded-full mb-4"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded"></div><div className="w-6 h-6 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1 h-20 bg-white rounded-xl shadow-sm p-4"><div className="w-20 h-3 bg-slate-100 rounded mb-2"></div><div className="w-16 h-6 bg-brand/20 rounded-lg"></div></div>
                      <div className="flex-1 h-20 bg-white rounded-xl shadow-sm p-4"><div className="w-20 h-3 bg-slate-100 rounded mb-2"></div><div className="w-16 h-6 bg-green-100 rounded-lg"></div></div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl shadow-sm p-4 pt-6 relative overflow-hidden">
                       <div className="w-full border-b border-slate-100 absolute top-10 left-0"></div>
                       <div className="w-full border-b border-slate-100 absolute top-16 left-0"></div>
                       <div className="absolute top-8 left-8 right-8 bg-brand/10 border border-brand/30 rounded-lg p-2 h-10"><div className="w-1/3 h-2 bg-brand/50 rounded"></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 bottom-12 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3 shadow-blue-500/10">
                 <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-lg">⏱</div>
                 <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Economia real</p><p className="text-sm font-bold text-slate-800">20h/semana economizadas</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O FIM DO CAOS DIÁRIO */}
      <section className="py-24 bg-white relative">
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

      {/* FERRAMENTAS ESPECÍFICAS */}
      <section id="funcionalidadesNicho" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-6">Feito para você</div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Ferramentas para Maquiadoras</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-brand/10 hover:shadow-xl transition-all duration-300 group">
              <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand transition-colors">Gestão de eventos</h3>
              <p className="text-slate-500 text-sm">noivas, formaturas, ensaios</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-brand/10 hover:shadow-xl transition-all duration-300 group">
              <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand transition-colors">Zero furos na agenda</h3>
              <p className="text-slate-500 text-sm">confirmações automáticas</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-brand/10 hover:shadow-xl transition-all duration-300 group">
              <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand transition-colors">Portfólio de looks</h3>
              <p className="text-slate-500 text-sm">seu trabalho encanta novos clientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTO */}
      <section className="py-24 bg-slate-900 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 text-yellow-400 mb-8">
            <Star className="w-6 h-6 fill-current"/><Star className="w-6 h-6 fill-current"/><Star className="w-6 h-6 fill-current"/><Star className="w-6 h-6 fill-current"/><Star className="w-6 h-6 fill-current"/>
          </div>
          <p className="text-slate-300 text-2xl md:text-3xl font-medium mb-12 italic leading-relaxed">
            "Trabalho em eventos e nunca mais tive problema com agenda. O Agendify gere tudo."
          </p>
          <div className="inline-flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-white font-bold text-2xl">B</div>
            <div>
              <h4 className="font-bold text-white text-lg">Beatriz</h4>
              <p className="text-slate-400 font-medium">Maquiadora</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-r from-purple-700 to-brand relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Transforme a gestão do seu negócio hoje</h2>
          <Link href="/login" className="bg-white text-brand px-10 py-5 rounded-full font-extrabold text-lg md:text-xl shadow-2xl hover:scale-105 transition-transform inline-block mt-8">
            Começar grátis
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
                <li><Link href="/#funcionalidades" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</Link></li>
                <li><Link href="/#precos" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Suporte</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Central de Ajuda</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Contato</Link></li>
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
