"use client";

import React, { useState, useEffect } from "react";
import { Store, Clock, MessageCircle, AlertCircle, Link as LinkIcon, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase, db } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const [formData, setFormData] = useState({
    nome: "Carregando...",
    telefone: "",
    horario_inicio: "09:00",
    horario_fim: "18:00",
    mensagem_padrao: "Oi {nome}, seu horário está confirmado para {dia} às {hora} para o serviço de {servico}.",
  });

  const [activeDays, setActiveDays] = useState({
    seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [salonId, setSalonId] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    async function loadConfig() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: salon } = await supabase.from('salons').select('*').eq('user_id', session.user.id).single();
      if (salon) {
        setSalonId(salon.id);
        setFormData({
          nome: salon.nome || "",
          telefone: salon.telefone || "",
          horario_inicio: salon.horario_inicio?.substring(0,5) || "09:00",
          horario_fim: salon.horario_fim?.substring(0,5) || "18:00",
          mensagem_padrao: salon.mensagem_padrao || formData.mensagem_padrao,
        });
        
        if (salon.dias_ativos && Array.isArray(salon.dias_ativos)) {
          const loadedDays = { seg: false, ter: false, qua: false, qui: false, sex: false, sab: false, dom: false };
          salon.dias_ativos.forEach((d: string) => {
            if (Object.keys(loadedDays).includes(d)) {
              loadedDays[d as keyof typeof loadedDays] = true;
            }
          });
          setActiveDays(loadedDays);
        }
      }
      setIsLoading(false);
    }
    loadConfig();
  }, []);

  const handleToggleDay = (dayKey: keyof typeof activeDays) => {
    setActiveDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId) return;
    setIsSaving(true);
    
    try {
      const activeArr = Object.keys(activeDays).filter(k => activeDays[k as keyof typeof activeDays]);
      
      const { error } = await supabase.from("salons").update({
        nome: formData.nome,
        telefone: formData.telefone,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        mensagem_padrao: formData.mensagem_padrao,
        dias_ativos: activeArr
      }).eq("id", salonId);
      
      if (error) throw error;
      setToastMsg("Configurações atualizadas com sucesso!");
    } catch {
      setToastMsg("As configurações não puderam ser atualizadas. Verifique rede.");
    } finally {
      setIsSaving(false);
    }
  };

  const dayLabels = {
    seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom"
  };

  const generatedLink = salonId ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/agendar/${salonId}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setToastMsg("Link copiado!");
  };

  const shareWhatsAppConfig = () => {
    const text = encodeURIComponent(`Agende seu horário comigo: ${generatedLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) return <div className="p-10 font-medium text-slate-500">Carregando painel de configuração...</div>;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações Gerais</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as informações do salão e página pública.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* LINK DE AGENDAMENTO (NOVO) */}
        {salonId && (
          <Card className="p-6 border-brand/20 bg-brand/5 shadow-[0_4px_20px_-4px_rgba(124,58,237,0.1)]">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-brand" /> Compartilhe seu Link de Agendamento
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Clientes podem acessar este link para agendar um horário sem precisar ligar ou contatar você previamente. Eles entrarão como <b>Pendentes</b> na sua aba Agenda.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink}
                  className="w-full px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg text-brand font-bold text-sm outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:w-auto w-full">
                <Button type="button" variant="primary" onClick={copyToClipboard} className="flex-1 sm:flex-none gap-2">
                  <Copy className="w-4 h-4" /> Copiar Link
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.open(generatedLink, '_blank')} className="gap-2 border-brand/20 text-brand">
                  <ExternalLink className="w-4 h-4" /> Testar
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
                <Button type="button" onClick={shareWhatsAppConfig} className="bg-[#25D366] hover:bg-green-600 text-white font-bold gap-2">
                  <MessageCircle className="w-4 h-4" /> Compartilhar no WhatsApp
                </Button>
            </div>
          </Card>
        )}

        {/* PERFIL DO SALÃO */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-slate-400" /> Perfil do Salão
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nome de Exibição" 
              placeholder="Ex: Bella Beauty Salão"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required
            />
            <Input 
              label="WhatsApp (Com DDD, apenas números)" 
              placeholder="Ex: 11999990000"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})}
              required
            />
          </div>
        </Card>

        {/* HORÁRIOS DE EXPEDIENTE */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" /> Expediente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mb-6">
            <Input 
              type="time" 
              label="Horário de Abertura" 
              value={formData.horario_inicio}
              onChange={(e) => setFormData({...formData, horario_inicio: e.target.value})}
              required
            />
            <Input 
              type="time" 
              label="Horário de Fechamento" 
              value={formData.horario_fim}
              onChange={(e) => setFormData({...formData, horario_fim: e.target.value})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Dias Ativos na Agenda Pública</label>
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
            <p className="text-xs text-slate-400 mt-3 flex gap-1 items-center">
              <AlertCircle className="w-4 h-4" /> Somente os dias selecionados mostrarão horários livres na página de agendamento.
            </p>
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" className="px-8 py-3 text-lg font-semibold w-full sm:w-auto shadow-md" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
