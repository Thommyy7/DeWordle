"use client";

import { useCallback, useMemo, useState } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { nextLifecycle, reconcileGameplayState, type GameplayTxSnapshot } from "@/lib/stellar/gameplay-flow";

export class StaleContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleContextError";
  }
}

export function useGameplayTx() {
  const wallet = useStellarWallet();
  const [snapshot, setSnapshot] = useState<GameplayTxSnapshot>({});

  const networkMismatch = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    if (!configured) return false;
    return configured !== wallet.network;
  }, [wallet.network]);

  const execute = useCallback(
    async (transactionXdr: string, optimisticSessionId?: string) => {
      // Pre-submit stale context guards
      if (!wallet.connected || !wallet.address) {
        throw new StaleContextError("Wallet is not connected. Please reconnect before submitting.");
      }
      if (networkMismatch) {
        throw new StaleContextError(
          `Network mismatch: app expects '${process.env.NEXT_PUBLIC_STELLAR_NETWORK}' but wallet is on '${wallet.network}'. Please switch networks.`,
        );
      }

      const id = crypto.randomUUID();
      wallet.setTxStatus(nextLifecycle(id, "signing"));
      setSnapshot({ pendingId: id, optimisticSessionId });

      try {
        const signed = await wallet.signTransaction(transactionXdr);
        wallet.setTxStatus(nextLifecycle(id, "submitting"));

        const submitted = await wallet.submitTransaction(signed);
        const status = nextLifecycle(id, "success");

        wallet.setTxStatus({ ...status, txHash: submitted.hash });
        setSnapshot(
          reconcileGameplayState({
            status: { ...status, txHash: submitted.hash },
            optimisticSessionId,
            txHash: submitted.hash,
          }),
        );

        return submitted;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown transaction error";
        const status = nextLifecycle(id, "error", message);
        wallet.setTxStatus(status);
        setSnapshot(
          reconcileGameplayState({
            status,
            optimisticSessionId,
          }),
        );
        throw error;
      }
    },
    [wallet, networkMismatch],
  );

  return {
    execute,
    snapshot,
    networkMismatch,
    walletStatus: wallet.status,
  };
}
