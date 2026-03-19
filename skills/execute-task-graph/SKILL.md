---
name: execute-task-graph
description: Use when tracked Superplan work exists and one or more tasks are ready to execute, block, request feedback, or move toward review.
---

# Execute Task Graph

## Overview

Move graph-ready work forward without drifting into broad replanning.

This is the main execution control surface once work has been shaped.
It should behave more like a scheduler and control plane than a single linear worker.

## Trigger

Use when:

- there is executable tracked work
- at least one task is graph-ready
- the next need is to operate inside the shaped work rather than redesign it
- the system can make progress by dispatching one or more bounded work units

## Stay Out

Do not run when:

- the system is still deciding whether Superplan should engage
- shaping has not happened yet
- context or bootstrap is the real missing prerequisite
- the graph is invalid enough that execution should stop and escalate

## Inputs And Assumptions

Inputs:

- current task graph
- task contracts
- runtime state if present
- relevant workspace context
- current ready or blocking status
- relevant user-owned harnesses, scripts, custom skills, and workflows
- recent decision log entries affecting execution
- known workspace or task gotchas

Assumptions:

- execution should operate on ready work, not constantly redesign the project
- multiple ready tasks may be safe to handle in parallel
- trajectory will change during execution; the key question is whether the change is local, structural, or strategic

## Graph, Contract, And Runtime Rule

Keep these layers distinct:

- graph truth decides readiness and dependency state
- task-contract truth defines the bounded unit and its acceptance criteria
- runtime truth records what is in progress, blocked, waiting for feedback, or review-ready

Do not collapse execution into a flat task-file-only mindset.

See `references/runtime-state.md`.

## CLI Alignment Now

Align execution to the CLI that exists today.

Current CLI execution surface:

- `superplan task current`
- `superplan task next`
- `superplan task why-next`
- `superplan task show [task_id]`
- `superplan task why <task_id>`
- `superplan task events [task_id]`
- `superplan task start <task_id>`
- `superplan task resume <task_id>`
- `superplan task block <task_id> --reason <reason>`
- `superplan task request-feedback <task_id> --message <message>`
- `superplan task complete <task_id>`
- `superplan task fix`
- `superplan task reset <task_id>`
- `superplan run`
- `superplan status`

Current CLI truth:

- readiness is computed from parsed task contracts plus runtime state
- runtime states currently include `in_progress`, `done`, `blocked`, and `needs_feedback`
- runtime events are append-only in `.superplan/runtime/events.ndjson`
- review is still a workflow handoff, not a dedicated CLI lifecycle state

Therefore:

- use CLI transitions instead of hand-editing execution state
- use `task why` and `task why-next` when the frontier is unclear
- use `task events` when runtime history matters
- keep "ready for AC review" as a workflow output even though the current CLI does not store `review` as runtime state

## Trajectory Change Model

Classify discovered changes into three buckets:

- local trajectory change: implementation details vary but the task contract still holds
- structural trajectory change: dependencies, task boundaries, or contract validity changed materially
- strategic trajectory change: user goals or top-level expectations changed

Authority:

- local: stay inside execution
- structural: pause affected work and route to `shape-work`
- strategic: stop broad execution and route upward to `route-work`

See `references/trajectory-changes.md`.

## Allowed Actions

- choose graph-ready work
- choose whether work should run serially or in parallel
- dispatch bounded subagents for ready work
- assign clear ownership for each subagent's task or write surface
- dispatch verification in parallel where safe and useful
- route through existing repo scripts, custom skills, or harnesses when those are the trusted path
- begin task execution
- inspect the frontier with `superplan task current`, `superplan task next`, `superplan task why-next`, and `superplan status`
- inspect specific readiness or blockage with `superplan task why <task_id>`
- inspect runtime history with `superplan task events [task_id]`
- repair invalid runtime drift deterministically with `superplan task fix` or `superplan task reset <task_id>` when warranted
- surface blocked state
- surface needs-feedback state
- route toward review when work appears ready
- collect evidence from subagents and merge it into runtime understanding
- re-evaluate the current frontier after major task events
- invoke support disciplines for debugging, tests, and verification
- append meaningful execution decisions to durable decision memory
- append newly discovered traps to gotcha memory when likely to matter again

Recommended patterns:

- branch parallelism
- worker plus verifier
- blocker investigation
- review shadowing

See `references/subagent-dispatch.md`.

## Forbidden Behavior

- broad replanning by default
- reshaping the graph unless truly necessary
- hand-editing lifecycle state ad hoc
- claiming the current CLI has a persisted `review` runtime state
- claiming completion without review
- continuing blindly when blocked or feedback is clearly needed
- spawning subagents without bounded ownership
- parallelizing work that shares unstable assumptions or tight write conflicts
- ignoring `task why`, `task why-next`, or `task fix` when runtime or readiness is unclear
- treating every discovered issue as a reason to reshape
- replacing a working user-owned harness with a Superplan-specific flow during execution

## Outputs

Expected output categories:

- task started
- task in progress
- subagents dispatched
- verification in progress
- blocked with reason
- needs feedback
- ready for AC review
- runtime repaired
- localized re-shape required
- strategic re-route required
- execution cannot continue safely

Runtime summary should keep legible:

- what is running now
- what is verifying now
- what is blocked
- what is waiting for the user
- what changed in the trajectory
- what can run next
- which decisions were recorded
- which gotchas were learned

## Decision And Gotcha Rules

Use `.superplan/decisions.md` for meaningful execution choices, such as trajectory changes, major blocker handling, or review-routing decisions that future agents need to preserve.

Do not use it as a runtime event stream.

Use `.superplan/gotchas.md` for repeated execution traps, misleading repo behavior, unstable verification patterns, or subagent coordination failures likely to recur.

See `references/gotchas.md`.

## Handoff

Likely handoffs:

- `review-task-against-ac`
- back to the user for feedback
- back to `shape-work` when structural trajectory change is detected
- back to `route-work` only when strategic trajectory change is detected

Internal support-skill usage may include:

- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`

Execution handoff to `review-task-against-ac` should name the evidence gathered and the CLI/runtime facts that support the review.

## CLI Hooks

Current CLI:

- `superplan task current`
- `superplan task next`
- `superplan task why-next`
- `superplan task show [task_id]`
- `superplan task why <task_id>`
- `superplan task events [task_id]`
- `superplan task start <task_id>`
- `superplan task resume <task_id>`
- `superplan task block <task_id> --reason <reason>`
- `superplan task request-feedback <task_id> --message <message>`
- `superplan task complete <task_id>`
- `superplan task fix`
- `superplan task reset <task_id>`
- `superplan run`
- `superplan status`

Future CLI hooks:

- `superplan task review`
- `superplan run dispatch`
- `superplan run reconcile`

## Validation Cases

Should execute:

- when one or more tasks are graph-ready and clearly actionable

Should dispatch subagents in parallel:

- when multiple ready tasks have disjoint write surfaces
- when verification can run independently of implementation without invalidating the result

Should use the CLI control plane explicitly:

- `superplan task next` or `superplan run` to select or start work
- `superplan task why` or `superplan task why-next` when readiness is unclear
- `superplan task block` or `superplan task request-feedback` when execution must pause
- `superplan task resume` when paused work becomes executable again
- `superplan task events` when runtime history matters
- `superplan task fix` or `superplan task reset` when runtime state has drifted

Should avoid parallelism:

- when tasks depend on unstable shared assumptions
- when verification depends on a moving implementation target
- when write conflicts are likely

Should not overclaim current CLI support:

- review-ready may be a workflow output without a persisted CLI review state
- `run` and `status` exist today, but richer `run dispatch` and `run reconcile` do not

Should classify trajectory change as local:

- implementation approach changes but task contract still holds

Should classify trajectory change as structural:

- a new dependency changes sequencing
- a task needs to split

Should classify trajectory change as strategic:

- the user's expectations changed
- the engagement or depth decision now looks materially wrong
