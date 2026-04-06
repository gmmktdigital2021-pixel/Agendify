"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, CalendarClock, Pencil } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";


interface HistoryItem {
  id: string;
  date: string;
  service: string;
  price: number;
  status: "confirmado" | "pendente" | "cancelado" | "concluido";
}

const mockHistory: HistoryItem[] = [
  { id: "h1", date: "02/04/2024", service: "Corte + Hidratação", price: 150, status: "concluido" },
  { id: "h2", date: "15/03/2024", service: "Corte", price: 80, status: "concluido" },
  { id: "h3", date: "05/02/2024", service: "Coloração", price: 200, status: "cancelado" },
];

export default function ClienteProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  // Mock data simulation based on ID
  const [client] = useState({
    id: params.id as string,
    name: params.id === "1" ? "Maria Silva" : params.id === "2" ? "Ana Souza" : "Cliente Exemplo",
    phone: "11999999999",
    createdAt: "10/01/2023",
  });

  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para clientes
      </button>

      {/* Profile Header */}
      <Card className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-brand/10" />
        <div className="relative mt-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-brand/20 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-brand">
                {client.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <p className="text-slate-500 mt-1">
              {client.phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")} • Cliente desde {client.createdAt}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <Button variant="secondary" className="flex-1 sm:flex-none gap-2">
              <Pencil className="w-4 h-4" /> Editar
            </Button>
            <Button 
              className="flex-1 sm:flex-none gap-2 bg-[#25D366] text-white hover:bg-green-600 border-none"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Histórico de Atendimentos</h3>
        <Button variant="primary" onClick={() => setIsSchedModalOpen(true)} className="gap-2 shadow-sm">
          <CalendarClock className="w-4 h-4" /> Agendar novamente
        </Button>
      </div>

      {/* History List */}
      <Card className="divide-y divide-slate-100">
        {mockHistory.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 text-center border-r border-slate-200 pr-4">
                <span className="block text-xs font-bold text-slate-500 uppercase">
                  {item.date.split('/')[1]}/{item.date.split('/')[2].slice(2, 4)}
                </span>
                <span className="block text-xl font-bold text-slate-800">
                  {item.date.split('/')[0]}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-800">{item.service}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={item.status} />
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {mockHistory.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Nenhum histórico encontrado para este cliente.
          </div>
        )}
      </Card>

      <Modal isOpen={isSchedModalOpen} onClose={() => setIsSchedModalOpen(false)} title="Novo Agendamento">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Agendando para <strong className="text-slate-800">{client.name}</strong>.
            (Implementação do fluxo de nova agenda...)
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setIsSchedModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setIsSchedModalOpen(false)}>Confirmar Horário</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
