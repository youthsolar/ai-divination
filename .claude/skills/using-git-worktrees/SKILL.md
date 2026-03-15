---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

Follow this priority order:

1. **Check existing:** `.worktrees/` → `worktrees/` (if found, use it)
2. **Check CLAUDE.md:** `grep -i "worktree.*director" CLAUDE.md`
3. **Ask user:** If neither found, present options

## Safety Verification

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null
```

**If NOT ignored:** Add to .gitignore, commit, then proceed.

**Why critical:** Prevents accidentally committing worktree contents.

## Creation Steps

```bash
# 1. Detect project name
project=$(basename "$(git rev-parse --show-toplevel)")

# 2. Create worktree
git worktree add ".worktrees/$BRANCH_NAME" -b "$BRANCH_NAME"
cd ".worktrees/$BRANCH_NAME"

# 3. Run project setup
if [ -f package.json ]; then npm install; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# 4. Verify clean baseline
<test command>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| Neither exists | Check CLAUDE.md → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |

## Common Mistakes

- **Skipping ignore verification** → worktree contents tracked in git
- **Assuming directory location** → violates project conventions
- **Proceeding with failing tests** → can't distinguish new bugs from pre-existing

## Integration

**Required by:**
- `executing-plans` — Set up isolated workspace before starting
- `subagent-driven-development` — Each feature in its own worktree

**Cleaned up by:**
- `finishing-a-development-branch` — Removes worktree after merge/PR
