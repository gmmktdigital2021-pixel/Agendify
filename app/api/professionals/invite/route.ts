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

    // Verifica se email já foi convidado neste salão
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

    // Gera token de convite único
    const inviteToken = crypto.randomUUID();
    const appUrl = "https://agendify-plpd.vercel.app";
    const inviteUrl = `${appUrl}/convite?token=${inviteToken}&salon=${salonId}`;

    // Cria o profissional no banco
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

    // Busca dados do salão para personalizar o e-mail
    const { data: salon } = await supabase
      .from("salons")
      .select("nome")
      .eq("user_id", salonId)
      .single();

    const salonName = salon?.nome || "Agendify";

    // Tenta convidar via Supabase Auth (para novos usuários)
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: inviteUrl,
        data: {
          professional_id: professional.id,
          salon_id: salonId,
          invite_token: inviteToken,
          role: "professional",
          full_name: name,
        },
      }
    );

    // Se usuário já existe, envia e-mail customizado via Resend
    if (inviteError) {
      console.log("Usuário já existe, enviando e-mail via Resend...");

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Agendify <onboarding@resend.dev>",
            to: [email],
            subject: `Você foi convidado para trabalhar no ${salonName}!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #7c3aed; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Agendify</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                  <h2 style="color: #111827;">Olá, ${name}! 👋</h2>
                  <p style="color: #6b7280; font-size: 16px;">
                    Você foi convidado para fazer parte da equipe do <strong>${salonName}</strong> no Agendify.
                  </p>
                  <p style="color: #6b7280; font-size: 16px;">
                    Clique no botão abaixo para aceitar o convite e acessar sua agenda:
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" 
                       style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Aceitar convite
                    </a>
                  </div>
                  <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                    Se não conseguir clicar no botão, copie e cole este link no navegador:<br/>
                    <a href="${inviteUrl}" style="color: #7c3aed;">${inviteUrl}</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });
      }
    }

    return NextResponse.json({ professional });
  } catch (err: any) {
    console.error("Erro ao convidar profissional:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
