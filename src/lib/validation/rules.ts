import type { EventSettings, TeamMember } from '@/types';

export interface RuleViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates team composition against event settings.
 * Rules are always read from configuration, never hardcoded.
 */
export function validateTeamAgainstEventRules(
  members: Pick<TeamMember, 'role' | 'gender'>[],
  settings: Pick<EventSettings, 'minimum_team_size' | 'maximum_team_size' | 'minimum_female_members'>
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Team size check
  if (members.length < settings.minimum_team_size) {
    violations.push({
      rule: 'team_size_minimum',
      message: `Your team must have at least ${settings.minimum_team_size} members. Currently: ${members.length}.`,
      severity: 'error',
    });
  }

  if (members.length > settings.maximum_team_size) {
    violations.push({
      rule: 'team_size_maximum',
      message: `Your team cannot exceed ${settings.maximum_team_size} members. Currently: ${members.length}.`,
      severity: 'error',
    });
  }

  // Female member count
  const femaleCount = members.filter((m) => m.gender === 'female').length;
  if (femaleCount < settings.minimum_female_members) {
    violations.push({
      rule: 'minimum_female_members',
      message: `Your team must include at least ${settings.minimum_female_members} female members. Currently: ${femaleCount}.`,
      severity: 'error',
    });
  }

  // Team leader check
  const leaderCount = members.filter((m) => m.role === 'team_leader').length;
  if (leaderCount === 0) {
    violations.push({
      rule: 'team_leader_required',
      message: 'One team member must be designated as Team Leader.',
      severity: 'error',
    });
  }
  if (leaderCount > 1) {
    violations.push({
      rule: 'team_leader_unique',
      message: 'Only one team member can be the Team Leader.',
      severity: 'error',
    });
  }

  return violations;
}

/**
 * Checks if registration is currently allowed.
 */
export function isRegistrationOpen(
  settings: Pick<EventSettings, 'registration_open' | 'registration_deadline'>
): { open: boolean; reason?: string } {
  if (!settings.registration_open) {
    return { open: false, reason: 'Registration is currently closed.' };
  }

  if (settings.registration_deadline) {
    const deadline = new Date(settings.registration_deadline);
    if (new Date() > deadline) {
      return { open: false, reason: 'The registration deadline has passed.' };
    }
  }

  return { open: true };
}

/**
 * Checks if team editing is permitted.
 */
export function isEditingAllowed(
  settings: Pick<EventSettings, 'editing_enabled'>
): boolean {
  return settings.editing_enabled;
}
