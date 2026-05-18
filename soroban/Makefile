.PHONY: check fmt test build-wasm

check:
	cargo check --workspace

fmt:
	cargo fmt --all

test:
	cargo test --workspace

build-wasm:
	cargo build --workspace --target wasm32-unknown-unknown --release
