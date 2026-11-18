import Stripe from 'stripe';
import { config } from './config.js';
import {
  applySubscriptionState,
  confirmBookingPayment,
  findUserByStripeCustomer,
  findUserById,
  hasProcessedStripeEvent,
  markStripeEventProcessed,
} from './store.js';

let client: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!config.stripe.secretKey) return null;
  client ??= new Stripe(config.stripe.secretKey);
  return client;
}

/**
 * Estados de Stripe que conservan Premium. `past_due` mantiene el acceso mientras
 * Stripe reintenta el cobro (decisión de producto: quítalo para cortar de inmediato).
 */
const ENTITLED_STATUSES = new Set<string>(['active', 'trialing', 'past_due']);
export const isEntitled = (status: string) => ENTITLED_STATUSES.has(status);

const idOf = (value: string | { id: string } | null | undefined): string | undefined =>
  typeof value === 'string' ? value : value?.id;

export type FulfillmentResult =
  | { ok: true; kind: 'premium' | 'booking' }
  | { ok: false; reason: string };

/**
 * Concede lo comprado en una Checkout Session. Se usa tanto desde el webhook
 * (fuente de verdad) como desde /verifyStripeSession (confirmación inmediata al
 * volver del pago); ambas rutas aplican exactamente las mismas comprobaciones
 * y son idempotentes.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  eventAt: number,
): Promise<FulfillmentResult> {
  if (session.payment_status !== 'paid') return { ok: false, reason: `payment_status=${session.payment_status}` };
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  if (!userId || !findUserById(userId)) return { ok: false, reason: 'unknown_user' };

  if (metadata.kind === 'premium') {
    const stripe = getStripe();
    if (session.mode !== 'subscription' || !stripe) return { ok: false, reason: 'invalid_premium_session' };
    const subscriptionId = idOf(session.subscription as string | Stripe.Subscription | null);
    if (!subscriptionId) return { ok: false, reason: 'missing_subscription' };
    // Estado en vivo: si ya la cancelaron, volver a la URL de éxito NO debe reactivar Premium.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    applySubscriptionState(userId, {
      entitled: isEntitled(subscription.status),
      customerId: idOf(subscription.customer as string | Stripe.Customer | null),
      subscriptionId: subscription.id,
      eventAt,
    });
    return isEntitled(subscription.status)
      ? { ok: true, kind: 'premium' }
      : { ok: false, reason: `subscription_${subscription.status}` };
  }

  if (metadata.kind === 'booking' && metadata.booking_id) {
    if (session.mode !== 'payment' || session.currency !== 'mxn' || typeof session.amount_total !== 'number') {
      return { ok: false, reason: 'invalid_booking_session' };
    }
    const result = confirmBookingPayment(metadata.booking_id, userId, session.id, session.amount_total);
    if (result === 'confirmed' || result === 'already_confirmed') return { ok: true, kind: 'booking' };
    if (result === 'amount_mismatch') {
      console.error(`[stripe] Monto no coincide para la reserva ${metadata.booking_id} (sesión ${session.id}); requiere revisión manual.`);
    }
    return { ok: false, reason: result };
  }
  return { ok: false, reason: 'unknown_kind' };
}

function applySubscriptionEvent(subscription: Stripe.Subscription, eventAt: number): void {
  const customerId = idOf(subscription.customer as string | Stripe.Customer | null);
  const userId = subscription.metadata?.user_id ?? (customerId ? findUserByStripeCustomer(customerId)?.id : undefined);
  if (!userId) {
    console.warn(`[stripe] Suscripción ${subscription.id} sin usuario asociado.`);
    return;
  }
  applySubscriptionState(userId, {
    entitled: isEntitled(subscription.status),
    customerId,
    subscriptionId: subscription.id,
    eventAt,
  });
}

/** Procesa un evento ya verificado (firma válida). Idempotente por event.id. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (hasProcessedStripeEvent(event.id)) return;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const result = await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, event.created);
      if (!result.ok) console.info(`[stripe] ${event.type} sin cumplimiento: ${result.reason}`);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      applySubscriptionEvent(event.data.object as Stripe.Subscription, event.created);
      break;
    default:
      break; // otros eventos se aceptan y se ignoran
  }
  markStripeEventProcessed(event.id);
}
