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
- Bounded queue buffering rejects bursts once `INDEXER_QUEUE_MAX_BUFFER_SIZE` is reached.
- Replay rejection alerts emit structured threshold snapshots for operational visibility.

## Frontend wallet
- Explicit tx lifecycle states (signing/submitting/success/error).
- Freighter signing abstraction separated from UI logic.
- Network config centralized to reduce misconfigured tx submission risk.

---

## Threat Model: Replay and Nonce Abuse

### Scope
Covers `core_game`, `rewards`, `achievements` Soroban contracts and the backend ingestion pipeline.

---

### Scenario 1 — Transaction Replay (core_game)
**Surface:** `guess` and `finalize` entry points.  
**Attack:** Attacker captures a signed transaction XDR and resubmits it on the same or a forked network.  
**Impact:** Duplicate guess recorded; session state corrupted; potential double reward.  
**Mitigations:**
- Soroban ledger sequence numbers make replayed transactions invalid after the sequence window expires.
- Session ownership check (`player == tx source`) prevents cross-player replay.
- `(player, nonce)` uniqueness enforced in contract storage; duplicate nonce → `AlreadyUsed` error.

**Owner module:** `soroban/contracts/core_game`  
**Mitigation test:** `soroban/contracts/core_game/src/tests.rs` — `test_duplicate_nonce_rejected`  
**Status:** Mitigated by Soroban sequence + nonce storage. No open follow-up.

---

### Scenario 2 — Nonce Reuse / Nonce Prediction (core_game)
**Surface:** Client-generated nonce passed to `guess` instruction.  
**Attack:** Client reuses a nonce (accidental or malicious) to replay a prior guess commitment; or attacker predicts nonce to front-run a guess.  
**Impact:** Replay of prior guess; potential commitment collision.  
**Mitigations:**
- Contract rejects any `(player, nonce)` pair already stored.
- Nonce should be a cryptographically random 32-byte value generated client-side (`crypto.randomUUID` / `crypto.getRandomValues`).
- Frontend `useGameplayTx` generates a fresh `id` per execution via `crypto.randomUUID()`.

**Owner module:** `soroban/contracts/core_game`, `frontend/src/hooks/useGameplayTx.ts`  
**Mitigation test:** `event-normalizer.service.spec.ts` — topic allowlist rejects unknown events that could carry replayed nonces.  
**Status:** Mitigated. Follow-up: enforce nonce entropy minimum in contract (>= 16 bytes). See #605.

---

### Scenario 3 — Ingestion Pipeline Replay (backend indexer)
**Surface:** `POST /indexer/ingest` endpoint.  
**Attack:** Attacker replays a previously accepted event payload to double-apply a projection (e.g., double-credit a reward).  
**Impact:** Duplicate session projection; inflated reward/achievement state.  
**Mitigations:**
- Unique key `(network, txHash, eventIndex)` enforced at the database layer; duplicate insert is a no-op.
- Projection `apply()` is idempotent: upsert by `(network, sessionId)` overwrites rather than appends.
- Payload size guard (configurable via `INDEXER_MAX_PAYLOAD_BYTES`) rejects oversized payloads that could carry embedded replay data.
- Topic allowlist (`ALLOWED_TOPICS`) rejects unknown event types at normalization time.
- Queue backpressure guard rejects oversized bursts before they can accumulate in memory.

**Owner module:** `backend/src/indexer`  
**Mitigation tests:** `event-normalizer.service.spec.ts` — allowlist and payload-size guard tests.  
**Status:** Mitigated. Follow-up: add HMAC signature verification on ingest endpoint for authenticated sources. See #606.

---

### Scenario 4 — Cross-Network Replay
**Surface:** Signed transaction XDR submitted to wrong network (testnet tx replayed on mainnet).  
**Attack:** Attacker or misconfigured client submits a testnet-signed transaction to mainnet RPC.  
**Impact:** Transaction rejected by Stellar (network passphrase mismatch), but could cause confusing UX or be exploited if passphrases were ever reused.  
**Mitigations:**
- Stellar network passphrase is embedded in the transaction envelope; mainnet and testnet passphrases are distinct.
- `STELLAR_NETWORKS` config centralizes passphrases; `signWithFreighter` passes the correct passphrase.
- `useGameplayTx` pre-submit guard throws `StaleContextError` on network mismatch before signing.

**Owner module:** `frontend/src/hooks/useGameplayTx.ts`, `frontend/src/lib/stellar/network.ts`  
**Mitigation tests:** `useGameplayTx.spec.ts` — network mismatch guard tests.  
**Status:** Mitigated at frontend layer. No open follow-up.

---

### Scenario 5 — Reward / Achievement Double-Claim
**Surface:** `rewards` and `achievements` contract claim entry points.  
**Attack:** Player submits claim transaction twice (race condition or replay) to receive duplicate rewards.  
**Impact:** Token over-issuance; achievement badge duplication.  
**Mitigations:**
- Contract must enforce claimed-flag per `(player, reward_id)` in storage.
- Idempotent projection in indexer prevents double-counting in read model.

**Owner module:** `soroban/contracts/rewards`, `soroban/contracts/achievements`  
**Status:** Partially mitigated (indexer layer). **Unresolved risk:** on-chain claimed-flag enforcement needs explicit test coverage.  
**Follow-up:** Add `test_double_claim_rejected` to rewards and achievements contract test suites. See #607.

---

### Summary Table

| # | Scenario | Severity | Status | Follow-up |
|---|----------|----------|--------|-----------|
| 1 | Transaction replay (core_game) | High | Mitigated | — |
| 2 | Nonce reuse / prediction | High | Mitigated | #605 (nonce entropy min) |
| 3 | Ingestion pipeline replay | High | Mitigated | #606 (HMAC on ingest) |
| 4 | Cross-network replay | Medium | Mitigated | — |
| 5 | Reward/achievement double-claim | High | Partial | #607 (on-chain claimed-flag tests) |

---

## Pre-testnet Hardening Checklist

- Confirm replay rejection alerts are visible in worker tick logs.
- Verify the indexer queue rejects burst traffic once the bounded buffer is full.
- Run the workflow secret-scope policy check before merging workflow changes.
- Keep security notes and wave docs aligned with any behavior changes.
