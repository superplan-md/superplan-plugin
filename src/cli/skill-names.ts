export const LEGACY_SUPERPLAN_SKILL_NAMES = [
  'brainstorming',
  'context-bootstrap-sync',
  'docs-sync',
  'execute-task-graph',
  'handoff-checkpointing',
  'regression-guarding',
  'release-readiness',
  'retrospective-postmortem',
  'review-task-against-ac',
  'route-work',
  'shape-work',
  'systematic-debugging',
  'test-driven-development',
  'using-superplan',
  'verification-before-completion',
  'writing-plans',
] as const;

export const CURRENT_SUPERPLAN_SKILL_NAMES = LEGACY_SUPERPLAN_SKILL_NAMES.map(skillName => `superplan-${skillName}`);
export const ALL_SUPERPLAN_SKILL_NAMES = [...CURRENT_SUPERPLAN_SKILL_NAMES, ...LEGACY_SUPERPLAN_SKILL_NAMES];

export const CURRENT_ENTRY_SKILL_NAME = 'superplan-using-superplan';
export const LEGACY_ENTRY_SKILL_NAME = 'using-superplan';
export const ALL_ENTRY_SKILL_NAMES = [CURRENT_ENTRY_SKILL_NAME, LEGACY_ENTRY_SKILL_NAME];
