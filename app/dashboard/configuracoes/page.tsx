"use client";

import React, { useState, useEffect, useRef } from "react";
import { Store, Clock, MessageCircle, AlertCircle, Link as LinkIcon, Copy, ExternalLink, Camera, Settings, Smartphone, Palette, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const antecedenciaMap: Record<string, number> = {
  "30 min": 30, "1 hora": 60, "2 horas": 120, "3 horas": 180,
  "6 horas": 360, "12 horas": 720, "24 horas": 1440, "48 horas": 2880
};
const intervaloMap: Record<string, number> = {
  "Sem intervalo": 0, "10 min": 10, "15 min": 15, "30 min": 30
};
const antecedenciaReverseMap: Record<number, string> = Object.fromEntries(
  Object.entries(antecedenciaMap).map(([k, v]) => [v, k])
);
const intervaloReverseMap: Record<number, string> = Object.fromEntries(
  Object.entries(intervaloMap).map(([k, v]) => [v, k])
);

const DAY_LABELS: Record<string, string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta",
  qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo"
};

const DEFAULT_HORARIOS = {
  seg: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  ter: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  qua: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  qui: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  sex: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  sab: { ativo: true, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
  dom: { ativo: false, inicio: "08:00", fim: "19:00", almoco_inicio: "12:00", almoco_fim: "13:00" },
};

type DayKey = keyof typeof DEFAULT_HORARIOS;
type DayConfig = { ativo: boolean; inicio: string; fim: string; almoco_inicio: string; almoco_fim: string };

export default function ConfiguracoesPage() {
  const WHATSAPP_DEFAULT = "Oi {nome}, seu horário está confirmado para {dia} às {hora} para o serviço de {servico}.";

  const [formData, setFormData] = useState({
    nome: "Carregando...",
    whatsapp: "",
    antecedencia_minima: "1 hora",
    intervalo_atendimentos: "Sem intervalo",
    mensagem_padrao: WHATSAPP_DEFAULT,
    mensagem_boas_vindas: "",
    foto_perfil: "",
    foto_capa: "",
    cor_tema: "#7C3AED",
  });

  const [horariosPorDia, setHorariosPorDia] = useState<Record<DayKey, DayConfig>>(DEFAULT_HORARIOS);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: salon, error } = await supabase
        .from('salons').select('*').eq('user_id', session.user.id).single();
      if (error) console.error("Erro ao carregar salão:", error);

      if (salon) {
        setSalonId(salon.id);
        setFormData({
          nome: salon.nome || "",
          whatsapp: salon.whatsapp || "",
          antecedencia_minima: antecedenciaReverseMap[salon.antecedencia_minima] || "1 hora",
          intervalo_atendimentos: intervaloReverseMap[salon.intervalo_atendimentos] || "Sem intervalo",
          mensagem_padrao: salon.mensagem_padrao || WHATSAPP_DEFAULT,
          mensagem_boas_vindas: salon.mensagem_boas_vindas || "",
          foto_perfil: salon.foto_perfil || "",
          foto_capa: salon.foto_capa || "",
          cor_tema: salon.cor_tema || "#7C3AED",
        });

        // Carrega horários por dia se existir, senão usa padrão
        if (salon.horarios_por_dia) {
          setHorariosPorDia({ ...DEFAULT_HORARIOS, ...salon.horarios_por_dia });
        } else if (salon.dias_ativos && Array.isArray(salon.dias_ativos)) {
          // Migra dados antigos: usa horario_inicio/fim global por dia
          const migrated = { ...DEFAULT_HORARIOS };
          (Object.keys(migrated) as DayKey[]).forEach(day => {
            migrated[day] = {
              ...migrated[day],
              ativo: salon.dias_ativos.includes(day),
              inicio: salon.horario_inicio?.substring(0, 5) || "08:00",
              fim: salon.horario_fim?.substring(0, 5) || "19:00",
              almoco_inicio: salon.horario_almoco_inicio?.substring(0, 5) || "12:00",
              almoco_fim: salon.horario_almoco_fim?.substring(0, 5) || "13:00",
            };
          });
          setHorariosPorDia(migrated);
        }
      }
      setIsLoading(false);
    }
    loadConfig();
  }, []);

  const updateDia = (day: DayKey, field: keyof DayConfig, value: string | boolean) => {
    setHorariosPorDia(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'perfil' | 'capa') => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !userId || !salonId) return;
      const file = e.target.files[0];
      setToastMsg(`Fazendo upload da foto de ${type}...`);
      setIsSaving(true);
      const filePath = `${salonId}/${type}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('salon-images').upload(filePath, file, { upsert: true, cacheControl: '0' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('salon-images').getPublicUrl(filePath);
      const finalUrl = `${data.publicUrl}?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, [type === 'perfil' ? 'foto_perfil' : 'foto_capa']: finalUrl }));
      const { error: updateError } = await supabase.from("salons")
        .update({ [type === 'perfil' ? 'foto_perfil' : 'foto_capa']: finalUrl })
        .eq("id", salonId).eq("user_id", userId);
      if (updateError) throw updateError;
      setToastMsg(`✅ Foto de ${type} atualizada!`);
    } catch (err: any) {
      setToastMsg(`Erro ao fazer upload: ${err.message || ''}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId || !userId) return;
    setIsSaving(true);
    try {
      // Dias ativos = dias com ativo: true
      const diasAtivos = (Object.keys(horariosPorDia) as DayKey[]).filter(d => horariosPorDia[d].ativo);
      // Primeiro dia ativo para compatibilidade com agendamento público
      const primeiroDia = diasAtivos.length > 0 ? horariosPorDia[diasAtivos[0]] : null;

      const { error } = await supabase.from("salons").update({
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        antecedencia_minima: antecedenciaMap[formData.antecedencia_minima] ?? 60,
        intervalo_atendimentos: intervaloMap[formData.intervalo_atendimentos] ?? 0,
        mensagem_padrao: formData.mensagem_padrao,
        mensagem_boas_vindas: formData.mensagem_boas_vindas,
        foto_perfil: formData.foto_perfil,
        foto_capa: formData.foto_capa,
        cor_tema: formData.cor_tema,
        dias_ativos: diasAtivos,
        horarios_por_dia: horariosPorDia,
        // Compatibilidade com agendamento público
        horario_inicio: primeiroDia?.inicio || "08:00",
        horario_fim: primeiroDia?.fim || "19:00",
        horario_almoco_inicio: primeiroDia?.almoco_inicio || "12:00",
        horario_almoco_fim: primeiroDia?.almoco_fim || "13:00",
      }).eq("id", salonId).eq("user_id", userId);

      if (error) throw error;
      setToastMsg("✅ Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setToastMsg(`Erro ao salvar: ${error.message || 'Verifique sua conexão.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = formData.mensagem_padrao.substring(0, start) + variable + formData.mensagem_padrao.substring(end);
      setFormData({ ...formData, mensagem_padrao: newText });
      setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + variable.length; textarea.focus(); }, 0);
    } else {
      setFormData({ ...formData, mensagem_padrao: formData.mensagem_padrao + ' ' + variable });
    }
  };

  const previewMessage = formData.mensagem_padrao
    .replace('{nome}', 'Maria').replace('{dia}', 'segunda-feira')
    .replace('{hora}', '14:00').replace('{servico}', 'Corte Feminino').replace('{valor}', 'R$ 80,00');

  const fullLink = `${process.env.NEXT_PUBLIC_SITE_URL}/agendar/${salonId}`;
  const copyToClipboard = () => { navigator.clipboard.writeText(fullLink); setToastMsg("Link copiado!"); };
  const shareWhatsAppConfig = () => window.open(`https://wa.me/?text=${encodeURIComponent('Agende seu horário comigo: ' + fullLink)}`, '_blank');

  if (isLoading) return <div className="p-10 font-medium text-slate-500">Carregando painel de configuração...</div>;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configurações Gerais</h2>
        <p className="text-slate-500 text-sm mt-1">Gerencie as informações do salão e página pública.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* LINK */}
        {salonId && (
          <Card className="p-6 border-brand/20 bg-brand/5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-brand" /> Compartilhe seu Link de Agendamento
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <input readOnly value={fullLink} className="flex-1 w-full px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg text-brand font-bold text-sm outline-none" />
              <div className="flex gap-2">
                <Button type="button" variant="primary" onClick={copyToClipboard} className="gap-2">
                  <Copy className="w-4 h-4" /> Copiar
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.open(fullLink, '_blank')} className="gap-2 border-brand/20 text-brand">
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

        {/* PERFIL */}
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
                  {formData.foto_perfil ? <Image src={formData.foto_perfil} alt="Perfil" fill className="object-cover group-hover:brightness-75" sizes="96px" /> : <span className="text-slate-400 font-medium text-xs">Sem foto</span>}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'perfil')} />
                </label>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-700 mb-3">Foto de Capa</label>
                <label className="relative flex w-full h-[140px] rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 cursor-pointer overflow-hidden group hover:border-brand transition-colors">
                  {formData.foto_capa ? <Image src={formData.foto_capa} alt="Capa" fill className="object-cover group-hover:brightness-75" sizes="(max-width: 768px) 100vw, 50vw" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-slate-400 text-sm">Adicionar imagem de capa</span></div>}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-8 h-8 text-white" /></div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'capa')} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Input label="Nome de Exibição" placeholder="Ex: Bella Beauty" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
              <Input label="WhatsApp (Com DDD)" placeholder="Ex: 11999990000" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem de Boas-vindas</label>
              <textarea value={formData.mensagem_boas_vindas} onChange={(e) => setFormData({ ...formData, mensagem_boas_vindas: e.target.value })} maxLength={200} placeholder="Ex: Bem-vinda! Agende com facilidade." className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:bg-white focus:outline-none focus:border-brand resize-none h-20 placeholder:text-slate-400" />
              <div className="text-right text-[11px] font-semibold text-slate-400 mt-1">{formData.mensagem_boas_vindas.length}/200 caracteres</div>
            </div>
          </div>
        </Card>

        {/* EXPEDIENTE POR DIA */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-brand" /> Expediente
          </h3>
          <p className="text-sm text-slate-500 mb-6">Configure horários específicos para cada dia da semana.</p>

          <div className="space-y-3">
            {(Object.keys(horariosPorDia) as DayKey[]).map((day) => {
              const cfg = horariosPorDia[day];
              return (
                <div key={day} className={`rounded-xl border transition-all ${cfg.ativo ? 'border-brand/30 bg-brand/5' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  {/* Header do dia */}
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => updateDia(day, 'ativo', !cfg.ativo)}>
                    <span className={`font-bold text-sm ${cfg.ativo ? 'text-brand' : 'text-slate-400'}`}>{DAY_LABELS[day]}</span>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${cfg.ativo ? 'text-brand' : 'text-slate-400'}`}>
                      {cfg.ativo ? (
                        <><ToggleRight className="w-6 h-6" /> Aberto</>
                      ) : (
                        <><ToggleLeft className="w-6 h-6" /> Fechado</>
                      )}
                    </div>
                  </div>

                  {/* Campos de horário — só mostra se ativo */}
                  {cfg.ativo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Abertura</label>
                        <input type="time" value={cfg.inicio} onChange={(e) => updateDia(day, 'inicio', e.target.value)}
                          className="w-full px-3 py-2 border border-brand/20 bg-white rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Fechamento</label>
                        <input type="time" value={cfg.fim} onChange={(e) => updateDia(day, 'fim', e.target.value)}
                          className="w-full px-3 py-2 border border-brand/20 bg-white rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Início Almoço</label>
                        <input type="time" value={cfg.almoco_inicio} onChange={(e) => updateDia(day, 'almoco_inicio', e.target.value)}
                          className="w-full px-3 py-2 border border-brand/20 bg-white rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Fim Almoço</label>
                        <input type="time" value={cfg.almoco_fim} onChange={(e) => updateDia(day, 'almoco_fim', e.target.value)}
                          className="w-full px-3 py-2 border border-brand/20 bg-white rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[12px] mt-4 flex gap-1.5 items-center font-medium bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 text-amber-700">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> O horário de almoço será bloqueado automaticamente na agenda pública.
          </p>
        </Card>

        {/* PREFERÊNCIAS */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-brand" /> Preferências da Agenda
          </h3>
          <p className="text-sm text-slate-500 mb-6">Regras e restrições para seus agendamentos via link.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tempo mínimo para agendamento</label>
              <p className="text-xs text-slate-500 mb-3">Clientes não poderão agendar com menos tempo de antecedência.</p>
              <select value={formData.antecedencia_minima} onChange={(e) => setFormData({ ...formData, antecedencia_minima: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand font-semibold text-slate-700 cursor-pointer">
                {Object.keys(antecedenciaMap).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Intervalo entre atendimentos</label>
              <p className="text-xs text-slate-500 mb-3">Tempo de descanso entre um atendimento e outro.</p>
              <select value={formData.intervalo_atendimentos} onChange={(e) => setFormData({ ...formData, intervalo_atendimentos: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand font-semibold text-slate-700 cursor-pointer">
                {Object.keys(intervaloMap).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* MENSAGEM WHATSAPP */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-brand" /> Mensagem WhatsApp
          </h3>
          <p className="text-sm text-slate-500 mb-6">Personalize a mensagem automática enviada ao interagir com atendimentos.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['{nome}', '{dia}', '{hora}', '{servico}', '{valor}'].map(v => (
              <button type="button" key={v} onClick={() => insertVariable(v)} className="px-3 py-1 bg-brand/10 text-brand text-[11px] font-bold rounded-lg hover:bg-brand hover:text-white transition-colors">{v}</button>
            ))}
          </div>
          <textarea ref={textAreaRef} value={formData.mensagem_padrao} onChange={(e) => setFormData({ ...formData, mensagem_padrao: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:bg-white focus:outline-none focus:border-brand h-28 resize-none mb-2 placeholder:text-slate-400" />
          <div className="flex justify-end mb-4">
            <button type="button" onClick={() => setFormData({ ...formData, mensagem_padrao: WHATSAPP_DEFAULT })} className="text-[12px] font-bold text-slate-400 hover:text-brand transition-colors">Restaurar padrão</button>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl relative">
            <div className="absolute -top-2.5 left-4 bg-slate-50 px-2 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pré-visualização</div>
            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">" {previewMessage} "</p>
          </div>
        </Card>

        {/* APARÊNCIA */}
        <Card className="p-6">
          <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-brand" /> Aparência da Página Pública
          </h3>
          <p className="text-sm text-slate-500 mb-6">Cor principal da sua página de agendamento.</p>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex gap-4">
              {['#7C3AED', '#EC4899', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444'].map(color => (
                <button type="button" key={color} onClick={() => setFormData({ ...formData, cor_tema: color })}
                  className={`w-[36px] h-[36px] rounded-full shrink-0 transition-all border-2 border-white ${formData.cor_tema === color ? 'scale-110 shadow-md ring-2' : 'hover:scale-110 opacity-80 shadow-sm'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex-1 w-full bg-slate-50 py-5 rounded-xl border border-slate-100 flex items-center justify-center">
              <button type="button" className="px-10 py-3 text-white text-sm font-bold rounded-lg shadow-lg cursor-default"
                style={{ backgroundColor: formData.cor_tema, boxShadow: `0 8px 20px -8px ${formData.cor_tema}` }}>
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </Card>

        <div className="sticky bottom-4 z-50 mt-10">
          <Button type="submit" variant="primary" className="w-full py-4 text-[16px] font-bold shadow-xl rounded-xl" disabled={isSaving}>
            {isSaving ? "Salvando configurações..." : "Salvar configurações"}
          </Button>
        </div>
      </form>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}