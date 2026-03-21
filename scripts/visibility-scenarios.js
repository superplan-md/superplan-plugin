#!/usr/bin/env node
const fs = require('node:fs/promises');
const path = require('node:path');

const SCENARIOS = [
  {
    id: 'interruption-recovery',
    title: 'Interruption Recovery',
    prompt: 'Pause work mid-task, return later, and continue without relying on chat memory alone.',
    superplan: {
      artifacts: [
        '.superplan/runtime/tasks.json keeps the active task and timestamps explicit.',
        '.superplan/runtime/events.ndjson records start, pause, and resume transitions.',
        'visibility report explains whether the run recovered cleanly or stalled.',
      ],
      visibility_gains: [
        'The exact resume point is durable and repo-local.',
        'Blocked or resumed state changes are visible without replaying chat.',
        'Elapsed time and interruption count can be inspected after the run.',
      ],
    },
    baseline: {
      mode: 'raw_claude_code',
      visibility_gaps: [
        'Recovery depends on transcript recall and manual reconstruction.',
        'There is no durable distinction between idle, blocked, and abandoned work.',
        'Timing and interruption signals are implicit or lost.',
      ],
    },
    measured_deltas: [
      {
        signal: 'Resume point',
        superplan: 'Explicit in runtime state and report',
        baseline: 'Recovered manually from prior chat context',
      },
      {
        signal: 'Interruption trace',
        superplan: 'Append-only lifecycle events',
        baseline: 'No durable event trail',
      },
    ],
    conclusion: 'Superplan makes interruptions inspectable and recoverable, while the raw baseline relies on memory and chat archaeology.',
  },
  {
    id: 'needs-feedback-handoff',
    title: 'Needs Feedback Handoff',
    prompt: 'Stop safely when a requirement is ambiguous and surface exactly what the user needs to answer.',
    superplan: {
      artifacts: [
        'task request-feedback records an explicit needs-feedback transition.',
        'The report marks the run as waiting on user input instead of merely idle.',
        'Overlay and runtime state can surface the handoff separately from normal progress.',
      ],
      visibility_gains: [
        'The user-facing blocker is explicit and durable.',
        'Feedback latency can be measured after the run.',
        'Later agents can tell whether work paused intentionally or drifted.',
      ],
    },
    baseline: {
      mode: 'raw_claude_code',
      visibility_gaps: [
        'Clarification requests blend into normal chat traffic.',
        'There is no durable wait-state separate from conversation noise.',
        'Later review cannot tell whether the pause was intentional or accidental.',
      ],
    },
    measured_deltas: [
      {
        signal: 'Pause classification',
        superplan: 'Explicit needs-feedback state',
        baseline: 'Only implied by prose',
      },
      {
        signal: 'User wait time',
        superplan: 'Derivable from runtime timestamps',
        baseline: 'Not measurable without manual annotation',
      },
    ],
    conclusion: 'Superplan turns ambiguity into a first-class workflow state instead of burying it inside the transcript.',
  },
  {
    id: 'review-reopen-correction',
    title: 'Review Reopen Correction',
    prompt: 'Send work to review, discover a gap, and reopen it with a durable correction trail.',
    superplan: {
      artifacts: [
        'task complete, approve, and reopen create an explicit review trail.',
        'The report separates review health from implementation progress.',
        'Reopen counts and correction loops remain visible after the run closes.',
      ],
      visibility_gains: [
        'Review is a tracked handoff, not just a chat message.',
        'Correction loops are measurable instead of anecdotal.',
        'The final report can distinguish clean approval from late review failures.',
      ],
    },
    baseline: {
      mode: 'raw_claude_code',
      visibility_gaps: [
        'Review and correction steps blur into one conversation timeline.',
        'There is no durable reopen signal for later analysis.',
        'Late failures are easy to miss when reading only the final diff.',
      ],
    },
    measured_deltas: [
      {
        signal: 'Review state',
        superplan: 'Explicit in_review and reopened lifecycle',
        baseline: 'Conversation-only and easy to flatten',
      },
      {
        signal: 'Late failure visibility',
        superplan: 'Captured in review/reopen counts',
        baseline: 'Requires manual post-hoc reading',
      },
    ],
    conclusion: 'Superplan makes late review failures visible as workflow evidence rather than post-hoc narrative.',
  },
];

function renderScenarioMarkdown(scenario) {
  const deltaRows = scenario.measured_deltas
    .map(delta => `| ${delta.signal} | ${delta.superplan} | ${delta.baseline} |`)
    .join('\n');

  return [
    `# ${scenario.title}`,
    '',
    `Prompt: ${scenario.prompt}`,
    '',
    '## Superplan',
    ...scenario.superplan.artifacts.map(artifact => `- ${artifact}`),
    '',
    '## What Became Visible',
    ...scenario.superplan.visibility_gains.map(gain => `- ${gain}`),
    '',
    '## Raw Claude Code Baseline',
    ...scenario.baseline.visibility_gaps.map(gap => `- ${gap}`),
    '',
    '## Measured Deltas',
    '| Signal | Superplan | Raw Claude Code |',
    '| --- | --- | --- |',
    deltaRows,
    '',
    '## Conclusion',
    scenario.conclusion,
    '',
  ].join('\n');
}

function renderIndexMarkdown(scenarios) {
  return [
    '# Visibility Examples',
    '',
    'These paired scenarios are the internal comparison harness for the Superplan visibility program.',
    'Each example contrasts the same workflow moment with Superplan enabled versus raw Claude Code without Superplan task/runtime scaffolding.',
    '',
    '## Scenarios',
    ...scenarios.map(scenario => `- [${scenario.title}](./${scenario.id}.md)`),
    '',
  ].join('\n');
}

async function writeVisibilityExamples(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const outputDir = path.join(rootDir, 'docs', 'examples', 'visibility');
  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(SCENARIOS.flatMap(scenario => [
    fs.writeFile(path.join(outputDir, `${scenario.id}.json`), `${JSON.stringify(scenario, null, 2)}\n`, 'utf-8'),
    fs.writeFile(path.join(outputDir, `${scenario.id}.md`), renderScenarioMarkdown(scenario), 'utf-8'),
  ]));

  await fs.writeFile(path.join(outputDir, 'README.md'), renderIndexMarkdown(SCENARIOS), 'utf-8');

  return {
    output_dir: outputDir,
    scenarios: SCENARIOS.map(({ id, title }) => ({ id, title })),
  };
}

if (require.main === module) {
  writeVisibilityExamples().then(result => {
    console.log(JSON.stringify({
      ok: true,
      data: result,
      error: null,
    }, null, 2));
  }).catch(error => {
    console.error(JSON.stringify({
      ok: false,
      error: {
        code: 'VISIBILITY_EXAMPLES_FAILED',
        message: error instanceof Error ? error.message : 'Failed to write visibility examples',
        retryable: false,
      },
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  SCENARIOS,
  renderScenarioMarkdown,
  writeVisibilityExamples,
};
