"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarCheck, ChevronLeft, Check, Clock, CalendarDays, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { createClient } from '@supabase/supabase-js';
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-day-picker/style.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AgendarPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;

  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [appointmentsFilterDate, setAppointmentsFilterDate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [step, setStep] = useState(1);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [selectedService, setSelectedService] = useState<any>(null);
  const [clientData, setClientData] = useState({ nome: "", telefone: "" });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [step2Errors, setStep2Errors] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: salonData } = await supabase.from('salons').select('*').eq('id', salonId).single();
        if (salonData) setSalon(salonData);
        const { data: szData } = await supabase.from('services').select('*').eq('salon_id', salonId);
        if (szData) setServices(szData);
      } catch (e) {
        console.error("Erro ao puxar dados: ", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [salonId]);

  // Busca agendamentos sempre que a data mudar — independente do step
  useEffect(() => {
    if (!selectedDate || !salonId) return;

    const loadAppts = async () => {
      setIsLoadingSlots(true);
      try {
        const { data } = await supabase
          .from('appointments')
          .select('id, hora_inicio, hora_fim, status')
          .eq('salon_id', salonId)
          .eq('data', selectedDate)
          .neq('status', 'cancelado');
        if (data) setAppointmentsFilterDate(data);
      } catch (e) {
        console.error("Erro ao buscar agendamentos:", e);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAppts();
  }, [selectedDate, salonId]);

  const timeToMins = (t: string): number => {
    if (!t) return 0;
    const parts = t.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const availableSlots = useMemo(() => {
    if (!salon || !selectedService || !selectedDate) return [];

    const duracao = selectedService.duracao_minutos || 60;

    // Pega horários do dia específico se existir horarios_por_dia
    let openMin: number;
    let closeMin: number;
    let almInicio: number | null = null;
    let almFim: number | null = null;

    if (salon.horarios_por_dia) {
      const daysMap: Record<string, string> = {
        "0": "dom", "1": "seg", "2": "ter", "3": "qua",
        "4": "qui", "5": "sex", "6": "sab"
      };
      const dateObj = new Date(selectedDate + "T00:00:00");
      const dayKey = daysMap[String(dateObj.getDay())];
      const dayConfig = salon.horarios_por_dia[dayKey];

      if (dayConfig && dayConfig.ativo) {
        openMin = timeToMins(dayConfig.inicio);
        closeMin = timeToMins(dayConfig.fim);
        if (dayConfig.almoco_inicio && dayConfig.almoco_fim) {
          almInicio = timeToMins(dayConfig.almoco_inicio);
          almFim = timeToMins(dayConfig.almoco_fim);
        }
      } else {
        return []; // dia inativo
      }
    } else {
      openMin = timeToMins(salon.horario_inicio?.substring(0, 5) || "08:00");
      closeMin = timeToMins(salon.horario_fim?.substring(0, 5) || "18:00");
      if (salon.horario_almoco_inicio && salon.horario_almoco_fim) {
        almInicio = timeToMins(salon.horario_almoco_inicio.substring(0, 5));
        almFim = timeToMins(salon.horario_almoco_fim.substring(0, 5));
      }
    }

    const slots: string[] = [];

    for (let m = openMin; m + duracao <= closeMin; m += 30) {
      const slotStart = m;
      const slotEnd = m + duracao;

      // 1. Verifica sobreposição com horário de almoço
      if (almInicio !== null && almFim !== null) {
        if (slotStart < almFim && slotEnd > almInicio) continue;
      }

      // 2. Verifica sobreposição com agendamentos existentes
      let isOverlapping = false;
      for (const app of appointmentsFilterDate) {
        const appStart = timeToMins(app.hora_inicio.substring(0, 5));
        const appEnd = timeToMins(app.hora_fim.substring(0, 5));

        // Overlap: slotStart < appEnd E slotEnd > appStart
        if (slotStart < appEnd && slotEnd > appStart) {
          isOverlapping = true;
          break;
        }
      }

      if (!isOverlapping) {
        const hr = Math.floor(m / 60).toString().padStart(2, '0');
        const min = (m % 60).toString().padStart(2, '0');
        slots.push(`${hr}:${min}`);
      }
    }

    // 3. Filtra horários passados se for hoje
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (selectedDate === todayStr) {
      const nowMin = today.getHours() * 60 + today.getMinutes();
      return slots.filter(s => timeToMins(s) > nowMin);
    }

    return slots;
  }, [salon, selectedService, selectedDate, appointmentsFilterDate]);

  const handleConfirmarAgendamento = async () => {
    setIsSubmitLoading(true);
    try {
      const [horas, minutos] = selectedTime.split(':').map(Number);
      const inicio = new Date();
      inicio.setHours(horas, minutos, 0, 0);
      const fim = new Date(inicio.getTime() + selectedService.duracao_minutos * 60000);
      const horaFim = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}:00`;
      const horaInicio = `${selectedTime}:00`;

      const { data, error } = await supabase.rpc('create_public_appointment', {
        p_salon_id: salonId,
        p_nome: clientData.nome,
        p_telefone: clientData.telefone.replace(/\D/g, ''),
        p_service_id: selectedService.id,
        p_data: selectedDate,
        p_hora_inicio: horaInicio,
        p_hora_fim: horaFim,
      });

      if (error) {
        setToastMsg('Erro: ' + error.message);
        return;
      }

      if (!data?.success) {
        setToastMsg('Erro: ' + (data?.error || 'Desconhecido'));
        return;
      }

      setSuccess(true);

    } catch (err) {
      setToastMsg('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center font-sans">
        <div className="text-xl font-bold text-slate-400 animate-pulse">Carregando perfil...</div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center font-sans">
        <div className="text-xl font-bold text-slate-400">Salão não encontrado :(</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans pb-10">
      <div className="bg-brand py-6">
        <div className="max-w-[480px] mx-auto px-4 flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <CalendarCheck className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-white font-bold text-2xl drop-shadow-md">{salon.nome}</h1>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">

          {!success && (
            <div className="bg-slate-50 border-b border-slate-100 flex items-center p-4">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="p-1 text-slate-400 hover:text-brand transition-colors mr-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 flex justify-center items-center gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? 'w-8 bg-brand' : 'w-4 bg-slate-200'}`} />
                ))}
              </div>
              <div className="w-7"></div>
            </div>
          )}

          {/* SUCESSO */}
          {success && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Agendamento Solicitado!</h2>
              <p className="text-slate-500 mb-8">Seu agendamento foi enviado com sucesso! O salão entrará em contato para confirmação.</p>
              <div className="p-4 bg-slate-50 rounded-xl w-full flex flex-col text-left gap-2 shadow-inner border border-slate-100">
                <p className="text-sm"><b>Serviço:</b> {selectedService?.nome}</p>
                <p className="text-sm"><b>Data:</b> {selectedDate.split('-').reverse().join('/')}</p>
                <p className="text-sm"><b>Hora:</b> {selectedTime}</p>
                <p className="text-sm"><b>Duração:</b> {selectedService?.duracao_minutos} min</p>
              </div>
            </div>
          )}

          {/* STEP 1: SERVIÇOS */}
          {!success && step === 1 && (
            <div className="flex-1 p-6 animate-in slide-in-from-left">
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" /> Escolha o serviço
              </h2>
              <div className="space-y-3">
                {services.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">Nenhum serviço disponível no momento.</div>
                ) : (
                  services.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { setSelectedService(s); setStep(2); }}
                      className="p-4 rounded-xl border-2 border-slate-100 hover:border-brand cursor-pointer transition-all hover:bg-brand/5 group flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-brand transition-colors text-lg mb-1">{s.nome}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {s.duracao_minutos} min
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">R$ {s.preco?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2: DADOS CLIENTE */}
          {!success && step === 2 && (
            <div className="flex-1 p-6 animate-in slide-in-from-right">
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-brand" /> Seus dados
              </h2>
              <div className="space-y-5">
                <div>
                  <Input
                    label="Nome Completo *"
                    value={clientData.nome}
                    onChange={e => { setClientData({ ...clientData, nome: e.target.value }); if (step2Errors) setStep2Errors(false); }}
                    placeholder="Ex: Ana Clara"
                    autoFocus
                  />
                  {step2Errors && (!clientData.nome || clientData.nome.trim() === "") && (
                    <p className="text-red-500 text-sm font-medium mt-1.5 ml-1">Nome é obrigatório</p>
                  )}
                </div>
                <div>
                  <Input
                    label="Telefone *"
                    value={clientData.telefone}
                    onChange={e => { setClientData({ ...clientData, telefone: e.target.value.replace(/\D/g, '') }); if (step2Errors) setStep2Errors(false); }}
                    placeholder="Ex: 11999990000"
                  />
                  {step2Errors && clientData.telefone.length < 10 && (
                    <p className="text-red-500 text-sm font-medium mt-1.5 ml-1">Telefone inválido</p>
                  )}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  onClick={() => {
                    if (!clientData.nome || clientData.nome.trim() === "" || clientData.telefone.length < 10) {
                      setStep2Errors(true);
                      return;
                    }
                    setStep2Errors(false);
                    setStep(3);
                  }}
                  className="w-full text-lg py-3.5"
                >
                  Continuar <Check className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DATA E HORA */}
          {!success && step === 3 && (
            <div className="flex-1 p-6 animate-in slide-in-from-right flex flex-col">
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-brand" /> Quando?
              </h2>

              <div className="mb-6 flex flex-col items-center">
                <style>{`
                  .rdp-root {
                    --rdp-accent-color: #7C3AED;
                    --rdp-background-color: rgba(124, 58, 237, 0.1);
                    margin: 0;
                  }
                  .rdp-day_disabled { opacity: 0.3; pointer-events: none; }
                `}</style>
                <div className="w-full border-2 border-brand/20 bg-brand/5 rounded-xl p-4 flex justify-center">
                  <DayPicker
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (!date) { setSelectedDate(""); return; }
                      setSelectedDate(format(date, "yyyy-MM-dd"));
                      setSelectedTime("");
                      setAppointmentsFilterDate([]); // limpa slots ao mudar data
                    }}
                    disabled={[
                      { before: new Date(new Date().setHours(0, 0, 0, 0)) },
                      (date) => {
                        const daysNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                        const dayName = daysNames[date.getDay()];
                        return !!salon.dias_ativos && !salon.dias_ativos.includes(dayName);
                      }
                    ]}
                    locale={ptBR}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Dias ativos: {salon.dias_ativos?.join(', ')}
                </p>
              </div>

              {selectedDate && (
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Horários Livres:
                    {isLoadingSlots && <span className="text-brand ml-2 font-normal text-xs">carregando...</span>}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2">
                    {isLoadingSlots ? (
                      <div className="col-span-3 text-center py-6 text-slate-400 text-sm">Verificando disponibilidade...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="col-span-3 text-center text-slate-500 py-6 border border-slate-100 rounded-xl bg-slate-50 text-sm">
                        Nenhum horário disponível para {selectedDate.split('-').reverse().join('/')}.
                      </div>
                    ) : (
                      availableSlots.map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 rounded-lg font-bold border transition-colors ${selectedTime === t ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand'}`}
                        >
                          {t}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 mt-auto">
                <Button
                  onClick={() => setStep(4)}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full text-lg py-3.5"
                >
                  Revisar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: REVISÃO */}
          {!success && step === 4 && (
            <div className="flex-1 p-6 animate-in slide-in-from-right flex flex-col">
              <h2 className="font-bold text-xl text-slate-800 mb-6">Última Revisão</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{clientData.nome}</p>
                      <p className="text-sm text-slate-500">{clientData.telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-slate-500 text-sm">Serviço</div>
                    <div className="font-bold text-slate-800">{selectedService?.nome}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-slate-500 text-sm">Duração</div>
                    <div className="font-bold text-slate-800">{selectedService?.duracao_minutos} min</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-slate-500 text-sm">Valor</div>
                    <div className="font-bold text-green-600">R$ {selectedService?.preco?.toFixed(2)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-slate-500 text-sm">Data & Hora</div>
                    <div className="font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-lg">
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  onClick={handleConfirmarAgendamento}
                  disabled={isSubmitLoading}
                  className="w-full text-lg py-3.5 gap-2"
                >
                  {isSubmitLoading ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isSubmitLoading ? "Processando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}