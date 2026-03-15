# Root Cause Tracing

## Overview

Bugs often manifest deep in the call stack. Your instinct is to fix where the error appears, but that's treating a symptom.

**Core principle:** Trace backward through the call chain until you find the original trigger, then fix at the source.

## The Tracing Process

### 1. Observe the Symptom
```
Error: something failed in /path/to/deep/component
```

### 2. Find Immediate Cause
What code directly causes this?

### 3. Ask: What Called This?
```
ComponentC.method()
  → called by ComponentB.process()
  → called by ComponentA.start()
  → called by test at entrypoint
```

### 4. Keep Tracing Up
What value was passed? Where did the bad value come from?

### 5. Find Original Trigger
Where did the bad value originate? That's where to fix.

## Adding Stack Traces

When you can't trace manually, add instrumentation:

```typescript
// Before the problematic operation
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**Critical:** Use `console.error()` in tests (not logger - may not show)

Run and capture:
```bash
npm test 2>&1 | grep 'DEBUG git init'
```

## Finding Which Test Causes Pollution

Use the bisection script `find-polluter.sh` in this directory:
```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```

## Key Principle

Fix at source, not at symptom.

After fixing root cause, add defense-in-depth (see `defense-in-depth.md`) to make the bug structurally impossible.
