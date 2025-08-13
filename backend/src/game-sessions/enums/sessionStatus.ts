export enum GameSessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  WON = 'WON',
  LOST = 'LOST',
}

export interface SessionCompletedEvent {
  sessionId: number;
  userId?: number;
  finalStatus: 'WON' | 'LOST';
  guessCount: number;
  solutionWord: string;
}
