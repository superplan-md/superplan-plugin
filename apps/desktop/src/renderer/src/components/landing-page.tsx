import {
  IconArrowRight,
  IconBolt,
  IconBrandGithub,
  IconChecklist,
  IconCommand,
  IconLayersIntersect,
  IconLayoutKanban,
  IconProgressCheck,
  IconRouteSquare2,
  IconSparkles
} from '@tabler/icons-react'

import logo from '../../../../../../assets/logo.svg'

const proofPoints = [
  {
    label: 'Repo-native state',
    value: '.superplan/changes/',
    description: 'Tasks, progress, and handoffs stay with the code instead of vanishing into chat history.'
  },
  {
    label: 'Execution loop',
    value: 'run -> inspect -> complete',
    description: 'Superplan tells an agent what to do next, how to prove it, and how to resume without drift.'
  },
  {
    label: 'Built for agents',
    value: 'Codex, Claude, Cursor',
    description: 'The workflow travels across tools, so a change can keep moving even when the agent changes.'
  }
] as const

const featureCards = [
  {
    icon: IconRouteSquare2,
    eyebrow: 'Structured by default',
    title: 'Turn vague requests into tracked execution',
    body:
      'Create a change, scaffold tasks, and give every unit of work a clear contract before code starts moving.'
  },
  {
    icon: IconProgressCheck,
    eyebrow: 'Visible progress',
    title: 'Know what is active, blocked, or ready next',
    body:
      'Runtime state is explicit, reviewable, and resumable. No more guessing where work paused or what still needs proof.'
  },
  {
    icon: IconLayersIntersect,
    eyebrow: 'Markdown-first',
    title: 'Keep the source of truth inside the repository',
    body:
      'Plans, specs, tasks, and durable context live next to the code, so handoffs survive tool switches and time.'
  }
] as const

const workflowSteps = [
  {
    title: 'Define a change',
    text: 'Capture the user-visible outcome you want, not a pile of disconnected TODOs.'
  },
  {
    title: 'Scaffold tasks',
    text: 'Break the work into bounded contracts with acceptance criteria and verification paths.'
  },
  {
    title: 'Run the frontier',
    text: 'Let the CLI surface the next safe task so the agent stays aligned instead of improvising.'
  },
  {
    title: 'Resume without drift',
    text: 'Progress, blockers, and review state are preserved, so a fresh session can continue immediately.'
  }
] as const

const agentChips = ['Codex', 'Claude Code', 'Cursor', 'OpenCode', 'Gemini CLI'] as const

const macInstallCommand =
  'curl -fsSL https://raw.githubusercontent.com/superplan-md/superplan-plugin/main/scripts/install.sh | sh'

const windowsInstallCommand = String.raw`curl.exe -fsSL -o install-superplan.cmd https://raw.githubusercontent.com/superplan-md/superplan-plugin/main/scripts/install.cmd; if ($LASTEXITCODE -eq 0) { .\install-superplan.cmd }`

const firstCommands = `superplan init
superplan change new ship-launch --single-task "Build the launch page"
superplan run --json`

function LandingPage(): React.JSX.Element {
  return (
    <main className="landing-page min-h-screen overflow-y-auto text-stone-50">
      <div className="landing-page__glow landing-page__glow--amber" />
      <div className="landing-page__glow landing-page__glow--teal" />

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="landing-page__grid absolute inset-0 opacity-70" />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-12 pt-6 sm:px-8 lg:px-10">
          <header className="landing-reveal flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="landing-brand-mark">
                <img alt="Superplan" className="h-9 w-9 rounded-2xl object-cover" src={logo} />
              </div>
              <div>
                <p className="landing-kicker">superplan.md</p>
                <p className="text-sm text-stone-300/75">Execution infrastructure for AI agents</p>
              </div>
            </div>

            <a
              className="landing-nav-link"
              href="https://github.com/superplan-md/superplan-plugin"
              rel="noreferrer"
              target="_blank"
            >
              <IconBrandGithub className="size-4" />
              GitHub
            </a>
          </header>

          <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:py-16">
            <div className="space-y-8">
              <div className="landing-reveal landing-reveal--delayed flex flex-wrap items-center gap-3">
                <span className="landing-pill">
                  <IconSparkles className="size-4" />
                  Repo-native planning that actually executes
                </span>
                <span className="landing-pill landing-pill--muted">
                  <IconCommand className="size-4" />
                  CLI-first
                </span>
              </div>

              <div className="space-y-5">
                <p className="landing-reveal landing-reveal--delayed-2 max-w-2xl font-landing-display text-5xl leading-none tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                  Stop losing work between chats. Start shipping with a real execution loop.
                </p>
                <p className="landing-reveal landing-reveal--delayed-3 max-w-2xl text-lg leading-8 text-stone-300/86 sm:text-xl">
                  Superplan turns a request into tracked change work, task contracts, and a runtime that keeps agents moving
                  through the repo without drift.
                </p>
              </div>

              <div className="landing-reveal landing-reveal--delayed-4 flex flex-col gap-3 sm:flex-row">
                <a className="landing-cta landing-cta--primary" href="#install">
                  Install Superplan
                  <IconArrowRight className="size-4" />
                </a>
                <a className="landing-cta landing-cta--secondary" href="#workflow">
                  See the workflow
                </a>
              </div>

              <div className="landing-reveal landing-reveal--delayed-4 flex flex-wrap gap-3">
                {agentChips.map((agent) => (
                  <span key={agent} className="landing-agent-chip">
                    {agent}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing-reveal landing-reveal--delayed-2">
              <div className="landing-console">
                <div className="landing-console__header">
                  <span className="landing-console__traffic" />
                  <span className="landing-console__traffic" />
                  <span className="landing-console__traffic" />
                  <p className="landing-console__title">Superplan runtime</p>
                </div>

                <div className="landing-console__body">
                  <div className="landing-console__command">
                    <span className="text-amber-300">$</span>
                    <span>superplan init</span>
                  </div>

                  <div className="landing-console__card">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Active change</p>
                        <p className="mt-2 text-xl font-semibold text-white">ship-superplan-launch</p>
                      </div>
                      <span className="landing-status-pill">
                        <IconBolt className="size-4" />
                        In progress
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="landing-task-row">
                        <div>
                          <p className="text-sm text-stone-200">T-001 Shape launch narrative</p>
                          <p className="text-xs text-stone-400">Spec and value prop aligned</p>
                        </div>
                        <span className="landing-task-state landing-task-state--done">Done</span>
                      </div>
                      <div className="landing-task-row">
                        <div>
                          <p className="text-sm text-stone-100">T-002 Build landing page</p>
                          <p className="text-xs text-stone-400">Hero, proof, install, CTA</p>
                        </div>
                        <span className="landing-task-state landing-task-state--active">Running</span>
                      </div>
                      <div className="landing-task-row">
                        <div>
                          <p className="text-sm text-stone-200">T-003 Verify desktop build</p>
                          <p className="text-xs text-stone-400">Proof before completion</p>
                        </div>
                        <span className="landing-task-state">Ready next</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="landing-console__metric">
                      <IconChecklist className="size-4 text-teal-300" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">State saved</p>
                        <p className="mt-2 text-sm text-stone-100">Plans, tasks, and runtime stay in the repo.</p>
                      </div>
                    </div>
                    <div className="landing-console__metric">
                      <IconLayoutKanban className="size-4 text-amber-300" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Next action</p>
                        <p className="mt-2 text-sm text-stone-100">The CLI surfaces the frontier instead of asking the agent to guess.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-reveal landing-reveal--delayed-4 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
            {proofPoints.map((point) => (
              <article key={point.label} className="landing-proof-card">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{point.label}</p>
                <p className="mt-3 font-landing-display text-2xl text-white">{point.value}</p>
                <p className="mt-3 text-sm leading-6 text-stone-300/78">{point.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10" id="workflow">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-5">
            <p className="landing-section-label">Why it feels different</p>
            <h2 className="font-landing-display text-4xl leading-none tracking-[-0.05em] text-white sm:text-5xl">
              Planning is only useful when it survives execution.
            </h2>
            <p className="max-w-xl text-lg leading-8 text-stone-300/82">
              Superplan keeps graph truth, task contracts, and runtime state separate so the agent can move fast without
              making the work invisible.
            </p>
          </div>

          <div className="grid gap-4">
            {featureCards.map(({ icon: Icon, eyebrow, title, body }) => (
              <article key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-amber-300/90">{eyebrow}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300/80">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="landing-section-label">The operating loop</p>
              <h2 className="font-landing-display text-4xl leading-none tracking-[-0.05em] text-white sm:text-5xl">
                A calmer way to run complex repo work.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-stone-300/80">
              The point is not more process. The point is removing ambiguity at the exact moments when agents usually wander.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="landing-step-card">
                <p className="text-sm text-stone-500">0{index + 1}</p>
                <h3 className="mt-6 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-stone-300/78">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10" id="install">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <p className="landing-section-label">Quick install</p>
            <h2 className="font-landing-display text-4xl leading-none tracking-[-0.05em] text-white sm:text-5xl">
              Get an agent into a structured execution loop in minutes.
            </h2>
            <p className="max-w-xl text-lg leading-8 text-stone-300/82">
              Start with install, initialize the repo, then let `superplan run` keep the frontier visible.
            </p>
          </div>

          <div className="grid gap-4">
            <article className="landing-code-card">
              <p className="landing-code-card__label">macOS / Linux</p>
              <pre className="landing-code-card__code">
                <code>{macInstallCommand}</code>
              </pre>
            </article>

            <article className="landing-code-card">
              <p className="landing-code-card__label">Windows PowerShell</p>
              <pre className="landing-code-card__code">
                <code>{windowsInstallCommand}</code>
              </pre>
            </article>

            <article className="landing-code-card">
              <p className="landing-code-card__label">First commands</p>
              <pre className="landing-code-card__code">
                <code>{firstCommands}</code>
              </pre>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="landing-final-cta">
          <div className="space-y-4">
            <p className="landing-section-label">Ready to ship</p>
            <h2 className="font-landing-display text-4xl leading-none tracking-[-0.05em] text-white sm:text-5xl">
              Give your agents a workflow that remembers.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-stone-300/80">
              Superplan keeps execution visible, resumable, and grounded in the repository so progress does not dissolve the
              moment the session ends.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a className="landing-cta landing-cta--primary" href="https://github.com/superplan-md/superplan-plugin" rel="noreferrer" target="_blank">
              Open the repo
              <IconArrowRight className="size-4" />
            </a>
            <a className="landing-cta landing-cta--secondary" href="#install">
              Copy the install flow
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export { LandingPage }
