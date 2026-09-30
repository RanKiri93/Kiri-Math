# `.agents/` — shared agent definitions

**This directory is the single source of truth for agent instructions.** It is
tool-neutral: neither Cursor, opencode, nor Claude Code owns it.

```
.agents/
  <role>.md      the operating manual for one role
  engines.md     shared reference: computation engines and their failure modes
  glossary.md    shared reference: canonical Hebrew terminology
```

## How the tools reach these files

| Tool | Definition lives in | How the prompt is loaded |
| --- | --- | --- |
| Cursor | `.cursor/agents/<role>.md` | A short stub that instructs the agent to read `.agents/<role>.md` first |
| opencode | `opencode.json`, `agent` block | `prompt: "{file:./.agents/<role>.md}"` — inlined by opencode at load time |
| Claude Code | `.claude/agents/<role>.md` | A short stub (YAML frontmatter + body) that instructs the agent to read `.agents/<role>.md` first — Claude Code has no file-include for agent prompts |

Only a few things are duplicated between the tools, all unavoidable because the schemas
differ: the one-line `description`, the model/effort choice, and the permission settings.
Cursor supports only `readonly: true`; opencode has a richer `permission` map; Claude Code
has a `tools` allowlist. Everything substantive — the actual instructions — exists exactly
once, here.

**Editing a role: change `.agents/<role>.md` and you are done.** No sync step, no
regeneration. Every tool picks it up on the next session.

## Model tiers

Planning and review roles run on the stronger tier at high effort; roles that write code,
copy, or docs run on the faster tier at medium effort.

| Role | opencode | Claude Code |
| --- | --- | --- |
| orchestrator (primary), `plan`/`Plan`, `activity-planner`, `design-review`, `pedagogy-review` | `gpt-6-astra`, `high` | `opus`, effort `high` |
| `build`, `general`/`general-purpose`, `explore`/`Explore`, `design`, `hebrew-copy`, `question-designer`, `scribe`, `verifier` | `gpt-6-luna`, `medium` | `sonnet`, effort `medium` |

## Claude Code specifics

- The orchestrator is defined in `.claude/agents/orchestrator.md` and made the main session
  by `"agent": "orchestrator"` in `.claude/settings.json` (or per session with
  `claude --agent orchestrator`). Its body parallels `.opencode/agents/orchestrator.md`,
  adapted to Claude Code's Agent tool; keep the two in step when changing either.
- `.claude/agents/Plan.md`, `Explore.md` and `general-purpose.md` override Claude Code's
  built-in agents of those names (the counterparts of opencode's `plan`, `explore` and
  `general`). An override replaces the built-in entirely, so these files carry full prompts.
  Delete one to fall back to the built-in.
- Any specialist can run as the main session: `claude --agent design-review`.
- Claude Code reads the root `AGENTS.md` automatically **as long as no `CLAUDE.md` exists**.
  Do not add a `CLAUDE.md` unless it imports `@AGENTS.md`.

## Adding a role

1. Write `.agents/<role>.md`.
2. Add a stub at `.cursor/agents/<role>.md` — copy an existing one, it is four lines.
3. Add an entry to the `agent` block in `opencode.json`.
4. Add a stub at `.claude/agents/<role>.md` — copy an existing specialist and change the
   frontmatter (`name`, `description`, `model`, `effort`, `tools`).
5. Add a row to the roster table in `AGENTS.md`.
6. Verify with `opencode agent list` and `/agents` inside Claude Code.

## Shared context

Anything every agent needs goes in the root `AGENTS.md`, which **every tool reads
automatically** with no configuration. That file is the main reason the environments
behave alike. Keep role-specific detail out of it.
