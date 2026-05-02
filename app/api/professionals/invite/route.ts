import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, email, specialty, salonId } = await req.json();

    if (!name || !email || !salonId) {
      return NextResponse.json(
        { error: "name, email e salonId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica limite de 5 profissionais
    const { count } = await supabase
      .from("professionals")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salonId);

    if ((count || 0) >= 5) {
      return NextResponse.json(
        { error: "Limite de 5 profissionais atingido no plano Premium" },
        { status: 400 }
      );
    }

    // Verifica se email já foi convidado
    const { data: existing } = await supabase
      .from("professionals")
      .select("id")
      .eq("salon_id", salonId)
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já foi convidado" },
        { status: 400 }
      );
    }

    // Gera token de convite
    const inviteToken = crypto.randomUUID();

    // Cria o profissional
    const { data: professional, error } = await supabase
      .from("professionals")
      .insert({
        salon_id: salonId,
        name,
        email,
        specialty: specialty || null,
        invite_token: inviteToken,
        invite_accepted: false,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Envia convite por email via Supabase Auth
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://agendify-plpd.vercel.app"}/convite?token=${inviteToken}&salon=${salonId}`;

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteUrl,
        data: {
          professional_id: professional.id,
          salon_id: salonId,
          invite_token: inviteToken,
          role: "professional",
        },
      }
    );

    if (inviteError) {
      console.error("Erro ao enviar convite:", inviteError.message);
      // Não falha — profissional foi criado, convite pode ser reenviado
    }

    return NextResponse.json({ professional });
  } catch (err: any) {
    console.error("Erro ao convidar profissional:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
