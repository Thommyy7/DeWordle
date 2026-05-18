# ADR 0001: Soroban Foundation Boundaries

## Status
Accepted

## Context
DeWordle is transitioning from a mixed offchain + Starknet architecture to Stellar Soroban.
The foundation phase must maximize contributor parallelism while minimizing protocol risk.

## Decision
1. Establish modular contract boundaries (`core_game`, `rewards`, `achievements`, `admin_registry`).
2. Keep `core_game` authoritative for session state transitions and streak accounting.
3. Keep backend as indexer/projection/read API foundation, not gameplay authority.
4. Introduce TS SDK as shared integration surface for frontend and backend workers.
5. Introduce replay-safe ingest identifiers `(network, txHash, eventIndex)` for projections.

## Consequences
- Contributors can work in parallel across contracts, SDK, frontend, and indexer.
- Protocol-critical transitions are centralized in `core_game` early.
- Rewards/tournaments are safely deferred to later waves.
