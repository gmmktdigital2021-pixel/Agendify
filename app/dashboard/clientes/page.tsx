"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, MessageCircle, Pencil, ArrowRight, RefreshCw } from "lucide-react";
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
  created_at: string; // Estamos usando como "lastVisit" genérico
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ nome: "", telefone: "" });
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
      setFormData({ nome: client.nome, telefone: client.telefone });
    } else {
      setEditingClient(null);
      setFormData({ nome: "", telefone: "" });
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
    } catch {
      setToastMsg("Houve um erro de rede. Tente novamente.");
    } finally {
      closeModal();
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
                <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-brand">{getInitials(client.nome)}</span>
                </div>
                <div className="flex flex-col">
                    <Link href="#" className="font-bold text-slate-800 hover:text-brand text-lg transition-colors flex items-center gap-2 group cursor-default">
                    {client.nome} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                    {client.telefone && <span>{client.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")}</span>}
                    {client.telefone && <span>•</span>}
                    <span>Interação: {formatVisitDate(client.created_at)}</span>
                    </div>
                </div>
                </div>

                <div className="flex items-center gap-2">
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
                    className="text-slate-600 border-slate-300 gap-1.5"
                >
                    <Pencil className="w-4 h-4" /> Editar
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
          <Input 
            label="Telefone (WhatsApp)" 
            value={formData.telefone}
            onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, "")})}
            placeholder="Ex: 11999999999"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" variant="primary">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
