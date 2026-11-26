/** Fuente única de verdad del precio de las asesorías. El cliente NUNCA fija montos. */
export const COMMISSION_RATE = 0.15;
export const ALLOWED_BOOKING_HOURS = [1, 1.5, 2] as const;
export const MIN_HOURLY_RATE_MXN = 50;
export const MAX_HOURLY_RATE_MXN = 5000;

export interface BookingPrice {
  totalCents: number;
  commissionCents: number;
  totalAmount: number;
  platformCommission: number;
}

/** Aritmética en centavos enteros para evitar errores de coma flotante. */
export function priceBooking(hourlyRateMxn: number, hours: number): BookingPrice {
  const totalCents = Math.round(hourlyRateMxn * hours * 100);
  const commissionCents = Math.round(totalCents * COMMISSION_RATE);
  return {
    totalCents,
    commissionCents,
    totalAmount: totalCents / 100,
    platformCommission: commissionCents / 100,
  };
}

/** Reglas de progresión (XP) controladas por el servidor. */
export const LEVEL_STEP = 100;
export const DAILY_XP_CAP = 600;
export const FREE_DAILY_3D_CREDITS = 3;
export const levelFromXp = (xp: number) => Math.floor(xp / LEVEL_STEP) + 1;

/** Recompensas de XP por tipo de acción (el cliente solo declara el tipo, nunca la cantidad). */
export const XP_REWARDS = { exercise: 15, diagnostic: 50, examPerCorrectAnswer: 10, daily: 25 } as const;
