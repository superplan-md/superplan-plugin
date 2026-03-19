# Routing Boundaries

`using-superplan` is an entry layer, not a workflow blob.

## It Owns

- checking whether Superplan should engage at all
- readiness guidance
- routing to `route-work`
- routing to `context-bootstrap-sync` when missing context is the blocker
- choosing the next workflow lane, not the inner support discipline directly

## It Does Not Own

- depth choice
- shaping artifacts
- execution
- completion review
- direct invocation of support disciplines as the primary route, except through the owning workflow phase

## Workflow Spine Vs Support Skills

Use the workflow spine for phase ownership:

- engagement and depth: `route-work`
- shaping and trajectory: `shape-work`
- forward motion: `execute-task-graph`
- completion authority: `review-task-against-ac`
- durable context: `context-bootstrap-sync`

Use support skills inside those phases:

- `brainstorming`
- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `verification-before-completion`

## Boundary Tests

- If the next question is "how much structure?", use `route-work`.
- If the next question is "what artifacts should exist?", use `shape-work`.
- If the next question is "what work is ready now?", use `execute-task-graph`.
- If the next question is "is this task actually done?", use `review-task-against-ac`.
