---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor

### RED - Write Failing Test

Write one minimal test showing what should happen.
- One behavior per test
- Clear, descriptive name
- Test real code (no mocks unless unavoidable)

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Run: `<test-command> path/to/test`

Confirm:
- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

**Test passes?** You're testing existing behavior. Fix test.

### GREEN - Minimal Code

Write simplest code to pass the test. Just enough. No YAGNI features.

### Verify GREEN - Watch It Pass

**MANDATORY.**

Run: `<test-command> path/to/test`

Confirm:
- Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

### REFACTOR - Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

## Common Rationalizations - STOP

| Thought | Reality |
|---------|---------|
| "Skip TDD just this once" | That's rationalization. Don't. |
| "I'll write test after confirming fix" | Untested fixes don't stick. |
| "It's too simple to need a test" | Simple things have bugs too. |
| "I already know it works" | Prove it with a test. |

## When to Skip (Ask Human First)

- Throwaway prototypes
- Generated code
- Configuration files only
