import { Injectable, Logger } from '@nestjs/common';
import { REPLAY_REJECTION_ALERT_THRESHOLD } from './replay-alert.constants';

export interface ReplayAlertSnapshot {
  windowSkips: number;
  threshold: number;
  isAlerting: boolean;
  lastRejectedAt?: Date;
}

@Injectable()
export class ReplayAlertService {
  private readonly logger = new Logger(ReplayAlertService.name);
  private windowSkips = 0;
  private lastRejectedAt?: Date;
  private readonly threshold = REPLAY_REJECTION_ALERT_THRESHOLD;

  recordReplayRejection(
    ledger: number,
    txHash: string,
    eventIndex: number,
  ): ReplayAlertSnapshot {
    this.windowSkips += 1;
    this.lastRejectedAt = new Date();

    const snapshot = this.snapshot();
    this.logger.warn({
      msg: 'indexer.replay.rejected',
      ledger,
      txHash,
      eventIndex,
      windowSkips: snapshot.windowSkips,
      threshold: snapshot.threshold,
      alert: snapshot.isAlerting ? 'replay_rejection_threshold_exceeded' : 'replay_rejection_observed',
    });

    return snapshot;
  }

  snapshot(): ReplayAlertSnapshot {
    return {
      windowSkips: this.windowSkips,
      threshold: this.threshold,
      isAlerting: this.windowSkips >= this.threshold,
      lastRejectedAt: this.lastRejectedAt,
    };
  }

  resetWindow(): void {
    this.windowSkips = 0;
    this.lastRejectedAt = undefined;
  }
}
