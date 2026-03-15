---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

# Using Superpowers

## Instruction Priority

1. **User's explicit instructions** (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check.

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |

## Available Skills

- **brainstorming** — Before any creative/feature work
- **writing-plans** — Before touching code
- **systematic-debugging** — Before proposing any fix
- **verification-before-completion** — Before claiming work is done
- **test-driven-development** — Before writing implementation code
- **dispatching-parallel-agents** — When facing 2+ independent tasks
- **subagent-driven-development** — When executing plans with independent tasks
- **executing-plans** — When you have a written plan to execute
- **using-git-worktrees** — When starting isolated feature work
- **finishing-a-development-branch** — When implementation is complete
- **requesting-code-review** — After completing features or tasks
- **receiving-code-review** — When receiving review feedback
- **writing-skills** — When creating new skills
