# Review Task Against AC Evals

## Should Trigger

- task claims completion and downstream work may unblock

## Should Stay Out

- task is still clearly mid-execution
- verification is obviously missing

## Ambiguous Boundary

- a local implementation change may or may not have invalidated part of the evidence

## Overlap Boundary

- confirm unmet AC hands back to `execute-task-graph` rather than becoming quiet replanning
- confirm contract mismatch hands back to `shape-work`

## Handoff Check

- accepted review allows completion
- stale evidence triggers rerun
- contract drift triggers localized re-shape

## Pressure Scenario

- tests passed before a later material code change, while one AC is only weakly supported

## Pass Condition

The skill classifies evidence quality, freshness, and AC coverage explicitly, routes the right next authority, and refuses vibes-based completion.
