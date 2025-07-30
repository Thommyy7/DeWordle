import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from './entities/game-session.entity';
import { Game } from 'src/games/entities/game.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { User } from 'src/auth/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { submitGuessProvider } from './providers/submit-guess';

@Injectable()
export class GameSessionsService {
  constructor(
    @InjectRepository(GameSession)
    private sessionRepo: Repository<GameSession>,
    @InjectRepository(Game)
    private gameRepo: Repository<Game>,
    private eventEmitter: EventEmitter2,
    private leaderboardService: LeaderboardService,
    private submitGuessProvider: submitGuessProvider,
  ) {}

  async create(createDto: CreateSessionDto, user: User | null) {
    // Validate game exists
    const game = await this.gameRepo.findOne({
      where: { id: createDto.gameId },
    });
    if (!game) throw new NotFoundException('Game not found');

    // Validate score for guest sessions (prevent abuse)
    if (!user && createDto.score < 0) {
      throw new BadRequestException('Invalid score for guest session');
    }

    // Create session with user or null for guest
    const session = this.sessionRepo.create({
      ...createDto,
      game,
      ...(user ? { user } : {}),
    });

    const saved = await this.sessionRepo.save(session);

    // Update leaderboard only for authenticated users
    // Guest sessions are excluded from leaderboard and stats
    if (user) {
      const win = false; // You may want to determine win logic based on session/score
      await this.leaderboardService.upsertEntry(user, game, createDto.score, win);
    }

    // Emit event for both authenticated and guest sessions
    this.eventEmitter.emit('session.completed', saved);
    
    return saved;
  }

  /**
   * Get sessions for a specific user or guest
   * @param user - User entity for authenticated users, null for guests
   * @param guestId - Guest identifier for anonymous sessions
   */
  async getUserSessions(user: User | null, guestId?: string) {
    if (user) {
      // Return authenticated user sessions
      return await this.sessionRepo.find({
        where: { user },
        relations: ['game'],
        order: { playedAt: 'DESC' },
      });
    } else if (guestId) {
      // Return guest sessions by guestId in metadata using query builder
      return await this.sessionRepo
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.game', 'game')
        .where('session.user IS NULL')
        .andWhere("session.metadata->>'guestId' = :guestId", { guestId })
        .orderBy('session.playedAt', 'DESC')
        .getMany();
    }
    
    return [];
  }

  public async submitGuess(sessionId: number, guess: string, user: User | null) {
    this.submitGuessProvider.submitGuess(sessionId, guess, user)
  }
}
