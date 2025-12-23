import { Server, Socket } from 'socket.io';
import { GameState, Player, RoundResult } from './types';

// In-memory store for games
const games: { [key: string]: GameState } = {};
const AI_PLAYER_ID = 'ai_player_id_xyz';

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const createGame = (io: Server, socket: Socket, playerName: string, overLimit: number | null, isVsAI: boolean) => {
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
    overLimit: overLimit, // Store the over limit
  };
  socket.join(gameCode);

  if (isVsAI) {
    const aiPlayer: Player = {
      id: AI_PLAYER_ID,
      name: 'AI Opponent',
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      oversBowled: 0,
      runsConceded: 0,
      wicketsTaken: 0,
    };
    games[gameCode].players.push(aiPlayer);
    games[gameCode].isGameActive = true; // Start immediately
    io.to(gameCode).emit('gameUpdate', games[gameCode]);
    performToss(io, gameCode, true); // AI game toss auto-handled
  } else {
    socket.emit('gameCreated', games[gameCode]);
  }
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
  performToss(io, gameCode, false);
};

const performToss = (io: Server, gameCode: string, isVsAI: boolean) => {
    const game = games[gameCode];
    if (!game || game.players.length !== 2) return;

    const tossWinnerIndex = Math.round(Math.random());
    const tossWinner = game.players[tossWinnerIndex];
    const tossLoser = game.players[1 - tossWinnerIndex];

    // If AI wins the toss, auto choose
    if (isVsAI && tossWinner.id === AI_PLAYER_ID) {
      const aiChoice: 'bat' | 'bowl' = Math.random() < 0.5 ? 'bat' : 'bowl';
      if (aiChoice === 'bat') {
        game.batter = tossWinner;
        game.bowler = tossLoser;
      } else {
        game.batter = tossLoser;
        game.bowler = tossWinner;
      }
      game.isTossDone = true;
      io.to(gameCode).emit('tossResult', { batter: game.batter, bowler: game.bowler, message: `${tossWinner.name} won the toss and chose to ${aiChoice}.` });
      io.to(gameCode).emit('gameUpdate', game);
      return;
    }

    // Human toss winner chooses
    io.to(tossWinner.id).emit('requestTossChoice', { gameCode, tossWinnerId: tossWinner.id });
    io.to(gameCode).emit('tossResult', { message: `${tossWinner.name} won the toss and is choosing to bat or bowl.` });
    io.to(gameCode).emit('gameUpdate', game);
}

export const chooseTossOption = (io: Server, socket: Socket, gameCode: string, choice: 'bat' | 'bowl') => {
    const game = games[gameCode];
    if (!game) {
        socket.emit('error', 'Game not found.');
        return;
    }

    const tossWinner = game.players.find(p => p.id === socket.id);
    if (!tossWinner && socket.id !== AI_PLAYER_ID) {
        socket.emit('error', 'You are not the toss winner for this game.');
        return;
    }

    const actualTossWinner = tossWinner || game.players.find(p => p.id === AI_PLAYER_ID)!;
    const otherPlayer = game.players.find(p => p.id !== actualTossWinner.id)!;

    if (choice === 'bat') {
        game.batter = actualTossWinner;
        game.bowler = otherPlayer;
    } else {
        game.batter = otherPlayer;
        game.bowler = actualTossWinner;
    }
    game.isTossDone = true;
    io.to(gameCode).emit('tossResult', { batter: game.batter, bowler: game.bowler, message: `${actualTossWinner.name} chose to ${choice}.` });
    io.to(gameCode).emit('gameUpdate', game);
};

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

// Generate a context-aware AI move
const generateAIMove = (game: GameState): number | string => {
  const possibleMoves: (number | string)[] = [0, 1, '1a', '1b', '1c', 2, 3, 4, 6, '6B'];
  const totalBallsForOverLimit = game.overLimit !== null ? game.overLimit * 6 : Infinity;
  const ballsRemainingInGame = totalBallsForOverLimit - game.balls;
  const runsToWin = game.target !== null ? game.target - game.score : Infinity;

  const currentBatter = game.batter ? game.players.find(p => p.id === game.batter!.id) : null;
  const currentBowler = game.bowler ? game.players.find(p => p.id === game.bowler!.id) : null;

  // Defensive helper to respect bowler move caps
  const availableBowlingMoves = possibleMoves.filter(m => {
    const moveCount = game.bowlerMovesInOver[String(m)] || 0;
    return m === 2 || moveCount < 3;
  });

  // AI batting logic
  if (currentBatter?.id === AI_PLAYER_ID) {
    // Endgame chase: last ball, need runs
    if (game.inning === 2 && ballsRemainingInGame <= 1 && runsToWin > 0) {
      return runsToWin <= 4 ? 4 : 6;
    }
    // Chasing and need acceleration
    if (game.inning === 2 && game.target !== null && runsToWin > 12) {
      return ['6B', 6, 4, 3][Math.floor(Math.random() * 4)];
    }
    // Setting a target or early innings: balanced aggression
    if (game.inning === 1 || runsToWin > 6) {
      return [6, 4, 3, '6B', 2, 1][Math.floor(Math.random() * 6)];
    }
    // Close finish: keep it low-risk
    return [1, '1a', '1b', '1c', 2, 0][Math.floor(Math.random() * 6)];
  }

  // AI bowling logic
  if (currentBowler?.id === AI_PLAYER_ID) {
    // Critical defense: prioritize outs
    const critical = game.inning === 2 && game.target !== null && (runsToWin <= 12 || ballsRemainingInGame <= 6);
    const predicted = [1, 2, 3, 4, 6, '1a', '1b', '1c', '6B'][Math.floor(Math.random() * 9)];

    // Try to match predicted for wicket
    if (availableBowlingMoves.includes(predicted) && Math.random() < (critical ? 0.6 : 0.4)) {
      return predicted;
    }

    // Penalize 0-0 if batter has runs
    if (currentBatter && currentBatter.runsScored > 0 && availableBowlingMoves.includes(0) && Math.random() < 0.25) {
      return 0;
    }

    // Default defensive mix
    const defensive = [2, 0, 3, 1];
    const filtered = defensive.filter(m => availableBowlingMoves.includes(m));
    if (filtered.length > 0) {
      return filtered[Math.floor(Math.random() * filtered.length)];
    }
    return availableBowlingMoves[Math.floor(Math.random() * availableBowlingMoves.length)];
  }

  // Fallback
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  return possibleMoves[randomIndex];
};

export const makeMove = (io: Server, socket: Socket, gameCode: string, move: number | string) => {
  const game = games[gameCode];
  if (!game || !game.isGameActive || !game.isTossDone || !game.batter || !game.bowler) return;

  // Clear previous round's warning
  game.warning = null;

  const currentBatterPlayer = game.players.find(p => p.id === game.batter.id)!;
  const currentBowlerPlayer = game.players.find(p => p.id === game.bowler.id)!;

  // Record the move for the current player
  game.moves[socket.id] = move;

  // If AI needs to play, generate its move
  if (currentBatterPlayer.id === AI_PLAYER_ID && game.moves[AI_PLAYER_ID] === undefined) {
    game.moves[AI_PLAYER_ID] = generateAIMove(game);
  }
  if (currentBowlerPlayer.id === AI_PLAYER_ID && game.moves[AI_PLAYER_ID] === undefined) {
    game.moves[AI_PLAYER_ID] = generateAIMove(game);
  }

  // Wait until both batter and bowler have made a move
  if (game.moves[currentBatterPlayer.id] === undefined || game.moves[currentBowlerPlayer.id] === undefined) {
    return;
  }

  // Both players have moved, proceed with game logic
  const batterMove = game.moves[currentBatterPlayer.id];
  const bowlerMove = game.moves[currentBowlerPlayer.id];

  // --- Over and Bowler Validation ---

  // Reset for new over (before this ball is counted)
  if (game.balls > 0 && game.balls % 6 === 0) {
    game.bowlerMovesInOver = {};
    game.currentOverHistory = [];
  }

  const bowlerMoveCount = game.bowlerMovesInOver[String(bowlerMove)] || 0;

  // Apply bowler move restriction ONLY if bowlerMove is not 2
  if (bowlerMove !== 2) {
    if (bowlerMoveCount >= 3) {
      currentBatterPlayer.runsScored++;
      game.score++;
      currentBowlerPlayer.runsConceded++;
      game.lastRoundResult = { batterMove: '?', bowlerMove, outcome: `No Ball! Bowler used '${bowlerMove}' 3+ times. +1 run.` };
      game.moves = {};
      io.to(gameCode).emit('gameUpdate', game);
      return; // End turn, no ball is recorded
    }
    game.bowlerMovesInOver[String(bowlerMove)] = bowlerMoveCount + 1;
    if (bowlerMoveCount === 2) {
      game.warning = `Warning: Bowler has used '${bowlerMove}' 3 times. They cannot use it again in this over.`;
    }
  }

  let isPlayerOut = false;
  
  // --- Move Evaluation Logic ---
  if (batterMove === '6B') {
    if (bowlerMove === 0) {
      isPlayerOut = true;
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT! 6B backfired!" };
    } else if (bowlerMove === 6) {
      const runsThisRound = 6;
      game.score += runsThisRound;
      currentBatterPlayer.runsScored += runsThisRound;
      currentBatterPlayer.sixes++;
      currentBowlerPlayer.runsConceded += runsThisRound;
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "SIX! 6B successful!" };
    } else {
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "Dot Ball! 6B defended." };
    }
  } else if (batterMove === 2 && bowlerMove === 2) {
    game.consecutiveTwos++;
    if (game.consecutiveTwos >= 3) {
      isPlayerOut = true;
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT! (3 consecutive matching 2s)" };
    } else {
      game.lastRoundResult = { batterMove, bowlerMove, outcome: "Dot Ball!" };
    }
  } else if (isOut(batterMove, bowlerMove)) {
    isPlayerOut = true;
    game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT!" };
  } else {
    // Standard Scoring for non-special cases
    game.consecutiveTwos = 0;
    const batterNumericMove = getNumericValue(batterMove);
    const bowlerNumericMove = getNumericValue(bowlerMove);
    let runsThisRound = batterNumericMove;
    let outcome = `${runsThisRound} RUNS!`;

    if (batterMove === 6 && bowlerMove === 4) { runsThisRound = 4; outcome = `Bowler saved 2 runs! 4 RUNS!`; }
    else if (batterMove === 4 && bowlerMove === 6) { runsThisRound = 2; outcome = `Bowler saved 2 runs! 2 RUNS!`; }
    else if (batterMove === 3 && bowlerNumericMove === 1) { runsThisRound = 1; outcome = `Bowler saved 2 runs! 1 RUN!`; }
    else if (batterMove === 0 && bowlerMove === 0 && game.score > 0) { runsThisRound = -1; outcome = "0-0 Defensive Penalty: -1 Run!"; }

    if (runsThisRound === -1) {
      game.score = Math.max(0, game.score - 1);
      currentBatterPlayer.runsScored = Math.max(0, currentBatterPlayer.runsScored - 1);
    } else {
      game.score += runsThisRound;
      currentBatterPlayer.runsScored += runsThisRound;
    }

    // Update boundary stats based on the FINAL runs scored
    if (runsThisRound === 4) currentBatterPlayer.fours++;
    else if (runsThisRound === 6) currentBatterPlayer.sixes++;
    
    currentBowlerPlayer.runsConceded += Math.max(0, runsThisRound);
    game.lastRoundResult = { batterMove, bowlerMove, outcome };
  }

  // --- Post-Evaluation State Update ---
  // Increment ball count if the batter is not out or if it's the end of the over limit
  const totalBallsForOverLimit = game.overLimit !== null ? game.overLimit * 6 : Infinity;
  if (!isPlayerOut || game.balls + 1 >= totalBallsForOverLimit) {
      game.balls += 1;
  }
  
  currentBatterPlayer.ballsFaced++;
  currentBowlerPlayer.oversBowled++;

  // Add the result of the ball to history *before* potential state reset
  if (game.lastRoundResult) {
    game.currentOverHistory.push(game.lastRoundResult);
  }

  // --- Check for End of Inning/Game ---
  let inningEnded = false;
  let gameEnded = false;

  // Conditions for Inning 1 ending
  if (game.inning === 1) {
    if (isPlayerOut || game.balls >= totalBallsForOverLimit) {
      inningEnded = true;
    }
  } 
  // Conditions for Inning 2 ending
  else if (game.inning === 2) {
    if (isPlayerOut || game.balls >= totalBallsForOverLimit || game.score >= game.target!) {
      inningEnded = true;
      gameEnded = true;
    }
  }

  if (inningEnded) {
    // If it's the end of the first inning, set up for the second
    if (game.inning === 1 && !gameEnded) {
      game.target = game.score + 1;
      game.inning = 2;
      [game.batter, game.bowler] = [game.bowler, game.batter]; // Swap roles
      // Reset stats for the new inning
      game.score = 0;
      game.balls = 0;
      game.out = false;
      game.bowlerMovesInOver = {};
      game.currentOverHistory = [];
      game.consecutiveTwos = 0;
    } 
    // If the game has ended, determine the winner
    else if (gameEnded) {
      if (game.score >= game.target!) {
        game.winner = currentBatterPlayer; // Batter wins by chasing target
      } else if (game.score === game.target! - 1) {
        game.winner = null; // It's a draw
      } else {
        game.winner = currentBowlerPlayer; // Bowler wins by defending
      }
      game.isGameActive = false; // Game is no longer active
    }
  }
  
  // Set game.out state based on if current batter was out this turn
  game.out = isPlayerOut; 

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
