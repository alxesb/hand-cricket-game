// This mirrors the server-side types.
// Keeping them in sync is important for type safety.

export type Player = {
  id: string;
  name: string;
};

export type GameState = {
  players: Player[];
  gameCode: string;
  isGameActive: boolean;
  isTossDone: boolean;
  batter: Player | null;
  bowler: Player | null;
  score: number;
  balls: number;
  target: number | null;
  inning: 1 | 2;
  moves: { [playerId: string]: number | string };
  lastRoundResult: {
    batterMove: number;
    bowlerMove: number;
    outcome: string;
  } | null;
  winner: Player | null;
  out: boolean;
};
