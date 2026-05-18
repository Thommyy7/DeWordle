#!/usr/bin/env bash
set -euo pipefail

rustup target add wasm32-unknown-unknown

echo "Soroban foundation setup complete."
echo "Next:"
echo "  cd soroban"
echo "  cargo check --workspace"
