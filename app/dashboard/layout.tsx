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
  
  // Realtime Pendentes
  const [pendingCount, setPendingCount] = useState(0);
  const [salonId, setSalonId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 z-20 shrink-0 shadow-lg bg-brand text-white">
        <div className="flex flex-col h-full">
          {/* TOPO */}
          <div className="p-6">
            <Link href="/dashboard" className="flex items-center gap-2 mb-2 hover:opacity-90 transition-opacity">
              <CalendarCheck className="w-6 h-6 text-white" />
              <span className="font-bold text-xl tracking-wide">Agendify</span>
            </Link>
            <div className="text-sm text-white/80 font-medium truncate" title={salonName}>
              {salonName}
            </div>
          </div>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" 
                ? pathname === "/dashboard" 
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/70"}`} />
                    {item.name === "Config." ? "Configurações" : item.name}
                  </div>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                     <span className="bg-indigo-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-inner animate-in zoom-in duration-300">
                        {item.badge}
                     </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RODAPÉ DESKTOP */}
          <div className="p-4 mt-auto">
            <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                  {userInitials}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-white/70 truncate max-w-[100px]">
                    {userEmail}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white shrink-0"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex items-center justify-around h-[70px] pb-safe px-2 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${
                isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-brand/10' : ''} relative`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium tracking-tight ${isActive ? "font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* MAIN CONTENT */}
      {/* pb-[90px] no mobile garante que o conteúdo não seja escondido pelo bottom nav de 70px + safe area */}
      <main className="flex-1 bg-[#F3F4F6] min-h-screen relative w-full overflow-hidden pb-[90px] md:pb-0">
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <CalendarCheck className="w-5 h-5 text-brand mr-2" />
          <span className="font-bold text-slate-800 tracking-wide">Agendify</span>
        </div>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
