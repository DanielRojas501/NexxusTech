import { MATH_SUBJECTS } from './subjectsMath';
import { SCIENCE_SUBJECTS } from './subjectsScience';
import { OTHER_SUBJECTS } from './subjectsOther';
import { normalize } from '@/lib/check';

export const SUBJECTS = [...MATH_SUBJECTS, ...SCIENCE_SUBJECTS, ...OTHER_SUBJECTS];

export const TOTAL_TOPICS = SUBJECTS.reduce((n, s) => n + s.syllabus.length, 0);

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id);

export function searchSubjects(query, area) {
  const q = normalize(query.trim());
  return SUBJECTS.filter((s) => area === 'todas' || s.area === area)
    .map((s) => {
      if (!q) return { subject: s, matches: [] };
      const topics = [...s.syllabus, ...s.modules.map((m) => m.title)];
      const matches = [...new Set(topics.filter((t) => normalize(t).includes(q)))];
      const hit = normalize(s.name).includes(q) || normalize(s.description).includes(q) || matches.length > 0;
      return hit ? { subject: s, matches } : null;
    })
    .filter(Boolean);
}