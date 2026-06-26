import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayerStreakDto {
  @ApiProperty({ description: 'Current consecutive day streak' })
  currentStreak: number;

  @ApiProperty({ description: 'Longest consecutive day streak ever achieved' })
  longestStreak: number;

  @ApiProperty({ description: 'ISO date of last played session', required: false })
  lastPlayedAt?: string;
}

export class PlayerSummaryDto {
  @ApiProperty({ description: 'Player wallet address' })
  address: string;

  @ApiProperty({ description: 'Total sessions played' })
  totalSessions: number;

  @ApiProperty({ description: 'Total wins' })
  totalWins: number;

  @ApiProperty({ description: 'Win rate as a decimal (0-1)' })
  winRate: number;

  @ApiProperty({ type: PlayerStreakDto })
  streak: PlayerStreakDto;

  @ApiPropertyOptional({ description: 'Data source freshness indicator' })
  source?: 'projection' | 'legacy';
}
