# Routing Boundaries

`superplan-using-superplan` is an entry layer, not a workflow blob.

## It Owns

- checking whether Superplan should engage at all
- readiness guidance
- deferring to repo-native workflows before suggesting generic Superplan helpers
- choosing whether to stay out, resume a later phase, or enter routing
- routing to `superplan-route-work`
- routing to `superplan-context-bootstrap-sync` when missing context is the blocker
- routing to `superplan-execute-task-graph` when work is already shaped and should move
- routing to `superplan-review-task-against-ac` when the request is really a completion gate
- choosing the next workflow lane, not the inner support discipline directly

## It Does Not Own

- depth choice
- shaping artifacts
- execution
- completion review
- direct invocation of support disciplines as the primary route, except through the owning workflow phase

## Direct Routing Table

- simple answer with no durable value: stay out
- new repo work where engagement or depth is still open: `superplan-route-work`
- serious brownfield repo missing durable context: `superplan-context-bootstrap-sync`
- tracked work that should continue now: `superplan-execute-task-graph`
- completion or unblock judgment against a task contract: `superplan-review-task-against-ac`

## Workspace Precedence

- inspect the repo first
- prefer user-owned harnesses, scripts, custom skills, and repo-native workflows
- use Superplan to coordinate those workflows rather than replacing them
- only add generic Superplan help when the workspace does not already provide a better path
- never let a Superplan-specific helper outrank a working user-owned setup

## Workflow Spine Vs Support Skills

Use the workflow spine for phase ownership:

- engagement and depth: `superplan-route-work`
- shaping and trajectory: `superplan-shape-work`
- forward motion: `superplan-execute-task-graph`
- completion authority: `superplan-review-task-against-ac`
- durable context: `superplan-context-bootstrap-sync`

Use support skills inside those phases:

- `superplan-brainstorming`
- `superplan-writing-plans`
- `superplan-systematic-debugging`
- `superplan-test-driven-development`
- `superplan-verification-before-completion`

## Boundary Tests

- If the next question is "how much structure?", use `superplan-route-work`.
- If the next question is "is Superplan even ready here?", stay in `superplan-using-superplan`.
- If the next question is "what artifacts should exist?", use `superplan-shape-work`.
- If the next question is "what work is ready now?", use `superplan-execute-task-graph`.
- If the next question is "is this task actually done?", use `superplan-review-task-against-ac`.
- If the next question is "what stable repo truth are we missing before serious work?", use `superplan-context-bootstrap-sync`.

## Common Wrong Moves

- routing "continue T-003" back to `superplan-route-work`
- routing "is this done?" back to `superplan-execute-task-graph`
- routing directly to `superplan-brainstorming` or `superplan-systematic-debugging` from the entry layer
- treating missing setup and missing init as the same readiness failure
- suggesting a generic Superplan helper when the repo already has a better native workflow
