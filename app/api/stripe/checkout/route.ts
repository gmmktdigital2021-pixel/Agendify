import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
  });

  try {
    const { priceId, userId, userEmail, planId } = await req.json();

    if (!priceId || !userId || !userEmail || !planId) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    // Identifica se é pagamento avulso (Pix/Boleto)
    const isAvulso = planId.includes('pix') || 
                     priceId === process.env.STRIPE_PRICE_PRO_PIX || 
                     priceId === process.env.STRIPE_PRICE_PREMIUM_PIX;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: isAvulso ? ['pix', 'boleto'] : ['card'],
      mode: isAvulso ? 'payment' : 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/landing#precos`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Erro no checkout:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão de checkout' }, { status: 500 });
  }
}
