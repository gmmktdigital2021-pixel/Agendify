"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { Calendar, Clock, User, Scissors, ChevronRight, CheckCircle } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  specialty: string;
  avatar_url: string | null;
}

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Salon {
  nome: string;
  foto_perfil: string | null;
  user_id: string;
}

type Step = "professional" | "service" | "datetime" | "confirm" | "success";

export default function AgendarPage() {
  const params = useParams();
  const salonId = params.salonId as string;

  const [step, setStep] = useState<Step>("professional");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      // Busca dados do salão e o user_id do dono
      const { data: salonData } = await supabase
        .from("salons")
        .select("nome, foto_perfil, user_id")
        .eq("id", salonId)
        .single();

      // Se não encontrar pelo id, tenta pelo user_id diretamente
      const ownerUserId = salonData?.user_id || salonId;
      setSalon(salonData);

      // Busca profissionais pelo user_id do dono
      const { data: pros } = await supabase
        .from("professionals")
        .select("id, name, specialty, avatar_url")
        .eq("salon_id", ownerUserId)
        .eq("active", true);

      // Se não tem profissionais cadastrados, pula direto para serviços
      if (!pros || pros.length === 0) {
        setStep("service");
      }
      setProfessionals(pros || []);

      // Busca serviços
      const { data: svcs } = await supabase
        .from("services")
        .select("id, nome, preco, duracao")
        .eq("salon_id", ownerUserId)
        .eq("ativo", true);
      setServices(svcs || []);
      setLoading(false);
    };
    init();
  }, [supabase, salonId]);

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ];

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;
    setSubmitting(true);
    try {
      await supabase.from("appointments").insert({
        salon_id: salon?.user_id || salonId,
        professional_id: selectedProfessional?.id || null,
        client_name: clientName,
        client_phone: clientPhone,
        service_name: selectedService.nome,
        date: selectedDate,
        time: selectedTime,
        status: "pendente",
        created_at: new Date().toISOString(),
      });
      setStep("success");
    } catch (err) {
      alert("Erro ao agendar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  type StepType = "professional" | "service" | "datetime" | "confirm" | "success";

  const steps: { key: StepType; label: string }[] = [
    ...(professionals.length > 0 ? [{ key: "professional" as StepType, label: "Profissional" }] : []),
    { key: "service" as StepType, label: "Serviço" },
    { key: "datetime" as StepType, label: "Data e hora" },
    { key: "confirm" as StepType, label: "Confirmar" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-md w-full text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendado com sucesso! 🎉</h2>
          <p className="text-gray-500 mb-6">
            Seu agendamento com <strong>{selectedProfessional?.name}</strong> foi confirmado para <strong>{selectedDate}</strong> às <strong>{selectedTime}</strong>.
          </p>
          <button
            onClick={() => { setStep("professional"); setSelectedProfessional(null); setSelectedService(null); setSelectedDate(""); setSelectedTime(""); setClientName(""); setClientPhone(""); }}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Fazer novo agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do salão */}
      <div className="bg-brand text-white py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">{salon?.nome || "Agendamento"}</h1>
        <p className="text-white/70 text-sm mt-1">Escolha seu profissional e agende</p>
      </div>

      {/* Steps */}
      {step !== "success" && (
        <div className="flex items-center justify-center gap-2 py-4 px-4 bg-white border-b border-gray-100 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${i <= currentStepIndex ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${i < currentStepIndex ? "bg-purple-600 text-white" : i === currentStepIndex ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-500"}`}>
                  {i < currentStepIndex ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 py-6">

        {/* Step 1 — Escolher profissional */}
        {step === "professional" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-purple-600" /> Escolha o profissional
            </h2>
            {professionals.length === 0 ? (
              // Redireciona automaticamente para serviços
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {professionals.map(pro => (
                  <button key={pro.id} onClick={() => { setSelectedProfessional(pro); setStep("service"); }}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-purple-300 hover:shadow-md transition text-left">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-xl shrink-0">
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pro.name}</p>
                      <p className="text-sm text-purple-600">{pro.specialty}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Escolher serviço */}
        {step === "service" && (
          <div>
            <button onClick={() => setStep("professional")} className="text-sm text-purple-600 mb-4 flex items-center gap-1 hover:underline">
              ← Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scissors size={18} className="text-purple-600" /> Escolha o serviço
            </h2>
            <div className="space-y-3">
              {services.map(svc => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep("datetime"); }}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-300 hover:shadow-md transition text-left">
                  <div>
                    <p className="font-semibold text-gray-900">{svc.nome}</p>
                    <p className="text-sm text-gray-500">{svc.duracao} min</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-600">R$ {svc.preco?.toFixed(2)}</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Escolher data e hora */}
        {step === "datetime" && (
          <div>
            <button onClick={() => setStep("service")} className="text-sm text-purple-600 mb-4 flex items-center gap-1 hover:underline">
              ← Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" /> Escolha a data e horário
            </h2>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {selectedDate && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-purple-600" /> Horários disponíveis
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`py-2 rounded-xl text-sm font-medium transition ${selectedTime === time ? "bg-purple-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-700"}`}>
                      {time}
                    </button>
                  ))}
                </div>
                {selectedTime && (
                  <button onClick={() => setStep("confirm")}
                    className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition">
                    Continuar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Confirmar */}
        {step === "confirm" && (
          <div>
            <button onClick={() => setStep("datetime")} className="text-sm text-purple-600 mb-4 flex items-center gap-1 hover:underline">
              ← Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Seus dados</h2>

            {/* Resumo */}
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 mb-4">
              <p className="text-sm text-purple-700 font-medium mb-2">Resumo do agendamento</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p>👤 <strong>{selectedProfessional?.name}</strong> — {selectedProfessional?.specialty}</p>
                <p>✂️ <strong>{selectedService?.nome}</strong> — R$ {selectedService?.preco?.toFixed(2)}</p>
                <p>📅 <strong>{selectedDate}</strong> às <strong>{selectedTime}</strong></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!clientName || !clientPhone || submitting}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {submitting ? "Agendando..." : "Confirmar agendamento"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}