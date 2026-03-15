---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future AI instances find and apply effective approaches.

**Skills are:** Reusable techniques, patterns, tools, reference guides

**Skills are NOT:** Narratives about how you solved a problem once

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious to you
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- Others would benefit

**Don't create for:**
- One-off solutions
- Project-specific conventions (put in AGENTS.md or CLAUDE.md)
- Mechanical constraints (automate it instead)

## SKILL.md Structure

**Frontmatter (YAML):**
- Only two fields: `name` and `description`
- `name`: Letters, numbers, and hyphens only
- `description`: "Use when [specific triggering conditions]"
- Max 1024 characters total

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
[Bullet list of conditions]

## The Process
[Step-by-step instructions]

## Red Flags
[What to watch out for]
```

## Personal Skills Locations

- **Claude Code:** `~/.claude/skills/` or `.claude/skills/` in project
- **OpenClaw:** `/opt/homebrew/lib/node_modules/openclaw/skills/`
- **Codex:** `~/.agents/skills/`

## Skill Quality Standards

- Core principle stated upfront
- Concrete steps, not vague guidance
- Red flags list (what NOT to do)
- Specific, not abstract
