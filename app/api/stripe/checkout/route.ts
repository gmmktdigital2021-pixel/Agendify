import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, userId, userEmail, planId } = body;

    console.log("🔑 Stripe checkout request:", { priceId, userId, userEmail, planId });

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "priceId e userId são obrigatórios" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY não configurada");
      return NextResponse.json(
        { error: "Configuração de pagamento incompleta" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planos?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planos?canceled=true`,
      customer_email: userEmail,
      metadata: { userId, planId },
      locale: "pt-BR",
    });

    console.log("✅ Stripe session criada:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe error:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
