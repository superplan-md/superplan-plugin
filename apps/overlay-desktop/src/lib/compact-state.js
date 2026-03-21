function getPrimaryTask(snapshot) {
  return snapshot.active_task
    ?? snapshot.board.needs_feedback[0]
    ?? snapshot.board.in_progress[0]
    ?? snapshot.board.blocked[0]
    ?? snapshot.board.backlog[0]
    ?? snapshot.board.done[0]
    ?? null;
}

export function isTaskReadyForReview(task) {
  if (!task || task.status !== 'backlog') {
    return false;
  }

  return typeof task.completed_acceptance_criteria === 'number'
    && typeof task.total_acceptance_criteria === 'number'
    && task.total_acceptance_criteria > 0
    && task.completed_acceptance_criteria >= task.total_acceptance_criteria;
}

export function shouldShowCompactDetail(snapshot, detailExpanded) {
  if (!snapshot) {
    return false;
  }

  if (snapshot.attention_state === 'needs_feedback' || snapshot.attention_state === 'all_tasks_done') {
    return true;
  }

  return detailExpanded && Boolean(getPrimaryTask(snapshot));
}

export function shouldAutoExpandCompactDetail(previousSnapshot, nextSnapshot, mode) {
  if (!nextSnapshot || mode !== 'compact') {
    return false;
  }

  if (nextSnapshot.attention_state === 'needs_feedback' || nextSnapshot.attention_state === 'all_tasks_done') {
    return false;
  }

  const nextPrimaryTask = getPrimaryTask(nextSnapshot);
  if (!nextPrimaryTask) {
    return false;
  }

  if (!previousSnapshot) {
    return true;
  }

  const previousPrimaryTask = getPrimaryTask(previousSnapshot);
  if (!previousPrimaryTask) {
    return true;
  }

  const previousActiveTaskId = previousSnapshot.active_task?.task_id ?? null;
  const nextActiveTaskId = nextSnapshot.active_task?.task_id ?? null;

  if (nextActiveTaskId !== previousActiveTaskId) {
    return true;
  }

  return nextPrimaryTask.task_id !== previousPrimaryTask.task_id;
}

export function createCompactPresentationModel(snapshot, options = {}) {
  const detailExpanded = options.detailExpanded ?? false;
  const primaryTask = getPrimaryTask(snapshot);
  const presentation = shouldShowCompactDetail(snapshot, detailExpanded) ? 'detail' : 'chip';

  return {
    primaryTask,
    presentation,
    showHideAction: presentation === 'detail',
    showCollapseAction: presentation === 'detail'
      && snapshot.attention_state === 'normal'
      && primaryTask !== null,
    showBoardAction: presentation === 'detail',
    isReviewReadyTask: isTaskReadyForReview(primaryTask),
  };
}
