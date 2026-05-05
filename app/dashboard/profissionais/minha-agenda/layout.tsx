"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, Calendar, Users, LogOut, Menu, X, Clock, User, Lock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function ProfissionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [professionalName, setProfessionalName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setUserEmail(session.user.email || "");
      setUserInitials(session.user.email?.substring(0, 2).toUpperCase() || "PR");

      const { data: pro } = await supabase
        .from("professionals")
        .select("name, salon_id")
        .eq("user_id", session.user.id)
        .single();

      if (pro) {
        setProfessionalName(pro.name);
        const { data: salon } = await supabase
          .from("salons")
          .select("nome")
          .eq("id", pro.salon_id)
          .single();
        if (salon) setSalonName(salon.nome);
      }
    };
    init();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Minha Agenda", href: "/dashboard/profissionais/minha-agenda", icon: Calendar },
    { name: "Clientes", href: "/dashboard/profissionais/minha-agenda/clientes", icon: Users },
    { name: "Meus Horários", href: "/dashboard/profissionais/minha-agenda/horarios", icon: Clock },
    { name: "Meu Perfil", href: "/dashboard/profissionais/minha-agenda/perfil", icon: User },
    { name: "Trocar Senha", href: "/dashboard/profissionais/minha-agenda/senha", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside
        style={{ width: sidebarExpanded ? "240px" : "64px", transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 bg-brand text-white group hover:shadow-[4px_0_20px_rgba(0,0,0,0.12)]"
      >
        <div className="flex flex-col h-full overflow-hidden w-full">
          {/* TOPO */}
          <div className="pt-4 pb-4 flex items-center justify-center shrink-0 border-b border-white/5 w-full">
            <Link href="/dashboard/profissionais/minha-agenda" className="flex items-center w-[36px] group-hover:w-[216px] transition-[width] duration-250 ease-in-out">
              <div className="w-[36px] h-[36px] bg-white rounded-lg flex items-center justify-center shrink-0 mx-auto group-hover:mx-0 group-hover:ml-2 shadow-sm">
                <CalendarCheck className="w-[28px] h-[28px] text-brand" />
              </div>
              <div style={{ transition: "opacity 0.15s ease, max-width 0.25s ease" }}
                className="flex flex-col ml-0 opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] group-hover:ml-3 whitespace-nowrap">
                <span className="font-bold text-xl tracking-wide">Agendify</span>
                <span className="text-xs text-white/60">{salonName}</span>
              </div>
            </Link>
          </div>

          {/* Info do profissional */}
          <div style={{ transition: "opacity 0.15s ease, max-height 0.25s ease" }}
            className="opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-20 px-4 py-3 border-b border-white/10">
            <p className="text-white/60 text-xs">Logado como profissional</p>
            <p className="text-white font-semibold text-sm truncate">{professionalName}</p>
          </div>

          {/* NAVEGAÇÃO */}
          <nav className="flex-1 py-4 space-y-2 overflow-x-hidden overflow-y-auto w-full">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard/profissionais/minha-agenda"
                ? pathname === "/dashboard/profissionais/minha-agenda"
                : pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center relative py-0 h-[44px] w-[44px] group-hover:w-[216px] mx-auto rounded-[10px] group-hover:px-3 transition-colors duration-250 group/navitem ${isActive ? "bg-white/[0.18]" : "hover:bg-white/[0.10]"}`}
                >
                  <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                    <item.icon className={`w-[20px] h-[20px] ${isActive ? "text-white" : "text-white/70"}`} />
                  </div>
                  <div style={{ transition: "opacity 0.15s ease, max-width 0.25s ease" }}
                    className="opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] whitespace-nowrap">
                    <span className={`font-medium text-[14px] ml-2 ${isActive ? "text-white font-bold" : "text-white/70"}`}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* RODAPÉ */}
          <div className="py-4 shrink-0 border-t border-white/5 w-full">
            <div className="flex items-center relative w-[36px] group-hover:w-[216px] group-hover:px-3 mx-auto h-[36px] transition-[width,padding] duration-250">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0">
                <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
              </div>
              <div style={{ transition: "opacity 0.15s ease, max-width 0.25s ease" }}
                className="flex items-center justify-between opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[200px] whitespace-nowrap ml-0 group-hover:ml-3 w-full">
                <p className="text-[13px] font-medium text-white max-w-[100px] truncate">{userEmail}</p>
                <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-brand text-white flex flex-col shadow-2xl">
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <span className="font-bold text-xl">Agendify</span>
              <button onClick={() => setIsMobileOpen(false)}>
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white/60 text-xs">Profissional</p>
              <p className="text-white font-semibold">{professionalName}</p>
              <p className="text-white/50 text-xs">{salonName}</p>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
              {navItems.map((item) => {
                const isActive = item.href === "/dashboard/profissionais/minha-agenda"
                  ? pathname === "/dashboard/profissionais/minha-agenda"
                  : pathname?.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-white/15 text-white font-bold" : "text-white/70 hover:bg-white/10"}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white">
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main
        className={`flex-1 bg-[#F3F4F6] min-h-screen ${sidebarExpanded ? "md:ml-[240px]" : "md:ml-[64px]"}`}
        style={{ transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div className="md:hidden flex items-center h-16 px-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 mr-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <CalendarCheck className="w-5 h-5 text-brand mr-2" />
          <span className="font-bold text-slate-800 text-lg border-l border-slate-200 pl-3">Agendify</span>
        </div>
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
