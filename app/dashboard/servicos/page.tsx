"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

const mockServices: Service[] = [
  { id: "1", name: "Corte Feminino", durationMin: 60, price: 80.00 },
  { id: "2", name: "Progressiva", durationMin: 120, price: 250.00 },
  { id: "3", name: "Coloração Raiz", durationMin: 90, price: 150.00 },
  { id: "4", name: "Manicure Clássica", durationMin: 45, price: 35.00 },
];

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetService, setTargetService] = useState<Service | null>(null);
  
  // Form Logic
  const [formData, setFormData] = useState({ name: "", durationMin: 45, price: 0.00 });
  const [toastMsg, setToastMsg] = useState("");

  const openFormModal = (service?: Service) => {
    if (service) {
      setTargetService(service);
      setFormData({ name: service.name, durationMin: service.durationMin, price: service.price });
    } else {
      setTargetService(null);
      setFormData({ name: "", durationMin: 60, price: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteOpen(false);
    setTargetService(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.durationMin <= 0) return;

    try {
      if (targetService) {
        setServices(prev => prev.map(s => 
          s.id === targetService.id ? { ...s, ...formData } : s
        ));
        setToastMsg("Serviço atualizado com sucesso.");
        try {
          await supabase.from("services").update(formData).eq("id", targetService.id);
        } catch (error) {
          console.error(error);
        }
      } else {
        const novo = { id: Math.random().toString(), ...formData };
        setServices([...services, novo]);
        setToastMsg("Novo serviço criado.");
        try {
          await supabase.from("services").insert([novo]);
        } catch (error) {
          console.error(error);
        }
      }
    } finally {
      closeModals();
    }
  };

  const confirmDelete = async () => {
    if (!targetService) return;
    try {
      setServices(prev => prev.filter(s => s.id !== targetService.id));
      setToastMsg("Serviço excluído com sucesso.");
      try {
        await supabase.from("services").delete().eq("id", targetService.id);
      } catch (error) {
        console.error(error);
      }
    } finally {
      closeModals();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Serviços</h2>
          <p className="text-slate-500 text-sm mt-1">
            Defina seus serviços e as durações para refletirem nos slots da agenda.
          </p>
        </div>
        <Button variant="primary" onClick={() => openFormModal()} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="p-5 flex flex-col justify-between group hover:shadow-md transition-shadow border-t-4 border-t-brand">
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-4">{service.name}</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-600 text-sm bg-slate-50 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 text-brand" />
                  <span className="font-medium text-slate-900">{service.durationMin} min</span> de duração
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm bg-slate-50 px-3 py-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-slate-900">R$ {service.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
              <Button 
                variant="secondary" 
                className="flex-1 text-slate-700 bg-white border-slate-200"
                onClick={() => openFormModal(service)}
              >
                <Pencil className="w-4 h-4 mr-1.5" /> Editar
              </Button>
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                title="Excluir"
                onClick={() => { setTargetService(service); setIsDeleteOpen(true); }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          Você não possui nenhum serviço cadastrado. <br/>
          <button onClick={() => openFormModal()} className="text-brand font-medium hover:underline mt-2">Clique aqui para criar o primeiro.</button>
        </Card>
      )}

      {/* Modal NOVO/EDITAR */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModals} 
        title={targetService ? "Editar Serviço" : "Novo Serviço"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input 
            label="Nome do Serviço" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required 
            placeholder="Ex: Corte Degrade"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Duração (min)" 
              type="number"
              min="5"
              step="5"
              value={formData.durationMin}
              onChange={(e) => setFormData({...formData, durationMin: parseInt(e.target.value) || 0})}
              required 
            />
            <Input 
              label="Preço Inicial (R$)" 
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              required 
            />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2 flex gap-3 text-sm text-blue-800">
            <span className="font-bold mt-0.5">ℹ</span>
            <p><strong>Atenção:</strong> A duração estipulada aqui será usada pelo Agendify para calcular o fim do espaço na agenda para evitar confrontos.</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={closeModals}>Cancelar</Button>
            <Button type="submit" variant="primary">Salvar Serviço</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação EXCLUSÃO */}
      <Modal isOpen={isDeleteOpen} onClose={closeModals} title="Atenção!">
        <div className="space-y-4">
          <p className="text-slate-600">
            Tem certeza que deseja excluir o serviço <strong>{targetService?.name}</strong>? 
            Isso não apagará os agendamentos já criados com ele no passado.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={closeModals}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir Serviço</Button>
          </div>
        </div>
      </Modal>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
