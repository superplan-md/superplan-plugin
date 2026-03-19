# Trajectory Changes

Classify execution discoveries before reacting.

## Local

- implementation detail changes
- narrow verifier findings inside the same task

Action:

- stay in execution

## Structural

- hidden dependency discovered
- task should split
- task contract no longer fits the real work

Action:

- pause affected work
- route to `shape-work`

## Strategic

- user goal changes
- top-level expectation changes
- engagement or depth decision was materially wrong

Action:

- stop broad execution
- route to `route-work`
