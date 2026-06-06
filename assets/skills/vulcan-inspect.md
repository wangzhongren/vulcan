---
description: Inspect the local project structure and gather context for building visualizations
---

You need to inspect the current project to understand its structure before building visualizations or interactive views.

## Step 1: Check Vulcan is Running

```bash
curl -s http://localhost:3000/api/health
```

If it fails, start Vulcan:
```bash
vulcan start --no-open
```

## Step 2: Get Project Info

```bash
curl -s http://localhost:3000/api/project/info
```

This returns the project name, package.json contents, and boolean flags for common config files (tsconfig, Dockerfile, Makefile, etc.).

## Step 3: Get Directory Tree

Get the project tree in text format (like the `tree` command):
```bash
curl -s "http://localhost:3000/api/project/tree?format=text&depth=3"
```

Or in JSON format for programmatic use:
```bash
curl -s "http://localhost:3000/api/project/tree?depth=3"
```

You can adjust `depth` from 1 to 8 depending on how deep you need.

## Step 4: Read Key Files

Based on the tree, read important files to understand the project:
```bash
curl -s -X POST http://localhost:3000/api/fs/read \
  -H "Content-Type: application/json" \
  -d '{"path": "./src/index.ts"}'
```

Common files to read depending on context:
- `package.json` — dependencies and scripts
- `src/router.ts` or `src/routes/` — for route maps
- `tsconfig.json` — TypeScript config
- `README.md` — project overview

## Step 5: Summarize

After gathering info, provide a structured summary:
- Project name and type (React/Vue/Node/Python/etc.)
- Key directories and their purposes
- Important config files found
- Tech stack detected from dependencies

## User Request Context

The user wants to inspect: $ARGUMENTS
