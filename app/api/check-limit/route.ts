import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LIMITS = {
  free: { appointments: 20, clients: 5, services: 20 },
  pro: { appointments: 30, clients: 30, services: 10 },
  premium: { appointments: Infinity, clients: Infinity, services: Infinity },
};

export async function POST(req: NextRequest) {
  try {
    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json({ error: "userId e type obrigatórios" }, { status: 400 });
    }

    // Busca plano do usuário
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .single();

    const plan = (sub?.plan_id as keyof typeof PLAN_LIMITS) || "free";
    const limit = PLAN_LIMITS[plan][type as keyof typeof PLAN_LIMITS["free"]];

    // Conta registros atuais
    let count = 0;
    if (type === "appointments") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: c } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", userId)
        .gte("created_at", startOfMonth.toISOString());
      count = c || 0;
    } else if (type === "clients") {
      const { count: c } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", userId);
      count = c || 0;
    } else if (type === "services") {
      const { count: c } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("salon_id", userId);
      count = c || 0;
    }

    const allowed = limit === Infinity || count < limit;

    return NextResponse.json({
      allowed,
      current: count,
      limit: limit === Infinity ? -1 : limit,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
