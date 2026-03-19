# Using Superplan Evals

## Should Trigger

- "Implement this feature and keep the work organized."
- "Set this repo up so future agent work is trackable."

## Should Stay Out

- "Explain this function."
- "Summarize this paragraph."

## Ambiguous Boundary

- "Fix this tiny typo."
- "Look into this bug."

## Overlap Boundary

- confirm it routes to `route-work` rather than choosing `brainstorming` or `systematic-debugging` as the entry lane

## Handoff Check

- if readiness is missing, handoff is `context-bootstrap-sync`
- if engagement is warranted but depth is unknown, handoff is `route-work`

## Pressure Scenario

- repo work request arrives in a partially initialized brownfield repo where Superplan may help, but a direct answer might still be enough if no durable value is created

## Pass Condition

The skill stays brief, does not shape artifacts itself, distinguishes workflow skills from support skills, and routes cleanly to `route-work` or `context-bootstrap-sync` when appropriate.
