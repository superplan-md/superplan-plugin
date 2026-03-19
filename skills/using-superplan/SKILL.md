---
name: using-superplan
description: Use when Superplan is active in the current host or repo and the system must decide whether the request should stay conversational or enter structured Superplan workflow.
---

# Using Superplan

## Overview

Universal entrypoint for Superplan.

Keep this skill small.
Its job is to decide whether Superplan should meaningfully participate, not to do downstream shaping, execution, or review.

## Trigger

Use when:

- Superplan is installed or expected in the current host environment
- the request may involve meaningful repo work
- the user asks for structured work, execution help, tracking, visibility, or durable context
- the system must decide whether Superplan adds value before deeper workflow work begins

In practice, this is the default entry layer in Superplan mode.

## Stay Out

Stay conversational when:

- the user wants a simple explanation or answer
- no durable artifact would help
- no visibility or supervision value would be created
- the request is casual, ephemeral, or already fully satisfied

If Superplan stays out, answer directly and do not create workflow artifacts.

## Inputs And Assumptions

Inputs:

- user request
- current repository and working directory
- whether Superplan appears active in this repo or host
- whether `.superplan/` exists
- whether useful workspace context exists already

Assumptions:

- users should not need to think about which skill comes next
- the workspace's current scripts, harnesses, and custom skills stay authoritative
- Superplan should improve the workflow, not hijack it

## Allowed Actions

- inspect the repo briefly for readiness and context
- decide whether to stay out or continue
- route to `route-work`
- route to `context-bootstrap-sync` when missing context is the real blocker
- give brief readiness guidance when setup or initialization is missing

## Current CLI Loop

When Superplan is active in a repo, prefer the CLI as the execution control plane.

Common commands:

- `superplan status --json` to see active, ready, blocked, and needs-feedback tasks
- `superplan run --json` to claim the next ready task or continue the active task
- `superplan task why-next --json` to explain why the current frontier was selected
- `superplan task show <task_id> --json` to inspect the selected task contract
- `superplan task why <task_id> --json` to understand why a task is not ready
- `superplan task block <task_id> --reason "<reason>" --json` when execution cannot safely continue
- `superplan task request-feedback <task_id> --message "<message>" --json` when the user must respond
- `superplan task complete <task_id> --json` after the work and acceptance criteria are satisfied
- `superplan task fix --json` when runtime state becomes inconsistent

Execution default:

1. check `superplan status --json`
2. claim work with `superplan run --json`
3. inspect the chosen task with `superplan task show <task_id> --json`
4. execute through the workflow spine, especially `execute-task-graph`, instead of ad hoc task mutation
5. block, request feedback, or complete through the runtime commands rather than editing markdown state by hand

## Routing Model

Treat Superplan as a workflow spine with support disciplines underneath it.

Workflow skills:

- `route-work`
- `shape-work`
- `execute-task-graph`
- `review-task-against-ac`
- `context-bootstrap-sync`

Support discipline skills:

- `brainstorming`
- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`

Entry routing should go into the workflow spine first.
Support skills should normally be invoked by the owning workflow skill rather than chosen as the first route from here.

Examples:

- ambiguity in work definition routes toward the workflow path that will later invoke `brainstorming`
- execution trouble routes toward the workflow path that may invoke `systematic-debugging`
- completion claims route toward the workflow path that may invoke `verification-before-completion`

## Forbidden Behavior

- doing full planning here
- authoring `specs`, `plan.md`, or task artifacts here
- doing broad execution here
- reviewing completion here
- forcing engagement when Superplan adds no value
- turning every request into tracked work

## Readiness Rules

- If Superplan is unavailable or clearly not initialized, give brief readiness guidance and stop.
- If the repo is brownfield and context is clearly missing or stale, route to `context-bootstrap-sync` before deeper shaping.
- If the request is repo work but the structure decision is still open, route to `route-work`.
- If a process discipline is needed, route first to the workflow skill that owns that phase rather than bypassing the workflow spine.

See `references/readiness.md` and `references/routing-boundaries.md`.

## Decision And Gotcha Rules

Use `.superplan/decisions.md` only for meaningful route or readiness decisions that future agents would need to understand later.

Do not write tiny entrypoint observations there.

If you discover a recurring trap in how entry routing goes wrong for this repo or host, record it in `.superplan/gotchas.md`.

See `references/gotchas.md`.

## Outputs

One of:

- direct answer with Superplan staying out
- readiness guidance
- route to `context-bootstrap-sync`
- route to `route-work`

The output should be brief and legible.

## Handoff

Likely handoffs:

- `route-work`
- `context-bootstrap-sync`
- no further Superplan action

## Current CLI Hooks

- `superplan doctor --json`
- `superplan init --json`
- `superplan status --json`
- `superplan run --json`
- `superplan task next --json`
- `superplan task why-next --json`

## Validation Cases

Should trigger:

- "Implement this feature and keep the work organized."
- "Help me execute this refactor with structure."
- "I want to use Superplan in this repo."
- any repo work request in a host configured for Superplan

Should stay out:

- "What does this function do?"
- "Explain TypeScript generics."
- "Summarize this paragraph."
- casual conversation with no durable repo value

Ambiguous:

- "Fix this tiny typo."
- "Can you look into this bug?" with no clear need for structure yet
- "Write a quick recommendation doc" where the doc itself may be the deliverable
