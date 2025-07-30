import { Module } from '@nestjs/common';
import { GameSessionsController } from './game-sessions.controller';
import { GameSessionsService } from './game-sessions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { Game } from 'src/games/entities/game.entity';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { submitGuessProvider } from './providers/submit-guess';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession, Game]), LeaderboardModule],
  controllers: [GameSessionsController],
  providers: [GameSessionsService, submitGuessProvider],
})
export class GameSessionsModule {}
