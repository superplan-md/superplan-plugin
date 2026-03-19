import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { confirm, select } from '@inquirer/prompts';

export interface SetupOptions {
  json?: boolean;
}

export type SetupResult =
  | { ok: true; data: { config_path: string; skills_path: string; agents: { name: string; path: string }[] } }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

async function ensureConfig(configPath: string): Promise<void> {
  const initialConfig = `version = "0.1"\n\n[agents]\ninstalled = []\n`;
  await fs.writeFile(configPath, initialConfig, 'utf-8');
}

async function ensureDirectories(configDir: string, skillsDir: string): Promise<void> {
  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(skillsDir, { recursive: true });
}

async function installSkills(sourceDir: string, targetDir: string): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  const stats = await fs.stat(sourceDir);
  if (stats.isDirectory()) {
    await fs.cp(sourceDir, targetDir, { recursive: true, force: true });
  }
}

async function installAgentSkills(globalSkillsDir: string): Promise<{ name: string; path: string }[]> {
  const supportedAgents = ['claude', 'gemini', 'cursor', 'vscode', 'codex'];
  const cwd = process.cwd();
  const installed: { name: string; path: string }[] = [];

  for (const agent of supportedAgents) {
    const agentDir = path.join(cwd, `.${agent}`);
    try {
      const stat = await fs.stat(agentDir);
      if (stat.isDirectory()) {
        const targetDir = path.join(agentDir, 'skills', 'superplan');
        
        await fs.rm(targetDir, { recursive: true, force: true });
        await fs.mkdir(path.join(agentDir, 'skills'), { recursive: true });

        try {
          await fs.symlink(globalSkillsDir, targetDir, 'dir');
        } catch (symlinkErr) {
          await fs.mkdir(targetDir, { recursive: true });
          await fs.cp(globalSkillsDir, targetDir, { recursive: true, force: true });
        }

        installed.push({ name: agent, path: targetDir });
      }
    } catch {
      // Agent directory doesn't exist
    }
  }

  return installed;
}

export async function setup(options: SetupOptions): Promise<SetupResult> {
  try {
    if (options.json) {
      return {
        ok: false,
        error: {
          code: "INTERACTIVE_REQUIRED",
          message: "setup must be run interactively",
          retryable: false
        }
      };
    }

    const configDir = path.join(os.homedir(), '.config', 'superplan');
    const configPath = path.join(configDir, 'config.toml');
    const skillsDir = path.join(configDir, 'skills');

    let configExists = false;
    try {
      await fs.access(configPath);
      configExists = true;
    } catch {
      configExists = false;
    }

    if (configExists) {
      const reinstall = await confirm({ message: 'Superplan is already set up. Reinstall?' });
      if (!reinstall) {
        return {
          ok: true,
          data: {
            config_path: configPath,
            skills_path: skillsDir,
            agents: []
          }
        };
      }
    }

    const installLocation = await select({
      message: 'Where do you want to install Superplan?',
      choices: [
        { name: 'Global (recommended)', value: 'global' },
        { name: 'Local', value: 'local' }
      ]
    });

    if (installLocation === 'local') {
      return {
        ok: false,
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Local setup is not supported yet",
          retryable: false
        }
      };
    }

    const proceed = await confirm({ message: 'Proceed with setup?' });
    if (!proceed) {
      return {
        ok: false,
        error: {
          code: "USER_ABORTED",
          message: "Setup aborted by user",
          retryable: false
        }
      };
    }

    const localSkillsDir = path.join(process.cwd(), 'skills');
    try {
      const stats = await fs.stat(localSkillsDir);
      if (!stats.isDirectory()) {
        return {
          ok: false,
          error: {
            code: "SKILLS_SOURCE_MISSING",
            message: "Local skills folder not found in project root",
            retryable: false
          }
        };
      }
    } catch {
      return {
        ok: false,
        error: {
          code: "SKILLS_SOURCE_MISSING",
          message: "Local skills folder not found in project root",
          retryable: false
        }
      };
    }

    await ensureDirectories(configDir, skillsDir);

    if (!configExists) {
      await ensureConfig(configPath);
    }

    await installSkills(localSkillsDir, skillsDir);

    const installedAgents = await installAgentSkills(skillsDir);

    return {
      ok: true,
      data: {
        config_path: configPath,
        skills_path: skillsDir,
        agents: installedAgents
      }
    };
  } catch (error: any) {
    return {
      ok: false,
      error: {
        code: "SETUP_FAILED",
        message: error.message || "An unknown error occurred",
        retryable: false
      }
    };
  }
}
