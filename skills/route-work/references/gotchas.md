# Route Work Gotchas

Record recurring routing failures here.

## Add A Gotcha When

- the repo repeatedly gets over-shaped into `slice` or `program`
- serious work keeps getting under-shaped into `direct`
- missing context is repeatedly mistaken for a depth problem

## A Surprise Becomes A Gotcha When

- the same routing mistake is likely to recur
- the request wording repeatedly misleads depth selection
- future agents would likely make the same over-shape or under-shape call

## Skill-Specific Vs Workspace-Wide

- skill-specific: the trap is about engagement or depth judgment itself
- workspace-wide: the trap belongs to this repo, its product surface, or cross-skill verification behavior

Workspace-wide traps should go to `.superplan/gotchas.md`.

## Typical Routing Traps

- choosing `program` because the request sounds important
- choosing `task` when graph structure or workstreams are the real need
- routing to context bootstrap for every large repo regardless of actual need
