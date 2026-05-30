import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestedEventDto } from './dto/ingested-event.dto';
import { EventProcessorService } from './processors/event-processor.service';
import { EventNormalizerService } from './processors/event-normalizer.service';
import { CursorService } from './projections/cursor.service';
import { compareEventsByCursor } from './processors/event-ordering.util';
import { randomUUID } from 'crypto';
import { INDEXER_STREAM_CORE_GAME } from './indexer.constants';

export interface IndexerLogContext {
  correlationId: string;
}

/** Observability counters for indexer health metrics. */
export interface IndexerMetrics {
  ingestedTotal: number;
  replaySkips: number;
  projectionErrors: number;
  pollCycles: number;
  lastCursorLedger: number;
}

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  readonly metrics: IndexerMetrics = {
    ingestedTotal: 0,
    replaySkips: 0,
    projectionErrors: 0,
    pollCycles: 0,
    lastCursorLedger: 0,
  };

  constructor(
    private readonly eventProcessor: EventProcessorService,
    private readonly eventNormalizer: EventNormalizerService,
    private readonly cursorService: CursorService,
    private readonly configService: ConfigService,
  ) {}

  async ingest(event: IngestedEventDto, context?: IndexerLogContext) {
    const t0 = Date.now();
    try {
      await this.eventProcessor.process(event, context);
      await this.cursorService.checkpoint(
        event.network,
        INDEXER_STREAM_CORE_GAME,
        event.ledger,
        event.txHash,
        event.eventIndex,
      );
      this.metrics.ingestedTotal++;
      this.metrics.lastCursorLedger = event.ledger;
      this.logger.log({
        msg: 'indexer.ingest.ok',
        correlationId: context?.correlationId,
        topic: event.topic,
        ledger: event.ledger,
        txHash: event.txHash,
        eventIndex: event.eventIndex,
        latencyMs: Date.now() - t0,
      });
    } catch (err) {
      this.metrics.projectionErrors++;
      this.logger.error({
        msg: 'indexer.ingest.error',
        correlationId: context?.correlationId,
        topic: event.topic,
        ledger: event.ledger,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async poll(context?: IndexerLogContext): Promise<number> {
    const network =
      (this.configService.get<string>('SOROBAN_NETWORK') as 'testnet' | 'mainnet') ||
      'testnet';
    const rpcUrl = this.configService.get<string>('SOROBAN_RPC_URL');
    const contractId = this.configService.get<string>('SOROBAN_CORE_GAME_CONTRACT_ID');

    const cycleContext: IndexerLogContext = context ?? { correlationId: randomUUID() };

    if (!rpcUrl || !contractId) {
      this.logger.warn({
        msg: 'indexer.poll.skipped',
        correlationId: cycleContext.correlationId,
        reason: 'missing_config',
      });
      return 0;
    }

    const cursor = await this.cursorService.getOrCreate(network, INDEXER_STREAM_CORE_GAME);
    this.metrics.pollCycles++;
    this.metrics.lastCursorLedger = cursor.lastLedger;

    this.logger.log({
      msg: 'indexer.poll.tick',
      correlationId: cycleContext.correlationId,
      network,
      cursorLedger: cursor.lastLedger,
      cursorTxHash: cursor.lastTxHash,
      cursorEventIndex: cursor.lastEventIndex,
      metrics: { ...this.metrics },
    });
    this.logger.debug({
      msg: 'indexer.poll.debug',
      correlationId: cycleContext.correlationId,
      network,
      cursorLedger: cursor.lastLedger,
      cursorTxHash: cursor.lastTxHash,
      cursorEventIndex: cursor.lastEventIndex,
    });

    const rawEvents = await this.fetchEvents(rpcUrl, contractId, cursor.lastLedger);

    const normalized = rawEvents
      .map((raw) => this.eventNormalizer.normalize(network, raw))
      .filter((e) => this.eventNormalizer.isValid(e))
      .sort(compareEventsByCursor);

    let ingested = 0;
    for (const event of normalized) {
      await this.ingest(event, cycleContext);
      ingested++;
    }

    this.logger.log({
      msg: 'indexer.poll.complete',
      correlationId: cycleContext.correlationId,
      ingested,
    });
    return ingested;
  }

  /** Fetches raw Soroban events from RPC after the given ledger cursor. Overridable for testing. */
  async fetchEvents(
    rpcUrl: string,
    contractId: string,
    afterLedger: number,
  ): Promise<Record<string, unknown>[]> {
    const { default: axios } = await import('axios');
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getEvents',
      params: {
        startLedger: afterLedger > 0 ? afterLedger + 1 : 1,
        filters: [{ type: 'contract', contractIds: [contractId] }],
        pagination: { limit: 200 },
      },
    };

    const response = await axios.post<{
      result?: { events?: Record<string, unknown>[] };
    }>(rpcUrl, body, { timeout: 10_000 });

    return response.data?.result?.events ?? [];
  }

  recordReplaySkip(ledger: number, txHash: string, eventIndex: number, context?: IndexerLogContext) {
    this.metrics.replaySkips++;
    this.logger.warn({
      msg: 'indexer.replay.skip',
      correlationId: context?.correlationId,
      ledger,
      txHash,
      eventIndex,
      totalSkips: this.metrics.replaySkips,
    });
  }
}
