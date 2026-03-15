---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** Fresh subagent per task = isolated context = focused execution. This preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

**Use when:**
- You have an implementation plan
- Tasks are mostly independent
- You want to stay in the current session

**vs. executing-plans:**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task
- Faster iteration

## The Process

For each task:
1. Dispatch implementer subagent with precise context (NOT your session history)
2. Subagent implements, tests, commits, self-reviews
3. Dispatch spec reviewer subagent — confirms code matches spec
4. If spec gaps found → implementer fixes → re-review
5. Dispatch code quality reviewer subagent
6. If quality issues found → implementer fixes → re-review
7. Mark task complete

After all tasks:
8. Dispatch final code reviewer for entire implementation
9. Use `finishing-a-development-branch` skill

## Key Rules

- **Never** pass your session history to subagents — construct precisely what they need
- **Always** two-stage review (spec compliance first, then quality)
- **Always** verify before claiming task complete
- **Stop** if implementer asks questions — answer and re-dispatch
