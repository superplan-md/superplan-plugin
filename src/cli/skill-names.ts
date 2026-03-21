export const ORIGINAL_SUPERPLAN_SKILL_NAMES = [
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

export const INTERIM_PREFIXED_SUPERPLAN_SKILL_NAMES = [
  'superplan-brainstorming',
  'superplan-context-bootstrap-sync',
  'superplan-docs-sync',
  'superplan-execute-task-graph',
  'superplan-handoff-checkpointing',
  'superplan-regression-guarding',
  'superplan-release-readiness',
  'superplan-retrospective-postmortem',
  'superplan-review-task-against-ac',
  'superplan-route-work',
  'superplan-shape-work',
  'superplan-systematic-debugging',
  'superplan-test-driven-development',
  'superplan-using-superplan',
  'superplan-verification-before-completion',
  'superplan-writing-plans',
] as const;

export const CURRENT_SUPERPLAN_SKILL_NAMES = [
  'superplan-brainstorm',
  'superplan-context',
  'superplan-debug',
  'superplan-docs',
  'superplan-entry',
  'superplan-execute',
  'superplan-guard',
  'superplan-handoff',
  'superplan-plan',
  'superplan-postmortem',
  'superplan-release',
  'superplan-review',
  'superplan-route',
  'superplan-shape',
  'superplan-tdd',
  'superplan-verify',
] as const;

export const LEGACY_SUPERPLAN_SKILL_NAMES = [
  ...INTERIM_PREFIXED_SUPERPLAN_SKILL_NAMES,
  ...ORIGINAL_SUPERPLAN_SKILL_NAMES,
] as const;

export const ALL_SUPERPLAN_SKILL_NAMES = [
  ...CURRENT_SUPERPLAN_SKILL_NAMES,
  ...LEGACY_SUPERPLAN_SKILL_NAMES,
] as const;

export const CURRENT_ENTRY_SKILL_NAME = 'superplan-entry';
export const LEGACY_ENTRY_SKILL_NAMES = [
  'superplan-using-superplan',
  'using-superplan',
] as const;
export const ALL_ENTRY_SKILL_NAMES = [CURRENT_ENTRY_SKILL_NAME, ...LEGACY_ENTRY_SKILL_NAMES] as const;
