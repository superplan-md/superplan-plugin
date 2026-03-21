# Needs Feedback Handoff

Prompt: Stop safely when a requirement is ambiguous and surface exactly what the user needs to answer.

## Superplan
- task request-feedback records an explicit needs-feedback transition.
- The report marks the run as waiting on user input instead of merely idle.
- Overlay and runtime state can surface the handoff separately from normal progress.

## What Became Visible
- The user-facing blocker is explicit and durable.
- Feedback latency can be measured after the run.
- Later agents can tell whether work paused intentionally or drifted.

## Raw Claude Code Baseline
- Clarification requests blend into normal chat traffic.
- There is no durable wait-state separate from conversation noise.
- Later review cannot tell whether the pause was intentional or accidental.

## Measured Deltas
| Signal | Superplan | Raw Claude Code |
| --- | --- | --- |
| Pause classification | Explicit needs-feedback state | Only implied by prose |
| User wait time | Derivable from runtime timestamps | Not measurable without manual annotation |

## Conclusion
Superplan turns ambiguity into a first-class workflow state instead of burying it inside the transcript.
