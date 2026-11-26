import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyStreak, localDay, recordActivity, streakStatus } from '../../src/lib/streakRules.js';

// Simula estudiar en una lista de días y devuelve el estado final.
const studyOn = (days: string[]) => days.reduce(recordActivity, emptyStreak());
const week = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'];

describe('Racha', () => {
  it('suma días seguidos y regala un protector a los 7', () => {
    const s = studyOn(week);
    assert.equal(s.streak_days, 7);
    assert.equal(s.best_streak, 7);
    assert.equal(s.streak_freezes, 1);
  });

  it('un protector cubre un día perdido; sin protector se reinicia', () => {
    const saved = recordActivity(studyOn(week), '2026-11-09'); // faltó el 8
    assert.equal(saved.streak_days, 8);
    assert.equal(saved.streak_freezes, 0);
    assert.deepEqual(saved.frozen_days, ['2026-11-08']);

    const lost = recordActivity(saved, '2026-11-11'); // faltó el 10 sin protectores
    assert.equal(lost.streak_days, 1);
    assert.equal(lost.best_streak, 8, 'el récord se conserva');
  });

  it('estudiar dos veces el mismo día no suma', () => {
    const once = studyOn(['2026-11-01']);
    assert.equal(recordActivity(once, '2026-11-01'), once);
  });

  it('el estado de hoy avisa riesgo, protección o pérdida sin modificar la racha', () => {
    const s = studyOn(week); // 1 protector
    assert.deepEqual(streakStatus(s, '2026-11-07'), { current: 7, mood: 'done' });
    assert.deepEqual(streakStatus(s, '2026-11-08'), { current: 7, mood: 'at_risk' });
    assert.deepEqual(streakStatus(s, '2026-11-09'), { current: 7, mood: 'protected' });
    assert.deepEqual(streakStatus(s, '2026-11-10'), { current: 0, mood: 'lost' });
  });

  it('el día cambia a medianoche de Saltillo, no a las 6 pm', () => {
    assert.equal(localDay(new Date('2026-11-18T23:30:00-06:00')), '2026-11-18'); // 05:30 UTC del día 19
    assert.equal(localDay(new Date('2026-11-19T00:30:00-06:00')), '2026-11-19');
  });
});
