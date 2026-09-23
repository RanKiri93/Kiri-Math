# `.agents/` — shared agent definitions

**This directory is the single source of truth for agent instructions.** It is
tool-neutral: neither Cursor nor opencode owns it.

```
.agents/
  <role>.md      the operating manual for one role
  engines.md     shared reference: computation engines and their failure modes
  glossary.md    shared reference: canonical Hebrew terminology
```

## How the two tools reach these files

| Tool | Definition lives in | How the prompt is loaded |
| --- | --- | --- |
| Cursor | `.cursor/agents/<role>.md` | A short stub that instructs the agent to read `.agents/<role>.md` first |
| opencode | `opencode.json`, `agent` block | `prompt: "{file:./.agents/<role>.md}"` — inlined by opencode at load time |

Only two things are duplicated between the tools, and both are unavoidable because the
schemas differ: the one-line `description`, and the permission settings. Cursor supports
only `readonly: true`; opencode has a richer `permission` map. Everything substantive —
the actual instructions — exists exactly once, here.

**Editing a role: change `.agents/<role>.md` and you are done.** No sync step, no
regeneration. Both tools pick it up on the next session.

## Adding a role

1. Write `.agents/<role>.md`.
2. Add a stub at `.cursor/agents/<role>.md` — copy an existing one, it is four lines.
3. Add an entry to the `agent` block in `opencode.json`.
4. Add a row to the roster table in `AGENTS.md`.
5. Verify with `opencode agent list`.

## Shared context

Anything every agent needs goes in the root `AGENTS.md`, which **both tools read
automatically** with no configuration. That file is the main reason the two environments
behave alike. Keep role-specific detail out of it.
