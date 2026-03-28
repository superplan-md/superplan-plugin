# Context Bootstrap Sync Evals

## Should Trigger

- serious brownfield repo work with no useful durable context

## Should Stay Out

- tiny task-only work
- transient debugging observations

## Ambiguous Boundary

- brownfield work where some context exists, but it is unclear whether the gap is durable enough to justify sync

## Overlap Boundary

- confirm durable repo truth stays in context while active task state stays out
- confirm this skill does not absorb shaping or execution responsibilities

## Handoff Check

- once context is durable enough, hand back to `superplan-route` or `superplan-shape`
- if no durable context action is needed, stop cleanly

## Pressure Scenario

- repo has scattered docs, stale architecture notes, and missing context routing for future work

## Pass Condition

The skill captures stable reusable truth, keeps active work and runtime state out of context, preserves the README and INDEX roles, and hands cleanly back into the workflow spine.
