import { api } from '@/api/apiClient';
import { isGuestSession, guestAwardXP, guestTouchStreak, guestCompleteModule, guestSubjectDone, guestSaveExam } from './guestStore';

export const LEVEL_STEP = 100;
export const levelFromXp = (xp) => Math.floor(xp / LEVEL_STEP) + 1;

export async function awardXP(amount) {
  if (isGuestSession()) return guestAwardXP(amount);
  const me = await api.auth.me();
  const xp = (me.xp_points || 0) + amount;
  await api.auth.updateMe({ xp_points: xp, level: levelFromXp(xp) });
  return xp;
}

export async function touchStreak() {
  if (isGuestSession()) return guestTouchStreak();
  const me = await api.auth.me();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (me.last_active_date === today) return me.streak_days || 0;
  const streak = me.last_active_date === yesterday ? (me.streak_days || 0) + 1 : 1;
  await api.auth.updateMe({ streak_days: streak, last_active_date: today });
  return streak;
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