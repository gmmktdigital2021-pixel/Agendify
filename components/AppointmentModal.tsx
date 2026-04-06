"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Toast } from "./Toast";
import { Search, Plus, Calendar as CalendarIcon, Clock, Scissors } from "lucide-react";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
  initialClientId?: string;
  appointmentId?: string;
}

// --- MOCK DATA ---
const mockClients = [
  { id: "1", name: "Maria Silva", phone: "11999999999" },
  { id: "2", name: "Ana Souza", phone: "11988888888" },
  { id: "3", name: "João Pereira", phone: "11977777777" },
];

const mockServices = [
  { id: "1", name: "Corte Feminino", durationMin: 60, price: 80.00 },
  { id: "2", name: "Progressiva", durationMin: 120, price: 250.00 },
  { id: "3", name: "Coloração Raiz", durationMin: 90, price: 150.00 },
  { id: "4", name: "Manicure Clássica", durationMin: 45, price: 35.00 },
];

// Appts of the current mock day (for conflict calculation)
const mockExistingAppts = [
  { id: "a1", time: "09:00", durationMin: 60, status: "confirmado" },
  { id: "a2", time: "10:30", durationMin: 90, status: "pendente" },
];

export function AppointmentModal({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  initialClientId,
  appointmentId
}: AppointmentModalProps) {
  // Configs
  const START_HOUR = 9;
  const END_HOUR = 18;
  

  // Form states
  const [clientId, setClientId] = useState<string>(initialClientId || "");
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>(initialTime || "");

  // Client search state
  const [clientSearch, setClientSearch] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientNamePhone] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState("");

  const isEditMode = !!appointmentId;

  useEffect(() => {
    if (isOpen) {
      // Reset or setup initial states
      if (initialDate) {
        setDate(initialDate.toISOString().split("T")[0]);
      } else {
        const today = new Date();
        setDate(today.toISOString().split("T")[0]);
      }
      setTime(initialTime || "");
      setClientId(initialClientId || "");
      setServiceId("");
      setErrors({});
      setClientSearch("");
      setIsCreatingClient(false);

      if (isEditMode) {
        // Mock edit mode fetch
        setClientId("1");
        setServiceId("1");
        setTime("09:00");
      }
    }
  }, [isOpen, initialDate, initialTime, initialClientId, appointmentId, isEditMode]);

  // Derived state
  const selectedService = mockServices.find(s => s.id === serviceId);
  
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const getSlotStatus = (slotTime: string) => {
    if (!selectedService) return "disabled"; // force selection of service first
    
    const slotStart = toMins(slotTime);
    const slotEnd = slotStart + selectedService.durationMin;
    const dayEnd = END_HOUR * 60;

    if (slotEnd > dayEnd) return "disabled"; // doesn't fit in shift

    // Check conflicts
    for (const app of mockExistingAppts) {
      if (isEditMode && app.id === appointmentId) continue;
      if (app.status === "cancelado") continue;

      const appStart = toMins(app.time);
      const appEnd = appStart + app.durationMin;

      // Conflict logic: slot starts before app ends AND slot ends after app starts
      if (slotStart < appEnd && slotEnd > appStart) {
        return "conflict";
      }
    }
    return "available";
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    const newId = Math.random().toString();
    mockClients.push({ id: newId, name: newClientName, phone: newClientPhone });
    setClientId(newId);
    setClientSearch(newClientName);
    setIsCreatingClient(false);
    setToastMsg("Cliente salvo com sucesso!");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleSave = (withWhatsApp: boolean = false) => {
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.client = "Selecione ou crie um cliente.";
    if (!serviceId) newErrors.service = "Selecione um serviço.";
    if (!date) newErrors.date = "A data é obrigatória.";
    if (!time) newErrors.time = "Selecione um horário válido.";
    else if (selectedService && getSlotStatus(time) === "conflict") {
      newErrors.time = "Este horário não está mais disponível.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mock Save
    setToastMsg(isEditMode ? "Agendamento atualizado!" : "Agendamento criado com status 'Pendente'.");
    
    if (withWhatsApp) {
      const c = mockClients.find(c => c.id === clientId);
      if (c && c.phone) {
        const text = encodeURIComponent(`Olá ${c.name}, seu agendamento para o dia ${date.split("-").reverse().join("/")} às ${time} foi confirmado!`);
        window.open(`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${text}`, "_blank");
      }
    }

    setTimeout(() => {
      setToastMsg("");
      onClose();
    }, 2000);
  };

  const handleCancelAppt = () => {
    setToastMsg("Agendamento cancelado com sucesso. Horário liberado.");
    setTimeout(() => {
      setToastMsg("");
      onClose();
    }, 2000);
  };

  const filteredClients = clientSearch.trim() === "" 
    ? [] 
    : mockClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditMode ? "Editar Agendamento" : "Novo Agendamento"}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          
          {/* 1. CLIENTE */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              1. Cliente
            </label>
            {!clientId && !isCreatingClient ? (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar cliente pelo nome..." 
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none transition-colors
                    ${errors.client ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.client && <span className="text-xs text-red-500 mt-1">{errors.client}</span>}

                {clientSearch.trim() !== "" && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setClientId(c.id); setClientSearch(c.name); }}
                        className="px-4 py-2 hover:bg-brand/5 cursor-pointer text-sm font-medium text-slate-700 border-b last:border-0"
                      >
                        {c.name} <span className="text-slate-400 font-normal ml-2">{c.phone}</span>
                      </div>
                    ))}
                    <div 
                      onClick={() => setIsCreatingClient(true)}
                      className="px-4 py-3 bg-brand/5 text-brand font-medium text-sm flex items-center gap-2 cursor-pointer hover:bg-brand/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Criar novo cliente &quot;{clientSearch}&quot;
                    </div>
                  </div>
                )}
              </div>
            ) : isCreatingClient ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                <h4 className="text-sm font-bold text-slate-800">Criar Novo Cliente</h4>
                <Input 
                  placeholder="Nome completo" 
                  value={newClientName} 
                  onChange={e => setNewClientName(e.target.value)} 
                />
                <Input 
                  placeholder="WhatsApp (com DDD)" 
                  value={newClientPhone} 
                  onChange={e => setNewClientNamePhone(e.target.value)} 
                />
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 text-xs" onClick={() => setIsCreatingClient(false)}>Cancelar</Button>
                  <Button variant="primary" className="flex-1 text-xs" onClick={handleCreateClient}>Salvar Cliente</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-brand/5 border border-brand/20 p-3 rounded-lg">
                <div>
                  <span className="block font-bold text-brand">{mockClients.find(c => c.id === clientId)?.name}</span>
                  <span className="text-xs text-slate-500">{mockClients.find(c => c.id === clientId)?.phone}</span>
                </div>
                <button onClick={() => { setClientId(""); setClientSearch(""); }} className="text-xs text-brand hover:underline font-medium">Trocar</button>
              </div>
            )}
          </div>

          {/* 2. SERVIÇO */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-slate-500" /> 2. Serviço
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockServices.map(s => {
                const isSelected = serviceId === s.id;
                return (
                  <div 
                    key={s.id}
                    onClick={() => { setServiceId(s.id); setTime(""); }} // reset time on service change
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-slate-200 hover:border-brand/50"
                    }`}
                  >
                    <span className="block font-bold text-slate-800 text-sm mb-1">{s.name}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>{s.durationMin} min</span>
                      <span>R$ {s.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {errors.service && <span className="text-xs text-red-500 block">{errors.service}</span>}
          </div>

          {/* 3. DATA & HORA */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-500" /> 3. Data
                </label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => { setDate(e.target.value); setTime(""); }} 
                  error={errors.date}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" /> 4. Horários Livres
                </label>
                
                {!selectedService ? (
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                    Selecione um serviço primeiro para ver os horários.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {timeSlots.map(t => {
                        const sStatus = getSlotStatus(t);
                        const isSelected = time === t;
                        if (sStatus === "conflict" || sStatus === "disabled") {
                          return (
                            <div key={t} className="py-2 text-center text-xs font-medium bg-slate-50 text-slate-300 rounded-md border border-slate-100 cursor-not-allowed">
                              {t}
                            </div>
                          );
                        }
                        return (
                          <button
                            key={t}
                            onClick={() => setTime(t)}
                            className={`py-2 text-center text-xs font-medium rounded-md transition-colors border ${
                              isSelected 
                                ? "bg-brand text-white border-brand shadow-sm" 
                                : "bg-white text-slate-700 border-slate-200 hover:border-brand/50 hover:bg-brand/5"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    {errors.time && <span className="text-xs text-red-500 block">{errors.time}</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACIONS */}
          <div className="pt-6 mt-4 border-t border-slate-100 flex flex-col gap-3">
            {isEditMode && (
              <Button variant="danger" className="w-full font-medium" onClick={handleCancelAppt}>
                Cancelar Agendamento (Liberar Horário)
              </Button>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={onClose} className="sm:flex-1 font-medium">Voltar sem Salvar</Button>
              <Button variant="primary" onClick={() => handleSave(true)} className="sm:flex-1 bg-[#25D366] hover:bg-[#25D366]/90 border-none">
                Salvar & Enviar WhatsApp
              </Button>
            </div>
            <Button variant="primary" onClick={() => handleSave(false)} className="w-full">
              Confirmar Agendamento ({selectedService ? `R$ ${selectedService.price.toFixed(2)}` : ''})
            </Button>
          </div>

        </div>
      </Modal>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </>
  );
}
