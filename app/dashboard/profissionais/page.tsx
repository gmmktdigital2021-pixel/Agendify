"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Trash2, Mail, CheckCircle, Clock, User } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  active: boolean;
  invite_accepted: boolean;
  avatar_url: string | null;
}

export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [form, setForm] = useState({ name: "", email: "", specialty: "" });

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("user_id", session.user.id)
        .single();
      setPlan(sub?.plan_id || "free");

      const { data } = await supabase
        .from("professionals")
        .select("*")
        .eq("salon_id", session.user.id)
        .order("created_at", { ascending: false });
      setProfessionals(data || []);
      setLoading(false);
    };
    init();
  }, [supabase]);

  const handleInvite = async () => {
    if (!form.name || !form.email || !userId) return;
    if (professionals.length >= 5) {
      alert("Limite de 5 profissionais atingido no plano Premium.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/professionals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salonId: userId }),
      });
      const data = await response.json();
      if (data.error) { alert("Erro: " + data.error); return; }
      setProfessionals(prev => [data.professional, ...prev]);
      setForm({ name: "", email: "", specialty: "" });
      setShowForm(false);
      alert("Convite enviado com sucesso!");
    } catch {
      alert("Erro ao enviar convite.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este profissional?")) return;
    await supabase.from("professionals").delete().eq("id", id);
    setProfessionals(prev => prev.filter(p => p.id !== id));
  };

  if (plan !== "premium") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
          <p className="text-gray-500 mb-6">Múltiplos profissionais está disponível apenas no plano Premium.</p>
          <a href="/dashboard/planos" className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
            Fazer upgrade
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
            <p className="text-gray-500 text-sm mt-1">{professionals.length}/5 profissionais cadastrados</p>
          </div>
          {professionals.length < 5 && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 transition"
            >
              <Plus size={16} /> Convidar profissional
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Novo profissional</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nome completo"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Especialidade (ex: Cabeleireiro)"
                value={form.specialty}
                onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleInvite}
                disabled={sending}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Mail size={14} />
                {sending ? "Enviando..." : "Enviar convite"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <User size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum profissional cadastrado ainda.</p>
            <p className="text-gray-400 text-sm mt-1">Convide seu primeiro profissional!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {professionals.map(pro => (
              <div key={pro.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg">
                    {pro.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pro.name}</p>
                    <p className="text-sm text-gray-500">{pro.email}</p>
                    {pro.specialty && <p className="text-xs text-purple-600 mt-0.5">{pro.specialty}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {pro.invite_accepted ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle size={14} /> Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                      <Clock size={14} /> Convite pendente
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(pro.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
