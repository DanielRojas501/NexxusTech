import { api } from '@/api/apiClient';
import { updateGuestProfile } from '@/lib/guestStore';

export const FREE_DAILY_3D = 3;
export const COMMISSION_RATE = 0.15;

// Precios Premium creados en Stripe (MXN)
export const PLANS = [
  { id: 'monthly', label: 'Mensual', priceId: 'price_1UQXx8Q1lPN6mQuim3jutsuq', price: 99, unit: 'MXN/mes' },
  { id: 'annual', label: 'Anual', priceId: 'price_1UQXx9Q1lPN6mQuiwDmDGUFP', price: 949, unit: 'MXN/año' },
];

export const isPremium = (user) => user?.subscription_status === 'premium';

export const todayKey = () => new Date().toISOString().slice(0, 10);

// Estado del contador diario de consultas 3D (plan Free: 3 por día)
export function get3DState(profile) {
  const used = profile?.daily_reset_date === todayKey() ? profile?.daily_3d_credits || 0 : 0;
  const remaining = Math.max(FREE_DAILY_3D - used, 0);
  return { used, remaining, blocked: remaining <= 0 };
}

export async function consume3DCredit(profile) {
  const state = get3DState(profile);
  if (state.blocked) return { allowed: false, ...state };
  const used = state.used + 1;
  if (profile?.is_guest) {
    updateGuestProfile({ daily_3d_credits: used, daily_reset_date: todayKey() });
  } else if (profile?.id) {
    await api.auth.updateMe({ daily_3d_credits: used, daily_reset_date: todayKey() });
  }
  return { allowed: true, used, remaining: Math.max(FREE_DAILY_3D - used, 0) };
}

export const commissionOf = (total) => Math.round(total * COMMISSION_RATE * 100) / 100;

/**
 * Abre Stripe Checkout. Debe llamarse directo desde un onClick:
 * si la app está embebida (iframe del preview) abre una pestaña
 * sincrónicamente antes de crear la sesión; si no, navega la actual.
 */
export async function openStripeCheckout(payload) {
  const isFramed = window.self !== window.top;
  const checkoutTab = isFramed ? window.open('', '_blank') : null;
  if (isFramed && !checkoutTab) {
    throw new Error('Permite las ventanas emergentes para continuar con el pago.');
  }
  if (checkoutTab) checkoutTab.opener = null;
  try {
    const res = await api.functions.invoke('createCheckoutSession', payload);
    const url = res?.url;
    if (!url) throw new Error('No se pudo iniciar la pasarela de pago.');
    if (checkoutTab) checkoutTab.location.replace(url);
    else window.location.assign(url);
  } catch (error) {
    checkoutTab?.close();
    throw error;
  }
}