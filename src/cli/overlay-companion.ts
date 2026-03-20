import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';
import { readInstallMetadata } from './install-metadata';

type OverlayCompanionSource = 'env' | 'install_metadata' | null;

export type OverlayCompanionIssue =
  | 'not_installed'
  | 'install_path_missing'
  | 'executable_missing'
  | 'launch_failed'
  | 'not_requested';

export interface OverlayCompanionStatus {
  configured: boolean;
  launchable: boolean;
  source: OverlayCompanionSource;
  install_path: string | null;
  executable_path: string | null;
  reason?: OverlayCompanionIssue;
  message?: string;
}

export interface OverlayCompanionLaunchResult extends OverlayCompanionStatus {
  attempted: boolean;
  launched: boolean;
  workspace_path: string;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeConfiguredPath(value: string | undefined | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function resolveExecutableFromInstallPath(
  installPath: string,
  executableRelativePath?: string,
): Promise<string | null> {
  if (!await pathExists(installPath)) {
    return null;
  }

  const stats = await fs.stat(installPath);
  if (stats.isFile()) {
    return installPath;
  }

  const relativeExecutable = normalizeConfiguredPath(executableRelativePath);
  if (relativeExecutable) {
    const configuredExecutablePath = path.join(installPath, relativeExecutable);
    if (await pathExists(configuredExecutablePath)) {
      return configuredExecutablePath;
    }
  }

  const macOsExecutableDir = path.join(installPath, 'Contents', 'MacOS');
  if (await pathExists(macOsExecutableDir)) {
    const entries = await fs.readdir(macOsExecutableDir, { withFileTypes: true });
    const executableEntry = entries.find(entry => entry.isFile());
    if (executableEntry) {
      return path.join(macOsExecutableDir, executableEntry.name);
    }
  }

  return null;
}

function resolveMacosAppBundlePath(
  installPath: string | null,
  executablePath: string | null,
): string | null {
  const normalizedInstallPath = normalizeConfiguredPath(installPath);
  if (normalizedInstallPath?.endsWith('.app')) {
    return normalizedInstallPath;
  }

  const normalizedExecutablePath = normalizeConfiguredPath(executablePath);
  if (!normalizedExecutablePath) {
    return null;
  }

  let currentPath = path.dirname(normalizedExecutablePath);
  while (currentPath !== path.dirname(currentPath)) {
    if (currentPath.endsWith('.app')) {
      return currentPath;
    }

    currentPath = path.dirname(currentPath);
  }

  return null;
}

async function resolveOverlayCompanionStatusFromPaths(input: {
  source: Exclude<OverlayCompanionSource, null>;
  installPath: string | null;
  executablePath: string | null;
  executableRelativePath?: string;
}): Promise<OverlayCompanionStatus> {
  const installPath = input.installPath;
  const configuredExecutablePath = input.executablePath;

  if (!installPath && !configuredExecutablePath) {
    return {
      configured: false,
      launchable: false,
      source: input.source,
      install_path: null,
      executable_path: null,
      reason: 'not_installed',
      message: 'Overlay companion is not installed.',
    };
  }

  if (installPath && !await pathExists(installPath)) {
    return {
      configured: true,
      launchable: false,
      source: input.source,
      install_path: installPath,
      executable_path: configuredExecutablePath,
      reason: 'install_path_missing',
      message: `Overlay install path is missing: ${installPath}`,
    };
  }

  const resolvedExecutablePath = configuredExecutablePath
    ? (await pathExists(configuredExecutablePath) ? configuredExecutablePath : null)
    : (installPath ? await resolveExecutableFromInstallPath(installPath, input.executableRelativePath) : null);

  if (!resolvedExecutablePath) {
    return {
      configured: true,
      launchable: false,
      source: input.source,
      install_path: installPath,
      executable_path: configuredExecutablePath,
      reason: 'executable_missing',
      message: 'Overlay executable could not be resolved from the installed companion.',
    };
  }

  return {
    configured: true,
    launchable: true,
    source: input.source,
    install_path: installPath,
    executable_path: resolvedExecutablePath,
  };
}

export async function inspectOverlayCompanionInstall(): Promise<OverlayCompanionStatus> {
  const envExecutablePath = normalizeConfiguredPath(process.env.SUPERPLAN_OVERLAY_BINARY_PATH);
  const envInstallPath = normalizeConfiguredPath(process.env.SUPERPLAN_OVERLAY_APP_PATH);

  if (envExecutablePath || envInstallPath) {
    return resolveOverlayCompanionStatusFromPaths({
      source: 'env',
      installPath: envInstallPath,
      executablePath: envExecutablePath,
    });
  }

  const installMetadata = await readInstallMetadata();
  const overlayMetadata = installMetadata?.overlay;
  if (!overlayMetadata) {
    return {
      configured: false,
      launchable: false,
      source: null,
      install_path: null,
      executable_path: null,
      reason: 'not_installed',
      message: 'Overlay companion is not installed.',
    };
  }

  return resolveOverlayCompanionStatusFromPaths({
    source: 'install_metadata',
    installPath: normalizeConfiguredPath(overlayMetadata.install_path),
    executablePath: normalizeConfiguredPath(overlayMetadata.executable_path),
    executableRelativePath: overlayMetadata.executable_relative_path,
  });
}

export async function launchInstalledOverlayCompanion(
  workspacePath = process.cwd(),
): Promise<OverlayCompanionLaunchResult> {
  const resolvedWorkspacePath = await fs.realpath(workspacePath).catch(() => path.resolve(workspacePath));
  const companionStatus = await inspectOverlayCompanionInstall();

  if (!companionStatus.launchable || !companionStatus.executable_path) {
    return {
      ...companionStatus,
      attempted: false,
      launched: false,
      workspace_path: resolvedWorkspacePath,
    };
  }

  try {
    const commonSpawnOptions = {
      cwd: resolvedWorkspacePath,
      detached: true,
      stdio: 'ignore' as const,
      env: {
        ...process.env,
        SUPERPLAN_OVERLAY_WORKSPACE: resolvedWorkspacePath,
      },
    };
    const macosAppBundlePath = process.platform === 'darwin'
      ? resolveMacosAppBundlePath(companionStatus.install_path, companionStatus.executable_path)
      : null;

    const child = macosAppBundlePath
      ? spawn('/usr/bin/open', ['-n', '-a', macosAppBundlePath, '--args', '--workspace', resolvedWorkspacePath], commonSpawnOptions)
      : spawn(companionStatus.executable_path, ['--workspace', resolvedWorkspacePath], commonSpawnOptions);

    child.unref();

    return {
      ...companionStatus,
      attempted: true,
      launched: true,
      workspace_path: resolvedWorkspacePath,
    };
  } catch (error: any) {
    return {
      ...companionStatus,
      attempted: true,
      launched: false,
      workspace_path: resolvedWorkspacePath,
      reason: 'launch_failed',
      message: error?.message || 'Failed to launch overlay companion.',
    };
  }
}
