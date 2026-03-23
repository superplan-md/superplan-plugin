export type NextAction =
  | {
      type: 'command';
      command: string;
      reason: string;
    }
  | {
      type: 'wait_for_user';
      reason: string;
      prompt: string;
    }
  | {
      type: 'stop';
      reason: string;
      outcome: string;
    };

export function commandNextAction(command: string, reason: string): NextAction {
  return {
    type: 'command',
    command,
    reason,
  };
}

export function waitForUserNextAction(prompt: string, reason: string): NextAction {
  return {
    type: 'wait_for_user',
    prompt,
    reason,
  };
}

export function stopNextAction(outcome: string, reason: string): NextAction {
  return {
    type: 'stop',
    outcome,
    reason,
  };
}

export function getQueueNextAction(queues: {
  active: string | null;
  ready: string[];
  in_review: string[];
  blocked: string[];
  needs_feedback: string[];
}): NextAction {
  if (queues.active) {
    return commandNextAction(
      `superplan run ${queues.active} --json`,
      'An active task already exists, so continue it before selecting different work.',
    );
  }

  if (queues.ready.length > 0) {
    return commandNextAction(
      'superplan run --json',
      'There is no active task and at least one task is ready to start.',
    );
  }

  if (queues.needs_feedback.length > 0) {
    const taskId = queues.needs_feedback[0];
    return waitForUserNextAction(
      `User feedback is required before ${taskId} can continue.`,
      'The frontier is blocked on user input, so the automated loop must pause.',
    );
  }

  if (queues.blocked.length > 0) {
    const taskId = queues.blocked[0];
    return stopNextAction(
      `Task ${taskId} is blocked by an external dependency or unresolved condition.`,
      'The automated loop cannot continue until the blocker is resolved outside the current command flow.',
    );
  }

  if (queues.in_review.length > 0) {
    const taskId = queues.in_review[0];
    return stopNextAction(
      `Task ${taskId} is in review and needs an explicit review decision.`,
      'There is no runnable task; the next forward move is review resolution, not more execution commands.',
    );
  }

  return stopNextAction(
    'There is no runnable tracked work left in the current workspace state.',
    'The automated loop has reached a terminal state until new tracked work is created.',
  );
}
