import * as fs from 'fs/promises';

export interface AutoFixResult {
  fixed: boolean;
  changes: string[];
  content: string;
}

/**
 * Auto-fix common graph format issues that agents make
 */
export async function autoFixGraphFile(filePath: string): Promise<AutoFixResult> {
  const changes: string[] = [];
  let content = await fs.readFile(filePath, 'utf-8');
  let fixed = false;

  // Fix 1: Add backticks around Change ID value if missing
  const changeIdMatch = /^(\s*- Change ID:\s+)([^`\s][^\n]+)$/m.exec(content);
  if (changeIdMatch) {
    const [fullMatch, prefix, value] = changeIdMatch;
    const trimmedValue = value.trim();
    content = content.replace(fullMatch, `${prefix}\`${trimmedValue}\``);
    changes.push(`Added backticks around Change ID value: ${trimmedValue}`);
    fixed = true;
  }

  // Fix 2: Ensure dependency arrays exist (add empty arrays if missing)
  // This is handled by the parser already - it defaults to empty arrays

  // Fix 3: Normalize extra whitespace in task entries
  const lines = content.split('\n');
  const normalizedLines: string[] = [];
  let inGraphLayout = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '## Graph Layout') {
      inGraphLayout = true;
      normalizedLines.push(line);
      continue;
    }
    
    if (line.trim().startsWith('## ') && inGraphLayout) {
      inGraphLayout = false;
    }

    if (inGraphLayout && line.trim().startsWith('- `')) {
      // Normalize task entry whitespace
      const taskMatch = /^(\s*)- `([^`]+)`\s+(.+)$/.exec(line);
      if (taskMatch) {
        const [, indent, taskId, title] = taskMatch;
        const normalizedLine = `${indent}- \`${taskId}\` ${title.trim()}`;
        if (normalizedLine !== line) {
          normalizedLines.push(normalizedLine);
          fixed = true;
          continue;
        }
      }
    }

    normalizedLines.push(line);
  }

  if (fixed && normalizedLines.length > 0) {
    content = normalizedLines.join('\n');
    changes.push('Normalized whitespace in task entries');
  }

  return { fixed, changes, content };
}

/**
 * Apply auto-fixes to a graph file
 */
export async function applyAutoFix(filePath: string): Promise<AutoFixResult> {
  const result = await autoFixGraphFile(filePath);
  
  if (result.fixed) {
    await fs.writeFile(filePath, result.content, 'utf-8');
  }

  return result;
}
