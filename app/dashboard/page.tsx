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
  ChevronDown,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  BarChart2
} from "lucide-react";
import { supabase, db } from "@/lib/supabase";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

type AppointmentWithService = {
  id: string;
  status: AppointmentStatus;
  data: string;
  hora_inicio: string;
  services: { nome: string; preco: number; duracao_minutos: number } | null;
  clients?: { nome: string; telefone: string } | null;
}

// Usar alias para manter compatibilidade com restos do código
type AppointmentWithRelations = AppointmentWithService;

type ChartDataPoint = { label: string; valor: number; previsto: number };

function processChartData(
  appointments: AppointmentWithRelations[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    const hours: Record<string, ChartDataPoint> = {};
    for (let h = 8; h <= 19; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      hours[label] = { label, valor: 0, previsto: 0 };
    }
    appointments.forEach(a => {
      const hour = a.hora_inicio?.substring(0, 5) || '08:00';
      const roundedHour = `${hour.substring(0, 2)}:00`;
      if (hours[roundedHour]) {
        if (a.status === 'concluido') hours[roundedHour].valor += Number(a.services?.preco || 0);
        if (['confirmado', 'pendente'].includes(a.status)) hours[roundedHour].previsto += Number(a.services?.preco || 0);
      }
    });
    return Object.values(hours);
  }

  if (diffDays <= 30) {
    const days: Record<string, ChartDataPoint> = {};
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days[key] = { label, valor: 0, previsto: 0 };
    }
    appointments.forEach(a => {
      const key = a.data;
      if (days[key]) {
        if (a.status === 'concluido') days[key].valor += Number(a.services?.preco || 0);
        if (['confirmado', 'pendente'].includes(a.status)) days[key].previsto += Number(a.services?.preco || 0);
      }
    });
    return Object.values(days);
  }

  const weeks: Record<string, ChartDataPoint> = {};
  appointments.forEach(a => {
    const d = new Date(a.data + 'T00:00:00');
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    const label = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    if (!weeks[key]) weeks[key] = { label, valor: 0, previsto: 0 };
    if (a.status === 'concluido') weeks[key].valor += Number(a.services?.preco || 0);
    if (['confirmado', 'pendente'].includes(a.status)) weeks[key].previsto += Number(a.services?.preco || 0);
  });
  return Object.values(weeks).sort((a, b) => a.label.localeCompare(b.label));
}
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
  const [isMounted, setIsMounted] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [isChartAnimating, setIsChartAnimating] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
    const saved = localStorage.getItem('agendify-chart-type') as 'area' | 'line' | 'bar' | null;
    if (saved) setChartType(saved);
  }, []);

  const handleSetChartType = (type: 'area' | 'line' | 'bar') => {
    setIsChartAnimating(true);
    setTimeout(() => {
      setChartType(type);
      setIsChartAnimating(false);
      localStorage.setItem('agendify-chart-type', type);
    }, 150);
  };

  // Filtro
  const [filter, setFilter] = useState<FilterOption>('prox7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isListViewAnimating, setIsListViewAnimating] = useState(false);

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
  const diffDays = useMemo(() => {
    return Math.ceil((new Date(`${endSql}T00:00:00`).getTime() - new Date(`${startSql}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24));
  }, [startSql, endSql]);

  const dadosGraficoFaturamento = useMemo(() => {
    return processChartData(periodAppointments, new Date(`${startSql}T00:00:00`), new Date(`${endSql}T00:00:00`));
  }, [periodAppointments, startSql, endSql]);

  const chartSubtitle = diffDays <= 1
    ? 'Por hora do dia'
    : diffDays <= 30
    ? 'Por dia'
    : 'Por semana';

  const chartTitle = diffDays <= 1 
    ? 'Faturamento por Hora' 
    : diffDays <= 30 
    ? 'Faturamento por Dia' 
    : 'Faturamento por Semana';

  const dadosGraficoStatus = useMemo(() => {
    const counts = { confirmado: 0, concluido: 0, cancelado: 0, pendente: 0 };
    periodAppointments.forEach(a => {
      if (counts[a.status as keyof typeof counts] !== undefined) counts[a.status as keyof typeof counts]++;
    });
    return [
      { name: 'Confirmados', value: counts.confirmado, color: '#22C55E' },
      { name: 'Pendentes', value: counts.pendente, color: '#F59E0B' },
      { name: 'Concluídos', value: counts.concluido, color: '#3B82F6' },
      { name: 'Cancelados', value: counts.cancelado, color: '#EF4444' }
    ].filter(s => s.value > 0);
  }, [periodAppointments]);

  const totalAgendamentosGrafico = useMemo(() => {
    return dadosGraficoStatus.reduce((acc, curr) => acc + curr.value, 0);
  }, [dadosGraficoStatus]);

  const dadosGraficoServicos = useMemo(() => {
    const counts: Record<string, { count: number, totalRS: number }> = {};
    periodAppointments.forEach(a => {
      if(a.status === 'cancelado') return;
      const sName = a.services?.nome || "Outros";
      if (!counts[sName]) counts[sName] = { count: 0, totalRS: 0 };
      counts[sName].count += 1;
      counts[sName].totalRS += (a.services?.preco || 0);
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, count: data.count, totalRS: data.totalRS }))
      .sort((a, b) => b.count - a.count);
  }, [periodAppointments]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: entry.color, margin: '2px 0' }}>
            {entry.name}: R$ {Number(entry.value).toFixed(2).replace('.', ',')}
          </p>
        ))}
      </div>
    );
  };

  useEffect(() => {
    setStatusFilter('todos');
  }, [filter, startSql, endSql]);

  const handleChipClick = (id: string) => {
    if (id === statusFilter) return;
    setIsListViewAnimating(true);
    setTimeout(() => {
      setStatusFilter(id);
      setIsListViewAnimating(false);
    }, 150);
  };

  const chipsConfig = useMemo(() => [
    { id: 'todos', label: 'Todos', 
      match: (a: AppointmentWithRelations) => a.status !== 'cancelado', 
      count: periodAppointments.filter(a => a.status !== 'cancelado').length,
      inactiveStyle: 'border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5',
      activeStyle: 'bg-[#7C3AED] border-[#7C3AED] text-white',
      badgeInactive: 'bg-[#7C3AED]/10 text-[#7C3AED]'
    },
    { id: 'confirmados', label: 'Confirmados', 
      match: (a: AppointmentWithRelations) => a.status === 'confirmado', 
      count: confirmadosPeriodo,
      inactiveStyle: 'border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/5',
      activeStyle: 'bg-[#22C55E] border-[#22C55E] text-white',
      badgeInactive: 'bg-[#22C55E]/10 text-[#22C55E]'
    },
    { id: 'pendentes', label: 'Pendentes', 
      match: (a: AppointmentWithRelations) => a.status === 'pendente', 
      count: pendentesPeriodo,
      inactiveStyle: 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/5',
      activeStyle: 'bg-[#F59E0B] border-[#F59E0B] text-white',
      badgeInactive: 'bg-[#F59E0B]/10 text-[#F59E0B]'
    },
    { id: 'concluidos', label: 'Concluídos', 
      match: (a: AppointmentWithRelations) => a.status === 'concluido', 
      count: concluidosPeriodo,
      inactiveStyle: 'border-[#374151] text-[#374151] hover:bg-[#374151]/5',
      activeStyle: 'bg-[#374151] border-[#374151] text-white',
      badgeInactive: 'bg-[#374151]/10 text-[#374151]'
    },
    { id: 'cancelados', label: 'Cancelados', 
      match: (a: AppointmentWithRelations) => a.status === 'cancelado', 
      count: canceladosPeriodo,
      inactiveStyle: 'border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/5',
      activeStyle: 'bg-[#EF4444] border-[#EF4444] text-white',
      badgeInactive: 'bg-[#EF4444]/10 text-[#EF4444]'
    },
    { id: 'previsto', label: 'Previsto', 
      match: (a: AppointmentWithRelations) => ['confirmado', 'pendente'].includes(a.status), 
      count: atendimentosFilter,
      inactiveStyle: 'border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5',
      activeStyle: 'bg-[#7C3AED] border-[#7C3AED] text-white',
      badgeInactive: 'bg-[#7C3AED]/10 text-[#7C3AED]'
    },
    { id: 'realizado', label: 'Realizado', 
      match: (a: AppointmentWithRelations) => a.status === 'concluido', 
      count: concluidosPeriodo,
      inactiveStyle: 'border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/5',
      activeStyle: 'bg-[#22C55E] border-[#22C55E] text-white',
      badgeInactive: 'bg-[#22C55E]/10 text-[#22C55E]'
    },
  ], [periodAppointments, confirmadosPeriodo, pendentesPeriodo, concluidosPeriodo, canceladosPeriodo, atendimentosFilter]);

  // Search & Status local filters
  const filteredAppointmentsList = useMemo(() => {
    let list = periodAppointments;
    
    const activeChip = chipsConfig.find(c => c.id === statusFilter);
    if (activeChip) list = list.filter(activeChip.match);
    else list = list.filter(a => a.status !== "cancelado"); // Default
    
    if (search.trim()) {
      return list.filter(a => a.clients?.nome.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [search, periodAppointments, statusFilter, chipsConfig]);

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
        
        <Card className="p-4 mb-6 flex flex-col sm:flex-row gap-4">
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

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          {chipsConfig.map(chip => {
            const isActive = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-[6px] border rounded-[20px] text-[13px] font-medium transition-colors duration-150 ${isActive ? chip.activeStyle : `bg-white ${chip.inactiveStyle}`}`}
              >
                <span>{chip.label}</span>
                <span className={`px-[6px] py-[2px] rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20' : chip.badgeInactive}`}>
                  {chip.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className={`transition-opacity duration-150 ${isListViewAnimating ? 'opacity-0' : 'opacity-100'}`}>
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
            <Card className="divide-y divide-slate-100/80 overflow-hidden min-h-[200px]">
              {filteredAppointmentsList.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/30">
                  <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium mb-5">
                    Nenhum agendamento {chipsConfig.find(c => c.id === statusFilter)?.label.toLowerCase()} no período.
                  </p>
                  {statusFilter !== 'todos' && (
                    <button onClick={() => handleChipClick('todos')} className="px-5 py-2 bg-white border border-slate-200 shadow-sm hover:border-slate-300 text-slate-700 rounded-[10px] text-sm font-semibold transition-colors">
                      Ver todos
                    </button>
                  )}
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
      </div>

      {/* Analytics Section */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-6">
           <h3 className="text-xl font-bold text-slate-800">Análises</h3>
           <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Gráfico 1 - Faturamento por Dia */}
          <div className="md:col-span-2 bg-white rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   {chartType === 'area' && <TrendingUp className="w-5 h-5 text-[#7C3AED]" />}
                   {chartType === 'line' && <Activity className="w-5 h-5 text-[#7C3AED]" />}
                   {chartType === 'bar' && <BarChart2 className="w-5 h-5 text-[#7C3AED]" />}
                   <h4 className="text-[15px] font-bold text-[#111827]">{chartTitle}</h4>
                </div>
                <p className="text-[12px] text-[#9CA3AF] ml-7">{chartSubtitle}</p>
              </div>
              <div className="flex bg-[#F3F4F6] p-1 rounded-[10px] gap-0.5">
                <button onClick={() => handleSetChartType('area')} title="Área"
                  className={`p-1.5 rounded-[8px] transition-all duration-150 flex items-center justify-center cursor-pointer ${chartType === 'area' ? 'bg-white shadow-sm scale-95' : 'text-[#9CA3AF] hover:text-slate-600'}`}>
                  <TrendingUp className={`w-4 h-4 ${chartType === 'area' ? 'text-[#7C3AED]' : ''}`} />
                </button>
                <button onClick={() => handleSetChartType('line')} title="Linha"
                  className={`p-1.5 rounded-[8px] transition-all duration-150 flex items-center justify-center cursor-pointer ${chartType === 'line' ? 'bg-white shadow-sm scale-95' : 'text-[#9CA3AF] hover:text-slate-600'}`}>
                  <Activity className={`w-4 h-4 ${chartType === 'line' ? 'text-[#7C3AED]' : ''}`} />
                </button>
                <button onClick={() => handleSetChartType('bar')} title="Barras"
                  className={`p-1.5 rounded-[8px] transition-all duration-150 flex items-center justify-center cursor-pointer ${chartType === 'bar' ? 'bg-white shadow-sm scale-95' : 'text-[#9CA3AF] hover:text-slate-600'}`}>
                  <BarChart2 className={`w-4 h-4 ${chartType === 'bar' ? 'text-[#7C3AED]' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className={`h-[250px] w-full transition-opacity duration-150 ${isChartAnimating ? 'opacity-0' : 'opacity-100'}`}>
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg"></div>
              ) : dadosGraficoFaturamento.every(d => d.valor === 0 && d.previsto === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-50 text-slate-300" />
                  <span className="text-sm font-medium">Nenhum faturamento no período</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  {chartType === 'area' ? (
                    <AreaChart data={dadosGraficoFaturamento} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGradientRealizado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="areaGradientPrevisto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val: number) => `R$${val}`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="valor" name="Realizado" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#areaGradientRealizado)" activeDot={{ r: 6 }} isAnimationActive={true} />
                      <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#areaGradientPrevisto)" activeDot={{ r: 6 }} isAnimationActive={true} />
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={dadosGraficoFaturamento} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val: number) => `R$${val}`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line type="monotone" dataKey="valor" name="Realizado" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                      <Line type="monotone" dataKey="previsto" name="Previsto" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                    </LineChart>
                  ) : (
                    <BarChart data={dadosGraficoFaturamento} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val: number) => `R$${val}`} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="valor" name="Realizado" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={true} />
                      <Bar dataKey="previsto" name="Previsto" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={true} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 2 - Atendimentos por Status */}
          <div className="bg-white rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <PieChartIcon className="w-5 h-5 text-brand" />
                      <h4 className="text-[15px] font-bold text-[#111827]">Atendimentos por Status</h4>
                   </div>
                   <p className="text-[12px] text-[#9CA3AF] ml-7">Progresso do período</p>
                </div>
                {!isLoading && dadosGraficoStatus.length > 0 && (
                   <div className="mt-3 sm:mt-0 text-[11px] text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 tracking-wider text-center">{totalAgendamentosGrafico} atendimentos no período</div>
                )}
            </div>
            
            <div className="w-full flex-1 pb-4">
              {isLoading ? (
                <div className="w-full h-[220px] bg-slate-100 animate-pulse rounded-lg"></div>
              ) : dadosGraficoStatus.length === 0 ? (
                <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400">
                  <PieChartIcon className="w-10 h-10 mb-3 opacity-50 text-slate-300" />
                  <span className="text-sm font-medium">Nenhum dado no período selecionado</span>
                </div>
              ) : (
                <div className="flex flex-col gap-6 pt-2">
                  {dadosGraficoStatus.map((item, index) => {
                     const percentage = totalAgendamentosGrafico > 0 ? (item.value / totalAgendamentosGrafico) * 100 : 0;
                     return (
                        <div key={index} className="flex items-center gap-3 w-full">
                           <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                           <div className="w-24 shrink-0 text-[13px] font-bold text-slate-700 truncate">{item.name}</div>
                           <div className="flex-1 h-[8px] bg-[#F3F4F6] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-[600ms] ease-out" style={{ width: isMounted ? `${percentage}%` : '0%', backgroundColor: item.color }} />
                           </div>
                           <div className="w-6 shrink-0 text-right text-[14px] font-bold text-slate-800">{item.value}</div>
                        </div>
                     )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico 3 - Serviços Mais Agendados */}
          <div className="bg-white rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-1">
               <TrendingUp className="w-5 h-5 text-brand" />
               <h4 className="text-[15px] font-bold text-[#111827]">Serviços Mais Agendados</h4>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mb-6 ml-7">Top performances por volume</p>
            
            <div className="w-full flex-1 pb-4">
              {isLoading ? (
                <div className="w-full h-[220px] bg-slate-100 animate-pulse rounded-lg"></div>
              ) : dadosGraficoServicos.length === 0 ? (
                <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400">
                  <BarChart3 className="w-10 h-10 mb-3 opacity-50 text-slate-300" />
                  <span className="text-sm font-medium">Nenhum dado no período selecionado</span>
                </div>
              ) : (
                <div className="flex flex-col gap-5 mt-2">
                  {dadosGraficoServicos.slice(0, 5).map((item, index) => {
                     const maxCount = dadosGraficoServicos[0].count;
                     const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                     const isTop = index === 0;

                     return (
                        <div key={index} className="flex items-center gap-3">
                           <div className="w-[110px] sm:w-[130px] shrink-0">
                              <div className="text-[14px] font-bold text-slate-800 truncate mb-[2px]">
                                 {item.name} 
                              </div>
                              <div className="text-[12px] text-[#9CA3AF] font-medium leading-tight">R$ {item.totalRS.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})} no período</div>
                           </div>
                           <div className="flex-1">
                              <div className="relative flex items-center">
                                 <div className="h-[36px] rounded-r-[6px] transition-all duration-[600ms] ease-out flex items-center justify-end px-3 shadow-sm" 
                                      style={{ 
                                         width: isMounted ? `${percentage}%` : '0%', 
                                         minWidth: '36px',
                                         background: isTop ? 'linear-gradient(90deg, #6D28D9 0%, #8B5CF6 100%)' : 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)' 
                                      }}>
                                      <span className="text-white text-xs font-bold shrink-0">{item.count}</span>
                                 </div>
                                 <div className="absolute top-1/2 -translate-y-1/2 left-full pl-2">
                                    {isTop && <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider shrink-0 shadow-sm align-middle">⭐ Top</span>}
                                 </div>
                              </div>
                           </div>
                        </div>
                     )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
