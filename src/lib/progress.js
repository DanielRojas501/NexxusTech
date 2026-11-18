// @ts-check
import { api } from '@/api/apiClient';
import { isGuestSession, guestAwardXP, guestTouchStreak, guestCompleteModule, guestSubjectDone, guestSaveExam } from './guestStore';

export const LEVEL_STEP = 100;
export const levelFromXp = (xp) => Math.floor(xp / LEVEL_STEP) + 1;

// Recompensas locales SOLO para la sesión de invitado (no persiste en el servidor).
const GUEST_XP = { exercise: 15, diagnostic: 50 };

/**
 * Otorga XP. El cliente solo declara QUÉ ocurrió ('exercise' | 'diagnostic' | 'exam');
 * el servidor decide la cantidad, aplica el tope diario y evita duplicados.
 */
export async function awardXP(kind, meta = {}) {
  if (isGuestSession()) {
    const amount = kind === 'exam' ? (meta.correct || 0) * 10 : GUEST_XP[kind] || 0;
    return guestAwardXP(amount);
  }
  const result = await api.functions.invoke('awardXp', { kind, ...meta });
  return result.xp_points;
}

export async function touchStreak() {
  if (isGuestSession()) return guestTouchStreak();
  const result = await api.functions.invoke('touchStreak', {});
  return result.streak_days;
}

export async function completeModuleExercise(userId, subjectId, moduleIndex, totalInModule) {
  if (isGuestSession()) return guestCompleteModule(subjectId, moduleIndex, totalInModule);
  const topicId = `${subjectId}:m${moduleIndex}`;
  const [rec] = await api.entities.UserProgress.filter({ topic_id: topicId });
  let done;
  if (rec) {
    done = Math.min((rec.exercises_completed || 0) + 1, totalInModule);
    await api.entities.UserProgress.update(rec.id, {
      exercises_completed: done,
      mastery_percentage: Math.round((done / totalInModule) * 100),
    });
  } else {
    done = 1;
    await api.entities.UserProgress.create({
      subject_id: subjectId,
      topic_id: topicId,
      exercises_completed: done,
      mastery_percentage: Math.round((1 / totalInModule) * 100),
      unlocked: true,
    });
  }
  return done;
}

export async function getSubjectDone(userId, subjectId) {
  if (isGuestSession()) return guestSubjectDone(subjectId);
  const recs = await api.entities.UserProgress.filter({ subject_id: subjectId });
  return recs.reduce((n, r) => n + (r.exercises_completed || 0), 0);
}

export async function saveExamResult({ score_pct, correct, total, duration_sec, detail }) {
  if (isGuestSession()) return guestSaveExam({ score_pct, correct, total, duration_sec, detail });
  return api.entities.ExamResult.create({ score_pct, correct, total, duration_sec, detail });
}