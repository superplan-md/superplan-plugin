import { task } from './task';
import { overlay } from './overlay';
import type { OverlayRuntimeNotice } from '../overlay-visibility';

interface RunDeps {
  taskFn: typeof task;
  overlayFn: typeof overlay;
}

export type RunResult =
  | {
      ok: true;
      data: {
        task_id: string | null;
        action: 'start' | 'continue' | 'idle';
        overlay?: OverlayRuntimeNotice;
      };
    }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

function getOverlayNoticeFromEnsureResult(result: Awaited<ReturnType<typeof overlay>>): OverlayRuntimeNotice | undefined {
  if (!result.ok || !('requested_action' in result.data) || !result.data.requested_action || !result.data.enabled || !result.data.companion) {
    return undefined;
  }

  return {
    requested_action: result.data.requested_action,
    applied_action: result.data.applied_action ?? result.data.requested_action,
    enabled: result.data.enabled,
    has_content: result.data.has_content,
    companion: result.data.companion,
  };
}

export async function run(deps: Partial<RunDeps> = {}): Promise<RunResult> {
  const runtimeDeps: RunDeps = {
    taskFn: task,
    overlayFn: overlay,
    ...deps,
  };

  const nextTaskResult = await runtimeDeps.taskFn(['next']);
  if (!nextTaskResult.ok) {
    return nextTaskResult;
  }

  if (!('task_id' in nextTaskResult.data) || !('status' in nextTaskResult.data)) {
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
      },
    };
  }

  if (nextTaskResult.data.status === 'in_progress') {
    const overlayResult = await runtimeDeps.overlayFn(['ensure']);
    const overlayNotice = getOverlayNoticeFromEnsureResult(overlayResult);

    return {
      ok: true,
      data: {
        task_id: nextTaskResult.data.task_id,
        action: 'continue',
        ...(overlayNotice ? { overlay: overlayNotice } : {}),
      },
    };
  }

  if (nextTaskResult.data.status === 'ready') {
    const startTaskResult = await runtimeDeps.taskFn(['start', nextTaskResult.data.task_id]);
    if (!startTaskResult.ok) {
      return startTaskResult;
    }

    return {
      ok: true,
      data: {
        task_id: nextTaskResult.data.task_id,
        action: 'start',
        ...('overlay' in startTaskResult.data && startTaskResult.data.overlay
          ? { overlay: startTaskResult.data.overlay }
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
