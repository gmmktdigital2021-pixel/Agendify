"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, MessageCircle, Pencil, ArrowRight, RefreshCw, Trash2, X, Calendar as CalendarIcon, DollarSign, History, Save, User as UserIcon, Mail, Phone, CalendarDays } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { supabase, db } from "@/lib/supabase";

interface ClientRecord {
  id: string;
  salon_id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  observacoes?: string;
  created_at: string;
}

interface AppointmentHistory {
  id: string;
  data: string;
  hora_inicio: string;
  status: string;
  services: {
    nome: string;
    preco: number;
  } | null;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  
  // Delete Modal
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);

  // Drawer
  const [viewingClient, setViewingClient] = useState<ClientRecord | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [clientHistory, setClientHistory] = useState<AppointmentHistory[]>([]);
  const [obsText, setObsText] = useState("");
  const [isSavingObs, setIsSavingObs] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
    nome: "", 
    telefone: "",
    email: "",
    data_nascimento: "",
    observacoes: ""
  });
  const [salonId, setSalonId] = useState<string | null>(null);

  const fetchClients = useCallback(async (sid: string) => {
    try {
      const { data, error } = await db.clients.select('*').eq('salon_id', sid).order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data as ClientRecord[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Loader Init
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setIsLoading(false);
      
      const { data: salon } = await supabase.from('salons').select('id').eq('user_id', session.user.id).single();
      if (salon) {
        setSalonId(salon.id);
        fetchClients(salon.id);
      } else {
        setIsLoading(false);
      }
    }
    init();
  }, [fetchClients]);

  // 2. Realtime Listener for Auto-Clients (regra: Clientes Automáticos)
  useEffect(() => {
    if (!salonId) return;
    const channel = supabase
      .channel('realtime_clients')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clients',
        filter: `salon_id=eq.${salonId}`
      }, () => {
         fetchClients(salonId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [salonId, fetchClients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const name = c.nome?.toLowerCase() || '';
      const phone = c.telefone || '';
      return name.includes(search.toLowerCase()) || phone.includes(search);
    });
  }, [clients, search]);

  const openModal = (client?: ClientRecord) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        nome: client.nome || "", 
        telefone: client.telefone || "",
        email: client.email || "",
        data_nascimento: client.data_nascimento || "",
        observacoes: client.observacoes || ""
      });
    } else {
      setEditingClient(null);
      setFormData({ nome: "", telefone: "", email: "", data_nascimento: "", observacoes: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !salonId) return;

    try {
      if (editingClient) {
        const { error } = await db.clients.update(formData).eq("id", editingClient.id);
        if (error) throw error;
        setToastMsg("Cliente atualizado com sucesso!");
      } else {
        const { error } = await db.clients.insert({ ...formData, salon_id: salonId });
        if (error) throw error;
        setToastMsg("Cliente adicionado manualmente!");
      }
      fetchClients(salonId);
    } catch (error: unknown) {
      setToastMsg("Houve um erro de rede. Tente novamente.");
    } finally {
      closeModal();
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      const { error } = await db.clients.delete().eq('id', clientToDelete.id);
      if (error) throw error;
      setToastMsg("Cliente excluído com sucesso!");
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
    } catch (err: unknown) {
      setToastMsg("Erro ao excluir cliente.");
    } finally {
      setClientToDelete(null);
    }
  };

  const fetchClientDetails = async (client: ClientRecord) => {
    setViewingClient(client);
    setObsText(client.observacoes || "");
    setIsDrawerLoading(true);
    try {
      const { data, error } = await db.appointments.select(`
        id, data, hora_inicio, status,
        services ( nome, preco )
      `)
      .eq('client_id', client.id)
      .order('data', { ascending: false });
      
      if (error) throw error;
      setClientHistory((data as unknown) as AppointmentHistory[]);
    } catch (err: unknown) {
      setToastMsg("Erro ao buscar histórico do cliente.");
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setViewingClient(null);
    setClientHistory([]);
  };

  const handleSaveObs = async () => {
    if (!viewingClient) return;
    setIsSavingObs(true);
    try {
      const { error } = await db.clients.update({ observacoes: obsText }).eq('id', viewingClient.id);
      if (error) throw error;
      setToastMsg("Observações salvas com sucesso!");
      setClients(prev => prev.map(c => c.id === viewingClient.id ? { ...c, observacoes: obsText } : c));
      setViewingClient({ ...viewingClient, observacoes: obsText });
    } catch (err: unknown) {
      setToastMsg("Erro ao salvar observações.");
    } finally {
      setIsSavingObs(false);
    }
  };

  const formatVisitDate = (isoString: string) => {
     if (!isoString) return "Desconhecido";
     const d = new Date(isoString);
     return d.toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // Drawer Metrics
  const totalAgendamentos = clientHistory.length;
  const validHistory = clientHistory.filter(h => h.status !== 'cancelado');
  const totalGasto = validHistory.reduce((acc, h) => acc + (h.services?.preco || 0), 0);
  const lastAppointment = clientHistory.length > 0 ? clientHistory[0] : null;
  const last5 = clientHistory.slice(0, 5);

  const statusColors: Record<string, string> = {
    confirmado: "bg-green-500",
    pendente: "bg-amber-500",
    cancelado: "bg-red-500",
    concluido: "bg-slate-400"
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Meus Clientes
            {isLoading && <RefreshCw className="w-4 h-4 text-brand animate-spin" />}
        </h2>
        <Button variant="primary" onClick={() => openModal()} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <Card className="p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && clients.length === 0 ? (
           <div className="p-12 text-center text-slate-500">Buscando inteligência de clientes...</div>
        ) : (
            filteredClients.map(client => (
            <Card key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div onClick={() => fetchClientDetails(client)} className="flex items-center gap-4 cursor-pointer group w-full sm:w-auto flex-1">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                        <span className="font-bold text-brand">{getInitials(client.nome)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-brand text-lg transition-colors flex items-center gap-2">
                            {client.nome} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-brand" />
                        </span>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            {client.telefone && <span>{client.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")}</span>}
                            {client.telefone && <span>•</span>}
                            <span>Interação: {formatVisitDate(client.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            const tel = client.telefone?.replace(/\D/g,'');
                            if(tel) window.open(`https://wa.me/55${tel}`, '_blank');
                            else setToastMsg("Telefone em branco!");
                        }}
                        className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 gap-1.5"
                    >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>
                    <Button 
                        variant="secondary" 
                        onClick={() => openModal(client)}
                        className="text-slate-600 border-slate-300 px-3"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setClientToDelete(client)}
                        className="text-red-500 bg-red-50 hover:bg-red-100 px-3"
                        title="Excluir Cliente"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
            ))
        )}

        {!isLoading && filteredClients.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
            Nenhum cliente retornado do servidor.
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Cliente */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input 
            label="Nome do cliente *" 
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required 
            placeholder="Ex: Maria Silva"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Input 
               label="Telefone (WhatsApp)" 
               value={formData.telefone}
               onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, "")})}
               placeholder="Ex: 11999999999"
             />
             <Input 
               label="Data de nascimento (opicional)" 
               type="date"
               value={formData.data_nascimento}
               onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
             />
          </div>
          <Input 
            label="E-mail (opcional)" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="cliente@email.com"
          />
          <div className="flex flex-col gap-1">
             <label className="text-sm font-bold text-slate-700">Observações (opcional)</label>
             <textarea 
                rows={3}
                placeholder="Ex: alérgica a amônia, prefere terças..."
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal resize-none"
             />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" variant="primary">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal 
        isOpen={!!clientToDelete} 
        onClose={() => setClientToDelete(null)} 
        title="Confirmar exclusão"
      >
        <div className="flex flex-col gap-6">
           <p className="text-slate-600">
             Tem certeza que deseja excluir <strong>{clientToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
           </p>
           <div className="flex justify-end gap-2">
              <Button onClick={() => setClientToDelete(null)} variant="secondary" className="text-slate-600 border-slate-300 hover:bg-slate-50">
                 Cancelar
              </Button>
              <Button onClick={confirmDelete} variant="primary" className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-500/20">
                 Excluir
              </Button>
           </div>
        </div>
      </Modal>

      {/* Drawer da Ficha do Cliente */}
      {viewingClient && (
         <>
            {/* Overlay */}
            <div 
               className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in" 
               onClick={closeDrawer}
            />
            {/* Drawer Panel */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
               {/* Ficha Header */}
               <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {getInitials(viewingClient.nome)}
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-800">{viewingClient.nome}</h2>
                        <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full inline-block mt-1">Ficha Completa</span>
                     </div>
                  </div>
                  <button onClick={closeDrawer} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Ficha Body (Scrollable) */}
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  
                  {/* Informações Pessoais */}
                  <div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Informações</h3>
                     <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div>
                           <p className="text-slate-500 mb-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp</p>
                           <p className="font-bold text-slate-800">{viewingClient.telefone ? viewingClient.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3") : "-"}</p>
                        </div>
                        <div>
                           <p className="text-slate-500 mb-0.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-mail</p>
                           <p className="font-bold text-slate-800 break-words">{viewingClient.email || "-"}</p>
                        </div>
                        <div>
                           <p className="text-slate-500 mb-0.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Nascimento</p>
                           <p className="font-bold text-slate-800">{viewingClient.data_nascimento ? formatVisitDate(viewingClient.data_nascimento + "T00:00:00") : "-"}</p>
                        </div>
                     </div>
                  </div>

                  {/* Dashboard Metrics */}
                  <div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Relacionamento</h3>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                           <p className="text-green-600/80 text-xs font-bold truncate mb-1">Total Gasto</p>
                           <p className="text-2xl font-extrabold text-green-700">
                             {isDrawerLoading ? "..." : `R$ ${totalGasto.toFixed(2).replace('.', ',')}`}
                           </p>
                        </div>
                        <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10">
                           <p className="text-brand/80 text-xs font-bold truncate mb-1">Agendamentos</p>
                           <p className="text-2xl font-extrabold text-brand">
                              {isDrawerLoading ? "..." : totalAgendamentos}
                           </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between">
                           <div>
                              <p className="text-slate-500 text-xs font-bold mb-1">Última Visita</p>
                              <p className="text-base font-bold text-slate-800">
                                 {isDrawerLoading ? "..." : (lastAppointment ? formatVisitDate(lastAppointment.data + "T00:00:00") : "Nenhuma")}
                              </p>
                           </div>
                           <CalendarIcon className="w-8 h-8 text-slate-300" />
                        </div>
                     </div>
                  </div>

                  {/* Observações */}
                  <div>
                     <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Pencil className="w-4 h-4" /> Observações</h3>
                        {obsText !== (viewingClient.observacoes || "") && (
                           <Button onClick={handleSaveObs} variant="primary" className="h-7 text-xs px-3 gap-1 shadow-sm" disabled={isSavingObs}>
                              <Save className="w-3 h-3" /> {isSavingObs ? "Salvando..." : "Salvar"}
                           </Button>
                        )}
                     </div>
                     <textarea 
                        rows={4}
                        className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all font-medium text-slate-700 placeholder:text-slate-400 placeholder:font-normal resize-none"
                        placeholder="Nenhuma observação informada. Digite aqui preferências do cliente, alergias..."
                        value={obsText}
                        onChange={(e) => setObsText(e.target.value)}
                     />
                  </div>

                  {/* Últimos Atendimentos */}
                  <div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Últimos Atendimentos</h3>
                     {isDrawerLoading ? (
                        <div className="flex justify-center p-6"><RefreshCw className="w-6 h-6 text-brand animate-spin" /></div>
                     ) : last5.length > 0 ? (
                        <div className="space-y-3">
                           {last5.map(app => (
                              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 text-sm">{app.services?.nome || "Serviço Avulso"}</span>
                                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                                       {formatVisitDate(app.data + "T00:00:00")} às {app.hora_inicio.substring(0,5)}
                                    </span>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <span className="font-extrabold text-brand text-sm">R$ {app.services?.preco?.toFixed(2).replace('.', ',') || '0,00'}</span>
                                    <span className={`px-2 py-[2px] rounded-full text-[9px] font-bold text-white shadow-sm inline-block ${statusColors[app.status] || 'bg-slate-400'}`}>
                                       {app.status.toUpperCase()}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center bg-slate-50 border border-slate-100 rounded-xl p-6">
                           <p className="text-sm font-medium text-slate-400">Nenhum agendamento encontrado.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
