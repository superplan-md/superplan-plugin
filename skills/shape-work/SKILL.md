---
name: shape-work
description: Use when Superplan has decided to engage and the request needs durable work artifacts created at the right structure depth.
---

# Shape Work

## Overview

Create the minimum useful durable artifact structure and execution trajectory for the chosen depth.

This skill is not a task generator.
It is a trajectory shaper.

Its job is to shape work so the agent can move with bounded autonomy while staying aligned to the user's real expectations.

## Trigger

Use when:

- `route-work` has decided Superplan should engage
- the work needs durable structure created now
- the next step is to author plan, spec, or task artifacts proportional to the work
- the system must decide how much of the work is shapeable now versus discovery-driven
- the system must choose a verification loop before execution begins

## Stay Out

Do not shape work when:

- `route-work` decided to stay out
- execution is already fully shaped
- the request was already answered directly
- creating artifacts would add no value

## Inputs And Assumptions

Inputs:

- routing decision and chosen depth
- user request and raw narrative when available
- repo state
- current `.superplan/` artifacts if any
- workspace context when available
- existing verification loops
- existing user-owned harnesses, scripts, custom skills, and workflows
- recent decision log entries when relevant
- known gotchas when relevant

Assumptions:

- depth determines how much structure to create
- not all work is fully deterministic at shaping time
- some work should be represented as investigation, prototype, or decision-gate work before deeper decomposition
- the right shaping output is often a trajectory, not a frozen perfect plan

## Artifact Distinction Rule

Keep these layers distinct when the distinction adds clarity:

- graph truth: what work exists, how it depends, and what is ready now
- task-contract truth: what each bounded task means and what done requires
- runtime truth: what is happening now, what is blocked, and what is waiting on feedback

Artifact roles:

- `specs/*.md` capture behavior, constraints, interfaces, and acceptance intent
- `plan.md` captures implementation path, sequencing, and execution strategy
- graph/index artifacts capture dependency structure and workstreams
- task contracts capture bounded executable units

Canonical rule:

- specs constrain truth
- plans constrain trajectory
- task contracts, acceptance criteria, and checks constrain reality

Do not force all artifacts to exist for every request.

## Workspace Precedence Rule

Treat the workspace's existing setup as the default operating surface.

- inspect the workspace before inventing new Superplan-specific structure
- prefer repo-native scripts, harnesses, custom skills, and routines when they already solve the problem
- add Superplan-specific help only when the workspace does not already provide a better path

## Allowed Actions

- create one lightweight task for `direct`
- create one normal task for `task`
- create `plan.md` plus tasks for `slice` when sequencing matters
- create specs when misunderstanding the target is a bigger risk than sequencing
- create a richer graph, plan, spec, and task set for `program` when the work genuinely needs all layers
- classify sub-work as `parallel-safe`, `serial`, or `wait-for-clarity`
- create investigation or uncertainty-reduction tasks
- create explicit decision gates when user judgment or product tradeoff is the real blocker
- define the initial executable frontier
- choose the best available verification loop using repo resources first
- choose an autonomy class:
  - `autopilot`
  - `checkpointed autopilot`
  - `human-gated`
- define re-shape triggers
- define interruption points
- identify which shaping decisions should be written to durable decision memory

## Forbidden Behavior

- forcing every request through plan/spec/task ritual
- collapsing spec and implementation plan into the same vague artifact
- creating graph bloat for tiny work
- creating specs that do not materially help
- turning specs into pseudocode by default
- performing broad execution here
- pretending uncertain work is already cleanly decomposed
- pushing all ambiguity downstream into execution
- replacing a working repo-native workflow with a Superplan-specific one by default

## Output Schema

Every shaped output should make the following explicit:

- current objective
- work type:
  - `deterministic`
  - `investigative`
  - `taste-sensitive`
  - `decision-heavy`
  - `integration-heavy`
- autonomy class:
  - `autopilot`
  - `checkpointed autopilot`
  - `human-gated`
- initial executable frontier
- dependency logic
- parallelization assessment
- verification plan
- interruption points
- re-shape triggers
- expected evidence for completion
- meaningful decisions to record durably if the trajectory changes later

Outputs should make the next executable unit clear, not just the artifact inventory.

See `references/trajectory-shaping.md`, `references/verification-selection.md`, and `references/interruption-policy.md`.

## Decision And Gotcha Rules

Use `.superplan/decisions.md` for meaningful shaping decisions such as depth correction, major verification-path choice, explicit decision gates, or changes to the shaped trajectory that future agents would need to preserve.

Do not log routine decomposition detail or transient execution notes.

Use `.superplan/gotchas.md` for repeated shaping traps, misleading repo patterns, and verification pitfalls likely to matter again.

See `references/gotchas.md`.

## Handoff

Likely handoffs:

- `execute-task-graph`
- user review when shaped work needs approval first
- back to `route-work` only if shaping discovers the engagement or depth decision was materially wrong

Internal support-skill usage may include:

- `brainstorming`
- `writing-plans`

## Future CLI Hooks

- `superplan change create`
- `superplan task add`
- `superplan plan init`
- `superplan spec add`
- `superplan doctor`

## Validation Cases

Should create only a lightweight task:

- tiny real work with low complexity and clear scope

Should create one normal task:

- one bounded bugfix
- one bounded feature

Should create plan plus tasks:

- work with sequencing or multiple meaningful steps

Should create specs as well:

- ambiguity or edge cases make a spec materially useful
- larger initiatives with multiple workstreams

Should create investigation or decision-gate tasks:

- debugging with unknown root cause
- brownfield work where repo understanding is incomplete
- product work where the user's preference is the real acceptance oracle

Should prefer checkpointed autopilot:

- the work is mostly routine but has high-leverage risk points

Should prefer human-gated:

- strong taste sensitivity
- destructive or expensive changes
- hidden expectation risk is high
