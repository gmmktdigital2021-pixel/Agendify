export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // Usa o Service Role Key para ignorar Row Level Security (RLS) no webhook
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed.', msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (session.mode === 'subscription') {
          // Assinatura via cartão
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          
          if (userId && subscriptionId) {
             await supabaseAdmin.from('subscriptions').upsert({
                user_id: userId,
                plan_id: planId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: 'active',
                updated_at: new Date().toISOString()
             }, { onConflict: 'user_id' });
          }
        } else if (session.mode === 'payment' && session.payment_status === 'paid') {
          // Pagamento avulso (Pix/Boleto)
          if (userId && planId) {
             const now = new Date();
             const end = new Date();
             end.setFullYear(now.getFullYear() + 1); // Assumindo Pix como plano Anual
             
             await supabaseAdmin.from('subscriptions').upsert({
                user_id: userId,
                plan_id: planId,
                stripe_customer_id: (session.customer as string) || null,
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: end.toISOString(),
                cancel_at_period_end: false,
                updated_at: now.toISOString()
             }, { onConflict: 'user_id' });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subId = subscription.id;
        const status = subscription.status;
        const current_period_start = subscription.items?.data?.[0]
          ? new Date((subscription.items.data[0] as any).current_period_start * 1000).toISOString()
          : null;
        const current_period_end = subscription.items?.data?.[0]
          ? new Date((subscription.items.data[0] as any).current_period_end * 1000).toISOString()
          : null;
        const cancel_at_period_end = subscription.cancel_at_period_end;
        
        await supabaseAdmin.from('subscriptions').update({
           status,
           current_period_start,
           current_period_end,
           cancel_at_period_end,
           updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subId = subscription.id;
        
        await supabaseAdmin.from('subscriptions').update({
           plan_id: 'free',
           status: 'canceled',
           cancel_at_period_end: false,
           updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subId);
        break;
      }
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
