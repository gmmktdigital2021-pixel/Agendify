"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase, db } from "@/lib/supabase";
import { createFullAppointment } from "@/lib/supabase";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido";

interface AppointmentWithRelations {
  id: string;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  status: AppointmentStatus;
  clients: { nome: string; telefone: string } | null;
  services: { nome: string; duracao_minutos: number } | null;
}

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_DURATION_MIN = 30;
const SLOT_HEIGHT_PX = 64;

const timeSlots: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
  timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
}

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    service_id: "",
    data: "",
    hora_inicio: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const fetchWeeklyAppointments = useCallback(async (sid: string, starts: string, ends: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await db.appointments.select(`
        id, data, hora_inicio, status,
        clients ( nome, telefone ),
        services ( nome, duracao_minutos )
      `)
      .eq('salon_id', sid)
      .gte('data', starts)
      .lte('data', ends);

      if (error) throw error;
      setAppointments((data as unknown) as AppointmentWithRelations[]);
    } catch (err) {
      console.error("Falha ao buscar agenda semanal:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const daysToRender = useMemo(() => {
    if (isMobile) {
      return [currentDate];
    } else {
      const monday = getMonday(currentDate);
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    }
  }, [currentDate, isMobile]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      const { data: salon } = await supabase.from('salons').select('id').eq('user_id', session.user.id).single();
      
      if (salon) {
        setSalonId(salon.id);
        const { data: svcs } = await db.services.select('*').eq('salon_id', salon.id);
        if (svcs) setServices(svcs);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!salonId) return;
    const startStr = daysToRender[0].toISOString().split('T')[0];
    const endStr = daysToRender[daysToRender.length - 1].toISOString().split('T')[0];
    fetchWeeklyAppointments(salonId, startStr, endStr);
  }, [salonId, daysToRender, fetchWeeklyAppointments]);

  useEffect(() => {
    if (!salonId) return;
    const channel = supabase
      .channel('realtime_agenda')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments',
        filter: `salon_id=eq.${salonId}`
      }, () => {
         const startStr = daysToRender[0].toISOString().split('T')[0];
         const endStr = daysToRender[daysToRender.length - 1].toISOString().split('T')[0];
         fetchWeeklyAppointments(salonId, startStr, endStr);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [salonId, daysToRender, fetchWeeklyAppointments]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const amount = isMobile ? 1 : 7;
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? amount : -amount));
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const weekLabel = useMemo(() => {
    if (isMobile) {
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    }
    const start = daysToRender[0];
    const end = daysToRender[daysToRender.length - 1];
    return `Semana de ${start.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} a ${end.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}`;
  }, [daysToRender, isMobile, currentDate]);

  const showToast = (msg: string) => setToastMsg(msg);

  const statusColors: Record<AppointmentStatus, string> = {
    confirmado: "bg-green-500",
    pendente: "bg-amber-500",
    cancelado: "bg-red-500",
    concluido: "bg-slate-400"
  };

  const getPosAndHeight = (startTime: string, MathMinutes: number) => {
    const [h, m] = startTime.split(":").map(Number);
    const startMinutes = (h - START_HOUR) * 60 + m;
    const top = (startMinutes / SLOT_DURATION_MIN) * SLOT_HEIGHT_PX;
    const height = (MathMinutes / SLOT_DURATION_MIN) * SLOT_HEIGHT_PX;
    return { top, height };
  };

  const openSlotModal = (dateStr: string, timeStr: string) => {
    setFormData({ ...formData, data: dateStr, hora_inicio: timeStr, nome: "", telefone: "", service_id: "" });
    setModalOpen(true);
  };

  const handleCreateAppointment = async () => {
    if (!salonId) return;
    if (!formData.nome || !formData.telefone || !formData.service_id) {
       showToast("Preencha todos os campos do agendamento.");
       return;
    }
    
    setIsSubmitting(true);
    try {
      const selectedSvc = services.find(s => s.id === formData.service_id);
      if (!selectedSvc) throw new Error("Serviço inválido");

      // Math para hora_fim
      const [h, m] = formData.hora_inicio.split(":").map(Number);
      const totalMin = h * 60 + m + selectedSvc.duracao_minutos;
      const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
      const endM = (totalMin % 60).toString().padStart(2, '0');
      const hora_fim = `${endH}:${endM}:00`;

      // Chamada simplificada aproveitando toda inteligência interna do lib/supabase.ts (clientes nativos)
      await createFullAppointment(salonId, { nome: formData.nome, telefone: formData.telefone }, {
        service_id: formData.service_id,
        data: formData.data,
        hora_inicio: formData.hora_inicio + ":00",
        hora_fim: hora_fim,
        status: "confirmado" // Regra visual 2 exige confirmado
      });

      showToast("✅ Agendamento confirmado!");
      setModalOpen(false);
    } catch (e: any) {
      console.error(e);
      showToast("Erro ao criar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Agenda Semanal
          {isLoading && <RefreshCw className="w-4 h-4 text-brand animate-spin" />}
        </h2>
        
        <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Button variant="ghost" onClick={() => navigateDate('prev')} className="px-2" title="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button variant="secondary" onClick={goToToday} className="px-4 font-medium text-sm">
            Hoje
          </Button>

          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center capitalize">
            {weekLabel}
          </span>
          
          <Button variant="ghost" onClick={() => navigateDate('next')} className="px-2" title="Próxima">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container (flex-1 forces 100% remaining vertical space) */}
      <div className="h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-y-auto flex flex-col custom-scrollbar">
        
        {/* Days Header */}
        <div className="flex border-b border-slate-200 bg-white shrink-0">
          <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className={`flex-1 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-7'}`}>
            {daysToRender.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
              
              return (
                <div 
                  key={i} 
                  className={`py-3 flex flex-col items-center justify-center border-l first:border-l-0 border-slate-200 
                    ${isToday ? 'bg-brand/10' : ''}`}
                >
                  <span className={`text-xs font-semibold uppercase mb-1 ${isToday ? 'text-brand' : 'text-slate-500'}`}>
                    {dayName}
                  </span>
                  <span className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full 
                    ${isToday ? 'bg-brand text-white' : 'text-slate-800'}`}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slots Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar">
          <div className="flex relative" style={{ minHeight: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}>
            
            {/* Time Labels Column */}
            <div className="w-16 sm:w-20 shrink-0 bg-white border-r border-slate-200 sticky left-0 z-20">
               <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
                {timeSlots.map((time, i) => (
                  <div key={i} className="h-16 border-b border-slate-200 w-full" />
                ))}
              </div>
              {timeSlots.map((time, i) => (
                <div 
                  key={i} 
                  className="h-16 flex items-start justify-center pt-2 relative z-10"
                >
                  {time.endsWith("00") && (
                    <span className="text-xs font-medium text-slate-400 -mt-2 bg-white px-1">{time}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className={`flex-1 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-7'} relative`}>
              {/* Horizontal grid lines for all columns */}
              <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
                {timeSlots.map((_, i) => (
                  <div key={i} className="h-16 border-b border-slate-200 w-full" />
                ))}
              </div>

              {daysToRender.map((date, colIndex) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayAppointments = appointments.filter(a => a.data === dateStr);

                return (
                  <div key={colIndex} className="relative border-l first:border-l-0 border-slate-200 z-10 p-1">
                     
                    {/* Empty Slots Interactivity */}
                    <div className="absolute inset-0 z-0 flex flex-col">
                      {timeSlots.map((time, i) => (
                        <div 
                          key={i} 
                          className="h-16 w-full cursor-pointer group hover:bg-[#F5F3FF] transition-colors relative"
                          onClick={() => openSlotModal(dateStr, time)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus className="w-5 h-5 text-brand" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Appointment Cards */}
                    {dayAppointments.map(app => {
                      const duracao = app.services?.duracao_minutos || 60;
                      const { top, height } = getPosAndHeight(app.hora_inicio, duracao);
                      const isCanceled = app.status === "cancelado";

                      return (
                        <div
                          key={app.id}
                          className={`absolute left-1 right-2 rounded-lg bg-white overflow-hidden shadow-sm border border-slate-200 cursor-pointer 
                            transition-transform hover:scale-[1.02] hover:shadow-md z-10 flex
                            ${isCanceled ? 'opacity-40 grayscale' : ''}`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height - 4, 30)}px`,
                          }}
                        >
                          <div className={`w-1.5 shrink-0 ${statusColors[app.status]}`} />
                          <div className="p-2 overflow-hidden w-full flex flex-col justify-center">
                            <span className={`text-sm font-bold text-slate-800 truncate ${isCanceled ? 'line-through text-slate-500' : ''}`}>
                              {app.clients?.nome || "Online..."}
                            </span>
                            <span className={`text-[10px] sm:text-xs truncate ${isCanceled ? 'line-through text-slate-400' : 'text-slate-500'}`}>
                              {app.hora_inicio.substring(0,5)} • {app.services?.nome || "Público"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Novo Agendamento</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                   <input type="date" disabled value={formData.data} className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-bold text-slate-700 mb-1">Horário</label>
                   <input type="time" disabled value={formData.hora_inicio} className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
                 </div>
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
                  <Input 
                    placeholder="Nome completo..." 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                  <div className="mt-2">
                    <Input 
                      placeholder="WhatsApp (ex: 11999999999)" 
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">* Se o telefone já existir, o agendamento será vinculado ao cliente. Senão, um novo será criado.</p>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Serviço</label>
                 <select 
                   value={formData.service_id} 
                   onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                   className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand font-medium"
                 >
                   <option value="">Selecione um serviço...</option>
                   {services.map(s => (
                     <option key={s.id} value={s.id}>{s.nome} ({s.duracao_minutos} min) • R$ {s.preco?.toFixed(2)}</option>
                   ))}
                 </select>
               </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
               <Button variant="ghost" onClick={() => setModalOpen(false)} className="px-4 text-slate-600 font-bold hover:bg-slate-200 rounded-lg" disabled={isSubmitting}>
                 Cancelar
               </Button>
               <Button onClick={handleCreateAppointment} disabled={isSubmitting} variant="primary" className="px-6 font-bold shadow-md">
                 {isSubmitting ? "Salvando..." : "Confirmar"}
               </Button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
         <Toast message={toastMsg} onClose={() => setToastMsg("")} />
      )}
    </div>
  );
}
