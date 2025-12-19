import { Server, Socket } from 'socket.io';
import { GameState, Player, RoundResult } from './types';

// In-memory store for games
const games: { [key: string]: GameState } = {};

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const createGame = (io: Server, socket: Socket, playerName: string) => {
  const gameCode = generateGameCode();
  const player: Player = {
    id: socket.id,
    name: playerName || 'Player 1',
    runsScored: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    oversBowled: 0,
    runsConceded: 0,
    wicketsTaken: 0,
  };
  games[gameCode] = {
    gameCode,
    players: [player],
    isGameActive: false,
    isTossDone: false,
    batter: null,
    bowler: null,
    score: 0,
    balls: 0,
    target: null,
    inning: 1,
    moves: {},
    lastRoundResult: null,
    winner: null,
    out: false,
    consecutiveTwos: 0,
    bowlerMovesInOver: {},
    warning: null,
    currentOverHistory: [],
  };
  socket.join(gameCode);
  socket.emit('gameCreated', games[gameCode]);
};

export const joinGame = (io: Server, socket: Socket, { gameCode, playerName }: { gameCode: string; playerName: string }) => {
  const game = games[gameCode];
  if (!game) {
    socket.emit('error', 'Game not found');
    return;
  }
  if (game.players.length >= 2) {
    socket.emit('error', 'Game is full');
    return;
  }
  const player: Player = {
    id: socket.id,
    name: playerName || 'Player 2',
    runsScored: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    oversBowled: 0,
    runsConceded: 0,
    wicketsTaken: 0,
  };
  game.players.push(player);
  socket.join(gameCode);

  // Start the game
  game.isGameActive = true;
  io.to(gameCode).emit('gameUpdate', game);

  // Perform the toss
  performToss(io, gameCode);
};

const performToss = (io: Server, gameCode: string) => {
    const game = games[gameCode];
    if (!game || game.players.length !== 2) return;

    const tossWinnerIndex = Math.round(Math.random());
    const tossLoserIndex = 1 - tossWinnerIndex;
    
    game.batter = game.players[tossWinnerIndex];
    game.bowler = game.players[tossLoserIndex];
    game.isTossDone = true;

    io.to(gameCode).emit('tossResult', { batter: game.batter, bowler: game.bowler });
    io.to(gameCode).emit('gameUpdate', game);
}

// Helper to get the numeric value of a move for scoring
const getNumericValue = (move: number | string): number => {
  if (typeof move === 'number') {
    return move;
  }
  // For '1a', '1b', '1c', return 1 for scoring purposes
  if (move === '1a' || move === '1b' || move === '1c') {
    return 1;
  }
  // For any other unexpected string move, treat as 0 runs
  return 0;
};

// Helper to determine if a move results in an out based on new rules
const isOut = (batterMove: number | string, bowlerMove: number | string): boolean => {
  // Rule 1: 0-0 defensive play is NOT an out
  if (batterMove === 0 && bowlerMove === 0) {
    return false;
  }

  // Rule 2: Matching 2s is a dot ball, not an out by this function
  if (batterMove === 2 && bowlerMove === 2) {
    return false;
  }

  // Rule 3: Exact match (number vs number, or string vs string) results in an out
  if (batterMove === bowlerMove) {
    return true;
  }

  return false;
};

export const makeMove = (io: Server, socket: Socket, gameCode: string, move: number | string) => {
  const game = games[gameCode];
  if (!game || !game.isGameActive) return;

  // Clear previous round's warning
  game.warning = null;

  // Record the move for the current player
  game.moves[socket.id] = move;

  const [player1, player2] = game.players;

  // Wait until both players have made a move
  if (!player1 || !player2 || game.moves[player1.id] === undefined || game.moves[player2.id] === undefined) {
    return;
  }

  // Both players have moved, proceed with game logic
  const batterMove = game.moves[game.batter!.id];
  const bowlerMove = game.moves[game.bowler!.id];

  const currentBatterPlayer = game.players.find(p => p.id === game.batter!.id)!;
  const currentBowlerPlayer = game.players.find(p => p.id === game.bowler!.id)!;

  // --- Over and Bowler Validation ---

  // Reset for new over
  if (game.balls > 0 && game.balls % 6 === 0) {
    game.bowlerMovesInOver = {};
    game.currentOverHistory = [];
  }

  const bowlerMoveCount = game.bowlerMovesInOver[String(bowlerMove)] || 0;

  // Rule: Bowler chose same number 4 times (invalid bowl)
  if (bowlerMoveCount >= 3) {
    currentBatterPlayer.runsScored++;
    game.score++;
    currentBowlerPlayer.runsConceded++;

    game.lastRoundResult = {
      batterMove: '?', // Hide batter's move
      bowlerMove: bowlerMove,
      outcome: `No Ball! Bowler used '${bowlerMove}' 3+ times. +1 run.`
    };
    
    // We don't add to history for a no-ball as it's re-bowled

    game.moves = {}; // Reset for re-bowl
    io.to(gameCode).emit('gameUpdate', game);
    return; // End turn
  }

  // Valid bowl, so record it for the over
  game.bowlerMovesInOver[String(bowlerMove)] = bowlerMoveCount + 1;

  // Rule: Warn bowler on 3rd use of a number
  if (bowlerMoveCount === 2) {
    game.warning = `Warning: Bowler has used '${bowlerMove}' 3 times. They cannot use it again in this over.`;
  }

  // --- Move evaluation ---

  let isPlayerOut = false;

  // Rule: 3 consecutive matching 2s is an out
  if (batterMove === 2 && bowlerMove === 2) {
    game.consecutiveTwos++;
    if (game.consecutiveTwos >= 3) {
      isPlayerOut = true;
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT! (3 consecutive matching 2s)" };
    }
  } else {
    game.consecutiveTwos = 0; // Reset counter if the chain is broken
  }

  // Check for other out conditions
  if (!isPlayerOut && isOut(batterMove, bowlerMove)) {
    isPlayerOut = true;
    game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT!" };
  }

  // --- Process Outcome ---

  if (isPlayerOut) {
    game.out = true;
    currentBowlerPlayer.wicketsTaken++;
    game.consecutiveTwos = 0; // Reset for next batter
    
    // Add the 'out' ball to history
    if (game.lastRoundResult) {
        game.currentOverHistory.push(game.lastRoundResult);
    }

    if (game.inning === 1) {
      game.target = game.score + 1;
      game.inning = 2;
      [game.batter, game.bowler] = [game.bowler, game.batter]; // Swap roles
      game.score = 0;
      game.balls = 0;
      game.out = false;
      game.bowlerMovesInOver = {};
      game.currentOverHistory = []; // Reset for new inning
    } else {
      game.winner = currentBowlerPlayer;
      game.isGameActive = false;
    }
  } else {
    // Not out, update score
    game.balls += 1; // A valid ball has been bowled

    if (batterMove === 2 && bowlerMove === 2) {
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "Dot Ball!" };
      currentBatterPlayer.ballsFaced++;
      currentBowlerPlayer.oversBowled++;
    } else {
      // Standard scoring logic
      const batterNumericMove = getNumericValue(batterMove);
      let runsThisRound = batterNumericMove;
      let outcome = `${runsThisRound} RUNS!`;

      if (batterMove === 6 && bowlerMove === 4) {
        runsThisRound = 4;
        outcome = `Bowler saved 2 runs! 4 RUNS!`;
      } else if (batterMove === 4 && bowlerMove === 6) {
        runsThisRound = 2;
        outcome = `Bowler saved 2 runs! 2 RUNS!`;
      } else if (batterMove === 0 && bowlerMove === 0 && game.score > 0) {
        runsThisRound = -1;
        outcome = "0-0 Defensive Penalty: -1 Run!";
      }

      if (runsThisRound === -1) {
        game.score = Math.max(0, game.score - 1);
        currentBatterPlayer.runsScored = Math.max(0, currentBatterPlayer.runsScored - 1);
      } else {
        game.score += runsThisRound;
        currentBatterPlayer.runsScored += runsThisRound;
      }

      currentBatterPlayer.ballsFaced++;
      if (batterNumericMove === 4) currentBatterPlayer.fours++;
      else if (batterNumericMove === 6) currentBatterPlayer.sixes++;

      currentBowlerPlayer.runsConceded += Math.max(0, runsThisRound);
      currentBowlerPlayer.oversBowled++;

      game.lastRoundResult = { batterMove, bowlerMove, outcome };
    }
    
    // Add the ball to history
    if (game.lastRoundResult) {
        game.currentOverHistory.push(game.lastRoundResult);
    }

    if (game.inning === 2 && game.target !== null && game.score >= game.target) {
      game.winner = currentBatterPlayer;
      game.isGameActive = false;
    }
  }

  // Reset moves for the next round
  game.moves = {};
  io.to(gameCode).emit('gameUpdate', game);
};

export const handleDisconnect = (io: Server, socket: Socket) => {
    // Find the game the user was in
    const gameCode = Object.keys(games).find(gc => games[gc].players.some(p => p.id === socket.id));
    if (gameCode) {
        const game = games[gameCode];
        // If the game was active, the other player wins
        if (game.isGameActive) {
            const remainingPlayer = game.players.find(p => p.id !== socket.id);
            if(remainingPlayer){
                game.winner = remainingPlayer;
                game.isGameActive = false;
                io.to(gameCode).emit('gameUpdate', game);
            }
        }
        // Clean up the game
        delete games[gameCode];
    }
}
