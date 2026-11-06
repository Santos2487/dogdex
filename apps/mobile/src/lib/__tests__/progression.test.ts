import { getLevelFromXp, initialAchievements } from '@/lib/data';
import { computeCaptureProgress, xpForCapture } from '@/lib/progression';

const lockedAll = initialAchievements.map((a) => ({ id: a.id, unlocked: false }));

describe('xpForCapture', () => {
  it('awards 1 / +2 new breed / +1 rare', () => {
    expect(xpForCapture('Common', false)).toBe(1);
    expect(xpForCapture('Common', true)).toBe(3);
    expect(xpForCapture('Rare', true)).toBe(4);
    expect(xpForCapture('Uncommon', false)).toBe(1);
  });
});

describe('getLevelFromXp', () => {
  it('matches the web app curve', () => {
    expect(getLevelFromXp(0)).toEqual({ level: 1, progress: 0, requiredXpForNextLevel: 10 });
    expect(getLevelFromXp(10)).toEqual({ level: 2, progress: 0, requiredXpForNextLevel: 20 });
    expect(getLevelFromXp(35).level).toBe(3);
  });
});

describe('computeCaptureProgress', () => {
  it('handles a first capture of a new rare breed', () => {
    const r = computeCaptureProgress({
      user: { xp: 0, totalCaptures: 0, uniqueBreedsCount: 0 },
      rarity: 'Rare',
      isNewBreed: true,
      existingUncommon: 0,
      existingRare: 0,
      achievements: lockedAll,
    });
    expect(r).toMatchObject({ xpGained: 4, xp: 4, level: 1, totalCaptures: 1, uniqueBreedsCount: 1 });
    const byId = Object.fromEntries(r.achievementUpdates.map((u) => [u.id, u]));
    expect(byId['first-capture']).toEqual({ id: 'first-capture', progress: 1, unlocked: true });
    expect(byId['first-rare']).toEqual({ id: 'first-rare', progress: 1, unlocked: true });
    expect(byId['first-uncommon']).toEqual({ id: 'first-uncommon', progress: 0, unlocked: false });
    expect(byId['ten-captures'].unlocked).toBe(false);
  });

  it('skips unlocked or missing achievements and tolerates missing counters', () => {
    const r = computeCaptureProgress({
      user: {},
      rarity: 'Uncommon',
      isNewBreed: false,
      existingUncommon: 4,
      existingRare: 0,
      achievements: [
        { id: 'first-capture', unlocked: true },
        { id: 'five-uncommon', unlocked: false },
      ],
    });
    expect(r.xp).toBe(1);
    expect(r.uniqueBreedsCount).toBe(0);
    expect(r.achievementUpdates).toEqual([{ id: 'five-uncommon', progress: 5, unlocked: true }]);
  });
});
