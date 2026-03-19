---
name: review-task-against-ac
description: Use when a Superplan task claims completion or downstream work depends on verifying its acceptance criteria and completion evidence.
---

# Review Task Against AC

## Overview

Decide whether a task is actually complete against its contract.

This is the Superplan-specific completion gate.
It must judge completion against the task contract, acceptance criteria, and fresh evidence rather than vibes or implementation plausibility.

## Trigger

Use when:

- a task is claimed ready for completion
- downstream work may unblock if the task is truly done
- verification has run and the system must decide whether the results are still valid
- subagents have produced evidence that appears sufficient

## Stay Out

Do not review when:

- the task is clearly mid-execution
- key evidence is still missing
- the task contract is too broken to review cleanly
- the verification basis is obviously stale and must be rerun first
- structural trajectory change invalidated the review target

## Inputs And Assumptions

Inputs:

- task contract
- acceptance criteria
- implementation evidence
- verification outputs
- outputs from trusted workspace-native harnesses or QA flows
- runtime notes and recent trajectory changes
- subagent outputs and ownership boundaries where relevant
- chosen verification plan when available
- recent decision log entries affecting contract interpretation
- known gotchas that may invalidate naive review

Assumptions:

- completion must be judged against the task contract
- evidence can become stale after material implementation or trajectory change
- not all evidence is equal

## Evidence Validity Model

Classify evidence before trusting it:

- strong valid evidence: directly covers the claimed AC and targets the current implementation
- weak but useful evidence: supports the judgment but cannot prove important AC alone
- stale evidence: verification predates material changes or earlier task understanding
- invalid evidence: unrelated, mis-targeted, or based on false assumptions

See `references/evidence-validity.md` and `references/stale-verification.md`.

## Trajectory-Aware Review Rules

- local execution change: review may continue, rerunning only invalidated checks
- structural trajectory change: do not bless the task as-is; require localized re-shape or reconciliation
- strategic trajectory change: stop pretending the old AC are sufficient

## Allowed Actions

- evaluate each acceptance criterion
- inspect evidence provenance, freshness, and relevance
- reconcile subagent-produced evidence against the final task contract
- run or require relevant verification
- prefer the repo's trusted verification path when more proof is needed
- require reruns when evidence is stale
- reject completion when the contract changed materially
- decide:
  - `accepted`
  - `rejected`
  - `incomplete`
  - `rerun required`
  - `re-shape required`
  - `needs human judgment`
- identify which AC are unmet or only weakly supported
- identify which review outcome should be recorded as a durable decision
- identify whether a new gotcha was discovered during review

## Forbidden Behavior

- treating Superplan-originated evidence as inherently better than valid workspace-native evidence
- requiring a Superplan-specific verification path when the workspace already has a trustworthy one
- broad replanning
- silently changing the task contract to fit work already done
- marking tasks complete on vibes
- unblocking downstream work without real review
- treating any passing test as universal proof
- trusting stale evidence after material changes

## Outputs

Expected output categories:

- accepted as complete
- rejected: unmet AC
- incomplete: missing evidence
- rerun required: stale evidence
- localized re-shape required
- needs human judgment

The output should identify:

- each acceptance criterion
- its current status
- evidence class for that AC
- whether verification is fresh enough
- whether downstream unblocking is safe

## Completion Authority

Allow completion only when all of the following hold:

- the task contract still describes the actual work being judged
- the relevant acceptance criteria are satisfied
- the strongest available proof has been gathered or reused honestly
- no stale evidence remains on critical AC
- no unresolved blockers remain inside the task contract

## Decision And Gotcha Rules

Use `.superplan/decisions.md` for material review judgments that affect downstream work, such as acceptance, rejection, rerun requirements, or contract mismatch findings that future agents need to know.

Do not log every trivial successful review.

Use `.superplan/gotchas.md` for recurring review failures, stale-evidence traps, misleading verification signals, and repo-specific proof pitfalls likely to recur.

See `references/gotchas.md`.

## Handoff

Likely handoffs:

- back to `execute-task-graph` for more work
- task completion if accepted
- user feedback if human judgment is needed
- back to `shape-work` when the task contract no longer matches the real work

Internal support-skill usage may include:

- `verification-before-completion`

## Future CLI Hooks

- `superplan task review`
- `superplan task complete --if-reviewed`
- `superplan doctor`
- `superplan task evidence`
- `superplan task verify`
- `superplan task reconcile-review`

## Validation Cases

Should reject:

- tests pass but explicit AC remain unmet
- implementation exists but no evidence supports claimed behavior
- required docs, tests, or outputs are missing

Should accept:

- all required AC are satisfied
- relevant verification is complete
- evidence is fresh enough for the current implementation and contract

Should require rerun:

- verification predates material changes
- verification targeted the wrong environment or branch

Should require localized re-shape:

- the task contract no longer matches the real implementation path
- a hidden dependency changed what done should mean
