import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

interface DoctorIssue {
  code: string;
  message: string;
  fix: string;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function directoryHasAtLeastOneFile(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isFile()) {
        return true;
      }

      if (entry.isDirectory() && await directoryHasAtLeastOneFile(entryPath)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function doctor() {
  const issues: DoctorIssue[] = [];
  const homeDir = os.homedir();
  const configPath = path.join(homeDir, '.config', 'superplan', 'config.toml');
  const skillsPath = path.join(homeDir, '.config', 'superplan', 'skills');

  if (!await pathExists(configPath)) {
    issues.push({
      code: 'CONFIG_MISSING',
      message: 'Global config not found',
      fix: 'Run superplan setup',
    });
  }

  const skillsInstalled = await pathExists(skillsPath) && await directoryHasAtLeastOneFile(skillsPath);
  if (!skillsInstalled) {
    issues.push({
      code: 'SKILLS_MISSING',
      message: 'Global skills not installed',
      fix: 'Run superplan setup',
    });
  }

  const agents = ['claude', 'gemini', 'cursor', 'vscode', 'codex'];
  for (const agent of agents) {
    const agentPath = path.join(process.cwd(), `.${agent}`);
    const agentSkillsPath = path.join(agentPath, 'skills', 'superplan');

    if (await pathExists(agentPath) && !await pathExists(agentSkillsPath)) {
      issues.push({
        code: 'AGENT_SKILLS_MISSING',
        message: 'Superplan skills not installed for agent',
        fix: 'Run superplan setup in this repo',
      });
    }
  }

  return {
    ok: true,
    data: {
      valid: issues.length === 0,
      issues,
    },
  };
}
