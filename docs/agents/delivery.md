# Delivery

How work leaves this repo: the gate, the branch, the pull request, the merge, and the
deploy check. This is the sequence; follow it rather than reinventing it per task.

## The gate

Every change passes all of these before it is pushed. Run them from the repo root.

```sh
pnpm check         # tsc --noEmit
pnpm lint          # eslint .
pnpm format:check  # prettier --check .
pnpm test          # vitest run
pnpm build         # vite build -> dist/public
```

`pnpm test:e2e` (Playwright, against the production build) also runs in CI. Run it
locally when the change touches rendering, audio, the PWA, offline behaviour or the
`/mobile` route — that is what it covers.

Two commands are not part of the gate but belong to specific changes:

| Command              | When                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm shots`         | A screen changed. It writes PNGs to `.tmp/shots/current/`; **read them** before calling the change done. |
| `pnpm audit:content` | Content changed. It writes a Markdown sheet under `docs/audits/`.                                        |

`pnpm format:check` is part of the gate and the committed tree is clean. Format only
the files your change touches (`pnpm exec prettier --write <paths>`); do not reformat
the repo to make your own diff look tidy.

## Branch, commit, push

Branch from `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…` or
`test/…`. No direct commits to `main`.

```sh
git checkout -b feat/short-description
# ... work, gate ...
git add -A
git commit -q -F - <<'EOF'
One line about what changed and why.

Why it changed, what it does not change, and what was verified.
EOF
git push -u origin <branch>
```

Commit messages state the change and its consequence, not the diff. The `Why` part
is what a reader needs and cannot get from the diff.

## Pull request

```sh
gh pr create --base main --head <branch> --title "<imperative title>" --body "$(cat <<'EOF'
## What
What changed and why, in prose.

## Changes
The concrete edits, grouped.

## Validation
| Command | Result |
| --- | --- |
| `pnpm check` | exit 0 |
| ... | ... |

## Part of #<issue>
EOF
)"
```

Reference the tracking issue at the bottom. The validation table is not decoration:
it is how the reviewer knows the change was checked. Report the real numbers — the
test count, the e2e count — not "tests pass".

Keep a PR small. The repo's own convention is roughly 400 changed lines; above that,
split the work.

## Merge

Wait for CI. Do not merge a red build.

```sh
gh pr checks <pr> --watch --interval 20
gh pr merge <pr> --squash --delete-branch
```

Squash-merge: the branch history is a series of attempts, and the squash commit is
the one that matters.

If the branch is based on a `main` that moved, rebase and force-push:

```sh
git fetch origin && git rebase origin/main
git push --force-with-lease origin <branch>
```

Rebase after the _first_ merge of a stack, not before — a rebase rewrites the
branch, and the CI result you already have belongs to the old commits.

## Deploy check

A merged PR must reach production. The web app deploys to Vercel on every push to
`main`; this confirms it happened and that the site still serves the new build.

```sh
gh api repos/superbahbi/goyo-korean-app/deployments \
  --jq '.[0:4][] | "\(.id)\t\(.environment)\t\(.ref[0:7])\t\(.created_at)"'
```

A `Production` row whose `ref` starts with the merge commit is the deploy. Then
check the state and the live site:

```sh
gh api repos/superbahbi/goyo-korean-app/deployments/<id>/statuses \
  --jq '.[0] | "\(.state)\t\(.target_url)"'

curl -s -L "https://goyo.bahbi.net/" | grep -oE '/assets/[a-zA-Z0-9_-]+\.js' | head
```

The asset hashes in the live HTML must match the ones from your local `pnpm build`.
That is what proves the deployed bundle is _your_ build and not a cached older one.

Note that the deployment URLs themselves are behind Vercel's deployment protection,
so `curl` on them returns a login page. Use the production domain
(`https://goyo.bahbi.net`) for the live check.

## The native app is not on Vercel

Vercel ships the web app only. The iOS app is built on this Mac and installed
straight onto the owner's iPhone: `pnpm ios:zen` builds `dist/public`, copies it
into `mobile/ios/Goyo/www`, renders the icon, then runs `xcodegen`, `xcodebuild`
and `xcrun devicectl` (see `scripts/install-ios-zen.sh`). There is no EAS and no
Android target — the Expo toolchain was removed in #107. A push to `main` does
not rebuild the native app; do not report a green Vercel check as a native
deploy.

## Moving a directory

The repo is a pnpm workspace, so a move touches more than the moved files. This
checklist is the difference between a move that works and one that half-works.

**1. The files.** `git mv` so the history follows:

```sh
mkdir -p packages && git mv shared packages/shared
```

**2. Every alias.** The same three configs must agree, or the build breaks in a way
that only shows up at runtime:

| Config             | What it holds           |
| ------------------ | ----------------------- |
| `tsconfig.json`    | `compilerOptions.paths` |
| `vite.config.ts`   | `resolve.alias`         |
| `vitest.config.ts` | `resolve.alias`         |

Current aliases: `@/*` → `apps/web/src/*`, `@domain/*` → `packages/domain/src/*`,
`@shared/*` → `packages/shared/*`.

**3. Every importer.** Relative imports change depth; aliased imports change name:

```sh
grep -rn 'old/path' --include="*.ts" --include="*.tsx" . | grep -v node_modules
```

**4. The scripts.** `scripts/*.py` hold source paths as string literals
(`SOURCE = ROOT / 'packages/domain/src/essentialVocabulary.ts'`) — a `grep` over the
scripts catches what the TypeScript grep misses.

**5. The docs.** Every `codemap.md` under the moved tree has a `# path/` heading, and
the root `codemap.md` has a directory map with a link column. `README.md` has a
layout block. `docs/ui-map.md` names component paths.

**6. The tooling cache.** `.slim/codemap.json` is a change-detection cache: a
`file_hashes` map (path → md5 of the file) and a `folder_hashes` map. Nothing in CI
validates it, so it rots silently. A folder hash is:

```
md5( "\n".join(f"{path}:{file_hash}" for path, file_hash in sorted(files)) + "\n" )
```

where `files` are the entries of `file_hashes` whose path starts with that folder
plus a slash. Recompute every folder hash after a move — including the folders you
did not touch, since a stale entry from an earlier rename is invisible otherwise.

Then run `pnpm codemap:check`. It fails on any `file_hashes` or `folder_hashes`
key whose path no longer exists on disk; it does not compare hashes, because a
changed hash only means "changed since the last run".

**7. Build config that points at the moved tree.** `vite.config.ts` (`root`,
`publicDir`, `build.outDir`), `vercel.json` (`buildCommand`, `outputDirectory`),
`components.json` (shadcn's css path and aliases), `playwright.config.ts`,
`vitest.config.ts` (`test.include`).

**8. Verify.** The gate, plus `pnpm test:e2e` if the move touched anything the
browser can see, plus a build whose output hashes are unchanged from before the
move. Identical hashes are the proof that a move was a move.

## After the merge

Post what happened on the tracking issue:

```sh
gh issue comment <issue> --body "## <phase> merged
| PR | Change | Merge commit |
| --- | --- | --- |
| [#<pr>](<url>) | ... | \`<sha>\` |

### Verified
- the gate
- the deploy: the production domain serves the new build"
```

Then close the phase in `docs/improvement-plan.md` in the same PR — that file is the
single source of truth for what is done and what is next.
