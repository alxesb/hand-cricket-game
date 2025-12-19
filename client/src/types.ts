// This mirrors the server-side types.
// Keeping them in sync is important for type safety.

export type Player = {
  id: string;
  name: string;
  // Batting Stats (cumulative for the game)
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  // Bowling Stats (cumulative for the game)
  oversBowled: number; // Tracked as total balls, e.g., 7 balls = 1.1 overs
  runsConceded: number;
  wicketsTaken: number;
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
    batterMove: number | string;
    bowlerMove: number | string;
    outcome: string;
  } | null;
  winner: Player | null;
  out: boolean;
};
