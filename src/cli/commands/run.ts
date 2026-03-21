import { activateTask, selectNextTask, type ParsedTask } from './task';
import type { OverlayRuntimeNotice } from '../overlay-visibility';

interface RunDeps {
  selectNextTaskFn: typeof selectNextTask;
  activateTaskFn: typeof activateTask;
}

export type RunResult =
  | {
      ok: true;
      data: {
        task_id: string | null;
        action: 'start' | 'resume' | 'continue' | 'idle';
        status: 'in_progress' | null;
        task: ParsedTask | null;
        reason: string;
        overlay?: OverlayRuntimeNotice;
      };
    }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

function getPositionalArgs(args: string[]): string[] {
  return args.filter(arg => arg !== '--json' && arg !== '--quiet');
}

function getInvalidRunCommandError(): RunResult {
  return {
    ok: false,
    error: {
      code: 'INVALID_RUN_COMMAND',
      message: [
        'Run accepts at most one optional <task_id>.',
        '',
        'Usage:',
        '  superplan run',
        '  superplan run <task_id>',
      ].join('\n'),
      retryable: true,
    },
  };
}

function buildRunResultFromActivation(activationResult: Awaited<ReturnType<typeof activateTask>>): RunResult {
  if (!activationResult.ok) {
    return activationResult;
  }

  return {
    ok: true,
    data: {
      task_id: activationResult.data.task_id,
      action: activationResult.data.action,
      status: activationResult.data.status,
      task: activationResult.data.task,
      reason: activationResult.data.reason,
      ...('overlay' in activationResult.data && activationResult.data.overlay
        ? { overlay: activationResult.data.overlay }
        : {}),
    },
  };
}

export async function run(args: string[] = [], deps: Partial<RunDeps> = {}): Promise<RunResult> {
  const runtimeDeps: RunDeps = {
    selectNextTaskFn: selectNextTask,
    activateTaskFn: activateTask,
    ...deps,
  };
  const positionalArgs = getPositionalArgs(args);

  if (positionalArgs.length > 1) {
    return getInvalidRunCommandError();
  }

  const explicitTaskId = positionalArgs[0];
  if (explicitTaskId) {
    return buildRunResultFromActivation(await runtimeDeps.activateTaskFn(explicitTaskId));
  }

  const nextTaskResult = await runtimeDeps.selectNextTaskFn();
  if (!nextTaskResult.ok) {
    return nextTaskResult;
  }

  if (
    !('task_id' in nextTaskResult.data)
    || !('status' in nextTaskResult.data)
    || !('task' in nextTaskResult.data)
    || !('reason' in nextTaskResult.data)
  ) {
    return {
      ok: false,
      error: {
        code: 'RUN_FAILED',
        message: 'Unexpected task next result',
        retryable: false,
      },
    };
  }

  if (nextTaskResult.data.task_id === null) {
    return {
      ok: true,
      data: {
        task_id: null,
        action: 'idle',
        status: null,
        task: null,
        reason: nextTaskResult.data.reason,
      },
    };
  }

  if (nextTaskResult.data.status === 'in_progress' || nextTaskResult.data.status === 'ready') {
    const activationResult = await runtimeDeps.activateTaskFn(nextTaskResult.data.task_id);
    if (!activationResult.ok) {
      return activationResult;
    }

    return {
      ok: true,
      data: {
        task_id: activationResult.data.task_id,
        action: activationResult.data.action,
        status: activationResult.data.status,
        task: activationResult.data.task,
        reason: nextTaskResult.data.reason,
        ...('overlay' in activationResult.data && activationResult.data.overlay
          ? { overlay: activationResult.data.overlay }
          : {}),
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'RUN_FAILED',
      message: 'Unexpected task next status',
      retryable: false,
    },
  };
}
