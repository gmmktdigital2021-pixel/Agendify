"use client";

import React, { useState, useMemo } from "react";
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
  CalendarClock
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AppointmentStatus = "confirmado" | "pendente" | "cancelado" | "concluido" | "livre";

interface Appointment {
  id: string;
  time: string;
  clientName: string;
  clientPhone: string;
  service: string;
  price: number;
  status: AppointmentStatus;
  cancelReason?: string;
}

const mockAppointments: Appointment[] = [
  { id: "1", time: "09:00", clientName: "Maria Silva", clientPhone: "5511999999999", service: "Corte", price: 80, status: "confirmado" },
  { id: "2", time: "10:00", clientName: "Ana Souza", clientPhone: "5511988888888", service: "Progressiva", price: 250, status: "pendente" },
  { id: "3", time: "11:00", clientName: "João Pereira", clientPhone: "5511977777777", service: "Corte", price: 50, status: "cancelado", cancelReason: "Não Compareceu" },
  { id: "4", time: "12:00", clientName: "", clientPhone: "", service: "", price: 0, status: "livre" },
  { id: "5", time: "13:00", clientName: "Carla Mendes", clientPhone: "5511966666666", service: "Coloração", price: 480, status: "concluido" },
];

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const todayStr = "24 de Maio, 2024";

  // Calculations
  const atendimentosHoje = appointments.filter(a => a.status !== "cancelado" && a.status !== "livre").length;
  
  const faturamento = appointments
    .filter(a => a.status === "concluido")
    .reduce((acc, curr) => acc + curr.price, 0);

  const horariosLivres = appointments.filter(a => a.status === "livre").length;

  const filteredAppointments = useMemo(() => {
    if (!search.trim()) return appointments;
    return appointments.filter(a => 
      a.clientName.toLowerCase().includes(search.toLowerCase()) || 
      (a.status === "livre" && search === "") // Hide free slots if searching
    );
  }, [search, appointments]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    // 1. Atualizar state local (Mock)
    setAppointments(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));

    // 2. Simular Supabase DB Update
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error && error.message.includes("URL missing")) {
         // ignoramos no mock
      }
      showToast(`Status atualizado para ${newStatus}.`);
    } catch {
      console.warn("Erro no mock Supabase");
      showToast(`Status atualizado para ${newStatus} (Mock).`);
    }
  };

  const openWhatsApp = (phone: string, name: string, time: string) => {
    const text = encodeURIComponent(`Olá ${name}, confirmando seu agendamento hoje às ${time}.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleAction = (action: string) => {
    showToast(`Ação "${action}" disparada (modal pendente de implementação).`);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Bella <span className="font-medium text-slate-600">Beauty Salão</span>
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium hidden sm:inline-block">{todayStr}</span>
          <Button variant="primary" className="gap-2 shadow-sm" onClick={() => handleAction("Novo Agendamento")}>
            <Plus className="w-4 h-4" /> Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-brand/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-brand shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Hoje:</p>
            <p className="text-xl font-bold text-slate-800">{atendimentosHoje} Atendimentos</p>
          </div>
        </Card>
        
        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Faturamento:</p>
            <p className="text-xl font-bold text-slate-800">
              R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Horários Livres:</p>
            <p className="text-xl font-bold text-slate-800">{horariosLivres}</p>
          </div>
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
              placeholder="Buscar clientes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-colors"
            />
          </div>
          <Button variant="secondary" className="gap-2 text-brand font-medium h-[42px]" onClick={() => handleAction("Novo Cliente")}>
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </Card>

        <Card className="divide-y divide-slate-100/80 overflow-hidden">
          {filteredAppointments.map((app) => {
            if (app.status === "livre") {
              return (
                <div 
                  key={app.id} 
                  onClick={() => handleAction(`Agendar horário ${app.time}`)}
                  className="p-4 flex items-center bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-slate-400 w-12 group-hover:text-brand transition-colors text-lg">{app.time}</span>
                    <span className="text-slate-400 font-medium group-hover:text-slate-600 transition-colors">— Horário Livre</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={app.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="font-bold text-slate-800 w-12 text-lg">{app.time}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <button 
                      onClick={() => handleAction(`Perfil de ${app.clientName}`)} 
                      className={`font-bold hover:text-brand transition-colors border-b-2 pb-0.5 text-left
                        ${app.status === 'confirmado' ? 'border-green-500 text-slate-800' : 
                          app.status === 'cancelado' ? 'border-red-500 text-slate-800' : 'border-slate-300 text-slate-800'}`}
                    >
                      {app.clientName}
                    </button>
                    {app.status !== 'cancelado' && <span className="text-slate-500 text-sm hidden sm:inline-block">{app.service}</span>}
                    <div className="flex items-center gap-2">
                       <Badge status={app.status} />
                       {app.cancelReason && <span className="text-red-500 text-xs font-medium ml-1">{app.cancelReason}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 ml-16 md:ml-0">
                  {/* Whatsapp SEMPRE disponivel quando não livre salvo cancelados antigos se quiser, mas mantendo o mockup */}
                  <button 
                    onClick={() => openWhatsApp(app.clientPhone, app.clientName, app.time)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>

                  {/* Botões contextuais de status seguindo a lógica pedida de outlines */}
                  {app.status === "confirmado" && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(app.id, "concluido")}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-transparent border border-green-500 text-green-600 text-xs font-bold rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                      </button>
                      <button 
                        onClick={() => handleStatusChange(app.id, "cancelado")}
                        className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {app.status === "pendente" && (
                    <>
                      <button 
                        onClick={() => handleAction("Modal Editar")}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent border border-amber-500 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button 
                        onClick={() => handleStatusChange(app.id, "cancelado")}
                        className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {app.status === "cancelado" && (
                    <button 
                      onClick={() => handleAction("Modal Reagendar")}
                      className="flex items-center justify-center px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Reagendar
                    </button>
                  )}

                  {app.status === "concluido" && (
                    <button 
                      onClick={() => handleAction("Modal Editar Concluído")}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent border border-slate-400 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredAppointments.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nenhum agendamento encontrado.
            </div>
          )}
        </Card>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-30">
        <button 
          onClick={() => handleAction("Novo Agendamento Flutuante")}
          className="flex items-center gap-2 px-6 py-4 bg-brand text-white font-bold rounded-full shadow-xl shadow-brand/30 hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
        >
          <CalendarClock className="w-5 h-5" /> + Agendar Cliente
        </button>
      </div>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg("")} />
      )}
    </div>
  );
}
