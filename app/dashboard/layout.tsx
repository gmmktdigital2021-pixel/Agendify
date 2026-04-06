"use client";

import React from "react";
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
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Mocked Data
  const salonName = "Bella Beauty Salão";
  const userEmail = "camila@bellabeauty.com";
  const userInitials = "CR";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Erro no signOut (mock)", e);
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/dashboard/agenda", icon: Calendar },
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
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="w-6 h-6 text-white" />
              <span className="font-bold text-xl tracking-wide">Agendify</span>
            </div>
            <div className="text-sm text-white/80 font-medium">
              {salonName}
            </div>
          </div>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" 
                ? pathname === "/dashboard" 
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/70"}`} />
                  {item.name === "Config." ? "Configurações" : item.name}
                </Link>
              );
            })}
          </nav>

          {/* RODAPÉ DESKTOP */}
          <div className="p-4 mt-auto">
            <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
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
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-brand" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-brand/10' : ''}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
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
        {/* Adiciona Topbar minimalista no mobile apenas pro Logo caso deseje, se não apenas mantém padding */}
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
