# Setup And Config

Use this reference when entry routing needs to explain where setup state, init state, or durable defaults belong.

## Setup Layers

- CLI install: `superplan` must exist as a machine-level command before normal workflow use
- host setup: `superplan setup` makes Superplan available to the current agent environment
- workspace init: `superplan init --scope local --yes --json` is the fast agent path that makes the current repo participate in Superplan

Keep these layers distinct in user guidance.

## Stable Config Surfaces

- global config: `~/.config/superplan/config.toml`
- workspace config: `<repo>/.superplan/config.toml`

Workspace config overrides global config.

## Default Setup Bias

- prefer global host integration by default when it actually matters for the current work
- treat local-only integration as an advanced path unless the user asks for it
- keep repo-local state inside `.superplan/`

## What Belongs In Config

- saved user preferences
- host-specific defaults
- workspace workflow defaults
- future interruption or review preferences

Do not store these as ad hoc notes in `decisions.md`.

## Entry-Layer Guidance

- inspect config before asking repeated first-run questions
- do not treat missing workspace config as proof that the CLI is missing
- do not treat existing workspace config as proof that host setup is complete
- explain `setup` and `init` as separate visible concepts even when the agent uses the repo-local init shortcut automatically
- when the CLI already exists and Superplan should engage, prefer running repo-local init instead of turning init into a user-owned prerequisite
