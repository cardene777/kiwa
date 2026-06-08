# Releasing kiwa

> [🇬🇧 English](./RELEASING.md) • [🇯🇵 日本語](./RELEASING.ja.md)

kiwa releases are managed with Changesets and GitHub Actions.
In this repository, version updates, `CHANGELOG.md` updates, and npm publishing are handled by a workflow that runs after merging to `main`.
Local work stops at adding a changeset file, and version bumps and publishing are delegated to `release.yml`.

## Changesets workflow

1. In the PR that contains your changes, run `pnpm changeset` and add `.changeset/{name}.md`.
2. Merge the PR into `main`.
3. `release.yml` starts, and the Changesets bot creates a `chore(release): version packages` PR.
4. The version PR includes package version bumps and `CHANGELOG.md` updates aggregated from pending changesets.
5. When the version PR is merged, `pnpm release` runs and publishes to npm with `pnpm publish -r --access public --provenance`.

Before opening a PR, run `pnpm changeset` for any change that requires one.
Then, always pass the following three commands as local verification.

```bash
pnpm typecheck
pnpm test
pnpm build
```

Normally, do not use `pnpm version-packages` locally. Instead, review the diff in the version PR created by the Changesets bot.
Only proceed with manual version bumps if you are temporarily changing the release operation.

## Configuring NPM_TOKEN

Create an Automation Token on the npm side and register it in GitHub at `Settings > Secrets and variables > Actions` with the name `NPM_TOKEN`. The release workflow uses this secret to publish, so make sure it is configured before publishing.
Use an Automation Token dedicated to publishing. The policy is not to use a regular personal account token.

## About provenance

Publishing with `--provenance` generates sigstore provenance using the GitHub Actions OIDC token. On the package page on npmjs.com, you can verify the linkage to the source repository and build workflow.
To enable this, the release workflow always grants `permissions.id-token: write`.

## Troubleshooting

- If a version PR is not created, check whether there is a pending changeset on `main`.
- If publishing stops, check the `NPM_TOKEN` secret and workflow permissions.
- If you want to inspect the tarball contents, run `npm pack --dry-run` in each package.

## SHA pin policy

Dependabot monitors the `github-actions` ecosystem daily and, through the `groups` setting, proposes all actions together in a single PR. The policy is to merge those PRs in a weekly batch. In particular, we recommend manual review for minor version updates of `changesets/action` because they carry a risk of internal behavior changes.
SHA pinning prevents supply chain attacks through mutable major tags such as `@v4` and lets you update each action intentionally.

The routine group (`actions/*` + `pnpm/*`) also follows the same manual review policy for major updates, and `dependabot.yml` is configured with `ignore` to reject `version-update:semver-major`.
Automatic PRs are limited to minor and patch updates. When a major update is required, open a SHA pin update PR after manual review (the SHA verification procedure is a two-step check: `gh api repos/{owner}/{repo}/git/refs/tags/v{version}` → `gh api commits/{SHA}`).
This comes from what we learned in PR #19, where an automatic PR proposed two-stage major bumps for three actions, including `actions/checkout` v4 → v6. That showed the routine group also needs the same manual review process as `changesets/action`.

## release.yml CI gate

`release.yml` runs directly on pushes to `main`, but before `changesets/action` starts, it has a CI gate that runs five steps: install → typecheck → test (core + cli) → build → consumer typecheck. If tests fail, `changesets/action` does not start and publishing does not happen.
Because this repository relies primarily on local testing, it does not keep a GitHub Actions CI workflow for PRs. Before submitting a PR, developers are expected to run `pnpm typecheck && pnpm test && pnpm build` locally and record the results in the PR body.
The test gate in the publish path is enforced by rerunning tests inside `release.yml`. Parallel validation across multiple Node versions is removed, but behavior verification remains because `release.yml` still runs typecheck / test / build before publishing.
Required status checks for main branch protection are not configured in this repository (after removing `ci.yml`, statuses such as `test (20)` and `test (22)` no longer exist, so they cannot be required, and configuring them would deadlock PR merges). Instead, branch protection only enforces "PR required," and if needed, you can add physical enforcement on the review path such as signed commits. The test gate is enforced in two layers: developer local runs plus the five steps in `release.yml`. Third-party app statuses such as GitGuardian Security Checks and CodeRabbit may appear, but they are not included as required checks.

## v0.1.0 first publish procedure

The steps below apply to the initial publish, when the package does not yet exist on npmjs.com.
From the second release onward, the normal Changesets workflow handles the process automatically, but the first publish requires user-side setup for NPM_TOKEN distribution and Trusted Publisher configuration.

### Phase 1 — npm-side preparation (user action)

1. **Configure 2FA for your npm account** — At https://www.npmjs.com/settings/{user}/profile, select **Auth only** or **Auth and writes**. If you use an Automation Token, publishing is possible even with Auth only.
2. **Reserve a scope (optional)** — To use `@kiwa/core` and `@kiwa/cli`, create the `@kiwa` organization (`https://www.npmjs.com/org/create`). If that scope is unavailable, consider an alternative such as `@cardene-kiwa/core`.
3. **Create a Granular Access Token** — Settings > Access Tokens > Generate New Token > Granular Access Token.
   - name: `kiwa-publish`
   - expiration: 1 year (recommended)
   - packages: `@kiwa/*`
   - permissions: **Read and write** (for publishing)
   - The token is shown only once immediately after creation, so you must copy it then.

### Phase 2 — GitHub-side preparation (user action)

1. **Register the NPM_TOKEN secret** — At https://github.com/cardene777/kiwa/settings/secrets/actions, add the token from Phase 1.3 with the name `NPM_TOKEN`.
2. **Workflow permissions** — In Settings > Actions > General, enable **Read and write permissions** and Allow GitHub Actions to create and approve pull requests. This allows `release.yml` to create version PRs automatically.
3. **Trusted Publishers (stronger provenance)** — If you configure npm Trusted Publisher, publishing is possible without a token. In Settings > Packages > Trusted Publishers, specify the repo and workflow. Keep `permissions.id-token: write` in `release.yml`.

### Phase 3 — starting the release workflow (automated path)

1. Create a pending changeset under `.changeset/` (`pnpm changeset`).
2. Merge into `main` to start `release.yml`, which automatically creates a `chore(release): version packages` PR.
3. Merge the version PR → `release.yml` starts again → npm publishing runs through `pnpm release`.
4. Because provenance is enabled, links to the source repository and build workflow appear on the package page on npmjs.com.

### Phase 4 — post-publish checks

1. **Verify the npmjs.com pages** — Check `https://www.npmjs.com/package/@kiwa/core` and `@kiwa/cli` for the README, provenance badge, and version `0.1.0`.
2. **smoke test** — In a separate dApp project, run `pnpm dlx @kiwa/cli init` and confirm that the generated `e2e/connect.spec.ts` passes:

   ~~~bash
   mkdir /tmp/kiwa-smoke && cd /tmp/kiwa-smoke
   pnpm init
   pnpm dlx @kiwa/cli init
   pnpm install
   pnpm exec playwright install chromium
   pnpm exec playwright test
   ~~~

3. **Report completion** — Leave a trace on the roadmap issue.

### Known risks

| Risk | Mitigation |
|---|---|
| Package name is rejected by npm during the first publish | Open a separate issue to change the scope |
| `NPM_TOKEN` is read-only and publish fails on auth | Reissue the token (change Phase 1.3 to Read and write) |
| GitHub Actions workflow permissions are read-only and version PR creation fails | Recheck Phase 2.2 |
| Provenance fails on the sigstore side | Trusted Publisher is not configured; add Phase 2.3 |
| `changesets/action` has a compatibility issue with the pnpm v10 lockfile format | Already handled by pinning `release.yml` to pnpm version 10.33.2 |

## Related links

- [Changesets official site](https://github.com/changesets/changesets)
- [changesets/action](https://github.com/changesets/action)
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements)
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
- [npm Granular Access Tokens](https://docs.npmjs.com/about-access-tokens#about-granular-access-tokens)
