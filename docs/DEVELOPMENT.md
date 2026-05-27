# Development Guide

## Phase 3 One-Command Validation

Run the full Phase 3 validation suite before opening a PR:

```bash
./scripts/validate-phase3.sh
```

Target a specific module only:

```bash
./scripts/validate-phase3.sh sc    # Soroban smart contracts
./scripts/validate-phase3.sh sdk   # TypeScript SDK
./scripts/validate-phase3.sh fe    # Frontend
./scripts/validate-phase3.sh be    # Backend
```

> **Watchman-constrained environments**: If `cargo` is unavailable (e.g. CI
> containers without Rust), the Soroban check is automatically skipped with a
> clear notice. All other modules still run.

## Recommended Workflow
1. Pick an issue with acceptance criteria.
2. Create focused branch.
3. Implement with tests.
4. Run `./scripts/validate-phase3.sh` to confirm nothing is broken.
5. Open PR using template.

## Backend Notes
- API prefix: `/api/v1`
- Swagger: `/api`
- Uses TypeORM migrations and seed scripts.

## Frontend Notes
- Next.js app router
- Keep UI changes accompanied by screenshots in PRs.

## Onchain Notes
- Current stack: Cairo/Starknet
- Migration target: Soroban (see `STELLAR_MIGRATION.md`)

## Reproducing CI Locally

Use `scripts/ci-local.sh` to run the same checks as GitHub Actions, in the
same order, before pushing.

```bash
# Run all subsets (frontend + backend + soroban)
./scripts/ci-local.sh

# Run a specific subset
./scripts/ci-local.sh frontend
./scripts/ci-local.sh backend
./scripts/ci-local.sh soroban

# Run multiple subsets
./scripts/ci-local.sh backend soroban
```

The script exits non-zero and prints a summary of every failed step, so you
can see all failures at once rather than stopping at the first one.

**Prerequisites:** Node 20+, npm, Rust stable with `wasm32-unknown-unknown`
target (`rustup target add wasm32-unknown-unknown`).
