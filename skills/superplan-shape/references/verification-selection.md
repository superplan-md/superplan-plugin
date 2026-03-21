# Verification Selection

Choose the best available proof before execution begins.

## Preference Order

- trusted repo-native verification loops
- existing QA or browser routines
- current scripts and harnesses
- new lightweight proof only when the workspace lacks a better path

## Questions

- what proof maps to the acceptance criteria
- what proof will still be valid after likely local changes
- what proof is cheap enough to run honestly

## Bad Patterns

- generic acceptance criteria with no proof path
- inventing tests that the repo will never trust
- planning verification after execution instead of before it
