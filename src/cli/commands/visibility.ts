import { doctor } from './doctor';
import { loadTasks } from './task';
import { readOverlayPreferences } from '../overlay-preferences';
import {
  buildAndWriteVisibilityReport,
  type VisibilityDoctorSnapshot,
  type VisibilityRunReport,
  type VisibilityTaskSnapshot,
} from '../visibility-runtime';
import { commandNextAction, type NextAction } from '../next-action';

export type VisibilityResult =
  | {
      ok: true;
      data: {
        report: VisibilityRunReport;
        next_action: NextAction;
      };
    }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

const VISIBILITY_SUBCOMMANDS = new Set(['report']);

export function getVisibilityCommandHelpMessage(options: { subcommand?: string }): string {
  const intro = options.subcommand
    ? `Unknown visibility subcommand: ${options.subcommand}`
    : 'Superplan visibility command requires a subcommand.';

  return [
    intro,
    '',
    'Visibility commands:',
    '  report [--run <run_id>]      Build and print the latest repo-local visibility report',
    '',
    'Examples:',
    '  superplan visibility report',
    '  superplan visibility report --json',
  ].join('\n');
}

function getInvalidVisibilityCommandError(subcommand?: string): VisibilityResult {
  return {
    ok: false,
    error: {
      code: 'INVALID_VISIBILITY_COMMAND',
      message: getVisibilityCommandHelpMessage({ subcommand }),
      retryable: true,
    },
  };
}

function getOptionValue(args: string[], optionName: string): string | undefined {
  const optionIndex = args.indexOf(optionName);
  if (optionIndex === -1) {
    return undefined;
  }

  const optionValue = args[optionIndex + 1];
  if (!optionValue || optionValue.startsWith('--')) {
    return undefined;
  }

  return optionValue;
}

function getPositionalArgs(args: string[]): string[] {
  const positionalArgs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--json' || arg === '--quiet') {
      continue;
    }

    if (arg === '--run') {
      index += 1;
      continue;
    }

    positionalArgs.push(arg);
  }

  return positionalArgs;
}

async function reportVisibility(args: string[]): Promise<VisibilityResult> {
  const runId = getOptionValue(args, '--run');
  const [tasksResult, doctorResult, overlayPreferences] = await Promise.all([
    loadTasks(),
    doctor([]),
    readOverlayPreferences(),
  ]);

  const tasks: VisibilityTaskSnapshot[] = tasksResult.ok
    ? tasksResult.data.tasks
    : [];
  const doctorSnapshot: VisibilityDoctorSnapshot = {
    valid: doctorResult.data.valid,
    issues: doctorResult.data.issues,
  };

  const report = await buildAndWriteVisibilityReport({
    tasks,
    doctor: doctorSnapshot,
    overlayEnabled: overlayPreferences.effective_enabled,
    ...(runId ? { runId } : {}),
  });

  if (!report) {
    return {
      ok: false,
      error: {
        code: 'VISIBILITY_REPORT_UNAVAILABLE',
        message: 'No visibility report could be built for this workspace yet',
        retryable: true,
      },
    };
  }

  return {
    ok: true,
    data: {
      report,
      next_action: commandNextAction(
        'superplan status --json',
        'The visibility report is diagnostic output; the next operational step is checking the live frontier.',
      ),
    },
  };
}

export async function visibility(args: string[]): Promise<VisibilityResult> {
  const positionalArgs = getPositionalArgs(args);
  const subcommand = positionalArgs[0];

  if (!subcommand || !VISIBILITY_SUBCOMMANDS.has(subcommand)) {
    return getInvalidVisibilityCommandError(subcommand);
  }

  return reportVisibility(args);
}
