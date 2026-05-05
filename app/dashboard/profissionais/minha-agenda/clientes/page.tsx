"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Users, Phone, Calendar, Search } from "lucide-react";

interface Client {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  service_name: string;
}

export default function MeusClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!pro) { setLoading(false); return; }
      setProfessionalId(pro.id);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, client_name, client_phone, date, time, service_name")
        .eq("professional_id", pro.id)
        .order("date", { ascending: false });

      // Remove duplicatas por telefone mantendo o mais recente
      const uniqueClients = appointments?.reduce((acc: Client[], curr) => {
        const exists = acc.find(c => c.client_phone === curr.client_phone);
        if (!exists) acc.push(curr);
        return acc;
      }, []) || [];

      setClients(uniqueClients);
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const filtered = clients.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Clientes que já agendaram com você</p>
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {search ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Os clientes aparecerão aqui após o primeiro agendamento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <div key={client.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg">
                    {client.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.client_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone size={12} /> {client.client_phone}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-purple-600 mt-0.5">
                      <Calendar size={11} /> Último: {client.date} às {client.time} — {client.service_name}
                    </span>
                  </div>
                </div>
                
                <a
                  href={`https://wa.me/55${client.client_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
