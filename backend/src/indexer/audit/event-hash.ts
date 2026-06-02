import { createHash } from 'crypto';

export type AuditEventHashInput = {
  network: string;
  contractId: string;
  topic: string;
  txHash: string;
  ledger: number;
  eventIndex: number;
  payload: Record<string, unknown>;
};

export function computeAuditEventHash(e: AuditEventHashInput): string {
  // Stable, minimal serialization for tamper-evident auditing.
  const json = JSON.stringify([
    e.network,
    e.contractId,
    e.topic,
    e.txHash,
    e.ledger,
    e.eventIndex,
    e.payload,
  ]);
  return createHash('sha256').update(json).digest('hex');
}

