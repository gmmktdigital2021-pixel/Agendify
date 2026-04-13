"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  CalendarCheck, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { supabase, db } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Mocked Auth Initials until proper profile mapping
  const [salonName, setSalonName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [salonFotoPerfil, setSalonFotoPerfil] = useState("");
  
  // Realtime Pendentes
  const [pendingCount, setPendingCount] = useState(0);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Mobile Sidebar
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchPending = useCallback(async (sid: string) => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      
      const { count } = await db.appointments.select('*', { count: 'exact', head: true })
        .eq('salon_id', sid)
        .eq('data', todayStr)
        .eq('status', 'pendente');
        
      setPendingCount(count || 0);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      setUserEmail(session.user.email || "usuário");
      setUserInitials(session.user.email?.substring(0,2).toUpperCase() || "US");

      let { data: salon } = await supabase.from('salons').select('*').eq('user_id', session.user.id).single();
      
      if (!salon) {
        const { data: newSalon } = await supabase.from('salons').insert([{
          user_id: session.user.id,
          nome: 'Meu Salão',
          horario_inicio: '08:00',
          horario_fim: '19:00',
          dias_ativos: ['seg','ter','qua','qui','sex'],
          mensagem_padrao: 'Oi {nome}, seu horário está confirmado para {dia} às {hora}'
        }]).select().single();
        salon = newSalon;
      }

      if (salon) {
        setSalonName(salon.nome);
        setSalonId(salon.id);
        if (salon.foto_perfil) setSalonFotoPerfil(salon.foto_perfil);
        fetchPending(salon.id);
      }
    }
    initUser();
  }, [router, fetchPending]);

  // Realtime Subscribe Notifications
  useEffect(() => {
    if (!salonId) return;
    const channel = supabase
      .channel('realtime_layout_notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments',
        filter: `salon_id=eq.${salonId}`
      }, () => {
         fetchPending(salonId);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [salonId, fetchPending]);


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: Calendar, badge: pendingCount },
    { name: "Clientes", href: "/dashboard/clientes", icon: Users },
    { name: "Serviços", href: "/dashboard/servicos", icon: Scissors },
    { name: "Config.", href: "/dashboard/configuracoes", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside 
        style={{ transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 shadow-none bg-brand text-white w-[64px] hover:w-[240px] group hover:shadow-[4px_0_20px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col h-full overflow-hidden w-full">
          {/* TOPO */}
          <div className="pt-4 pb-4 flex items-center justify-center shrink-0 border-b border-white/5 w-full">
            <Link href="/dashboard" className="flex items-center w-[36px] group-hover:w-[216px] transition-[width] duration-250 ease-in-out group/logo">
              <div className="w-[36px] h-[36px] bg-white rounded-lg flex items-center justify-center shrink-0 mx-auto group-hover:mx-0 group-hover:ml-2 shadow-sm">
                <CalendarCheck className="w-[28px] h-[28px] text-brand" />
              </div>
              <div 
                style={{ transition: 'opacity 0.15s ease, max-width 0.25s ease' }}
                className="flex flex-col ml-0 opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] group-hover:ml-3 whitespace-nowrap">
                <span className="font-bold text-xl tracking-wide">Agendify</span>
              </div>
            </Link>
          </div>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="flex-1 py-4 space-y-2 overflow-x-hidden overflow-y-auto w-full custom-scrollbar">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" 
                ? pathname === "/dashboard" 
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center relative py-0 h-[44px] w-[44px] group-hover:w-[216px] mx-auto rounded-[10px] group-hover:px-3 transition-colors duration-250 group/navitem ${
                    isActive
                      ? "bg-white/[0.18]"
                      : "hover:bg-white/[0.10]"
                  }`}
                >
                  <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0 relative">
                    <item.icon className={`w-[20px] h-[20px] transition-colors ${isActive ? "text-white" : "text-white/70 group-hover/navitem:text-white"}`} />
                    
                    {/* Badge Collapsed (Small Dot) */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-[16px] h-[16px] bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                         {item.badge > 9 ? '+9' : item.badge}
                      </span>
                    )}
                  </div>
                  
                  <div 
                    style={{ transition: 'opacity 0.15s ease, max-width 0.25s ease' }}
                    className="flex items-center justify-between opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] whitespace-nowrap">
                    <span className={`font-medium text-[14px] ml-2 ${isActive ? "text-white font-bold" : "text-white/70 group-hover/navitem:text-white"}`}>
                      {item.name === "Config." ? "Configurações" : item.name}
                    </span>
                    
                    {/* Badge Expanded */}
                    {item.badge !== undefined && item.badge > 0 && (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-inner ml-2">
                          {item.badge}
                       </span>
                    )}
                  </div>

                  {/* Tooltip Collapsed State */}
                  <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-[#111827] text-white text-[12px] font-medium px-[10px] py-[4px] rounded-[6px] opacity-0 pointer-events-none transition-opacity duration-200 ease-in-out group-hover/navitem:opacity-100 group-hover/navitem:delay-[400ms] group-hover:hidden z-[9999] whitespace-nowrap shadow-md after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-left-1 after:border-[4px] after:border-r-[#111827] after:border-y-transparent after:border-l-transparent">
                    {item.name === "Config." ? "Configurações" : item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* RODAPÉ DESKTOP */}
          <div className="py-4 shrink-0 border-t border-white/5 w-full">
            <div className="flex items-center relative w-[36px] group-hover:w-[216px] group-hover:px-3 mx-auto h-[36px] transition-[width,padding] duration-250 ease-in-out group/footer cursor-pointer">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0">
                {salonFotoPerfil ? (
                  <img src={salonFotoPerfil} alt="Perfil" className="w-[36px] h-[36px] rounded-full object-cover bg-white/20" />
                ) : (
                  <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                )}
              </div>
              <div 
                style={{ transition: 'opacity 0.15s ease, max-width 0.25s ease' }}
                className="flex items-center justify-between opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] whitespace-nowrap ml-0 group-hover:ml-3 w-full">
                <div className="flex flex-col">
                   <p className="text-[13px] font-medium text-white max-w-[100px] truncate">{userEmail}</p>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors" title="Sair">
                   <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY SIDEBAR */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-brand text-white flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                <CalendarCheck className="w-6 h-6" />
                <span className="font-bold text-xl tracking-wide">Agendify</span>
              </Link>
              <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6 text-white/70 hover:text-white" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = item.href === "/dashboard" 
                  ? pathname === "/dashboard" 
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isActive ? "bg-white/15 text-white font-bold" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.name === "Config." ? "Configurações" : item.name}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                       </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 mt-auto border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {salonFotoPerfil ? (
                    <img src={salonFotoPerfil} alt="Perfil" className="w-10 h-10 rounded-full object-cover shrink-0 bg-white/20 border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                      {userInitials}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium text-white/90 truncate max-w-[120px]">{userEmail}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[#F3F4F6] min-h-screen relative w-full overflow-hidden md:ml-[64px]">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center h-16 px-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 mr-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <CalendarCheck className="w-5 h-5 text-brand mr-2" />
          <span className="font-bold text-slate-800 tracking-wide text-lg border-l border-slate-200 pl-3">Agendify</span>
        </div>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
