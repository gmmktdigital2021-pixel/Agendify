"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarCheck, ChevronLeft, Check, Clock, CalendarDays, User, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AgendarPage({ params }: { params: { salonId: string } }) {
  const { salonId } = params;

  // Domain Data
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [appointmentsFilterDate, setAppointmentsFilterDate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [step, setStep] = useState(1);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [clientData, setClientData] = useState({ nome: "", telefone: "" });
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState(""); // HH:MM

  // Fetch Base Data
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

  // Handle Date Selection (Fetches remote appointments to calculate overlap)
  useEffect(() => {
    if (selectedDate && salonId && step === 3) {
      const loadAppts = async () => {
        const { data } = await supabase.from('appointments')
          .select(`id, hora_inicio, status, services(duracao_minutos)`)
          .eq('salon_id', salonId)
          .eq('data', selectedDate)
          .neq('status', 'cancelado');
        if (data) setAppointmentsFilterDate(data);
      };
      loadAppts();
    }
  }, [selectedDate, salonId, step]);


  // Helper: Time in MM
  const timeToMins = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  
  // Create 30m slots respecting opening hours AND removing overlaps
  const availableSlots = useMemo(() => {
    if (!salon || !selectedService || !selectedDate) return [];

    const openMin = timeToMins(salon.horario_inicio);
    const closeMin = timeToMins(salon.horario_fim);
    const duracao = selectedService.duracao_minutos || 60;
    
    const slots: string[] = [];
    
    // Generate base slots
    for (let m = openMin; m + duracao <= closeMin; m += 30) {
      const slotStart = m;
      const slotEnd = m + duracao;
      
      // Test overlap with any existing appointment on that date
      let isOverlapping = false;
      
      for (const app of appointmentsFilterDate) {
        const appStart = timeToMins(app.hora_inicio.substring(0,5)); // "10:00:00" -> "10:00"
        const appDur = app.services?.duracao_minutos || 60;
        const appEnd = appStart + appDur;
        
        // Overlap logic: StartA < EndB AND EndA > StartB
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
    
    // Filtro adicional: Se for Hoje, não mostrar horários passados
    const today = new Date();
    const isHoje = selectedDate === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    if (isHoje) {
      const nowMin = today.getHours() * 60 + today.getMinutes();
      return slots.filter(s => timeToMins(s) > nowMin);
    }
    
    return slots;
  }, [salon, selectedService, selectedDate, appointmentsFilterDate]);


  const handleConfirmarAgendamento = async () => {
    setIsSubmitLoading(true);
    try {
      // Passo 1: criar ou buscar cliente
      let clientId: string;

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('salon_id', salonId)
        .eq('telefone', clientData.telefone.replace(/\D/g, ''))
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            salon_id: salonId,
            nome: clientData.nome,
            telefone: clientData.telefone.replace(/\D/g, '')
          }])
          .select('id')
          .single();

        if (clientError || !newClient) {
          console.error('Erro detalhado:', clientError ? JSON.stringify(clientError) : 'newClient is null');
          setToastMsg('Erro: ' + (clientError?.message || 'Desconhecido') + ' | Code: ' + (clientError?.code || ''));
          setIsSubmitLoading(false);
          return;
        }
        clientId = newClient.id;
      }

      // Passo 2: calcular hora_fim
      const [horas, minutos] = selectedTime.split(':').map(Number);
      const inicio = new Date();
      inicio.setHours(horas, minutos, 0, 0);
      const fim = new Date(inicio.getTime() + selectedService.duracao_minutos * 60000);
      const horaFim = `${String(fim.getHours()).padStart(2, '0')}:${String(fim.getMinutes()).padStart(2, '0')}`;

      // Passo 3: criar agendamento
      const { error: apptError } = await supabase
        .from('appointments')
        .insert([{
          salon_id: salonId,
          client_id: clientId,
          service_id: selectedService.id,
          data: selectedDate,
          hora_inicio: selectedTime,
          hora_fim: horaFim,
          status: 'pendente'
        }]);

      if (apptError) {
        console.error('Erro ao criar agendamento:', apptError);
        setToastMsg('Erro ao criar agendamento: ' + apptError.message);
        setIsSubmitLoading(false);
        return;
      }

      // Passo 4: sucesso
      setSuccess(true);
      
      // WhatsApp Forwarding
      const clName = clientData.nome.split(' ')[0];
      const dtParts = selectedDate.split('-');
      const strDt = `${dtParts[2]}/${dtParts[1]}/${dtParts[0]}`;
      
      let msg = salon?.mensagem_padrao || `Olá! Sou {nome}, agendei {servico} para {dia} às {hora} pelo Agendify.`;
      msg = msg.replace('{nome}', clName)
               .replace('{dia}', strDt)
               .replace('{hora}', selectedTime)
               .replace('{servico}', selectedService.nome);
               
      const cleanPhone = salon?.telefone?.replace(/\D/g, '');
      if (cleanPhone) {
        setTimeout(() => window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank'), 1500);
      }

    } catch (err) {
      console.error('Erro inesperado:', err);
      setToastMsg('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center font-sans">
      <div className="text-xl font-bold text-slate-400 animate-pulse">Carregando perfil...</div>
    </div>;
  }

  if (!salon) {
    return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center font-sans">
      <div className="text-xl font-bold text-slate-400">Salão não encontrado :(</div>
    </div>;
  }

  // Obter MinDate do input date pra frente apenas
  const todayDate = new Date();
  const minDateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans pb-10">
      
      {/* PÚBLICO HEADER */}
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
          
          {/* PROGRESS */}
          {!success && (
            <div className="bg-slate-50 border-b border-slate-100 flex items-center p-4">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="p-1 text-slate-400 hover:text-brand transition-colors mr-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 flex justify-center items-center gap-2">
                 {[1,2,3,4].map(s => (
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
               <p className="text-slate-500 mb-8">Nós enviamos sua solicitação. Você será redirecionado para o nosso WhatsApp em poucos segundos.</p>
               
               <div className="p-4 bg-slate-50 rounded-xl w-full flex flex-col text-left gap-2 shadow-inner border border-slate-100">
                  <p className="text-sm"><b>Serviço:</b> {selectedService?.nome}</p>
                  <p className="text-sm"><b>Data:</b> {selectedDate.split('-').reverse().join('/')}</p>
                  <p className="text-sm"><b>Hora:</b> {selectedTime}</p>
               </div>
            </div>
          )}

          {/* STEP 1: SERVIÇOS */}
          {!success && step === 1 && (
            <div className="flex-1 p-6 animate-in slide-in-from-left">
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-brand" /> Escolha o serviço</h2>
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
                            <p className="text-sm text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {s.duracao_minutos} min</p>
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
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-brand" /> Seus dados</h2>
              <div className="space-y-5">
                 <Input 
                   label="Nome Completo *" 
                   value={clientData.nome}
                   onChange={e => setClientData({...clientData, nome: e.target.value})}
                   placeholder="Ex: Ana Clara"
                   autoFocus
                 />
                 <Input 
                   label="Telefone WhatsApp *" 
                   value={clientData.telefone}
                   onChange={e => setClientData({...clientData, telefone: e.target.value.replace(/\D/g, '')})}
                   placeholder="Ex: 11999990000"
                 />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                 <Button 
                   onClick={() => setStep(3)} 
                   disabled={!clientData.nome || clientData.telefone.length < 10} 
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
              <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-brand" /> Quando?</h2>
              
              <div className="mb-6">
                <input 
                  type="date"
                  min={minDateStr}
                  value={selectedDate}
                  onChange={(e) => {
                     // Check day permission mapping
                     const dStr = e.target.value;
                     if (!dStr) { setSelectedDate(""); return; }
                     
                     // Convert '2024-10-31' literal ignoring timezone wrapping offset
                     const dateParts = dStr.split('-');
                     const obj = new Date(Number(dateParts[0]), Number(dateParts[1])-1, Number(dateParts[2]));
                     
                     const daysNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                     const selectedDayName = daysNames[obj.getDay()];
                     
                     if (salon.dias_ativos && !salon.dias_ativos.includes(selectedDayName)) {
                         setToastMsg("Lamentamos, o estabelecimento não atende neste dia da semana. Selecione outro.");
                         setSelectedDate("");
                         return;
                     }
                     setSelectedDate(dStr);
                     setSelectedTime("");
                  }}
                  className="w-full px-4 py-3 border-2 border-brand/20 bg-brand/5 text-brand font-bold rounded-xl outline-none"
                />
                <p className="text-xs text-slate-400 mt-2 text-center">Dias ativos: {salon.dias_ativos?.join(', ')}</p>
              </div>

              {selectedDate && (
                <div className="flex-1">
                   <h3 className="text-sm font-bold text-slate-800 mb-3">Horários Livres:</h3>
                   <div className="grid grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                     {availableSlots.length === 0 ? (
                        <div className="col-span-3 text-center text-slate-500 py-6 border border-slate-100 rounded-xl bg-slate-50 text-sm">
                           Nenhum horário sobrando para {selectedDate.split('-').reverse().join('/')}.
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
                       <div className="text-slate-500 text-sm">Valoração</div>
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
