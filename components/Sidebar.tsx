"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Heart, 
  Folder, 
  CalendarDays, 
  Users, 
  Scissors, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: Folder, href: "/dashboard" },
    { name: "Agenda", icon: CalendarDays, href: "/dashboard/agenda" },
    { name: "Clientes", icon: Users, href: "/dashboard/clientes" },
    { name: "Servicos", icon: Scissors, href: "/dashboard/servicos" },
    { name: "Configurações", icon: Settings, href: "/dashboard/configuracoes" },
  ];

  return (
    <aside className="w-64 bg-brand h-screen fixed top-0 left-0 flex flex-col text-white shadow-xl z-20">
      <div className="flex items-center gap-3 p-6 mb-2">
        <Heart className="w-8 h-8 fill-white/80 text-white/80" />
        <h1 className="text-xl font-bold tracking-wide">Bella Beauty</h1>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-white/20 font-medium shadow-sm backdrop-blur-sm" 
                  : "hover:bg-white/10 text-white/90"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/80"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
