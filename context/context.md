# Superplan CLI Context

## Project Overview
This project is a standalone CLI packaged for Superplan execution.
It provides global machine setup utilities (via the `superplan setup` command), environment validation (via `superplan doctor`), and initial task-file parsing (via `superplan parse`).

## Project Structure
- `src/cli/main.ts`: Main entry point for the CLI. Parses arguments, prints help when no command is provided, returns structured errors in JSON mode when `--json` is passed without a command, validates commands against the router, and then calls the router.
- `src/cli/router.ts`: Exposes the CLI router object and maps supported commands (`setup`, `doctor`, `parse`) to handlers. Executes matched handlers and prints structured JSON responses.
- `src/cli/commands/setup.ts`: Implements global machine setup for Superplan. Includes:
  - Idempotent configuration and skills setup.
  - Interactive prompts using `@inquirer/prompts`.
  - Structured error and success return types.
  - Automatic detection of supported agent environments (`.claude`, `.gemini`, `.cursor`, `.vscode`, `.codex`) in the current working directory.
  - Installs Skills to detected agents using symlinks (with a copy fallback).
- `src/cli/commands/doctor.ts`: Validates the current machine and repo environment. Checks for the global config file, verifies the global skills directory exists and contains at least one file, and ensures repo-local agent folders have `skills/superplan` installed when those agent directories are present.
- `src/cli/commands/parse.ts`: Parses a single task markdown file. Extracts `task_id` and `status` from frontmatter, reads the `Description` and `Acceptance Criteria` sections, and converts markdown checklist items into structured acceptance-criteria objects.
- `skills/`: Local dummy skills source used by `setup` during development/testing. This directory is copied into the global Superplan skills directory during installation.
- `package.json`: Configured with `"bin": { "superplan": "./dist/cli/main.js" }` for direct execution.
- `tsconfig.json`: Typings configuration.

## Command Guidelines
- **Output:** All commands must return a standard structured response instead of using direct `console.log` or `process.exit`.
  - Success format: `{ "ok": true, "data": { ... } }`
  - Failure format: `{ "ok": false, "error": { "code": "...", "message": "...", "retryable": boolean } }`
- **CLI Routing:** When no command is provided, the CLI prints help and exits cleanly. In `--json` mode with no command, it returns a structured `NO_COMMAND` error. Unknown commands return a structured `UNKNOWN_COMMAND` error.
- **Setup Source:** For development/testing, `setup` uses `path.join(process.cwd(), 'skills')` as the skills source. If that folder is missing, setup returns `SKILLS_SOURCE_MISSING`.
- **Doctor Checks:** `doctor` always returns `{ ok: true, data: { valid, issues } }` and reports `CONFIG_MISSING`, `SKILLS_MISSING`, and `AGENT_SKILLS_MISSING` issues without throwing.
- **Parse Scope:** `parse` currently supports parsing one task markdown file at a time, such as `changes/<slug>/tasks/T-001.md`, and returns structured JSON for a single task. Graph logic is not implemented yet.
- **Location Constraints:** The setup should refer to variables dynamically using `os.homedir()` and `path.resolve` where appropriate.

*Continues to be updated based on new requirements.*
