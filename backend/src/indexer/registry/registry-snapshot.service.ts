import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrySnapshotEntity } from '../entities/registry-snapshot.entity';

export interface RegistrySnapshotInput {
  network: string;
  contractId: string;
  registry: Record<string, unknown>;
  capturedAtLedger?: number;
}

@Injectable()
export class RegistrySnapshotService {
  private readonly logger = new Logger(RegistrySnapshotService.name);

  constructor(
    @InjectRepository(RegistrySnapshotEntity)
    private readonly snapshotRepo: Repository<RegistrySnapshotEntity>,
  ) {}

  /**
   * Persists (or updates) the registry snapshot for the given network and
   * contract. Safe to call on every successful registry fetch — subsequent
   * calls simply advance the ledger watermark.
   */
  async save(input: RegistrySnapshotInput): Promise<RegistrySnapshotEntity> {
    const existing = await this.snapshotRepo.findOne({
      where: { network: input.network, contractId: input.contractId },
    });

    const snapshot = this.snapshotRepo.create({
      id: existing?.id,
      network: input.network,
      contractId: input.contractId,
      registry: input.registry,
      capturedAtLedger: input.capturedAtLedger ?? existing?.capturedAtLedger ?? 0,
    });

    const saved = await this.snapshotRepo.save(snapshot);

    this.logger.log({
      msg: 'indexer.registry_snapshot.saved',
      network: input.network,
      contractId: input.contractId,
      capturedAtLedger: saved.capturedAtLedger,
    });

    return saved;
  }

  /**
   * Returns the latest known registry snapshot for the given network and
   * contract, or null if none has been persisted yet.
   */
  async getLatest(
    network: string,
    contractId: string,
  ): Promise<RegistrySnapshotEntity | null> {
    return this.snapshotRepo.findOne({
      where: { network, contractId },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Returns all snapshots for a network (useful for diagnostics).
   */
  async listByNetwork(network: string): Promise<RegistrySnapshotEntity[]> {
    return this.snapshotRepo.find({
      where: { network },
      order: { updatedAt: 'DESC' },
    });
  }
}
