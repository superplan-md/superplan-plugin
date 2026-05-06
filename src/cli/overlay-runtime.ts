import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createOverlayControlState,
  createOverlaySnapshot,
  getOverlayRuntimePaths,
  type OverlayAttentionState,
  type OverlayChangeStatus,
  type OverlayEvent,
  type OverlayEventKind,
  type OverlayFocusedChange,
  type OverlayRequestedAction,
  type OverlayRuntimePaths,
  type OverlaySnapshot,
  type OverlayTaskStatus,
  type OverlayTaskSummary,
  type OverlayTrackedChange,
} from '../shared/overlay';
import { loadChangeGraph } from './graph';
import { getTaskRef, toQualifiedTaskId } from './task-identity';
import { formatTitleFromSlug } from './commands/scaffold';
import { readExecutionRootsState, type ExecutionRootsState } from './execution-roots';
import { resolveProjectIdentity } from './project-identity';
import { resolveSuperplanRoot, resolveWorkspaceRoot } from './workspace-root';

type TaskPriority = 'high' | 'medium' | 'low';

export interface OverlayTaskSource {
  task_id: string;
  change_id?: string;
  task_ref?: string;
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

interface OverlayTrackedChangeSource {
  change_id: string;
  title: string;
  status: OverlayChangeStatus;
  task_total: number;
  task_done: number;
  updated_at: string;
}

interface RefreshOverlaySnapshotOptions {
  workspacePath?: string;
  alertKinds?: OverlayEventKind[];
}

interface SetOverlayVisibilityOptions {
  workspacePath?: string;
}

interface OverlayRuntimeTaskEntry {
  status?: string;
}

interface OverlayRuntimeChangeEntry {
  active_task_ref?: string | null;
  tasks?: Record<string, OverlayRuntimeTaskEntry>;
}

interface OverlayRuntimeStateFile {
  changes?: Record<string, OverlayRuntimeChangeEntry>;
  tasks?: Record<string, OverlayRuntimeTaskEntry>;
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

async function writeOverlaySnapshot(paths: OverlayRuntimePaths, snapshot: OverlaySnapshot): Promise<void> {
  await fs.mkdir(paths.runtime_dir, { recursive: true });
  const tempSnapshotPath = `${paths.snapshot_path}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tempSnapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  await fs.rename(tempSnapshotPath, paths.snapshot_path);
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

function parseTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Date.parse(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function getTaskTimestamp(task: OverlayTaskSource): number | null {
  return parseTimestamp(task.updated_at)
    ?? parseTimestamp(task.completed_at)
    ?? parseTimestamp(task.started_at);
}

function toOverlayTaskSummary(task: OverlayTaskSource): OverlayTaskSummary {
  const description = getTaskDescription(task);
  return {
    task_id: task.task_id,
    ...(task.change_id ? { change_id: task.change_id } : {}),
    ...(task.task_ref ? { task_ref: task.task_ref } : {}),
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

function getAttentionState(tasks: OverlayTaskSource[], trackedChanges: OverlayTrackedChangeSource[]): OverlayAttentionState {
  if (tasks.some(task => task.status === 'needs_feedback')) {
    return 'needs_feedback';
  }

  const hasIncompleteTrackedChange = trackedChanges.some(change => change.status !== 'done');
  if (tasks.length > 0 && tasks.every(task => task.status === 'done') && !hasIncompleteTrackedChange) {
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

function getOverlaySnapshotWorkspacePaths(workspacePath: string): string[] {
  const workspaceRoot = resolveWorkspaceRoot(workspacePath);
  const projectRoot = resolveProjectIdentity(workspacePath).project_root;
  return [...new Set([workspaceRoot, projectRoot])];
}

async function readOverlayRuntimeTaskRefs(workspacePath: string): Promise<string[]> {
  const tasksPath = path.join(resolveSuperplanRoot(workspacePath), 'runtime', 'tasks.json');
  try {
    const parsed = JSON.parse(await fs.readFile(tasksPath, 'utf-8')) as OverlayRuntimeStateFile;
    if (parsed && typeof parsed === 'object' && parsed.changes && typeof parsed.changes === 'object') {
      const refs = new Set<string>();
      for (const [changeId, changeState] of Object.entries(parsed.changes)) {
        const activeTaskRef = typeof changeState?.active_task_ref === 'string'
          ? changeState.active_task_ref.trim()
          : '';
        if (activeTaskRef) {
          refs.add(activeTaskRef);
          continue;
        }

        if (!changeState?.tasks || typeof changeState.tasks !== 'object') {
          continue;
        }

        for (const [taskId, taskState] of Object.entries(changeState.tasks)) {
          if (taskState?.status === 'in_progress') {
            refs.add(toQualifiedTaskId(changeId, taskId));
          }
        }
      }

      return [...refs].sort((left, right) => left.localeCompare(right));
    }

    if (parsed && typeof parsed === 'object' && parsed.tasks && typeof parsed.tasks === 'object') {
      return Object.entries(parsed.tasks)
        .filter(([taskRef, taskState]) => taskRef.includes('/') && taskState?.status === 'in_progress')
        .map(([taskRef]) => taskRef)
        .sort((left, right) => left.localeCompare(right));
    }
  } catch {}

  return [];
}

function getAttachedChangeIdForWorkspace(
  executionRootsState: ExecutionRootsState,
  workspacePath: string,
): string | null {
  const workspaceRoot = resolveWorkspaceRoot(workspacePath);
  return Object.values(executionRootsState.roots)
    .find(record => record.path === workspaceRoot)
    ?.attached_change_id ?? null;
}

function getActiveOverlayTaskForWorkspace(
  board: OverlaySnapshot['board'],
  options: {
    activeTaskRefs: string[];
    attachedChangeId: string | null;
  },
): OverlayTaskSummary | null {
  const taskByRef = new Map<string, OverlayTaskSummary>();
  for (const task of board.in_progress) {
    if (task.task_ref) {
      taskByRef.set(task.task_ref, task);
    }
  }

  if (options.attachedChangeId) {
    const attachedActiveTaskRef = options.activeTaskRefs.find(taskRef => taskRef.startsWith(`${options.attachedChangeId}/`));
    if (attachedActiveTaskRef) {
      const attachedActiveTask = taskByRef.get(attachedActiveTaskRef);
      if (attachedActiveTask) {
        return attachedActiveTask;
      }
    }

    const attachedTask = board.in_progress.find(task => task.change_id === options.attachedChangeId);
    if (attachedTask) {
      return attachedTask;
    }
  }

  for (const taskRef of options.activeTaskRefs) {
    const activeTask = taskByRef.get(taskRef);
    if (activeTask) {
      return activeTask;
    }
  }

  return board.in_progress[0] ?? null;
}

async function getTrackedChangeTaskIds(changeDir: string): Promise<string[]> {
  const tasksDir = path.join(changeDir, 'tasks');
  let taskEntries: Array<{ isFile(): boolean; name: string }> = [];

  try {
    taskEntries = await fs.readdir(tasksDir, { withFileTypes: true });
  } catch {
    return [];
  }

  return taskEntries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.basename(entry.name, '.md'))
    .sort((left, right) => left.localeCompare(right));
}

function getTrackedChangeStatus(taskTotal: number, tasks: OverlayTaskSource[]): OverlayChangeStatus {
  if (taskTotal === 0) {
    return 'tracking';
  }

  if (tasks.some(task => task.status === 'needs_feedback')) {
    return 'needs_feedback';
  }

  if (tasks.some(task => task.status === 'in_progress')) {
    return 'in_progress';
  }

  if (tasks.some(task => task.status === 'blocked')) {
    return 'blocked';
  }

  if (tasks.length === taskTotal && tasks.every(task => task.status === 'done')) {
    return 'done';
  }

  return 'backlog';
}

async function getTrackedChangeUpdatedAt(options: {
  changeDir: string;
  taskIds: string[];
  matchedTasks: OverlayTaskSource[];
}): Promise<string> {
  const candidateTimestamps: number[] = [];

  try {
    const graphStats = await fs.stat(path.join(options.changeDir, 'tasks.md'));
    candidateTimestamps.push(graphStats.mtimeMs);
  } catch {}

  for (const taskId of options.taskIds) {
    try {
      const taskStats = await fs.stat(path.join(options.changeDir, 'tasks', `${taskId}.md`));
      candidateTimestamps.push(taskStats.mtimeMs);
    } catch {}
  }

  for (const task of options.matchedTasks) {
    const taskTimestamp = getTaskTimestamp(task);
    if (taskTimestamp !== null) {
      candidateTimestamps.push(taskTimestamp);
    }
  }

  const latestTimestamp = candidateTimestamps.length > 0
    ? Math.max(...candidateTimestamps)
    : Date.now();

  return new Date(latestTimestamp).toISOString();
}

async function collectTrackedChanges(
  workspacePath: string,
  tasks: OverlayTaskSource[],
): Promise<OverlayTrackedChangeSource[]> {
  const changesRoots = [
    path.join(resolveSuperplanRoot(), 'changes'),
    path.join(workspacePath, '.superplan', 'changes'),
  ];
  const changeDirs = new Map<string, string>();

  for (const changesRoot of changesRoots) {
    let changeEntries: Array<{ isDirectory(): boolean; name: string }> = [];
    try {
      changeEntries = await fs.readdir(changesRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of changeEntries) {
      if (!entry.isDirectory() || changeDirs.has(entry.name)) {
        continue;
      }
      changeDirs.set(entry.name, path.join(changesRoot, entry.name));
    }
  }

  const taskMap = new Map(tasks.map(task => [getTaskRef(task), task]));
  const trackedChanges: OverlayTrackedChangeSource[] = [];

  for (const [changeId, changeDir] of changeDirs.entries()) {
    const [graphResult, taskIds] = await Promise.all([
      loadChangeGraph(changeDir),
      getTrackedChangeTaskIds(changeDir),
    ]);
    const matchedTasks = taskIds
      .map(taskId => taskMap.get(toQualifiedTaskId(changeId, taskId)))
      .filter((task): task is OverlayTaskSource => task !== undefined);
    const taskTotal = taskIds.length;
    const taskDone = matchedTasks.filter(task => task.status === 'done').length;
    const title = graphResult.graph?.title?.trim() || formatTitleFromSlug(changeId);

    trackedChanges.push({
      change_id: changeId,
      title,
      status: getTrackedChangeStatus(taskTotal, matchedTasks),
      task_total: taskTotal,
      task_done: taskDone,
      updated_at: await getTrackedChangeUpdatedAt({
        changeDir,
        taskIds,
        matchedTasks,
      }),
    });
  }

  trackedChanges.sort((left, right) => {
    const leftIncomplete = left.status !== 'done';
    const rightIncomplete = right.status !== 'done';
    if (leftIncomplete !== rightIncomplete) {
      return leftIncomplete ? -1 : 1;
    }

    const timestampDifference = Date.parse(right.updated_at) - Date.parse(left.updated_at);
    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.change_id.localeCompare(right.change_id);
  });

  return trackedChanges;
}

function toOverlayTrackedChange(change: OverlayTrackedChangeSource): OverlayTrackedChange {
  return {
    change_id: change.change_id,
    title: change.title,
    status: change.status,
    task_total: change.task_total,
    task_done: change.task_done,
    updated_at: change.updated_at,
  };
}

function toFocusedChange(change: OverlayTrackedChangeSource | undefined): OverlayFocusedChange | null {
  if (!change) {
    return null;
  }

  return toOverlayTrackedChange(change);
}

export async function refreshOverlaySnapshot(
  tasks: OverlayTaskSource[],
  options: RefreshOverlaySnapshotOptions = {},
): Promise<{ paths: OverlayRuntimePaths; snapshot: OverlaySnapshot }> {
  const workspacePath = resolveWorkspaceRoot(options.workspacePath ?? resolveWorkspaceRoot());
  const projectIdentity = resolveProjectIdentity(workspacePath);
  const timestamp = new Date().toISOString();
  const sortedTasks = [...tasks].sort(sortTasks);
  const trackedChanges = await collectTrackedChanges(workspacePath, sortedTasks);
  const focusedChange = toFocusedChange(trackedChanges[0]);
  const attentionState = getAttentionState(sortedTasks, trackedChanges);
  const alertKinds = (options.alertKinds ?? []).filter(kind => kind !== 'all_tasks_done' || attentionState === 'all_tasks_done');

  const board = {
    in_progress: sortedTasks.filter(task => task.status === 'in_progress').map(toOverlayTaskSummary),
    backlog: sortedTasks.filter(task => getOverlayTaskStatus(task.status) === 'backlog').map(toOverlayTaskSummary),
    done: sortedTasks.filter(task => task.status === 'done').map(toOverlayTaskSummary),
    blocked: sortedTasks.filter(task => task.status === 'blocked').map(toOverlayTaskSummary),
    needs_feedback: sortedTasks.filter(task => task.status === 'needs_feedback').map(toOverlayTaskSummary),
  };
  const [executionRootsState, activeTaskRefs] = await Promise.all([
    readExecutionRootsState(workspacePath),
    readOverlayRuntimeTaskRefs(workspacePath),
  ]);
  const targetWorkspacePaths = getOverlaySnapshotWorkspacePaths(workspacePath);
  const snapshots = await Promise.all(targetWorkspacePaths.map(async targetWorkspacePath => {
    const paths = getOverlayRuntimePaths(targetWorkspacePath);
    const previousSnapshot = await readOverlaySnapshot(paths);
    const snapshot = createOverlaySnapshot({
      project_id: projectIdentity.project_id,
      project_name: path.basename(projectIdentity.project_root) || path.basename(targetWorkspacePath) || 'root',
      project_path: projectIdentity.project_root,
      workspace_path: targetWorkspacePath,
      session_id: `workspace:${targetWorkspacePath}`,
      updated_at: timestamp,
      tracked_changes: trackedChanges.map(toOverlayTrackedChange),
      focused_change: focusedChange,
      active_task: getActiveOverlayTaskForWorkspace(board, {
        activeTaskRefs,
        attachedChangeId: getAttachedChangeIdForWorkspace(executionRootsState, targetWorkspacePath),
      }),
      board,
      attention_state: attentionState,
      events: createAlertEvents(previousSnapshot?.events ?? [], alertKinds, timestamp),
    });

    await writeOverlaySnapshot(paths, snapshot);
    return {
      paths,
      snapshot,
    };
  }));

  return snapshots.find(item => item.snapshot.workspace_path === workspacePath) ?? snapshots[0];
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
