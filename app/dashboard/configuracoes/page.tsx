"use client";

import React, { useState } from "react";
import { Store, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [formData, setFormData] = useState({
    name: "Bella Beauty Salão",
    phone: "11999990000",
    startTime: "09:00",
    endTime: "18:00",
    messageTemplate: "Oi {nome}, seu horário está confirmado para {dia} às {hora} para o serviço de {servico}.",
  });

  const [activeDays, setActiveDays] = useState({
    seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleToggleDay = (dayKey: keyof typeof activeDays) => {
    setActiveDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate Supabase API save Request
    try {
      await supabase.from("salons").update({
        name: formData.name,
        phone: formData.phone,
        start_time: formData.startTime,
        end_time: formData.endTime,
        message_template: formData.messageTemplate,
        active_days: Object.keys(activeDays).filter(k => activeDays[k as keyof typeof activeDays])
      }).eq("id", "MOCK_SESSION_ID");
      
      // Artificial delay for UX Spinner visible testing
      await new Promise(r => setTimeout(r, 1000));
      
      setToastMsg("Configurações atualizadas com sucesso!");
    } catch {
      setToastMsg("As configurações não puderam ser atualizadas. (Mock offline)");
    } finally {
      setIsLoading(false);
    }
  };

  const dayLabels = {
    seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom"
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações Gerais</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as informações do salão, horários visíveis da agenda e preferências de integração.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* PERFIL DO SALÃO */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-brand" /> Perfil do Profissional/Salão
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nome de Exibição" 
              placeholder="Ex: Bella Beauty Salão"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input 
              label="WhatsApp (Com DDD, apenas números)" 
              placeholder="Ex: 11999990000"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
        </Card>

        {/* HORÁRIOS DE EXPEDIENTE */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand" /> Expediente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mb-6">
            <Input 
              type="time" 
              label="Horário de Início (Abertura)" 
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              required
            />
            <Input 
              type="time" 
              label="Horário de Fim (Fechamento)" 
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Dias Ativos na Agenda</label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(activeDays) as Array<keyof typeof activeDays>).map(key => {
                const isActive = activeDays[key];
                return (
                  <label 
                    key={key} 
                    className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors user-select-none ${isActive ? 'bg-brand/10 border-brand text-brand font-bold' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isActive} 
                      onChange={() => handleToggleDay(key)} 
                    />
                    {dayLabels[key]}
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3 flex gap-1">
              <AlertCircle className="w-4 h-4" /> Dias desmarcados aparecerão bloqueados no calendário.
            </p>
          </div>
        </Card>

        {/* MENSAGEM DO WHATSAPP */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-brand" /> Automação de WhatsApp
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem Padrão de Confirmação</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-colors min-h-[120px] resize-y text-slate-800 block"
                value={formData.messageTemplate}
                onChange={(e) => setFormData({...formData, messageTemplate: e.target.value})}
                required
              />
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
              <span className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wide">Variáveis Disponíveis</span>
              <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                <li><code className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-bold">{'{nome}'}</code> - Nome do cliente cadastrado</li>
                <li><code className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-bold">{'{dia}'}</code> - Ex: segunda-feira, 24 de maio</li>
                <li><code className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-bold">{'{hora}'}</code> - Ex: 14:30</li>
                <li><code className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-bold">{'{servico}'}</code> - Nome do serviço selecionado no form</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" className="px-8 py-3 text-lg font-semibold w-full sm:w-auto shadow-md" disabled={isLoading}>
            {isLoading ? "Salvando configurações..." : "Salvar configurações"}
          </Button>
        </div>
      </form>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
