// Reglas de la racha. Las usan el servidor (server/store.ts) y el modo invitado
// (src/lib/guestStore.js), así que una cuenta y un invitado cuentan igual.

// ponytail: zona horaria fija del Tec Saltillo; si la plataforma sale de Coahuila, guárdala por usuario.
export const TIMEZONE = 'America/Monterrey';
export const FREEZE_EVERY = 7; // cada 7 días seguidos ganas un protector
export const MAX_FREEZES = 2;
const HISTORY_DAYS = 60;

export interface StreakState {
  streak_days: number;
  best_streak: number;
  streak_freezes: number;
  last_active_date: string | null;
  active_days: string[];
  frozen_days: string[];
}

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Fecha YYYY-MM-DD en Saltillo (no UTC: en UTC el día cambiaba a las 6 pm). */
export const localDay = (date: Date = new Date()): string => dayFormat.format(date);

export const shiftDays = (day: string, delta: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + delta * 864e5).toISOString().slice(0, 10);

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5);

export function emptyStreak(): StreakState {
  return { streak_days: 0, best_streak: 0, streak_freezes: 0, last_active_date: null, active_days: [], frozen_days: [] };
}

/**
 * Registra que el alumno estudió hoy (ejercicio, examen, diagnóstico o reto).
 * Si faltó días y tiene protectores suficientes, se gastan y la racha sigue.
 */
export function recordActivity(state: StreakState, today: string): StreakState {
  const gap = state.last_active_date ? daysBetween(state.last_active_date, today) : Infinity;
  if (gap <= 0) return state; // ya contó hoy (o un registro viejo en UTC quedó "adelantado")

  const missed = gap - 1;
  let { streak_days, streak_freezes } = state;
  let frozen = state.frozen_days;
  if (missed === 0) {
    streak_days += 1;
  } else if (missed <= streak_freezes) {
    streak_freezes -= missed;
    frozen = [...frozen, ...Array.from({ length: missed }, (_, i) => shiftDays(today, -missed + i))];
    streak_days += 1;
  } else {
    streak_days = 1;
  }
  if (streak_days % FREEZE_EVERY === 0) streak_freezes = Math.min(MAX_FREEZES, streak_freezes + 1);

  return {
    streak_days,
    best_streak: Math.max(state.best_streak, streak_days),
    streak_freezes,
    last_active_date: today,
    active_days: [...state.active_days, today].slice(-HISTORY_DAYS),
    frozen_days: frozen.slice(-HISTORY_DAYS),
  };
}

export type StreakMood = 'done' | 'at_risk' | 'protected' | 'lost' | 'new';

/** Cómo se ve la racha HOY, sin modificarla (el servidor solo la mueve al estudiar). */
export function streakStatus(state: StreakState, today: string): { current: number; mood: StreakMood } {
  if (!state.last_active_date) return { current: 0, mood: 'new' };
  const missed = daysBetween(state.last_active_date, today) - 1;
  if (missed < 0) return { current: state.streak_days, mood: 'done' };
  if (missed === 0) return { current: state.streak_days, mood: 'at_risk' };
  if (missed <= state.streak_freezes) return { current: state.streak_days, mood: 'protected' };
  return { current: 0, mood: 'lost' };
}
