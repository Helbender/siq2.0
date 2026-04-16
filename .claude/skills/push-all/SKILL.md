---
name: push-all
description: Stage all changes, create commit, and push to remote (use with caution)
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git diff:*), Bash(git log:*), Bash(git pull:*)
---

# Commit and Push Everything

⚠️ **CAUTION**: Stage ALL changes, commit, and push to remote. Use only when confident all changes belong together.

## Workflow

### 1. Analyze Changes
Run in parallel:
- `git status` - Show modified/added/deleted/untracked files
- `git diff --stat` - Show change statistics
- `git log -1 --oneline` - Show recent commit for message style

### 2. Safety Checks

**❌ STOP and WARN if detected:**
- Secrets: `.env*`, `*.key`, `*.pem`, `credentials.json`, `secrets.yaml`, `id_rsa`, `*.p12`, `*.pfx`, `*.cer`
- API Keys: Any `*_API_KEY`, `*_SECRET`, `*_TOKEN` variables with real values (not placeholders like `your-api-key`, `xxx`, `placeholder`)
- Large files: `>10MB` without Git LFS
- Build artifacts: `node_modules/`, `dist/`, `build/`, `__pycache__/`, `*.pyc`, `.venv/`
- Temp files: `.DS_Store`, `thumbs.db`, `*.swp`, `*.tmp`

**✅ Verify:**
- `.gitignore` properly configured
- No merge conflicts
- Correct branch (warn if main/master)
- API keys are placeholders only

### 3. Request Confirmation

Present summary and **WAIT for explicit "yes" before proceeding.**

### 4. Execute (After Confirmation)

Run sequentially:
```bash
git add .
git status  # Verify staging
```

### 5. Generate Commit Message

Analyze changes and create conventional commit:

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

### 6. Commit and Push

```bash
git commit -m "[Generated commit message]"
git push  # If fails: git pull --rebase && git push
git log -1 --oneline --decorate  # Verify
```

## Error Handling

- **git push fails (non-fast-forward)**: `git pull --rebase && git push`
- **No remote branch**: `git push -u origin [branch]`
- **Protected branch**: Use PR workflow instead
