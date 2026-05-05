"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Clock, Save, Loader2 } from "lucide-react";

const DAYS = [
  { key: "seg", label: "Segunda-feira" },
  { key: "ter", label: "Terça-feira" },
  { key: "qua", label: "Quarta-feira" },
  { key: "qui", label: "Quinta-feira" },
  { key: "sex", label: "Sexta-feira" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
}

type Schedule = Record<string, DaySchedule>;

export default function HorariosPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule>({
    seg: { active: true, start: "08:00", end: "18:00" },
    ter: { active: true, start: "08:00", end: "18:00" },
    qua: { active: true, start: "08:00", end: "18:00" },
    qui: { active: true, start: "08:00", end: "18:00" },
    sex: { active: true, start: "08:00", end: "18:00" },
    sab: { active: false, start: "08:00", end: "13:00" },
    dom: { active: false, start: "08:00", end: "12:00" },
  });
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState(60);

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
        .select("id, schedule, default_duration")
        .eq("user_id", session.user.id)
        .single();

      if (pro) {
        setProfessionalId(pro.id);
        if (pro.schedule) setSchedule(pro.schedule);
        if (pro.default_duration) setDefaultDuration(pro.default_duration);
      }
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!professionalId) return;
    setSaving(true);
    try {
      await supabase
        .from("professionals")
        .update({ schedule, default_duration: defaultDuration, updated_at: new Date().toISOString() })
        .eq("id", professionalId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const updateTime = (day: string, field: "start" | "end", value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Horários</h1>
            <p className="text-gray-500 text-sm mt-1">Configure seus dias e horários de atendimento</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saved ? "Salvo! ✓" : "Salvar"}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-1">Duração padrão dos atendimentos</h3>
          <p className="text-gray-500 text-sm mb-3">Tempo médio de cada serviço que você realiza</p>
          <select
            value={defaultDuration}
            onChange={e => setDefaultDuration(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-48"
          >
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>1 hora</option>
            <option value={90}>1h30</option>
            <option value={120}>2 horas</option>
          </select>
        </div>

        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day.key} className={`bg-white rounded-2xl p-5 shadow-sm border transition ${schedule[day.key].active ? "border-purple-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(day.key)}
                    className={`w-11 h-6 rounded-full transition-colors ${schedule[day.key].active ? "bg-purple-600" : "bg-gray-200"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${schedule[day.key].active ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                  <span className="font-medium text-gray-900">{day.label}</span>
                </div>

                {schedule[day.key].active && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <input
                      type="time"
                      value={schedule[day.key].start}
                      onChange={e => updateTime(day.key, "start", e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-400 text-sm">até</span>
                    <input
                      type="time"
                      value={schedule[day.key].end}
                      onChange={e => updateTime(day.key, "end", e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {!schedule[day.key].active && (
                  <span className="text-sm text-gray-400">Folga</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
