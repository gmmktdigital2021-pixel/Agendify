"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
}

export default function MinhaAgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalName, setProfessionalName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: pro } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!pro) return;
      setProfessionalName(pro.name);

      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", pro.id)
        .eq("date", selectedDate)
        .order("time");

      setAppointments(appts || []);
      setLoading(false);
    };
    init();
  }, [supabase, selectedDate]);

  const updateStatus = async (appointmentId: string, status: string) => {
    await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId);
    
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, status } : a
    ));
  };

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    confirmado: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    pendente: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
    cancelado: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    concluido: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
          {professionalName && (
            <p className="text-purple-600 text-sm mt-1">{professionalName}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-purple-600" />
            <label className="font-medium text-gray-700">Data:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum agendamento para esta data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm w-16">
                    <Clock size={14} />
                    {apt.time}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {apt.client_name}
                    </p>
                    <p className="text-sm text-gray-500">{apt.service_name}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className={`w-fit text-xs font-medium px-3 py-1 rounded-full ${statusColors[apt.status] || "bg-gray-100 text-gray-600"}`}>
                    {apt.status === "confirmed" || apt.status === "confirmado" ? "Confirmado" 
                     : apt.status === "pending" || apt.status === "pendente" ? "Pendente" 
                     : apt.status === "completed" || apt.status === "concluido" ? "Concluído" 
                     : "Cancelado"}
                  </span>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center gap-2 mt-1">
                    {(apt.status === "pendente" || apt.status === "pending") && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, "confirmed")}
                          className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "canceled")}
                          className="flex items-center gap-1 bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                        >
                          ✗ Cancelar
                        </button>
                      </>
                    )}
                    {(apt.status === "confirmed" || apt.status === "confirmado") && (
                      <button
                        onClick={() => updateStatus(apt.id, "completed")}
                        className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                      >
                        ✓ Concluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
