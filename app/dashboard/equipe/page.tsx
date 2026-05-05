"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Users, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  invite_accepted: boolean;
  stats: {
    todayAppointments: number;
    monthAppointments: number;
    pendingAppointments: number;
  };
}

export default function EquipePage() {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [totalMonth, setTotalMonth] = useState(0);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: pros } = await supabase
        .from("professionals")
        .select("*")
        .eq("salon_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!pros) { setLoading(false); return; }

      // Busca stats de cada profissional
      const prosWithStats = await Promise.all(pros.map(async (pro) => {
        const { count: todayCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("professional_id", pro.id)
          .eq("date", today);

        const { count: monthCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("professional_id", pro.id)
          .gte("created_at", startOfMonth.toISOString());

        const { count: pendingCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("professional_id", pro.id)
          .eq("status", "pendente");

        return {
          ...pro,
          stats: {
            todayAppointments: todayCount || 0,
            monthAppointments: monthCount || 0,
            pendingAppointments: pendingCount || 0,
          },
        };
      }));

      setProfessionals(prosWithStats);
      setTotalToday(prosWithStats.reduce((acc, p) => acc + p.stats.todayAppointments, 0));
      setTotalMonth(prosWithStats.reduce((acc, p) => acc + p.stats.monthAppointments, 0));
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minha Equipe</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral de todos os profissionais</p>
        </div>

        {/* Cards de métricas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-purple-600" />
              </div>
              <p className="text-gray-500 text-sm">Total de profissionais</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{professionals.length}</p>
            <p className="text-xs text-gray-400 mt-1">{professionals.filter(p => p.invite_accepted).length} ativos</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-green-600" />
              </div>
              <p className="text-gray-500 text-sm">Agendamentos hoje</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalToday}</p>
            <p className="text-xs text-gray-400 mt-1">Total da equipe</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              <p className="text-gray-500 text-sm">Agendamentos no mês</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalMonth}</p>
            <p className="text-xs text-gray-400 mt-1">Total da equipe</p>
          </div>
        </div>

        {/* Lista de profissionais com stats */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum profissional cadastrado ainda.</p>
            <Link href="/dashboard/profissionais" className="inline-flex items-center gap-2 mt-4 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition">
              Convidar profissional
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {professionals.map(pro => (
              <div key={pro.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg">
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{pro.name}</p>
                      <p className="text-sm text-gray-500">{pro.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pro.invite_accepted ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={14} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                        <Clock size={14} /> Convite pendente
                      </span>
                    )}
                    <Link
                      href={`/dashboard/profissionais/agenda/${pro.id}`}
                      className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
                    >
                      <Calendar size={14} /> Ver agenda
                    </Link>
                  </div>
                </div>

                {/* Stats do profissional */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{pro.stats.todayAppointments}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Hoje</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{pro.stats.monthAppointments}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Este mês</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{pro.stats.pendingAppointments}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pendentes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
