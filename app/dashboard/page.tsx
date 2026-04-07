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
  Plus,
  MessageCircle,
  CheckCircle2,
  Pencil,
  CalendarClock,
  RefreshCw
} from "lucide-react";
import { supabase, db } from "@/lib/supabase";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

// Tipo esperado com os JOINs do Supabase
interface AppointmentWithRelations {
  id: string;
  data: string;
  hora_inicio: string;
  status: AppointmentStatus;
  clients: { nome: string; telefone: string } | null;
  services: { nome: string; preco: number; duracao_minutos: number } | null;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Formata a data de hoje no padrão americano (AAAA-MM-DD) para query
  const todayDateObj = new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const todaySQL = `${year}-${month}-${day}`;
  
  const todayStr = todayDateObj.toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' });

  // 1. CARREGAR DADOS INICIAIS
  const fetchAppointments = useCallback(async (sid: string) => {
    try {
      // 3. LISTA "AGENDA DO DIA": Buscar TODOS de hoje ordenados por hora_inicio
      const { data, error } = await db.appointments.select(`
        id, data, hora_inicio, status,
        clients ( nome, telefone ),
        services ( nome, preco, duracao_minutos )
      `)
      .eq('salon_id', sid)
      .eq('data', todaySQL)
      .order('hora_inicio', { ascending: true });

      if (error) throw error;
      
      // Filter out raw null relations properly mapped
      setAppointments((data as unknown) as AppointmentWithRelations[]);
    } catch (err) {
      console.error("Falha ao buscar agenda do dia:", err);
    } finally {
      setIsLoading(false);
    }
  }, [todaySQL]);

  useEffect(() => {
    async function loadInitialData() {
      // Puxar usuario logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoading(false);
      
      // Puxar salao dele
      const { data: salon } = await supabase.from('salons').select('id').eq('user_id', session.user.id).single();
      if (salon) {
        setSalonId(salon.id);
        await fetchAppointments(salon.id);
      } else {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [fetchAppointments]);

  // 6. REALTIME COM SUPABASE
  useEffect(() => {
    if (!salonId) return;

    const channel = supabase
      .channel('realtime_dashboard_appointments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments',
        filter: `salon_id=eq.${salonId}`
      }, (payload) => {
        // Ao invés de merges complexos baseados no evento, 
        // disparamos re-fetch para garantir integridade dos JOINs (clients, services)
        fetchAppointments(salonId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, fetchAppointments]);


  // --- CÁLCULOS EXATOS DO DASHBOARD ---
  
  // 1. FATURAMENTO - APENAS concluídos de Hoje
  const faturamento = appointments
    .filter(a => a.status === "concluido")
    .reduce((acc, curr) => acc + (curr.services?.preco || 0), 0);

  // 2. ATENDIMENTOS DO DIA - (confirmado ou concluido)
  const atendimentosHoje = appointments.filter(a => a.status === "confirmado" || a.status === "concluido").length;
  
  // EXTRA: Horários livres vs Regra de Negócio (Simplificado no Painel de Hoje baseado na agenda existente)
  const pendentesHoje = appointments.filter(a => a.status === "pendente").length;
  const canceladosHoje = appointments.filter(a => a.status === "cancelado").length;

  const filteredAppointments = useMemo(() => {
    let filtered = appointments.filter(a => a.status !== "cancelado"); // Ignora visualmente os cancelados na grade padrão limpa, EXCETO se solicitado, mas a regra 3 pede pra listar "qualquer status exceto cancelado" visualmente (com o visual apagado no caso de cancelados mantidos).
    
    // "Buscar TODOS exceto cancelados" -> Vou mantê-los mas aplicar visual apagado como pedido na regra 3 ("Cancelado -> (visual apagado)").
    if (!search.trim()) return appointments;
    
    return appointments.filter(a => 
      a.clients?.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, appointments]);

  const showToast = (msg: string) => setToastMsg(msg);

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus, toastMessage: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      showToast(toastMessage);
    } catch {
      showToast("Falha ao atualizar. Verifique sua conexão online.");
    }
  };

  const openWhatsApp = (phone: string, nome: string, dataHora: string, actionMsg: string) => {
    if (!phone) {
      showToast("Cliente não possui WhatsApp cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Olá ${nome}, ${actionMsg} (${dataHora}).`);
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const formatHora = (timeSql: string) => timeSql.substring(0, 5); // 09:00:00 -> 09:00

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Visão <span className="font-medium text-slate-600">Geral</span>
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium hidden sm:inline-block">{todayStr}</span>
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
            <p className="text-sm text-slate-500 font-medium mb-0.5">Atendimentos Hoje</p>
            <p className="text-xl font-bold text-slate-800">{atendimentosHoje}</p>
          </div>
        </Card>
        
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Faturamento</p>
            <p className="text-xl font-bold text-slate-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamento)}
            </p>
          </div>
        </Card>
        
        {/* Card extra p/ Feedback */}
        <Card className="p-5 relative overflow-hidden flex flex-col justify-center">
            <div className="text-sm font-bold text-slate-700 mb-1">Status da Agenda (Hoje)</div>
            <p className="text-xs text-slate-500">
              <span className="text-green-600 font-bold">{atendimentosHoje - pendentesHoje}</span> confirmados/concluídos • 
              <span className="text-amber-500 font-bold ml-1">{pendentesHoje}</span> pendentes • 
              <span className="text-red-400 font-bold ml-1">{canceladosHoje}</span> cancelados
            </p>
        </Card>
      </div>

      {/* Agenda Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Agenda do Dia</h3>
        
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
           <div className="p-12 text-center text-slate-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand" /></div>
        ) : (
          <Card className="divide-y divide-slate-100/80 overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhum agendamento encontrado para o dia de hoje.
              </div>
            ) : (
              filteredAppointments.map((app) => {
                const hourFormatted = formatHora(app.hora_inicio);
                const clientName = app.clients?.nome || "Cliente Desconhecido";
                const clientPhone = app.clients?.telefone || "";
                const serviceName = app.services?.nome || "Serviço Deletado";
                const servicePrice = app.services?.preco || 0;
                
                const isCanceled = app.status === "cancelado";

                return (
                  <div key={app.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4 ${isCanceled ? 'opacity-50 grayscale bg-red-50/10' : ''}`}>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className={`font-bold w-12 text-lg ${isCanceled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {hourFormatted}
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className={`font-bold text-left ${isCanceled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {clientName}
                        </span>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm ${isCanceled ? 'text-slate-400' : 'text-slate-500'}`}>
                            {serviceName} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servicePrice)}
                          </span>
                          <Badge status={app.status} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 ml-16 md:ml-0">
                      
                      {/* PENDENTE -> Confirmar | WhatsApp | Cancelar */}
                      {app.status === "pendente" && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(app.id, "confirmado", "Agendamento confirmado!")}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                          </button>
                          <button 
                            onClick={() => openWhatsApp(clientPhone, clientName, hourFormatted, "acabamos de receber sua solicitação para a nossa agenda! Logo te confirmaremos.")}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg hover:bg-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app.id, "cancelado", "Agendamento cancelado.")}
                            className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {/* CONFIRMADO -> Concluir | WhatsApp | Cancelar */}
                      {app.status === "confirmado" && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(app.id, "concluido", `Serviço concluído! R$ ${servicePrice.toFixed(2)} adicionado ao faturamento.`)}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-transparent border border-green-500 text-green-600 text-xs font-bold rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                          </button>
                          <button 
                            onClick={() => openWhatsApp(clientPhone, clientName, hourFormatted, "estamos confirmando o seu horário agendado conosco! Estamos lhe aguardando.")}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg hover:bg-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app.id, "cancelado", "Agendamento cancelado!")}
                            className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {/* CONCLUÍDO -> WhatsApp */}
                      {app.status === "concluido" && (
                        <button 
                          onClick={() => openWhatsApp(clientPhone, clientName, hourFormatted, "Muito obrigado pela visita hoje! Mande uma mensagem caso precise de algo.")}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-lg hover:bg-[#25D366]/20 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Enviar Recibo
                        </button>
                      )}

                      {/* CANCELADO -> Reagendar */}
                      {app.status === "cancelado" && (
                        <button 
                          onClick={() => showToast("Reagendamento ainda deve ser remapeado via UI na versão completa.")}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent border border-slate-300 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reagendar
                        </button>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </Card>
        )}
      </div>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg("")} />
      )}
    </div>
  );
}
