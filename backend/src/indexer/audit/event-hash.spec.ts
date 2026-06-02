import { computeAuditEventHash } from './event-hash';

describe('computeAuditEventHash', () => {
  it('is deterministic for same input', () => {
    const e = {
      network: 'testnet',
      contractId: 'CABC',
      topic: 'session_finalized',
      txHash: 'tx1',
      ledger: 10,
      eventIndex: 0,
      payload: { a: 1, b: 'two' },
    };

    expect(computeAuditEventHash(e)).toEqual(computeAuditEventHash(e));
  });

  it('changes when payload changes', () => {
    const base = {
      network: 'testnet',
      contractId: 'CABC',
      topic: 'session_finalized',
      txHash: 'tx1',
      ledger: 10,
      eventIndex: 0,
    };

    const a = computeAuditEventHash({ ...base, payload: { a: 1 } });
    const b = computeAuditEventHash({ ...base, payload: { a: 2 } });
    expect(a).not.toEqual(b);
  });
});

