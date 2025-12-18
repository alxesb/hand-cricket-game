export type Player = {
  id: string;
  name: string;
};

export type GameState = {
  players: Player[];
  gameCode: string;
  isGameActive: boolean;
  isTossDone: boolean,
  batter: Player | null;
  bowler: Player | null;
  score: number;
  balls: number;
  target: number | null;
  inning: 1 | 2;
  moves: { [playerId: string]: number | string };
  lastRoundResult: {
    batterMove: number | string;
    bowlerMove: number | string;
    outcome: string;
  } | null;
  winner: Player | null;
  out: boolean;
};
