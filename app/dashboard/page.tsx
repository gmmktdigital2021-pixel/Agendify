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

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

interface AppointmentWithRelations {
  id: string;
  data: string;
  hora_inicio: string;
  status: AppointmentStatus;
  clients: { nome: string; telefone: string } | null;
  services: { nome: string; preco: number; duracao_minutos: number } | null;
}

type FilterOption = 'hoje' | 'ontem' | '7d' | '15d' | '30d' | '90d' | 'custom';

export default function DashboardPage() {
  const [appointmentsQuery, setAppointmentsQuery] = useState<AppointmentWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Filtro
  const [filter, setFilter] = useState<FilterOption>('hoje');
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
      start.setDate(end.getDate() - 1);
      end.setDate(end.getDate() - 1);
      startSql = formatSQL(start);
      endSql = formatSQL(end);
    } else if (filter === '7d') {
      start.setDate(end.getDate() - 6);
      startSql = formatSQL(start);
    } else if (filter === '15d') {
      start.setDate(end.getDate() - 14);
      startSql = formatSQL(start);
    } else if (filter === '30d') {
      start.setDate(end.getDate() - 29);
      startSql = formatSQL(start);
    } else if (filter === '90d') {
      start.setDate(end.getDate() - 89);
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
  const faturamento = periodAppointments
    .filter(a => a.status === "concluido")
    .reduce((acc, curr) => acc + (curr.services?.preco || 0), 0);

  const atendimentosFilter = periodAppointments.filter(a => a.status === "confirmado" || a.status === "concluido").length;
  
  const confirmadosPeriodo = periodAppointments.filter(a => a.status === "confirmado").length;
  const concluidosPeriodo = periodAppointments.filter(a => a.status === "concluido").length;
  const canceladosPeriodo = periodAppointments.filter(a => a.status === "cancelado").length;
  const pendentesPeriodo = periodAppointments.filter(a => a.status === "pendente").length;

  const livresPendentesHoje = todayAppointments.filter(a => a.status === "pendente").length;
  const livresCanceladosHoje = todayAppointments.filter(a => a.status === "cancelado").length;

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
    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      showToast(toastMessage);
    } catch {
      showToast("Falha ao atualizar.");
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
      'hoje': 'Hoje', 'ontem': 'Ontem', '7d': 'Últimos 7 dias', '15d': 'Últimos 15 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias'
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
              {[ {k:'hoje', l:'Hoje'}, {k:'ontem', l:'Ontem'}, {k:'7d', l:'Últimos 7 dias'}, {k:'15d', l:'Últimos 15 dias'}, {k:'30d', l:'Últimos 30 dias'}, {k:'90d', l:'Últimos 90 dias'}].map(opt => (
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
                      <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Até</label>
                      <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-brand/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Atendimentos</p>
            {isLoading ? 
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse"></div> : 
              <p className="text-xl font-bold text-slate-800">{atendimentosFilter}</p>
            }
          </div>
        </Card>
        
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Faturamento</p>
            {isLoading ? 
              <div className="h-7 w-24 bg-slate-200 rounded animate-pulse"></div> : 
              <p className="text-xl font-bold text-slate-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamento)}
              </p>
            }
          </div>
        </Card>
        
        <Card className="p-5 relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="text-sm font-bold text-slate-700">Horários Livres (Hoje)</div>
            </div>
            {isLoading ? (
               <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-xs text-slate-500">
                <span className="text-amber-500 font-bold ml-1">{livresPendentesHoje}</span> pendentes • 
                <span className="text-red-400 font-bold ml-1">{livresCanceladosHoje}</span> cancelados
              </p>
            )}
        </Card>
      </div>

      <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm text-center">
         <span>{getFilterLabel()}:</span> 
         <span className="text-green-600 font-bold">{confirmadosPeriodo} confirmados</span> • 
         <span className="text-slate-600 font-bold">{concluidosPeriodo} concluídos</span> • 
         <span className="text-red-400 font-bold">{canceladosPeriodo} cancelados</span> • 
         <span className="text-amber-500 font-bold">{pendentesPeriodo} pendentes</span>
      </div>

      {/* Agenda Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          {filter === 'hoje' ? 'Agenda do Dia' : 'Agendamentos do Período'}
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
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${isCanceled ? 'text-slate-400' : 'text-slate-500'}`}>
                            {app.services?.nome || "Serviço"} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.services?.preco || 0)}
                          </span>
                          <Badge status={app.status} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 ml-[5.5rem] md:ml-0 shrink-0">
                      
                      {app.status === "pendente" && (
                        <>
                          <button onClick={() => handleStatusChange(app.id, "confirmado", "Confirmado")} className="p-1.5 sm:px-3 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">Confirmar</span></button>
                          <button onClick={() => openWhatsApp(app.clients?.telefone||"", app.clients?.nome||"", formatHora(app.hora_inicio), "solicitação recebida")} className="p-1.5 sm:px-3 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg"><MessageCircle className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">WhatsApp</span></button>
                          <button onClick={() => handleStatusChange(app.id, "cancelado", "Cancelado")} className="p-1.5 sm:px-3 border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50"><span className="hidden sm:inline">Cancelar</span><span className="sm:hidden">✖</span></button>
                        </>
                      )}

                      {app.status === "confirmado" && (
                        <>
                          <button onClick={() => handleStatusChange(app.id, "concluido", `Concluído`)} className="p-1.5 sm:px-3 border border-green-500 text-green-600 text-xs font-bold rounded-lg hover:bg-green-50"><CheckCircle2 className="w-3.5 h-3.5 sm:hidden" /><span className="hidden sm:inline">Concluir</span></button>
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

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
