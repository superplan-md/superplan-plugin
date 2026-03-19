# Runtime State

Runtime truth is not graph truth and not task-contract truth.

Current CLI-backed runtime storage:

- `.superplan/runtime/tasks.json`
- `.superplan/runtime/events.ndjson`

## Graph Truth

- what tasks exist
- dependency edges
- what is graph-ready

## Task-Contract Truth

- what each task means
- acceptance criteria
- bounded write and review target

## Runtime Truth

- what is running now
- what is blocked now
- what needs feedback now
- what is ready for review now

## Current CLI Runtime States

- `in_progress`
- `blocked`
- `needs_feedback`
- `done`

## Workflow Outputs Not Yet Persisted As CLI State

- review ready
- localized re-shape required
- strategic re-route required

These can still be skill outputs and handoff states even when the CLI does not store them directly.

## Execution States To Surface

- in progress
- blocked
- needs feedback
- review ready
- localized re-shape required
- strategic re-route required

## Useful CLI Reads

- `superplan task current`
- `superplan task next`
- `superplan task why-next`
- `superplan task why <task_id>`
- `superplan task events [task_id]`
- `superplan status`
