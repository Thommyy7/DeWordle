import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { EventProcessorService } from './processors/event-processor.service';
import { EventNormalizerService } from './processors/event-normalizer.service';
import { ProjectionService } from './projections/projection.service';
import { CursorService } from './projections/cursor.service';
import { IndexerQueueService } from './queue/indexer-queue.service';
import { IndexerWorkerService } from './queue/indexer-worker.service';
import { ReplayAlertService } from './queue/replay-alert.service';
import { IngestedEventEntity } from './entities/ingested-event.entity';
import { SessionProjectionEntity } from './entities/session-projection.entity';
import { IndexerCursorEntity } from './entities/indexer-cursor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IngestedEventEntity,
      SessionProjectionEntity,
      IndexerCursorEntity,
    ]),
  ],
  controllers: [IndexerController],
  providers: [
    IndexerService,
    EventProcessorService,
    EventNormalizerService,
    ProjectionService,
    CursorService,
    IndexerQueueService,
    ReplayAlertService,
    IndexerWorkerService,
  ],
  exports: [IndexerService, ProjectionService, CursorService, EventNormalizerService],
})
export class IndexerModule {}
