# Context Bootstrap Sync Gotchas

Record recurring context-layer failures here.

## Add A Gotcha When

- stale context repeatedly misleads later shaping
- the repo's true architecture is easy to misread
- transient execution notes keep leaking into durable context

## A Surprise Becomes A Gotcha When

- it is likely to mislead later repo understanding again
- it reveals a repeated indexing, drift, or architecture-reading trap
- future agents would likely make the same context mistake without the note

## Skill-Specific Vs Workspace-Wide

- skill-specific: the trap is about context bootstrap or sync judgment itself
- workspace-wide: the trap belongs to the repo, product surface, or repeated misunderstandings across skills

Workspace-wide traps should go to `.superplan/gotchas.md`.

## Keep Out

- one-off repo exploration notes
- task-local findings that belong in task contracts or decisions
