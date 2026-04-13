"use client";

import React, { useState, useEffect, useRef } from "react";
import { Store, Clock, MessageCircle, AlertCircle, Link as LinkIcon, Copy, ExternalLink, Camera, Settings, Smartphone, Palette } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase, db } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const WHATSAPP_DEFAULT = "Oi {nome}, seu horário está confirmado para {dia} às {hora} para o serviço de {servico}.";

  const [formData, setFormData] = useState({
    nome: "Carregando...",
    telefone: "",
    horario_inicio: "09:00",
    horario_fim: "18:00",
    horario_almoco_inicio: "12:00",
    horario_almoco_fim: "13:00",
    antecedencia_minima: "1 hora",
    intervalo_atendimentos: "Sem intervalo",
    mensagem_padrao: WHATSAPP_DEFAULT,
    mensagem_boas_vindas: "",
    foto_perfil: "",
    foto_capa: "",
    cor_principal: "#7C3AED",
  });

  const [activeDays, setActiveDays] = useState({
    seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: false
  });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    async function loadConfig() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);
      const { data: salon } = await supabase.from('salons').select('*').eq('user_id', session.user.id).single();
      if (salon) {
        setSalonId(salon.id);
        setFormData({
          nome: salon.nome || "",
          telefone: salon.telefone || "",
          horario_inicio: salon.horario_inicio?.substring(0,5) || "09:00",
          horario_fim: salon.horario_fim?.substring(0,5) || "18:00",
          horario_almoco_inicio: salon.horario_almoco_inicio?.substring(0,5) || "12:00",
          horario_almoco_fim: salon.horario_almoco_fim?.substring(0,5) || "13:00",
          antecedencia_minima: salon.antecedencia_minima || "1 hora",
          intervalo_atendimentos: salon.intervalo_atendimentos || "Sem intervalo",
          mensagem_padrao: salon.mensagem_padrao || WHATSAPP_DEFAULT,
          mensagem_boas_vindas: salon.mensagem_boas_vindas || "",
          foto_perfil: salon.foto_perfil || "",
          foto_capa: salon.foto_capa || "",
          cor_principal: salon.cor_principal || "#7C3AED",
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

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'perfil' | 'capa') => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !userId) return;
      const file = e.target.files[0];
      setToastMsg(`Fazendo upload da foto de ${type}...`);
      setIsSaving(true);
      
      const filePath = `${userId}/${type}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from('salon-images').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('salon-images').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, [type === 'perfil' ? 'foto_perfil' : 'foto_capa']: data.publicUrl }));
      setToastMsg(`Foto de ${type} carregada com sucesso!`);
    } catch (err) {
      console.error(err);
      setToastMsg("Erro ao fazer upload da imagem.");
    } finally {
      setIsSaving(false);
    }
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
        horario_almoco_inicio: formData.horario_almoco_inicio,
        horario_almoco_fim: formData.horario_almoco_fim,
        antecedencia_minima: formData.antecedencia_minima,
        intervalo_atendimentos: formData.intervalo_atendimentos,
        mensagem_padrao: formData.mensagem_padrao,
        mensagem_boas_vindas: formData.mensagem_boas_vindas,
        foto_perfil: formData.foto_perfil,
        foto_capa: formData.foto_capa,
        cor_principal: formData.cor_principal,
        dias_ativos: activeArr
      }).eq("id", salonId);
      
      if (error) throw error;
      setToastMsg("✅ Configurações salvas com sucesso!");
    } catch {
      setToastMsg("As configurações não puderam ser atualizadas. Verifique rede.");
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textAreaRef.current;
    if(textarea) {
       const start = textarea.selectionStart;
       const end = textarea.selectionEnd;
       const text = formData.mensagem_padrao;
       const newText = text.substring(0, start) + variable + text.substring(end);
       setFormData({...formData, mensagem_padrao: newText});
       setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + variable.length;
          textarea.focus();
       }, 0);
    } else {
       setFormData({...formData, mensagem_padrao: formData.mensagem_padrao + ' ' + variable});
    }
  };

  const previewMessage = formData.mensagem_padrao
    .replace('{nome}', 'Maria')
    .replace('{dia}', 'segunda-feira')
    .replace('{hora}', '14:00')
    .replace('{servico}', 'Corte Feminino')
    .replace('{valor}', 'R$ 80,00');

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

        {/* SEÇÃO 2 — PERFIL DO SALÃO */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-brand" /> Perfil do Salão
          </h3>
          <p className="text-sm text-slate-500 mb-6">Personalize as informações públicas exibidas para seus clientes.</p>

          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-shrink-0 flex flex-col items-center">
                  <label className="block text-sm font-bold text-slate-700 mb-3 self-start">Foto de Perfil</label>
                  <label className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 cursor-pointer overflow-hidden group hover:border-brand transition-colors">
                     {formData.foto_perfil ? (
                        <img src={formData.foto_perfil} alt="Perfil" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
                     ) : (
                        <span className="text-slate-400 font-medium text-xs">Sem foto</span>
                     )}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="w-6 h-6 text-white" />
                     </div>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'perfil')} />
                  </label>
               </div>

               <div className="flex-1 w-full relative">
                  <label className="block text-sm font-bold text-slate-700 mb-3">Foto de Capa</label>
                  <label className="relative flex w-full h-[140px] rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 cursor-pointer overflow-hidden group hover:border-brand transition-colors">
                     {formData.foto_capa ? (
                        <img src={formData.foto_capa} alt="Capa" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                           <span className="text-slate-400 font-medium text-sm">Adicionar imagem de capa</span>
                        </div>
                     )}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="w-8 h-8 text-white" />
                     </div>
                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'capa')} />
                  </label>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Input 
                label="Nome de Exibição" 
                placeholder="Ex: Bella Beauty"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
              />
              <Input 
                label="WhatsApp (Com DDD)" 
                placeholder="Ex: 11999990000"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})}
                required
              />
            </div>
            
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem de Boas-vindas</label>
               <p className="text-xs text-slate-500 mb-2">Uma breve frase que aparece no topo da sua página pública.</p>
               <textarea 
                 value={formData.mensagem_boas_vindas}
                 onChange={(e) => setFormData({...formData, mensagem_boas_vindas: e.target.value})}
                 maxLength={200}
                 placeholder="Ex: Bem-vinda ao Bella Beauty! Agende com facilidade."
                 className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand transition-colors resize-none h-20"
               />
               <div className="text-right text-[11px] font-semibold text-slate-400 mt-1">
                 {formData.mensagem_boas_vindas.length}/200 caracteres
               </div>
            </div>
          </div>
        </Card>

        {/* SEÇÃO 3 — EXPEDIENTE */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-brand" /> Expediente
          </h3>
          <p className="text-sm text-slate-500 mb-6">Configure seus horários de atendimento diários.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end mb-8">
            <Input 
              type="time" 
              label="Abertura" 
              value={formData.horario_inicio}
              onChange={(e) => setFormData({...formData, horario_inicio: e.target.value})}
              required
            />
            <Input 
              type="time" 
              label="Fechamento" 
              value={formData.horario_fim}
              onChange={(e) => setFormData({...formData, horario_fim: e.target.value})}
              required
            />
            <Input 
              type="time" 
              label="Início do Almoço" 
              value={formData.horario_almoco_inicio}
              onChange={(e) => setFormData({...formData, horario_almoco_inicio: e.target.value})}
            />
            <Input 
              type="time" 
              label="Fim do Almoço" 
              value={formData.horario_almoco_fim}
              onChange={(e) => setFormData({...formData, horario_almoco_fim: e.target.value})}
            />
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-3 mt-4">Dias Ativos na Agenda Pública</label>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {(Object.keys(activeDays) as Array<keyof typeof activeDays>).map(key => {
                const isActive = activeDays[key];
                return (
                  <label 
                    key={key} 
                    className={`flex items-center justify-center px-4 md:px-5 py-2 border rounded-[12px] cursor-pointer transition-all user-select-none text-[13px] ${isActive ? 'bg-brand/10 border-brand text-brand font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
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
            <p className="text-[12px] text-slate-500 mt-4 flex gap-1.5 items-center font-medium bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 text-amber-700">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> O horário de almoço será bloqueado automaticamente na agenda pública.
            </p>
          </div>
        </Card>

        {/* SEÇÃO 4 — PREFERÊNCIAS DA AGENDA */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-brand" /> Preferências da Agenda
          </h3>
          <p className="text-sm text-slate-500 mb-6">Regras matemáticas e restrições para seus agendamentos via link.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Tempo mínimo para agendamento</label>
               <p className="text-xs text-slate-500 mb-3">Clientes não poderão agendar com menos tempo de antecedência.</p>
               <select 
                 value={formData.antecedencia_minima} 
                 onChange={(e) => setFormData({...formData, antecedencia_minima: e.target.value})}
                 className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand font-semibold text-slate-700 transition-colors cursor-pointer"
               >
                 {["30 min", "1 hora", "2 horas", "3 horas", "6 horas", "12 horas", "24 horas", "48 horas"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Intervalo entre atendimentos</label>
               <p className="text-xs text-slate-500 mb-3">Tempo de descanso entre um atendimento e outro.</p>
               <select 
                 value={formData.intervalo_atendimentos} 
                 onChange={(e) => setFormData({...formData, intervalo_atendimentos: e.target.value})}
                 className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand font-semibold text-slate-700 transition-colors cursor-pointer"
               >
                 {["Sem intervalo", "10 min", "15 min", "30 min"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
            </div>
          </div>
        </Card>

        {/* SEÇÃO 5 — MENSAGEM WHATSAPP */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-brand" /> Mensagem WhatsApp
          </h3>
          <p className="text-sm text-slate-500 mb-6">Personalize a mensagem automática enviada ao interagir com atendimentos.</p>

          <div>
             <div className="flex flex-wrap gap-2 mb-3">
               {['{nome}', '{dia}', '{hora}', '{servico}', '{valor}'].map(v => (
                 <button type="button" key={v} onClick={() => insertVariable(v)} className="px-3 py-1 bg-brand/10 text-brand text-[11px] font-bold rounded-lg hover:bg-brand hover:text-white transition-colors">
                   {v}
                 </button>
               ))}
             </div>
             
             <textarea 
               ref={textAreaRef}
               value={formData.mensagem_padrao}
               onChange={(e) => setFormData({...formData, mensagem_padrao: e.target.value})}
               className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand transition-colors h-28 resize-none mb-2"
             />

             <div className="flex justify-end mb-4">
                <button type="button" onClick={() => setFormData({...formData, mensagem_padrao: WHATSAPP_DEFAULT})} className="text-[12px] font-bold text-slate-400 hover:text-brand transition-colors">
                  Restaurar padrão
                </button>
             </div>

             <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl relative">
                <div className="absolute -top-2.5 left-4 bg-slate-50 px-2 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pré-visualização</div>
                <p className="text-sm text-slate-700 italic font-medium leading-relaxed">" {previewMessage} "</p>
             </div>
          </div>
        </Card>

        {/* SEÇÃO 6 — APARÊNCIA DA PÁGINA PÚBLICA */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-brand" /> Aparência da Página Pública
          </h3>
          <p className="text-sm text-slate-500 mb-6">Cor principal da sua página de agendamento.</p>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
             <div>
                <div className="flex gap-4">
                   {[ '#7C3AED', '#EC4899', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444' ].map(color => (
                     <button
                       type="button"
                       key={color}
                       onClick={() => setFormData({...formData, cor_principal: color})}
                       className={`w-[36px] h-[36px] rounded-full shrink-0 transition-all border-2 border-white ${formData.cor_principal === color ? 'scale-110 shadow-md ring-2' : 'hover:scale-110 opacity-80 shadow-sm'}`}
                       style={{ backgroundColor: color, ringColor: color }}
                     />
                   ))}
                </div>
             </div>

             <div className="flex-1 w-full bg-slate-50 py-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                <button type="button" className="px-10 py-3 text-white text-sm font-bold rounded-lg shadow-lg transition-colors cursor-default" style={{ backgroundColor: formData.cor_principal, boxShadow: `0 8px 20px -8px ${formData.cor_principal}` }}>
                  Confirmar Agendamento
                </button>
             </div>
          </div>
        </Card>

        <div className="sticky bottom-4 z-50 mt-10 shadow-[0_0_40px_rgba(255,255,255,1)]">
          <Button type="submit" variant="primary" className="w-full py-4 text-[16px] font-bold shadow-xl rounded-xl" disabled={isSaving}>
            {isSaving ? "Salvando configurações..." : "Salvar configurações"}
          </Button>
        </div>
      </form>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
