# Subagent Dispatch

Use subagents aggressively only when ownership and assumptions are bounded.

## Good Patterns

- branch parallelism on disjoint write surfaces
- worker plus verifier when the contract is stable enough
- blocker investigation while other safe ready work continues
- review shadowing for AC gap detection

## Bad Patterns

- parallel work on unstable shared assumptions
- verifier running against a moving target with no rerun plan
- workers redefining task contracts silently

## Required Dispatch Clarity

- owned task or write surface
- expected output
- verification expectation
- handoff condition
