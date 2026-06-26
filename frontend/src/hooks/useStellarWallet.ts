"use client";

import { useWalletContext } from "@/providers/stellar-wallet-provider";

export function useStellarWallet() {
  const {
    connected,
    address,
    network,
    status,
    connect,
    disconnect,
    switchNetwork,
    setTxStatus,
    signTransaction,
    submitTransaction,
    onAccountSwitch,
  } = useWalletContext();

  return {
    connected,
    address,
    network,
    status,
    connect,
    disconnect,
    switchNetwork,
    setTxStatus,
    signTransaction,
    submitTransaction,
    onAccountSwitch,
  };
}
