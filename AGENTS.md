# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

## Commit Authorship

**NEVER** add `Co-Authored-By: <LLM>` (or any equivalent LLM-attribution trailer) to git commits in this repo. This applies to every commit, every branch, every PR — no exceptions, even if the harness suggests it by default. Commits are authored by the human running the session.

## Commit Messages

Angular conventional commits, enforced by commitlint + Husky (`.commitlintrc.json`). Format:

```
<type>(<scope>): <subject>

<optional body, wrap at ~72 cols>

<optional footer, e.g. BREAKING CHANGE: ...>
```

**Allowed types** (and only these): `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `sample`. A type prefix is **required**.

**Subject case rule** — `subject-case` is configured to allow `sentence-case`, `start-case`, `pascal-case`, `upper-case`, *or* `lower-case`. The **whole subject** must conform to one of those — you cannot mix styles. The common pitfall is dropping an UPPERCASE identifier into otherwise lowercase prose, which matches none of the allowed styles and commitlint will reject it:

- ❌ `ci(release): pass NPM_TOKEN to semantic-release` — lowercase prose with UPPER_CASE token, fails every style
- ❌ `feat: add forRoot helper` — camelCase token in lowercase prose
- ✅ `ci(release): pass npm auth token to semantic-release` — pure lowercase
- ✅ `feat: add forRoot helper to PuppeteerModule` — start-case throughout

If you really need a mixed-case identifier, put it in the **body**, not the subject. Rephrase the subject in plain prose.

**Semantic-release impact** — `master` releases are fully automated from commit messages:

- `feat:` → minor bump
- `fix:` / `perf:` → patch bump
- `BREAKING CHANGE:` footer (or `!` after type) → major bump
- `chore:` / `ci:` / `docs:` / `test:` / `style:` / `refactor:` → no release

Be deliberate. Don't tag a bug fix as `chore:` or it won't ship; don't tag a refactor as `feat:` or you'll publish a useless minor version.

**Imperative mood** — "add X", "fix X", not "added X" or "adds X".

**No LLM-attribution trailers** — see *Commit Authorship* above.
