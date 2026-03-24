# 00 - GLOBAL RULE: Start With `superplan-entry`

As an AI agent working in this repository, treat `superplan-entry` as the mandatory first gate for repo work.

This file does not replace `superplan-entry`.
It exists to force the right order:

1. load `superplan-entry`
2. let `superplan-entry` decide whether Superplan should engage
3. only then enter shaping, execution, review, or stay-out behavior

## 1. Mandatory First Contact

Before implementation, broad repo exploration, repo-specific planning, or repo-specific clarification:

- load and follow `superplan-entry`
- do not jump straight to `superplan status --json`, `superplan run --json`, or task authoring before `superplan-entry` decides Superplan is actually needed
- do not scaffold tracked work before `superplan-entry` has decided that Superplan should engage

## 2. `superplan-entry` Owns The Engagement Decision

`superplan-entry` decides:

- whether Superplan should stay out
- whether the repo is ready enough to proceed
- whether missing repo init should be created now
- which workflow phase owns the next step

If `superplan-entry` says stay out:

- answer directly
- create no Superplan artifacts
- do not force the user through `init`, task creation, or lifecycle commands

## 3. Fastest Path For Missing Repo Init

Missing repo init is not a blocker by itself.

If the `superplan` CLI is available and the repo should use Superplan:

- run `superplan init --scope local --yes --json`
- continue in the same turn
- avoid turning repo init into a separate user chore unless the CLI itself is missing or the command fails

Prefer the fewest user-visible steps that preserve correct workflow state.

## 4. CLI Discipline After Engagement

Once `superplan-entry` has decided Superplan should engage:

- use the Superplan CLI as the control plane
- do not hand-edit `.superplan/runtime/`
- do not hand-create `tasks/T-xxx.md` task contracts
- author the root graph in `.superplan/changes/<change-slug>/tasks.md` only in the shaping phase that owns that work
- use `superplan run`, `superplan task runtime block`, `superplan task runtime request-feedback`, `superplan task review complete`, and related lifecycle commands only after engagement is already settled

## 5. Overlay And User Communication

- do not assume overlay visibility unless the current workflow phase has verified it
- keep workflow routing internal
- talk to the user about outcomes, blockers, and decisions, not about skill selection or command choreography
