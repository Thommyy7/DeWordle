import { ApiProperty } from '@nestjs/swagger';

export type AchievementState = 'unlocked' | 'pending' | 'unavailable';

export class AchievementEntryDto {
  @ApiProperty({ description: 'Unique achievement identifier' })
  id: string;

  @ApiProperty({ description: 'Human-readable achievement name' })
  name: string;

  @ApiProperty({ enum: ['unlocked', 'pending', 'unavailable'] as AchievementState[] })
  state: AchievementState;

  @ApiProperty({ description: 'ISO timestamp when unlocked, if applicable', required: false })
  unlockedAt?: string;
}

export class AchievementSummaryDto {
  @ApiProperty({ type: [AchievementEntryDto] })
  achievements: AchievementEntryDto[];

  @ApiProperty({ description: 'Total number of achievements' })
  total: number;

  @ApiProperty({ description: 'Number of unlocked achievements' })
  unlocked: number;
}
