"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarCheck, 
  ChevronDown, 
  Menu, 
  X, 
  Scissors, 
  Sparkles, 
  Eye, 
  Brush, 
  Heart,
  Droplet,
  Instagram,
  Phone,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nichosDropdownOpen, setNichosDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nichos = [
    { id: "cabeleireiras", icon: <Scissors className="w-5 h-5 text-brand" />, title: "Cabeleireiras", desc: "Gestão completa de cortes, coloração e química.", link: "/nichos/cabeleireiras" },
    { id: "manicure", icon: <Sparkles className="w-5 h-5 text-brand" />, title: "Manicure & Nail Art", desc: "Organize esmalteria e pacotes de unhas.", link: "/nichos/manicure" },
    { id: "sobrancelhas", icon: <Eye className="w-5 h-5 text-brand" />, title: "Design de Sobrancelhas", desc: "Controle retornos e manutenção de clientes.", link: "/nichos/sobrancelhas" },
    { id: "cilios", icon: <Eye className="w-5 h-5 text-brand" />, title: "Designer de Cílios", desc: "Agende volumes e manutenções com facilidade.", link: "/nichos/cilios" },
    { id: "maquiadoras", icon: <Brush className="w-5 h-5 text-brand" />, title: "Maquiadoras", desc: "Gestão de produções para festas e noivas.", link: "/nichos/maquiadoras" },
    { id: "barbearias", icon: <Scissors className="w-5 h-5 text-brand" />, title: "Barbearias", desc: "Agendamento rápido para cortes e barbas.", link: "/nichos/barbearias" },
    { id: "estetica", icon: <Heart className="w-5 h-5 text-brand" />, title: "Esteticistas & Spa", desc: "Controle de pacotes e sessões corporais.", link: "/nichos/estetica" },
    { id: "depilacao", icon: <Droplet className="w-5 h-5 text-brand" />, title: "Depilação", desc: "Acompanhe e fidelize a recorrência das clientes.", link: "/nichos/depilacao" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <CalendarCheck className="w-8 h-8 text-brand" />
              <span className="font-bold text-2xl text-brand tracking-tight">Agendify</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#funcionalidades" className="text-slate-600 hover:text-brand font-medium transition-colors">Funcionalidades</Link>
              
              {/* Dropdown Nichos */}
              <div 
                className="relative"
                onMouseEnter={() => setNichosDropdownOpen(true)}
                onMouseLeave={() => setNichosDropdownOpen(false)}
              >
                <button className="flex items-center gap-1 text-slate-600 hover:text-brand font-medium transition-colors py-2 focus:outline-none">
                  Nichos <ChevronDown className="w-4 h-4" />
                </button>
                {nichosDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-xl border border-slate-100 py-2 pt-2 animate-in fade-in slide-in-from-top-2">
                    {nichos.map(n => (
                      <Link key={n.id} href={n.link} className="block px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-brand text-sm transition-colors font-medium">
                        {n.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="#precos" className="text-slate-600 hover:text-brand font-medium transition-colors">Preços</Link>
              <Link href="/login" className="text-slate-600 hover:text-brand font-medium transition-colors">Entrar</Link>
              <Link href="/login" className="bg-brand text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-brand/90 transition-all hover:-translate-y-0.5">
                Começar grátis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 absolute w-full shadow-lg">
            <div className="flex flex-col gap-4">
              <Link href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium">Funcionalidades</Link>
              <div className="text-slate-700 font-medium">Nichos:</div>
              <div className="pl-4 flex flex-col gap-3">
                {nichos.map(n => (
                  <Link key={n.id} href={n.link} onClick={() => setMobileMenuOpen(false)} className="text-slate-600 text-sm font-medium">
                    {n.title}
                  </Link>
                ))}
              </div>
              <Link href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium">Preços</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 font-medium">Entrar</Link>
              <Link href="/login" className="bg-brand text-white px-6 py-3 rounded-xl font-bold text-center mt-2">
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO */}
      <section className="pt-32 pb-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 mb-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Col - Context */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-bold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                Software de Agendamento Nº1 para Beleza
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
                Sua agenda no <br className="hidden lg:block"/>
                <span className="text-brand">piloto automático.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl">
                Receba marcações 24h por dia, elimine as faltas com lembretes automáticos e foque no que você faz de melhor.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
                <Link href="/login" className="bg-brand text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all hover:-translate-y-1 text-center">
                  Começar grátis
                </Link>
                <Link href="#funcionalidades" className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-brand hover:text-brand transition-all text-center flex justify-center items-center">
                  Ver demonstração
                </Link>
              </div>
              
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">👩</div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">👩🏼</div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">👨🏾</div>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  <span className="text-yellow-500">⭐</span> +500 profissionais já usam o Agendify
                </p>
              </div>
            </div>

            {/* Right Col - Mockup */}
            <div className="relative w-full max-w-md mx-auto lg:max-w-none">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-transform hover:scale-[1.02] duration-500 relative z-10 lg:ml-10">
                <div className="bg-slate-100 px-4 py-3 flex gap-2 items-center border-b border-slate-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="mx-auto bg-white rounded flex-1 max-w-[200px] h-4"></div>
                </div>
                <div className="p-6 bg-[#F3F4F6] flex gap-4 h-[400px]">
                  <div className="w-16 bg-white rounded-xl shadow-sm flex flex-col gap-4 py-4 items-center hide-on-mobile">
                    <div className="w-8 h-8 bg-brand/20 rounded-full mb-4"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1 h-20 bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between">
                        <div className="w-20 h-3 bg-slate-100 rounded"></div>
                        <div className="w-16 h-6 bg-green-100 rounded-lg"></div>
                      </div>
                      <div className="flex-1 h-20 bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between">
                        <div className="w-20 h-3 bg-slate-100 rounded"></div>
                        <div className="w-16 h-6 bg-brand/20 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl shadow-sm p-4 pt-6 relative overflow-hidden">
                       <div className="w-full border-b border-slate-100 absolute top-10 left-0"></div>
                       <div className="w-full border-b border-slate-100 absolute top-16 left-0"></div>
                       <div className="w-full border-b border-slate-100 absolute top-22 left-0"></div>
                       <div className="absolute top-8 left-8 right-8 bg-brand/10 border border-brand/30 rounded-lg p-2 h-10 flex items-center">
                          <div className="w-1/3 h-2 bg-brand/50 rounded"></div>
                       </div>
                       <div className="absolute top-20 left-8 right-8 bg-green-500/10 border border-green-500/30 rounded-lg p-2 h-8 flex items-center">
                          <div className="w-1/4 h-2 bg-green-500/50 rounded"></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-6 lg:left-0 top-20 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3 animate-bounce shadow-brand/10" style={{animationDuration: '3s'}}>
                 <div className="text-xl">✅</div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nova reserva</p>
                   <p className="text-sm font-bold text-slate-800">Reserva confirmada!</p>
                 </div>
              </div>

              <div className="absolute -right-8 bottom-12 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3 animate-bounce shadow-blue-500/10" style={{animationDuration: '3.5s', animationDelay: '1s'}}>
                 <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-lg">⏱</div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Economia real</p>
                   <p className="text-sm font-bold text-slate-800">20h/semana economizadas</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF / LOGOS */}
      <section className="bg-slate-100/60 py-10 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Usado por profissionais de todo o Brasil</p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4 text-slate-500 font-bold text-lg md:text-xl md:gap-x-10">
            <span>Salões</span> <span className="text-slate-300 hidden md:inline">•</span>
            <span>Barbearias</span> <span className="text-slate-300 hidden md:inline">•</span>
            <span>Nail Designers</span> <span className="text-slate-300 hidden lg:inline">•</span>
            <span>Lash Designers</span> <span className="text-slate-300 hidden md:inline">•</span>
            <span>Maquiadoras</span> <span className="text-slate-300 hidden lg:inline">•</span>
            <span>Estéticas</span>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO NICHOS */}
      <section id="funcionalidades" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Para qual profissional é o Agendify?</h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">Criado para se adaptar perfeitamente a diversas especialidades do mercado de beleza e bem-estar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nichos.map(nicho => (
              <Link key={nicho.id} href={nicho.link} className="group outline-none">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                    {React.cloneElement(nicho.icon, { className: "w-6 h-6 transition-colors duration-300 text-brand group-hover:text-white" })}
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 mb-2">{nicho.title}</h3>
                  <p className="text-slate-500 mb-6 flex-1 text-sm leading-relaxed">{nicho.desc}</p>
                  <div className="flex items-center gap-2 text-brand font-bold text-sm group-hover:gap-3 transition-all mt-auto duration-300">
                    Saiba mais <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-brand relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Pronto para lotar sua agenda?</h2>
          <p className="text-brand-100 text-lg md:text-xl mb-10 text-white/80 max-w-2xl mx-auto">Junte-se a centenas de profissionais que já modernizaram a gestão de seus negócios e ganharam mais tempo livre.</p>
          <Link href="/login" className="bg-white text-brand px-10 py-5 rounded-full font-extrabold text-lg md:text-xl shadow-2xl hover:scale-105 transition-transform inline-block">
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-slate-900 pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Col 1 */}
            <div className="flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2 outline-none">
                <CalendarCheck className="w-8 h-8 text-brand" />
                <span className="font-bold text-2xl text-white tracking-tight">Agendify</span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                A plataforma de agendamento online inteligente que trabalha por você 24 horas por dia.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold text-white mb-6">Nichos</h4>
              <ul className="flex flex-col gap-3">
                {nichos.slice(0, 5).map(n => (
                  <li key={n.id}><Link href={n.link} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{n.title}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold text-white mb-6">Produto</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="#funcionalidades" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Funcionalidades</Link></li>
                <li><Link href="#precos" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Preços</Link></li>
                <li><Link href="#funcionalidades" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Demonstração</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Entrar</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-bold text-white mb-6">Suporte</h4>
              <ul className="flex flex-col gap-3">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Central de Ajuda</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Contato</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Política de Privacidade</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Termos de Uso</Link></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
              © 2025 Agendify. Feito com 💜 para profissionais da beleza brasileiros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
