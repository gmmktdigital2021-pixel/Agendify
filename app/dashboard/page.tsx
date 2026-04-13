"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Toast } from "@/components/Toast";
import { 
  CalendarDays, 
  DollarSign, 
  Clock, 
  Search, 
  MessageCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { supabase, db } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

interface AppointmentWithRelations {
  id: string;
  data: string;
  hora_inicio: string;
  status: AppointmentStatus;
  clients: { nome: string; telefone: string } | null;
  services: { nome: string; preco: number; duracao_minutos: number } | null;
}

type FilterOption = 'hoje' | 'ontem' | 'prox7d' | 'prox15d' | 'prox30d' | '7d' | '15d' | '30d' | '90d' | 'custom';

export default function DashboardPage() {
  const [appointmentsQuery, setAppointmentsQuery] = useState<AppointmentWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Filtro
  const [filter, setFilter] = useState<FilterOption>('prox7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");

  const todayDateObj = new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const todaySQL = `${year}-${month}-${day}`;
  
  const getPeriodRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    let startSql = todaySQL;
    let endSql = todaySQL;

    const formatSQL = (d: Date) => d.toISOString().split('T')[0];

    if (filter === 'ontem') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      startSql = formatSQL(start);
      endSql = formatSQL(end);
    } else if (filter === 'prox7d') {
      end.setDate(end.getDate() + 7);
      endSql = formatSQL(end);
    } else if (filter === 'prox15d') {
      end.setDate(end.getDate() + 15);
      endSql = formatSQL(end);
    } else if (filter === 'prox30d') {
      end.setDate(end.getDate() + 30);
      endSql = formatSQL(end);
    } else if (filter === '7d') {
      start.setDate(start.getDate() - 6);
      startSql = formatSQL(start);
    } else if (filter === '15d') {
      start.setDate(start.getDate() - 14);
      startSql = formatSQL(start);
    } else if (filter === '30d') {
      start.setDate(start.getDate() - 29);
      startSql = formatSQL(start);
    } else if (filter === '90d') {
      start.setDate(start.getDate() - 89);
      startSql = formatSQL(start);
    } else if (filter === 'custom' && appliedCustomStart && appliedCustomEnd) {
      startSql = appliedCustomStart;
      endSql = appliedCustomEnd;
    }

    return { startSql, endSql };
  }, [filter, appliedCustomStart, appliedCustomEnd, todaySQL]);

  const fetchAppointments = useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const { startSql, endSql } = getPeriodRange();
      
      // Expand boundries to always include "Today" natively so we can calculate "Horários Livres de Hoje" without a second query
      const queryStart = startSql < todaySQL ? startSql : todaySQL;
      const queryEnd = endSql > todaySQL ? endSql : todaySQL;

      const { data, error } = await db.appointments.select(`
        id, data, hora_inicio, status,
        clients ( nome, telefone ),
        services ( nome, preco, duracao_minutos )
      `)
      .eq('salon_id', sid)
      .gte('data', queryStart)
      .lte('data', queryEnd)
      .order('data', { ascending: true })
      .order('hora_inicio', { ascending: true });

      if (error) throw error;
      setAppointmentsQuery((data as unknown) as AppointmentWithRelations[]);
    } catch (err) {
      console.error("Falha ao buscar agenda:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getPeriodRange, todaySQL]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoading(false);
      
      const { data: salon } = await supabase.from('salons').select('id').eq('user_id', session.user.id).single();
      if (salon) {
        setSalonId(salon.id);
        await fetchAppointments(salon.id);
      } else {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [fetchAppointments]); // Re-reruns globally only when filter boundaries mutate

  useEffect(() => {
    if (!salonId) return;
    const channel = supabase
      .channel('realtime_dashboard_appointments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments',
        filter: `salon_id=eq.${salonId}`
      }, () => {
        fetchAppointments(salonId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [salonId, fetchAppointments]);

  // --- DATAS LOCAIS ---
  const { startSql, endSql } = getPeriodRange();

  const periodAppointments = useMemo(() => 
    appointmentsQuery.filter(a => a.data >= startSql && a.data <= endSql),
  [appointmentsQuery, startSql, endSql]);

  const todayAppointments = useMemo(() => 
    appointmentsQuery.filter(a => a.data === todaySQL),
  [appointmentsQuery, todaySQL]);

  // --- MÉTTRICAS ---
  const faturamentoPrevisto = periodAppointments
    .filter(a => a.status === "confirmado" || a.status === "pendente")
    .reduce((acc, curr) => acc + (curr.services?.preco || 0), 0);

  const faturamentoRealizado = periodAppointments
    .filter(a => a.status === "concluido")
    .reduce((acc, curr) => acc + (curr.services?.preco || 0), 0);

  const atendimentosFilter = periodAppointments.filter(a => a.status === "confirmado" || a.status === "pendente").length;
  
  const confirmadosPeriodo = periodAppointments.filter(a => a.status === "confirmado").length;
  const concluidosPeriodo = periodAppointments.filter(a => a.status === "concluido").length;
  const canceladosPeriodo = periodAppointments.filter(a => a.status === "cancelado").length;
  const pendentesPeriodo = periodAppointments.filter(a => a.status === "pendente").length;

  const livresPendentesHoje = todayAppointments.filter(a => a.status === "pendente").length;
  const livresCanceladosHoje = todayAppointments.filter(a => a.status === "cancelado").length;

  // --- DADOS PARA GRÁFICOS ---
  const dadosGraficoFaturamento = useMemo(() => {
    const validos = periodAppointments.filter(a => a.status === "concluido" || a.status === "confirmado" || a.status === "pendente");
    const grouped = validos.reduce((acc, curr) => {
      const parts = curr.data.split('-');
      const dateLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : curr.data;
      if (!acc[dateLabel]) acc[dateLabel] = { date: dateLabel, previsto: 0, realizado: 0 };
      
      const val = curr.services?.preco || 0;
      if (curr.status === "concluido") acc[dateLabel].realizado += val;
      if (curr.status === "confirmado" || curr.status === "pendente") acc[dateLabel].previsto += val;
      
      return acc;
    }, {} as Record<string, { date: string; previsto: number; realizado: number }>);
    return Object.values(grouped);
  }, [periodAppointments]);

  const dadosGraficoStatus = useMemo(() => {
    const counts = { confirmado: 0, concluido: 0, cancelado: 0, pendente: 0 };
    periodAppointments.forEach(a => {
      if (counts[a.status as keyof typeof counts] !== undefined) counts[a.status as keyof typeof counts]++;
    });
    return [
      { name: 'Confirmado', value: counts.confirmado, color: '#22C55E' },
      { name: 'Concluído', value: counts.concluido, color: '#374151' },
      { name: 'Cancelado', value: counts.cancelado, color: '#EF4444' },
      { name: 'Pendente', value: counts.pendente, color: '#F59E0B' }
    ].filter(s => s.value > 0);
  }, [periodAppointments]);

  const totalAgendamentosGrafico = useMemo(() => {
    return dadosGraficoStatus.reduce((acc, curr) => acc + curr.value, 0);
  }, [dadosGraficoStatus]);

  const dadosGraficoServicos = useMemo(() => {
    const counts: Record<string, number> = {};
    periodAppointments.forEach(a => {
      const sName = a.services?.nome || "Outros";
      counts[sName] = (counts[sName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [periodAppointments]);

  const CustomTooltipFaturamento = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-sm min-w-[160px]">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
             <div key={i} className="flex justify-between items-center gap-4 mb-1">
               <span className="text-slate-500">{entry.name}</span>
               <span className="font-bold" style={{ color: entry.color }}>
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
               </span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipStatus = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-slate-800 mb-1">{payload[0].name}</p>
          <p className="text-slate-600 font-medium">{payload[0].value} agendamentos</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipServicos = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-slate-800 mb-1">{label}</p>
          <p className="text-brand font-bold">{payload[0].value} agendamentos</p>
        </div>
      );
    }
    return null;
  };

  // Search local filters
  const filteredAppointmentsList = useMemo(() => {
    let list = periodAppointments.filter(a => a.status !== "cancelado"); 
    if (!search.trim()) return periodAppointments; 
    return periodAppointments.filter(a => 
      a.clients?.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, periodAppointments]);

  const showToast = (msg: string) => setToastMsg(msg);

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus, toastMessage: string) => {
    // Optimistic Update para refletir instantaneamente
    setAppointmentsQuery(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));

    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      showToast(toastMessage);
    } catch {
      showToast("Falha ao atualizar.");
      if (salonId) fetchAppointments(salonId); // Rollback locally on error
    }
  };

  const openWhatsApp = (phone: string, nome: string, dataHora: string, actionMsg: string) => {
    if (!phone) return showToast("Cliente não possui WhatsApp cadastrado.");
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá ${nome}, ${actionMsg} (${dataHora}).`);
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const formatHora = (timeSql: string) => timeSql.substring(0, 5); 
  const formatDateList = (dateSql: string) => {
    const [y, m, d] = dateSql.split('-');
    return `${d}/${m}`;
  }

  const getFilterLabel = () => {
    const map: any = {
      'hoje': 'Hoje',
      'prox7d': 'Próximos 7 dias',
      'prox15d': 'Próximos 15 dias',
      'prox30d': 'Próximos 30 dias',
      'ontem': 'Ontem',
      '7d': 'Últimos 7 dias',
      '15d': 'Últimos 15 dias',
      '30d': 'Últimos 30 dias',
      '90d': 'Últimos 90 dias'
    };
    if (filter === 'custom') return `${formatDateList(startSql)} a ${formatDateList(endSql)}`;
    return map[filter];
  }

  const handleApplyCustom = () => {
    if(!customStart || !customEnd) return showToast("Selecione as datas.");
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
    setFilter('custom');
    setIsDropdownOpen(false);
  }

  const handleSelectFilter = (val: FilterOption) => {
    if(val !== 'custom') {
      setFilter(val);
      setIsDropdownOpen(false);
    } else {
      setFilter('custom');
    }
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Visão <span className="font-medium text-slate-600">Geral</span>
        </h2>
        
        <div className="relative z-30">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-[10px] text-sm font-medium shadow-sm hover:border-brand transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-brand" />
            <span className="text-slate-700">{getFilterLabel()}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-slate-200 shadow-xl rounded-[10px] p-2 flex flex-col gap-1">
              {[ 
                {k:'hoje', l:'Hoje'}, 
                {k:'prox7d', l:'Próximos 7 dias'}, 
                {k:'prox15d', l:'Próximos 15 dias'}, 
                {k:'prox30d', l:'Próximos 30 dias'}, 
                {k:'ontem', l:'Ontem'}, 
                {k:'7d', l:'Últimos 7 dias'}, 
                {k:'15d', l:'Últimos 15 dias'}, 
                {k:'30d', l:'Últimos 30 dias'}, 
                {k:'90d', l:'Últimos 90 dias'}
              ].map(opt => (
                <button 
                  key={opt.k}
                  onClick={() => handleSelectFilter(opt.k as FilterOption)}
                  className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === opt.k ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
              
              <div className="border-t border-slate-100 my-1"></div>
              
              <button 
                onClick={() => setFilter('custom')}
                className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'custom' ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Personalizado
              </button>
              
              {filter === 'custom' && (
                <div className="px-3 pt-2 pb-2 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">De</label>
                      <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded text-slate-800 font-medium bg-slate-50" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Até</label>
                      <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded text-slate-800 font-medium bg-slate-50" />
                    </div>
                  </div>
                  <Button onClick={handleApplyCustom} className="w-full py-1.5 text-xs">Aplicar</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-3 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-blue-500/5 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110" />
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-500 font-medium mb-0.5 whitespace-nowrap">Atendimentos</p>
            {isLoading ? 
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse"></div> : 
              <p className="text-lg md:text-xl font-bold text-slate-800">{atendimentosFilter}</p>
            }
          </div>
        </Card>
        
        <Card title="Agendamentos confirmados e pendentes" className="p-3 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-brand/5 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110" />
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
            <CalendarDays className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-500 font-medium mb-0.5 whitespace-nowrap">Previsto</p>
            {isLoading ? 
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div> : 
              <p className="text-[15px] md:text-xl font-bold text-brand whitespace-nowrap tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoPrevisto)}
              </p>
            }
          </div>
        </Card>

        <Card title="Serviços já concluídos" className="p-3 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-12 h-12 bg-green-500/5 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110" />
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-500 font-medium mb-0.5 whitespace-nowrap">Realizado</p>
            {isLoading ? 
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div> : 
              <p className="text-[15px] md:text-xl font-bold text-green-600 whitespace-nowrap tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoRealizado)}
              </p>
            }
          </div>
        </Card>
        
        <Card className="p-3 md:p-5 relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 shrink-0" />
              <div className="text-[10px] md:text-sm font-bold text-slate-700 whitespace-nowrap shrink-0 overflow-hidden">Horários Livres (Hoje)</div>
            </div>
            {isLoading ? (
               <div className="h-4 w-16 bg-slate-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-[10px] md:text-xs text-slate-500 leading-tight">
                <span className="text-amber-500 font-bold">{livresPendentesHoje}</span> pend.<br className="md:hidden" />
                <span className="hidden md:inline"> • </span>
                <span className="text-red-400 font-bold md:ml-1 mt-0.5 md:mt-0">{livresCanceladosHoje}</span> canc.
              </p>
            )}
        </Card>
      </div>

      <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 py-3 px-4 rounded-xl flex flex-wrap items-center justify-center gap-y-2 gap-x-4 shadow-sm text-center">
         <div>
           <span className="text-slate-700">Período: </span> 
           <span className="text-green-600 font-bold">{confirmadosPeriodo} confirmados</span> • 
           <span className="text-amber-500 font-bold">{pendentesPeriodo} pendentes</span> • 
           <span className="text-slate-600 font-bold">{concluidosPeriodo} concluídos</span> • 
           <span className="text-red-400 font-bold">{canceladosPeriodo} cancelados</span>
         </div>
         <div className="hidden lg:block w-px h-4 bg-slate-300"></div>
         <div>
           <span className="text-brand font-bold lg:mr-3 mr-2">Previsto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoPrevisto)}</span>
           <span className="text-green-600 font-bold">Realizado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoRealizado)}</span>
         </div>
      </div>

      {/* Agenda Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {filter === 'hoje' ? 'Agenda do Dia' : filter.startsWith('prox') ? 'Próximos Agendamentos' : 'Agendamentos do Período'}
        </h3>
        
        <Card className="p-4 mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar clientes por nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-colors"
            />
          </div>
        </Card>

        {isLoading ? (
           <Card className="p-6 space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-12 h-6 bg-slate-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
           </Card>
        ) : (
          <Card className="divide-y divide-slate-100/80 overflow-hidden">
            {filteredAppointmentsList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhum agendamento encontrado para este período.
              </div>
            ) : (
              filteredAppointmentsList.map((app) => {
                const isCanceled = app.status === "cancelado";
                const displayDate = filter === 'hoje' ? '' : `${formatDateList(app.data)} • `;
                const displayTimeStr = `${displayDate}${formatHora(app.hora_inicio)}`;

                return (
                  <div key={app.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4 ${isCanceled ? 'opacity-50 grayscale bg-red-50/10' : ''}`}>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className={`font-bold w-20 text-[15px] sm:text-lg shrink-0 ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {displayTimeStr}
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className={`font-bold text-left ${isCanceled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {app.clients?.nome || "Cliente Desconhecido"}
                        </span>
                        
                        <div className="flex items-center gap-2 flex-wrap mt-[2px]">
                          <span className={`text-sm ${isCanceled ? 'text-slate-400' : 'text-slate-500'}`}>
                            {app.services?.nome || "Serviço"}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className={`text-sm font-bold ${app.status === 'concluido' ? 'text-green-600' : isCanceled ? 'text-slate-400 line-through' : 'text-brand'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.services?.preco || 0)}
                          </span>
                          <Badge status={app.status} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 ml-[5.5rem] md:ml-0 shrink-0">
                      
                      {app.status === "pendente" && (
                        <>
                          <button onClick={() => {
                            const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.services?.preco || 0);
                            handleStatusChange(app.id, "confirmado", `📅 Agendamento confirmado! ${val} adicionado ao previsto.`);
                          }} className="p-1.5 sm:px-3 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">Confirmar</span></button>
                          <button onClick={() => openWhatsApp(app.clients?.telefone||"", app.clients?.nome||"", formatHora(app.hora_inicio), "solicitação recebida")} className="p-1.5 sm:px-3 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg"><MessageCircle className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">WhatsApp</span></button>
                          <button onClick={() => handleStatusChange(app.id, "cancelado", "Cancelado")} className="p-1.5 sm:px-3 border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50"><span className="hidden sm:inline">Cancelar</span><span className="sm:hidden">✖</span></button>
                        </>
                      )}

                      {app.status === "confirmado" && (
                        <>
                          <button onClick={() => {
                            const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.services?.preco || 0);
                            handleStatusChange(app.id, "concluido", `✅ Serviço concluído! ${val} adicionado ao faturamento realizado.`);
                          }} className="p-1.5 sm:px-3 border border-green-500 text-green-600 text-xs font-bold rounded-lg hover:bg-green-50"><CheckCircle2 className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">Concluir</span></button>
                          <button onClick={() => openWhatsApp(app.clients?.telefone||"", app.clients?.nome||"", formatHora(app.hora_inicio), "horário confirmado")} className="p-1.5 sm:px-3 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg"><MessageCircle className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">WhatsApp</span></button>
                          <button onClick={() => handleStatusChange(app.id, "cancelado", "Cancelado")} className="p-1.5 sm:px-3 border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50"><span className="hidden sm:inline">Cancelar</span><span className="sm:hidden">✖</span></button>
                        </>
                      )}

                      {app.status === "concluido" && (
                        <button onClick={() => openWhatsApp(app.clients?.telefone||"", app.clients?.nome||"", formatHora(app.hora_inicio), "obrigado pela visita")} className="p-1.5 sm:px-3 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg hover:bg-[#25D366]/20 transition-colors"><MessageCircle className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">WhatsApp</span></button>
                      )}

                      {app.status === "cancelado" && (
                        <button onClick={() => showToast("Reagendar")} className="p-1.5 sm:px-3 border border-slate-300 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100"><RefreshCw className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">Reagendar</span></button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        )}
      </div>

      {/* Analytics Section */}
      <div className="mt-12 pt-8 border-t border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Análises</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico 1 - Faturamento por Dia */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
            <h4 className="text-[16px] font-semibold text-slate-900">Faturamento por Dia</h4>
            <p className="text-[13px] text-slate-500 mb-6">Baseado no período selecionado</p>
            
            <div className="h-[250px] w-full">
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Carregando dados...</span>
                </div>
              ) : dadosGraficoFaturamento.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-sm">Nenhum dado no período</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoFaturamento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val: number) => `R$${val}`} />
                    <RechartsTooltip content={<CustomTooltipFaturamento />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="previsto" name="Previsto" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="realizado" name="Realizado" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 2 - Atendimentos por Status */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
            <h4 className="text-[16px] font-semibold text-slate-900">Atendimentos por Status</h4>
            <p className="text-[13px] text-slate-500 mb-6">Baseado no período selecionado</p>
            
            <div className="h-[300px] w-full flex flex-col relative">
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Carregando dados...</span>
                </div>
              ) : dadosGraficoStatus.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-sm">Nenhum dado no período</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosGraficoStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {dadosGraficoStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltipStatus />} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Total Center Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-bold text-slate-800">{totalAgendamentosGrafico}</span>
                       <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</span>
                    </div>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-2">
                    {dadosGraficoStatus.map((status, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <span className="text-[11px] font-medium text-slate-600">{status.name} ({status.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gráfico 3 - Serviços Mais Agendados */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
            <h4 className="text-[16px] font-semibold text-slate-900">Serviços Mais Agendados</h4>
            <p className="text-[13px] text-slate-500 mb-6">Baseado no período selecionado</p>
            
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Carregando dados...</span>
                </div>
              ) : dadosGraficoServicos.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-sm">Nenhum dado no período</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoServicos} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                    <RechartsTooltip content={<CustomTooltipServicos />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                      {dadosGraficoServicos.map((entry, index) => {
                         const opacity = Math.max(0.3, 1 - (index * 0.15));
                         return <Cell key={`cell-bar-${index}`} fill={`rgba(124, 58, 237, ${opacity})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
