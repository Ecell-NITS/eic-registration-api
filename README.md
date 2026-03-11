# event-registrations-api

The API for registration of events

## Developer setup & pre-commit checks

This project includes several development checks to keep code quality consistent:

- ESLint (with TypeScript support) and Prettier for formatting and linting.
- Husky + lint-staged to run checks on staged files before commits.
- Commitlint enforcing Conventional Commits via a commit-msg hook.

Quick start:

1. Install dependencies:

```bash
pnpm install
```

2. Install Husky hooks (this runs automatically after install via the `prepare` script):

```bash
pnpm run prepare
```

3. Run the full checks locally:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format
```

If you need to bypass hooks temporarily (not recommended), you can use `git commit --no-verify`.
