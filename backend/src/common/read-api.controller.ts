import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionProjectionEntity } from '../indexer/entities/session-projection.entity';
import { AchievementSummaryDto, AchievementEntryDto } from './achievement-summary.dto';
import { PlayerSummaryDto } from './player-profile.dto';
import { SessionHistoryDto, SessionHistoryEntryDto } from './session-history.dto';

@ApiTags('Read API (Projection-backed)')
@Controller('api/v1')
export class ReadApiController {
  constructor(
    @InjectRepository(SessionProjectionEntity)
    private readonly sessionsRepo: Repository<SessionProjectionEntity>,
  ) {}

  @Get('achievements/:address')
  @ApiOperation({
    summary: 'Get achievement unlock summary for a player',
    description:
      'Returns unlocked, pending, and unavailable achievement states from projection data.',
  })
  @ApiOkResponse({ type: AchievementSummaryDto })
  async getAchievementSummary(
    @Param('address') address: string,
  ): Promise<AchievementSummaryDto> {
    const sessions = await this.sessionsRepo.find({
      where: { player: address },
    });

    const completedDays = sessions.filter((s) => s.finalized).length;
    const totalDays = Math.max(completedDays, 5);

    const achievements: AchievementEntryDto[] = [
      {
        id: 'first_win',
        name: 'First Win',
        state: completedDays >= 1 ? 'unlocked' : 'pending',
        unlockedAt: completedDays >= 1 ? new Date().toISOString() : undefined,
      },
      {
        id: 'streak_3',
        name: '3-Day Streak',
        state: completedDays >= 3 ? 'unlocked' : 'pending',
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        state: completedDays >= 7 ? 'unlocked' : 'pending',
      },
      {
        id: 'dedicated',
        name: 'Dedicated Player',
        state: completedDays >= 30 ? 'unlocked' : 'pending',
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        state: 'unavailable',
      },
    ];

    const unlocked = achievements.filter((a) => a.state === 'unlocked').length;

    return {
      achievements,
      total: achievements.length,
      unlocked,
    };
  }

  @Get('players/:address/summary')
  @ApiOperation({
    summary: 'Get player streak and profile summary',
    description:
      'Returns player profile summary including streaks, totals, and recent activity from projection data.',
  })
  @ApiOkResponse({ type: PlayerSummaryDto })
  async getPlayerSummary(
    @Param('address') address: string,
  ): Promise<PlayerSummaryDto> {
    const sessions = await this.sessionsRepo.find({
      where: { player: address },
      order: { updatedAt: 'DESC' },
    });

    const totalSessions = sessions.length;
    const finalizedSessions = sessions.filter((s) => s.finalized);
    const totalWins = finalizedSessions.filter((s) => s.status === 'Finalized').length;

    const sortedDates = finalizedSessions
      .map((s) => s.updatedAt)
      .filter(Boolean)
      .sort()
      .reverse();

    let currentStreak = 0;
    const today = new Date();
    for (const date of sortedDates) {
      const diffDays = Math.floor(
        (today.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays <= 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    const lastPlayedAt = sortedDates[0]?.toISOString();

    return {
      address,
      totalSessions,
      totalWins,
      winRate: totalSessions > 0 ? totalWins / totalSessions : 0,
      streak: {
        currentStreak,
        longestStreak: currentStreak,
        lastPlayedAt,
      },
      source: 'projection',
    };
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get paginated session history',
    description:
      'Returns paginated session history from projection data, filterable by player address.',
  })
  @ApiQuery({ name: 'player', required: false, description: 'Filter by player wallet address' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiOkResponse({ type: SessionHistoryDto })
  async getSessionHistory(
    @Query('player') player?: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ): Promise<SessionHistoryDto> {
    const where = player ? { player } : {};

    const [sessions, total] = await this.sessionsRepo.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: Math.max(0, Number(skip)),
      take: Math.max(1, Math.min(Number(take), 100)),
    });

    return {
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        player: s.player,
        dayId: s.dayId,
        status: s.status,
        attemptsUsed: s.attemptsUsed,
        finalized: s.finalized,
        updatedAt: s.updatedAt.toISOString(),
      })),
      total,
      skip: Number(skip),
      take: Number(take),
    };
  }
}
