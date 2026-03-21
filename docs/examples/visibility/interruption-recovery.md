# Interruption Recovery

Prompt: Pause work mid-task, return later, and continue without relying on chat memory alone.

## Superplan
- .superplan/runtime/tasks.json keeps the active task and timestamps explicit.
- .superplan/runtime/events.ndjson records start, pause, and resume transitions.
- visibility report explains whether the run recovered cleanly or stalled.

## What Became Visible
- The exact resume point is durable and repo-local.
- Blocked or resumed state changes are visible without replaying chat.
- Elapsed time and interruption count can be inspected after the run.

## Raw Claude Code Baseline
- Recovery depends on transcript recall and manual reconstruction.
- There is no durable distinction between idle, blocked, and abandoned work.
- Timing and interruption signals are implicit or lost.

## Measured Deltas
| Signal | Superplan | Raw Claude Code |
| --- | --- | --- |
| Resume point | Explicit in runtime state and report | Recovered manually from prior chat context |
| Interruption trace | Append-only lifecycle events | No durable event trail |

## Conclusion
Superplan makes interruptions inspectable and recoverable, while the raw baseline relies on memory and chat archaeology.
