# Soroban SDK Guide

The SDK scaffold lives in `soroban/sdk/ts`.

## Core modules
- `network.ts`: network and contract registry types/loaders
- `core-game-client.ts`: typed contract client scaffolding
- `tx-builder.ts`: build + simulate + assemble transaction helpers
- `events.ts`: event shape decoding utilities
- `types.ts`: shared domain types

## Usage pattern
1. Load network config.
2. Load contract registry.
3. Instantiate `CoreGameClient.fromRegistry(...)`.
4. Build and simulate transaction.
5. Sign in frontend wallet layer.
6. Submit signed transaction via Soroban RPC.
