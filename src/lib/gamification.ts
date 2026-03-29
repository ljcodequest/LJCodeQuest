export const LEVEL_BASE_XP = 100;

/**
 * Calculates a user's level based on their total XP.
 * Formula: Level = floor(sqrt(XP / 100)) + 1
 */
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor(Math.sqrt(xp / LEVEL_BASE_XP)) + 1;
}

/**
 * Calculates the XP required to reach the NEXT level.
 * Formula: Next XP = (NextLevel - 1)^2 * 100
 */
export function getXpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * LEVEL_BASE_XP;
}

/**
 * Calculates the XP required to reach the CURRENT level.
 */
export function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return Math.pow(currentLevel - 1, 2) * LEVEL_BASE_XP;
}

/**
 * Returns progress data for the current level (used for progress bars)
 */
export function getLevelProgress(xp: number) {
  const currentLevel = calculateLevel(xp);
  const xpForCurrent = getXpForCurrentLevel(currentLevel);
  const xpForNext = getXpForNextLevel(currentLevel);
  
  const xpIntoLevel = xp - xpForCurrent;
  const xpNeededForLevel = xpForNext - xpForCurrent;
  const progressPercentage = Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));

  return {
    currentLevel,
    xpIntoLevel,
    xpNeededForLevel,
    progressPercentage,
    xpForNext
  };
}

/**
 * Checks if the user's streak needs to be updated (incremented or broken)
 * @param streak The user's current streak object
 * @returns { shouldUpdate: boolean, newCurrent: number, newLongest: number, isBroken: boolean }
 */
export function evaluateStreak(streak: { current: number, longest: number, lastActiveDate: Date | null }) {
  if (!streak.lastActiveDate) {
     return { shouldUpdate: true, newCurrent: 1, newLongest: 1, isBroken: false };
  }

  const now = new Date();
  const lastActive = new Date(streak.lastActiveDate);

  // Normalize dates to midnight to easily compare "days"
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

  const diffTime = Math.abs(today.getTime() - lastDay.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
     // Already active today, no change needed
     return { shouldUpdate: false, newCurrent: streak.current, newLongest: streak.longest, isBroken: false };
  } else if (diffDays === 1) {
     // Active consecutive day! Increment streak
     const newCurrent = streak.current + 1;
     const newLongest = Math.max(newCurrent, streak.longest);
     return { shouldUpdate: true, newCurrent, newLongest, isBroken: false };
  } else {
     // Streak broken (missed more than 1 day)
     return { shouldUpdate: true, newCurrent: 1, newLongest: streak.longest, isBroken: true };
  }
}
