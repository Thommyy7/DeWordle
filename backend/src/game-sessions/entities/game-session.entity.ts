import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Game } from '../../games/entities/game.entity';
import { User } from 'src/auth/entities/user.entity';
import { GameSessionStatus } from '../enums/sessionStatus';

@Entity()
export class GameSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sessions, { nullable: true })
  user: User;

  @ManyToOne(() => Game, (game) => game.sessions, { nullable: false })
  game: Game;

  @Column()
  score: number;

  @Column()
  durationSeconds: number;

  @Column({ type: 'enum', enum: GameSessionStatus, default: GameSessionStatus.IN_PROGRESS })
  status: GameSessionStatus;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  playedAt: Date;
}
