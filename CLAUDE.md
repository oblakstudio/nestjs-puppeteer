# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Build & Test

Node.js >= 20 (see `.nvmrc`). Package is published as `nestjs-puppeteer`; source lives in `lib/` and compiles to `dist/`. Peer deps span `@nestjs/common`/`@nestjs/core` `^10 || ^11` and `puppeteer` `^21 || ^22 || ^23` — public API and types must stay compatible across all of these.

```bash
npm install
npm run build               # rm -rf dist && tsc -p tsconfig.json
npm run watch               # incremental tsc
npm run lint                # eslint 'lib/**/*.ts' --fix
npm run format              # prettier --write "**/*.ts"
npm run test:e2e            # jest --config ./tests/jest-e2e.json --runInBand
npm run test:e2e:cov        # with coverage
npm run test:e2e:dev        # watch mode

# Run a single e2e spec
npx jest --config ./tests/jest-e2e.json --runInBand tests/e2e/puppeteer.spec.ts
```

There are no unit tests — all tests are e2e specs in `tests/e2e/*.spec.ts` that boot a NestJS app via `@nestjs/testing` and drive it with `supertest`. They launch real Chromium, so they need a working Puppeteer install. CI runs them under AppArmor (`aa-exec --profile=chrome`) on Ubuntu — locally that prefix is not needed.

The `stealth-check` test in `tests/e2e/puppeteer-with-plugin.spec.ts` hits `https://arh.antoinevastel.com/bots/areyouheadless` and requires network access.

## Architecture Overview

This is a thin NestJS wrapper around `puppeteer-extra` that exposes a `Browser` (and named `Page`s) through Nest's DI container. The whole library is ~6 small files in `lib/`.

**Two-module pattern (mirrors `@nestjs/typeorm`, `@nestjs/mongoose`, etc.):**

- `PuppeteerModule` (`lib/puppeteer.module.ts`) — public façade with three statics: `forRoot`, `forRootAsync`, `forFeature`. Holds no state; delegates to the core module.
- `PuppeteerCoreModule` (`lib/puppeteer-core.module.ts`) — `@Global()`, owns the singleton `Browser` and the plugin registration. Implements `OnApplicationShutdown` to call `browser.close()` cleanly. The async branch (`forRootAsync`) supports `useFactory` / `useClass` / `useExisting` via `PuppeteerOptionsFactory.createPuppeteerOptions(name?)`.

**DI token scheme (`lib/common/puppeteer.utils.ts`):**

- Default (unnamed) browser → injected as the `Browser` class itself: `@InjectBrowser()`.
- Named browser → string token `\`${name}Browser\``: `@InjectBrowser('foo')`.
- Page token: `\`${browserPrefix}${page}Page\``, where `browserPrefix` is `''` for the default browser and `\`${name}_\`` otherwise. Built by `getPageToken` and consumed by `@InjectPage(page, browser?)`.

This is why `forFeature(pages, browser?)` must receive the *same* browser identifier (string name or options object) used at `forRoot` — the tokens are derived from it, not looked up. Mismatched names produce DI resolution errors, not runtime warnings.

**Plugin handling:** `options.plugins` is an array of `PuppeteerExtraPlugin`s. The core module calls `puppeteer.use(plugin)` for each before launching. Because `puppeteer-extra` mutates global state, plugins registered on one browser affect any subsequent `puppeteer.launch()` in the same process — keep this in mind when adding multi-browser tests.

> Per README: most `puppeteer-extra` plugins are **not compatible** with Chrome's "new headless" mode. When using plugins (e.g. stealth), pass `headless: true`, not `headless: 'new'`.

**Public API surface** (re-exported from `lib/index.ts`): `PuppeteerModule`, `PuppeteerCoreModule`, decorators (`InjectBrowser`, `InjectPage`), token helpers (`getBrowserToken`, `getPageToken`, `getBrowserPrefix`), constants, and the `PuppeteerModuleOptions` / `PuppeteerModuleAsyncOptions` / `PuppeteerOptionsFactory` interfaces. Treat anything exported here as a breaking-change surface.

## Conventions & Patterns

- **Commits:** Angular conventional commits enforced by commitlint + Husky (`.commitlintrc.json`). Allowed types: `build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test, sample`. Subject case is permissive (sentence/start/pascal/upper/lower) but a type prefix is required. Releases are fully automated by `semantic-release` on `master` and `next` — version bumps and CHANGELOG come from commit messages, so be deliberate about `feat:` vs `fix:` vs `chore:`.
- **TypeScript:** `strict: true`, `target: ES2019`, `module: commonjs`, decorators + `emitDecoratorMetadata` on. `rootDir` is `lib/`; tests live outside it and are excluded from the build.
- **Tests are intentionally outside `rootDir`** — they import the library via relative paths (`'../../lib'`), not via the package name. Don't add a path alias just to make this prettier; it would break `tsc` output.
- **Non-interactive shell commands:** `cp`, `mv`, `rm` may be aliased to `-i` mode. Use `-f` (or `-rf`) so commands don't hang waiting on y/n. See `AGENTS.md` for the full list.
