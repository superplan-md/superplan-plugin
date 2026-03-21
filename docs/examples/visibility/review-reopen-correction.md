# Review Reopen Correction

Prompt: Send work to review, discover a gap, and reopen it with a durable correction trail.

## Superplan
- task complete, approve, and reopen create an explicit review trail.
- The report separates review health from implementation progress.
- Reopen counts and correction loops remain visible after the run closes.

## What Became Visible
- Review is a tracked handoff, not just a chat message.
- Correction loops are measurable instead of anecdotal.
- The final report can distinguish clean approval from late review failures.

## Raw Claude Code Baseline
- Review and correction steps blur into one conversation timeline.
- There is no durable reopen signal for later analysis.
- Late failures are easy to miss when reading only the final diff.

## Measured Deltas
| Signal | Superplan | Raw Claude Code |
| --- | --- | --- |
| Review state | Explicit in_review and reopened lifecycle | Conversation-only and easy to flatten |
| Late failure visibility | Captured in review/reopen counts | Requires manual post-hoc reading |

## Conclusion
Superplan makes late review failures visible as workflow evidence rather than post-hoc narrative.
