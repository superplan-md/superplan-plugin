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
- claiming completion without review
- continuing blindly when blocked or feedback is clearly needed
- spawning subagents without bounded ownership
- parallelizing work that shares unstable assumptions or tight write conflicts
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

## Current CLI Loop

Use the runtime-aware CLI as the scheduler:

1. `superplan status --json` to inspect the frontier
2. `superplan run --json` to continue the current task or claim the next ready task
3. `superplan task show <task_id> --json` before editing code
4. `superplan task why <task_id> --json` when readiness is unclear
5. `superplan task block <task_id> --reason "<reason>" --json` when blocked
6. `superplan task request-feedback <task_id> --message "<message>" --json` when user input is required
7. `superplan task complete <task_id> --json` only after the task contract is actually satisfied
8. `superplan task fix --json` if runtime state becomes inconsistent

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

## Current CLI Hooks

- `superplan task next --json`
- `superplan task start <task_id> --json`
- `superplan task block <task_id> --reason "<reason>" --json`
- `superplan task request-feedback <task_id> --message "<message>" --json`
- `superplan task complete <task_id> --json`
- `superplan task show <task_id> --json`
- `superplan task why-next --json`
- `superplan task why <task_id> --json`
- `superplan task fix --json`
- `superplan doctor --json`
- `superplan status --json`
- `superplan run --json`

## Validation Cases

Should execute:

- when one or more tasks are graph-ready and clearly actionable

Should dispatch subagents in parallel:

- when multiple ready tasks have disjoint write surfaces
- when verification can run independently of implementation without invalidating the result

Should avoid parallelism:

- when tasks depend on unstable shared assumptions
- when verification depends on a moving implementation target
- when write conflicts are likely

Should classify trajectory change as local:

- implementation approach changes but task contract still holds

Should classify trajectory change as structural:

- a new dependency changes sequencing
- a task needs to split

Should classify trajectory change as strategic:

- the user's expectations changed
- the engagement or depth decision now looks materially wrong
