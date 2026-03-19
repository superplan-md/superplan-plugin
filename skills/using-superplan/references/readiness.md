# Readiness

Use this reference when `using-superplan` needs to decide whether the repo or host is ready for structured Superplan workflow.

## Check Briefly

- whether Superplan appears active in the host
- whether `.superplan/` exists
- whether the repo looks initialized enough for Superplan artifacts to be useful
- whether durable context already exists for serious brownfield work

## Readiness Outcomes

- ready: route to `route-work`
- context-missing: route to `context-bootstrap-sync`
- setup-missing: give readiness guidance and stop
- stay-out: answer directly because Superplan would add no value

## Keep Out Of `decisions.md`

- obvious "repo is initialized" notes
- tiny readiness observations with no future value

## Good `decisions.md` Entries

- "Superplan init missing, so structured workflow was deferred."
- "Brownfield repo lacked durable context; context bootstrap required before shaping."
