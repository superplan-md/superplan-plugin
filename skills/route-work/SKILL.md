---
name: route-work
description: Use when Superplan is engaged and the system must decide whether work should stay out or enter direct, task, slice, or program depth.
---

# Route Work

## Overview

Determine whether Superplan should engage and how much structure the work deserves.

This skill owns the `should_superplan_engage?` decision and the initial depth choice.

## Trigger

Use when:

- `using-superplan` decided Superplan should evaluate engagement
- the system must choose between staying out, engaging lightly, engaging structurally, or doing context work first
- the request may require a depth decision

## Stay Out

Do not continue into work shaping when:

- the correct action is simply to answer directly
- structure would be ceremonial rather than useful
- the request has already been satisfied without Superplan

## Inputs And Assumptions

Inputs:

- user request
- repo state
- current `.superplan/` state if present
- available workspace context
- whether this looks like greenfield, brownfield, or follow-on work

Assumptions:

- structure depth is a workflow decision, not a philosophical category
- the graph layer matters even when the immediate output is small
- the smallest useful depth is the right default

## Depth Modes

- `stay_out`: direct answer, no durable artifact
- `direct`: direct answer or one lightweight task only if visibility materially helps
- `task`: one bounded task contract
- `slice`: usually `plan.md` plus tasks, with specs only if target misunderstanding is the bigger risk
- `program`: `plan.md` plus tasks, and specs where multiple interfaces, expectations, or product truths need durable capture

For larger work, keep the graph/index layer distinct from individual task contracts and runtime state.

See `references/depth-modes.md`.

## Allowed Actions

- decide `stay_out`
- decide `direct`
- decide `task`
- decide `slice`
- decide `program`
- decide whether missing or stale context should be handled first
- produce a short rationale for the decision

## Forbidden Behavior

- writing large artifacts by default
- doing full shaping here
- implementing the work here
- forcing spec-first or plan-first ritual
- over-decomposing small work

## Context Routing Rule

Route to `context-bootstrap-sync` first when serious brownfield work is likely to be mis-shaped without better durable context.

Do not route to context work just because the repo is large.
Route there when missing or stale context is the real blocker.

## Decision And Gotcha Rules

Record only meaningful engagement and depth choices in `.superplan/decisions.md`.

Do not log every obvious `task` or `direct` choice.

If a recurring routing failure appears, such as consistent over-shaping or under-shaping in this repo, add it to `.superplan/gotchas.md`.

See `references/stay-out-cases.md` and `references/gotchas.md`.

## Outputs

Recommended output shape:

- engagement decision
- structure-depth mode
- expected artifact pattern
- short reason
- next skill recommendation

## Handoff

Likely handoffs:

- `shape-work`
- `context-bootstrap-sync`
- no further Superplan action

## Future CLI Hooks

- `superplan route --json`
- `superplan route --explain`
- `superplan doctor --engagement`

## Validation Cases

Should route to stay out:

- simple direct explanations
- ephemeral conversation with no durable value

Should route to `direct`:

- tiny but real work where one lightweight task would help
- obvious small edits where visibility still matters

Should route to `task`:

- one bounded task with clear acceptance criteria
- a small bugfix or feature with a normal task contract

Should route to `slice`:

- bounded multi-step work
- work with meaningful sequencing or decomposition needs

Should route to `program`:

- large, ambiguous, or multi-workstream work
- work needing richer artifact structure

Should route to context first:

- serious brownfield work with no useful workspace context
- stale context likely to mislead shaping
