import * as fs from 'fs/promises';
import {
  createOverlayControlState,
  createOverlaySnapshot,
  getOverlayRuntimePaths,
  type OverlayAttentionState,
  type OverlayEvent,
  type OverlayEventKind,
  type OverlayRequestedAction,
  type OverlayRuntimePaths,
  type OverlaySnapshot,
  type OverlayTaskStatus,
  type OverlayTaskSummary,
} from '../shared/overlay';
import { resolveWorkspaceRoot } from './workspace-root';

type TaskPriority = 'high' | 'medium' | 'low';

export interface OverlayTaskSource {
  task_id: string;
  description: string;
  status: string;
  priority: TaskPriority;
  completed_acceptance_criteria?: number;
  total_acceptance_criteria?: number;
  progress_percent?: number;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  reason?: string;
  message?: string;
}

interface RefreshOverlaySnapshotOptions {
  workspacePath?: string;
  alertKinds?: OverlayEventKind[];
}

interface SetOverlayVisibilityOptions {
  workspacePath?: string;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readOverlaySnapshot(paths: OverlayRuntimePaths): Promise<OverlaySnapshot | null> {
  if (!await pathExists(paths.snapshot_path)) {
    return null;
  }

  try {
    const content = await fs.readFile(paths.snapshot_path, 'utf-8');
    return JSON.parse(content) as OverlaySnapshot;
  } catch {
    return null;
  }
}

function getPriorityRank(priority: TaskPriority): number {
  if (priority === 'high') {
    return 0;
  }

  if (priority === 'medium') {
    return 1;
  }

  return 2;
}

function sortTasks(left: OverlayTaskSource, right: OverlayTaskSource): number {
  const priorityDifference = getPriorityRank(left.priority) - getPriorityRank(right.priority);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return left.task_id.localeCompare(right.task_id);
}

function getOverlayTaskStatus(status: string): OverlayTaskStatus {
  if (status === 'in_progress' || status === 'done' || status === 'blocked' || status === 'needs_feedback') {
    return status;
  }

  return 'backlog';
}

function getTaskTitle(task: OverlayTaskSource): string {
  const firstLine = task.description
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);

  return firstLine ?? task.task_id;
}

function getTaskDescription(task: OverlayTaskSource): string | undefined {
  const lines = task.description
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const excerpt = lines
    .slice(1)
    .find(line => !line.startsWith('##'));

  return excerpt || undefined;
}

function toOverlayTaskSummary(task: OverlayTaskSource): OverlayTaskSummary {
  const description = getTaskDescription(task);
  return {
    task_id: task.task_id,
    title: getTaskTitle(task),
    ...(description ? { description } : {}),
    status: getOverlayTaskStatus(task.status),
    ...(typeof task.completed_acceptance_criteria === 'number'
      ? { completed_acceptance_criteria: task.completed_acceptance_criteria }
      : {}),
    ...(typeof task.total_acceptance_criteria === 'number'
      ? { total_acceptance_criteria: task.total_acceptance_criteria }
      : {}),
    ...(typeof task.progress_percent === 'number'
      ? { progress_percent: task.progress_percent }
      : {}),
    ...(task.started_at ? { started_at: task.started_at } : {}),
    ...(task.completed_at ? { completed_at: task.completed_at } : {}),
    ...(task.updated_at ? { updated_at: task.updated_at } : {}),
    ...(task.reason ? { reason: task.reason } : {}),
    ...(task.message ? { message: task.message } : {}),
  };
}

function getAttentionState(tasks: OverlayTaskSource[]): OverlayAttentionState {
  if (tasks.some(task => task.status === 'needs_feedback')) {
    return 'needs_feedback';
  }

  if (tasks.length > 0 && tasks.every(task => task.status === 'done')) {
    return 'all_tasks_done';
  }

  return 'normal';
}

// Bug H3 fix: cap the ring buffer so overlay.json and the V8 snapshot heap
// don't grow without bound. Every task lifecycle event previously appended
// forever; in a long session this caused multi-MB JSON and increasing disk I/O
// at every poll tick.
const MAX_OVERLAY_EVENTS = 20;

function createAlertEvents(previousEvents: OverlayEvent[], alertKinds: OverlayEventKind[], timestamp: string): OverlayEvent[] {
  const newEvents = alertKinds.map((kind, index) => ({
    id: `${kind}:${Date.parse(timestamp)}:${index}`,
    kind,
    created_at: timestamp,
  }));

  return [...previousEvents, ...newEvents].slice(-MAX_OVERLAY_EVENTS);
}

export async function refreshOverlaySnapshot(
  tasks: OverlayTaskSource[],
  options: RefreshOverlaySnapshotOptions = {},
): Promise<{ paths: OverlayRuntimePaths; snapshot: OverlaySnapshot }> {
  const workspacePath = options.workspacePath ?? resolveWorkspaceRoot();
  const paths = getOverlayRuntimePaths(workspacePath);
  const timestamp = new Date().toISOString();
  const previousSnapshot = await readOverlaySnapshot(paths);
  const sortedTasks = [...tasks].sort(sortTasks);
  const attentionState = getAttentionState(sortedTasks);

  const board = {
    in_progress: sortedTasks.filter(task => task.status === 'in_progress').map(toOverlayTaskSummary),
    backlog: sortedTasks.filter(task => getOverlayTaskStatus(task.status) === 'backlog').map(toOverlayTaskSummary),
    done: sortedTasks.filter(task => task.status === 'done').map(toOverlayTaskSummary),
    blocked: sortedTasks.filter(task => task.status === 'blocked').map(toOverlayTaskSummary),
    needs_feedback: sortedTasks.filter(task => task.status === 'needs_feedback').map(toOverlayTaskSummary),
  };

  const snapshot = createOverlaySnapshot({
    workspace_path: workspacePath,
    session_id: `workspace:${workspacePath}`,
    updated_at: timestamp,
    active_task: board.in_progress[0] ?? null,
    board,
    attention_state: attentionState,
    events: createAlertEvents(previousSnapshot?.events ?? [], options.alertKinds ?? [], timestamp),
  });

  await fs.mkdir(paths.runtime_dir, { recursive: true });
  const tempSnapshotPath = `${paths.snapshot_path}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tempSnapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  await fs.rename(tempSnapshotPath, paths.snapshot_path);

  return {
    paths,
    snapshot,
  };
}

export async function setOverlayVisibilityRequest(
  requestedAction: OverlayRequestedAction,
  options: SetOverlayVisibilityOptions = {},
): Promise<{ paths: OverlayRuntimePaths; control: ReturnType<typeof createOverlayControlState> }> {
  const workspacePath = options.workspacePath ?? resolveWorkspaceRoot();
  const paths = getOverlayRuntimePaths(workspacePath);
  const control = createOverlayControlState({
    workspace_path: workspacePath,
    requested_action: requestedAction,
    updated_at: new Date().toISOString(),
  });

  await fs.mkdir(paths.runtime_dir, { recursive: true });
  const tempControlPath = `${paths.control_path}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tempControlPath, JSON.stringify(control, null, 2), 'utf-8');
  await fs.rename(tempControlPath, paths.control_path);

  return {
    paths,
    control,
  };
}
