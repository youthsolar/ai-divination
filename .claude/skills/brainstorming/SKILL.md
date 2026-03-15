---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short, but you MUST present it and get approval.

## Checklist

You MUST complete these in order:

1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to their complexity, get user approval after each section
5. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
6. **User reviews written spec** — ask user to review before proceeding
7. **Transition to implementation** — invoke writing-plans skill

## The Process

**Understanding the idea:**
- What problem does this solve?
- Who are the users?
- What does success look like?
- What are the constraints?

**Proposing approaches:**
- Offer 2-3 distinct approaches with trade-offs
- Make a clear recommendation with reasoning
- Ask which direction to pursue

**Design presentation:**
- Present design in digestible sections
- Get approval for each major section before continuing
- Don't proceed past design until user approves

## Why This Matters

Starting implementation without a clear design wastes time and creates rework.
The design phase is always faster than the rework phase.
