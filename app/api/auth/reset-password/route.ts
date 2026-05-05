import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    // Gera link de recuperação via Supabase Admin
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://agendify-plpd.vercel.app/reset-password",
      },
    });

    if (error) throw error;

    const resetUrl = data?.properties?.action_link;
    if (!resetUrl) throw new Error("Link não gerado");

    // Envia e-mail via Gmail
    await transporter.sendMail({
      from: `"Agendify" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Redefinição de senha — Agendify",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #7c3aed; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✂️ Agendify</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827;">Redefinição de senha</h2>
            <p style="color: #6b7280; font-size: 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta no Agendify.
            </p>
            <p style="color: #6b7280; font-size: 16px;">
              Clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Redefinir senha
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Se não solicitou a redefinição, ignore este e-mail.<br/>
              Este link expira em 1 hora.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Agendify — Plataforma de agendamento para profissionais de beleza
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao enviar e-mail de recuperação:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
