---
name: brainstorming
description: Use when the target is still ambiguous and the system must clarify goals, constraints, expectations, or acceptance intent before shaping Superplan work.
---

# Brainstorming

## Overview

Turn ambiguity into a design the user has actually approved before shaping or execution begins.

This is expectation discovery, not decomposition theater.

## Hard Gate

Do not invoke implementation skills, shape broad work, or start execution until a design has been presented and approved.

This applies even when the work looks simple.

## Trigger

Use when:

- the target is non-trivial and key expectations are still implicit
- the user wants something built, changed, or clarified but constraints are incomplete
- hidden taste, product, or acceptance risk would make premature shaping unsafe

## Process

1. Explore project context first.
2. Ask clarifying questions one at a time when the answer materially changes the path.
3. Propose 2-3 approaches with trade-offs and a recommendation.
4. Present the design in sections scaled to complexity.
5. Get approval before moving on.
6. Write the approved design into durable Superplan artifacts before handoff.
7. Hand off to `writing-plans`.

## Core Rules

- check repo files, docs, and nearby context before asking questions the workspace can answer
- prefer one high-leverage question at a time
- use the user's raw narrative as signal, not noise
- extract hidden expectations about output shape, risk tolerance, and the real definition of done
- preserve a real design artifact before handoff:
  - use `.superplan/specs/` when target truth, interfaces, or behavior need durable capture
  - use `.superplan/plan.md` when the main durable output is trajectory and sequencing
  - use `.superplan/decisions.md` when a clarified trade-off or approved preference is the durable fact
- do not skip the design-write step just because the conversation already contains the reasoning
- stop before broad execution

## Forbidden Behavior

- jumping straight to tasks before understanding the target
- asking low-value questions the repo can answer
- skipping the approval loop because the work seems obvious
- treating "I can code this" as proof that the design is understood

## Decision Rules

Use `.superplan/decisions.md` when the user approves a design choice, a trade-off changes the trajectory, or a clarified expectation will matter to later agents.

Do not log every clarifying answer.

## Handoff

The normal next skill is `writing-plans`.

If the design reveals the work should stay small, the eventual shaped output may still be only a task.
The approval loop still comes first.
