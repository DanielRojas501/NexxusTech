const PROFILE_KEY = 'apoya_guest_profile';
const PROGRESS_KEY = 'apoya_guest_progress';
const EXAMS_KEY = 'apoya_guest_exams';
const LEVEL_STEP = 100;
const levelFromXp = (xp) => Math.floor(xp / LEVEL_STEP) + 1;

const DEFAULT_PROFILE = {
  id: 'guest',
  full_name: 'Invitado',
  is_guest: true,
  xp_points: 0,
  streak_days: 0,
  last_active_date: null,
  level: 1,
  diagnostics_completed: false,
  diagnostic_result: null,
};

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const isGuestSession = () => localStorage.getItem(PROFILE_KEY) !== null;

export const getGuestProfile = () => ({ ...DEFAULT_PROFILE, ...read(PROFILE_KEY, {}) });

export const startGuestSession = () => {
  if (!isGuestSession()) write(PROFILE_KEY, DEFAULT_PROFILE);
};

export const exitGuestSession = () => {
  [PROFILE_KEY, PROGRESS_KEY, EXAMS_KEY].forEach((k) => localStorage.removeItem(k));
};

export const updateGuestProfile = (patch) => {
  const profile = { ...getGuestProfile(), ...patch };
  write(PROFILE_KEY, profile);
  return profile;
};

export const guestAwardXP = (amount) => {
  const xp = (getGuestProfile().xp_points || 0) + amount;
  updateGuestProfile({ xp_points: xp, level: levelFromXp(xp) });
  return xp;
};

export const guestTouchStreak = () => {
  const p = getGuestProfile();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (p.last_active_date === today) return p.streak_days || 0;
  const streak = p.last_active_date === yesterday ? (p.streak_days || 0) + 1 : 1;
  updateGuestProfile({ streak_days: streak, last_active_date: today });
  return streak;
};

export const guestCompleteModule = (subjectId, moduleIndex, totalInModule) => {
  const topicId = `${subjectId}:m${moduleIndex}`;
  const records = read(PROGRESS_KEY, []);
  const idx = records.findIndex((r) => r.topic_id === topicId);
  let done;
  let next;
  if (idx >= 0) {
    done = Math.min((records[idx].exercises_completed || 0) + 1, totalInModule);
    next = [...records];
    next[idx] = {
      ...records[idx],
      exercises_completed: done,
      mastery_percentage: Math.round((done / totalInModule) * 100),
      unlocked: true,
    };
  } else {
    done = 1;
    next = [
      ...records,
      {
        subject_id: subjectId,
        topic_id: topicId,
        exercises_completed: 1,
        mastery_percentage: Math.round((1 / totalInModule) * 100),
        unlocked: true,
      },
    ];
  }
  write(PROGRESS_KEY, next);
  return done;
};

export const guestSubjectDone = (subjectId) =>
  read(PROGRESS_KEY, [])
    .filter((r) => r.subject_id === subjectId)
    .reduce((n, r) => n + (r.exercises_completed || 0), 0);

export const guestSaveExam = (result) => {
  write(EXAMS_KEY, [...read(EXAMS_KEY, []), { ...result, created_date: new Date().toISOString() }]);
};