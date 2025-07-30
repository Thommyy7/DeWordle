import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GameSessionStatus } from '../enums/sessionStatus';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GameSession } from '../entities/game-session.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class submitGuessProvider {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
  ) {}
  async submitGuess(sessionId: number, guess: string, user: User | null) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['game', 'user'],
    });

    if (!session) throw new NotFoundException('Session not found');

    // Reject if game is already complete
    if (
      session.status === GameSessionStatus.WON ||
      session.status === GameSessionStatus.LOST
    ) {
      throw new ForbiddenException({
        message: 'Game session is already complete',
      });
    }

    await this.sessionRepo.save(session);

    return {
      result: 'Guess processed',
      status: session.status,
    };
  }
}
