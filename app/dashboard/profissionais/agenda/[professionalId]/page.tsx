"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

export default function ProfessionalAgendaPage() {
  const params = useParams();
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: pro } = await supabase
        .from("professionals")
        .select("*")
        .eq("id", params.professionalId)
        .single();
      setProfessional(pro);

      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", params.professionalId)
        .eq("date", selectedDate)
        .order("time");
      setAppointments(appts || []);
      setLoading(false);
    };
    init();
  }, [supabase, params.professionalId, selectedDate]);

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/profissionais")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft size={16} /> Voltar para profissionais
        </button>

        {professional && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-xl">
              {professional.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{professional.name}</h1>
              <p className="text-purple-600 text-sm">{professional.specialty}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-purple-600" />
            <label className="font-medium text-gray-700">Selecionar data:</label>
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
              <div key={apt.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
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
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[apt.status] || "bg-gray-100 text-gray-600"}`}>
                  {apt.status === "confirmed" ? "Confirmado" : apt.status === "pending" ? "Pendente" : "Cancelado"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
