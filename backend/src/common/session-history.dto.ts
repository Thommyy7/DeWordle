import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionHistoryEntryDto {
  @ApiProperty({ description: 'Unique session identifier' })
  sessionId: string;

  @ApiProperty({ description: 'Player wallet address' })
  player: string;

  @ApiProperty({ description: 'Day / round identifier' })
  dayId: number;

  @ApiProperty({ description: 'Session status (Finalized, InProgress, etc.)' })
  status: string;

  @ApiProperty({ description: 'Number of attempts used' })
  attemptsUsed: number;

  @ApiProperty({ description: 'Whether the session is finalized' })
  finalized: boolean;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class SessionHistoryDto {
  @ApiProperty({ type: [SessionHistoryEntryDto] })
  sessions: SessionHistoryEntryDto[];

  @ApiProperty({ description: 'Total matching sessions (for pagination)' })
  total: number;

  @ApiProperty({ description: 'Current page offset' })
  skip: number;

  @ApiProperty({ description: 'Page size' })
  take: number;
}
