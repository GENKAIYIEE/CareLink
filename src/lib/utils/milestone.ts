export const MILESTONE_AGES = [80, 85, 90, 95, 100] as const;
export type MilestoneAge = (typeof MILESTONE_AGES)[number];

/**
 * Calculates exact age taking month and day into account.
 */
export function calculateExactAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Checks if the senior will turn a milestone age during the current calendar year.
 */
export function getUpcomingMilestoneThisYear(dateOfBirth: Date | string): MilestoneAge | null {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return null;

  const currentYear = new Date().getFullYear();
  const ageThisYear = currentYear - dob.getFullYear();

  if (MILESTONE_AGES.includes(ageThisYear as MilestoneAge)) {
    return ageThisYear as MilestoneAge;
  }
  return null;
}

/**
 * Suggests a milestone category based on date of birth.
 * Prioritizes turning this year, then reached milestone tier.
 */
export function suggestMilestoneAge(dateOfBirth: Date | string): MilestoneAge | null {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return null;

  // Check if turning milestone this year (e.g. 79 turning 80, 84 turning 85)
  const upcomingThisYear = getUpcomingMilestoneThisYear(dob);
  if (upcomingThisYear) return upcomingThisYear;

  const exactAge = calculateExactAge(dob);
  if (exactAge >= 100) return 100;
  if (exactAge >= 95) return 95;
  if (exactAge >= 90) return 90;
  if (exactAge >= 85) return 85;
  if (exactAge >= 80) return 80;

  return null;
}

/**
 * Provides comprehensive milestone status details for profile views and badges.
 */
export function getMilestoneInfo(senior: {
  dateOfBirth: Date | string | null;
  milestoneAge?: number | null;
}) {
  if (!senior.dateOfBirth) {
    return {
      age: 0,
      effectiveMilestone: senior.milestoneAge ?? null,
      isMilestone: Boolean(senior.milestoneAge),
      isTurningThisYear: false,
      badgeText: senior.milestoneAge ? `${senior.milestoneAge} Milestone Applicant` : null,
      nextMilestone: null,
    };
  }

  const age = calculateExactAge(senior.dateOfBirth);
  const turningThisYear = getUpcomingMilestoneThisYear(senior.dateOfBirth);
  const effectiveMilestone = senior.milestoneAge ?? (turningThisYear || (age >= 80 ? suggestMilestoneAge(senior.dateOfBirth) : null));

  // Determine next milestone
  let nextMilestone: { age: MilestoneAge; yearsRemaining: number } | null = null;
  for (const m of MILESTONE_AGES) {
    if (m > age) {
      nextMilestone = { age: m, yearsRemaining: m - age };
      break;
    }
  }

  let badgeText: string | null = null;
  if (senior.milestoneAge) {
    badgeText = `${senior.milestoneAge} Milestone Applicant`;
  } else if (turningThisYear) {
    badgeText = `Turning ${turningThisYear} this year`;
  } else if (age >= 80 && effectiveMilestone) {
    badgeText = effectiveMilestone === 100 ? 'Centenarian (100+)' : `${effectiveMilestone} Milestone`;
  }

  return {
    age,
    effectiveMilestone,
    isMilestone: Boolean(effectiveMilestone),
    isTurningThisYear: Boolean(turningThisYear),
    badgeText,
    nextMilestone,
  };
}
