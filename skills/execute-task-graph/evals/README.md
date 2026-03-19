# Execute Task Graph Evals

## Should Trigger

- one or more graph-ready tasks exist

## Should Stay Out

- shaping is incomplete
- context is the real blocker

## Ambiguous Boundary

- a discovery during execution could be either a local trajectory change or a structural change requiring re-shape

## Overlap Boundary

- confirm it does not silently replan work that belongs back in `shape-work`
- confirm strategic goal change routes up to `route-work`

## Handoff Check

- review-ready work hands off to `review-task-against-ac`
- structural drift hands off to `shape-work`
- strategic drift hands off to `route-work`

## Pressure Scenario

- two ready tasks, one verifier opportunity, one hidden dependency discovered mid-run

## Pass Condition

The skill uses bounded execution, classifies change as local, structural, or strategic, and routes review, re-shape, or re-route explicitly instead of replanning silently.
