"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, MessageCircle, Pencil, ArrowRight } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
}

const mockClients: Client[] = [
  { id: "1", name: "Maria Silva", phone: "11999999999", lastVisit: "02/04/2024" },
  { id: "2", name: "Ana Souza", phone: "11988888888", lastVisit: "30/03/2024" },
  { id: "3", name: "Carla Mendes", phone: "11977777777", lastVisit: "15/04/2024" },
];

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [toastMsg, setToastMsg] = useState("");

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [clients, search]);

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, phone: client.phone });
    } else {
      setEditingClient(null);
      setFormData({ name: "", phone: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingClient) {
        // Edit mode (Mock)
        setClients(prev => prev.map(c => 
          c.id === editingClient.id ? { ...c, ...formData } : c
        ));
        setToastMsg("Cliente atualizado com sucesso!");
        // Supabase Mock
        try {
          await supabase.from("clients").update(formData).eq("id", editingClient.id);
        } catch (error) {
          console.error(error);
        }
      } else {
        // Create mode (Mock)
        const novo = {
          id: Math.random().toString(36).substr(2, 9),
          ...formData,
          lastVisit: "Nunca",
        };
        setClients(prev => [novo, ...prev]);
        setToastMsg("Cliente adicionado com sucesso!");
        // Supabase Mock
        try {
          await supabase.from("clients").insert([novo]);
        } catch (error) {
          console.error(error);
        }
      }
    } finally {
      closeModal();
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
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
        {filteredClients.map(client => (
          <Card key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="font-bold text-brand">{getInitials(client.name)}</span>
              </div>
              <div className="flex flex-col">
                <Link href={`/dashboard/clientes/${client.id}`} className="font-bold text-slate-800 hover:text-brand text-lg transition-colors flex items-center gap-2 group">
                  {client.name} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{client.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</span>
                  <span>•</span>
                  <span>Último atendimento: {client.lastVisit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => window.open(`https://wa.me/55${client.phone.replace(/\D/g,'')}`, '_blank')}
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
        ))}

        {filteredClients.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100">
            Nenhum cliente encontrado.
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
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required 
            placeholder="Ex: Maria Silva"
          />
          <Input 
            label="Telefone (WhatsApp)" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="Ex: 11999999999"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" variant="primary">Salvar</Button>
          </div>
        </form>
      </Modal>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
