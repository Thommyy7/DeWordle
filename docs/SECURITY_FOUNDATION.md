# Security Foundation Notes

## Core gameplay contract
- Admin-only day configuration updates.
- Session ownership auth required for guess and finalize actions.
- Replay protection primitive via `(player, nonce)` uniqueness.
- Invalid state transitions rejected (`InProgress` cannot finalize).
- Empty commitment rejects to avoid placeholder guess replay.

## Indexer
- Event replay safety with unique key `(network, txHash, eventIndex)`.
- Projection updates are idempotent by design.
- Cursor checkpoint model added for deterministic polling progress.

## Frontend wallet
- Explicit tx lifecycle states (signing/submitting/success/error).
- Freighter signing abstraction separated from UI logic.
- Network config centralized to reduce misconfigured tx submission risk.
