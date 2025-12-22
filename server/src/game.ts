import { Server, Socket } from 'socket.io';
import { GameState, Player, RoundResult } from './types';

// In-memory store for games
const games: { [key: string]: GameState } = {};

const AI_PLAYER_ID = 'ai_player_id_xyz'; // Unique ID for the AI player

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const createGame = (io: Server, socket: Socket, playerName: string, overLimit: number | null, isVsAI: boolean) => {
  const gameCode = generateGameCode();
  const humanPlayer: Player = {
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
    players: [humanPlayer],
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
    games[gameCode].isGameActive = true; // AI game starts immediately
    io.to(gameCode).emit('gameUpdate', games[gameCode]);
    performToss(io, gameCode); // Perform toss immediately for AI game
  } else {
    io.to(gameCode).emit('gameCreated', games[gameCode]);
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

  // If this is a human vs human game and the second player has joined, perform toss.
  // For AI games, toss is performed immediately after AI player is added in createGame.
  if (!game.players.some(p => p.id === AI_PLAYER_ID) && game.players.length === 2) {
    performToss(io, gameCode);
  }
};

const performToss = (io: Server, gameCode: string) => {
    const game = games[gameCode];
    if (!game || game.players.length !== 2) return;

    const tossWinnerIndex = Math.round(Math.random());
    const tossWinner = game.players[tossWinnerIndex];
    const tossLoser = game.players[1 - tossWinnerIndex];
    
    // If AI wins the toss, it makes a choice automatically
    if (tossWinner.id === AI_PLAYER_ID) {
        const aiChoice: 'bat' | 'bowl' = Math.random() < 0.5 ? 'bat' : 'bowl'; // 50/50 bat or bowl
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
    } else {
        // Human player won the toss, emit event to them to choose
        io.to(tossWinner.id).emit('requestTossChoice', { gameCode, tossWinnerId: tossWinner.id });
        io.to(gameCode).emit('tossResult', { message: `${tossWinner.name} won the toss and is choosing to bat or bowl.` });
        io.to(gameCode).emit('gameUpdate', game);
    }
}

export const chooseTossOption = (io: Server, socket: Socket, gameCode: string, choice: 'bat' | 'bowl') => {
    const game = games[gameCode];
    if (!game) {
        socket.emit('error', 'Game not found.');
        return;
    }

    const tossWinner = game.players.find(p => p.id === socket.id);
    if (!tossWinner && socket.id !== AI_PLAYER_ID) { // Allow AI to make choice via internal call
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

// Function to generate a move for the AI player
const generateAIMove = (game: GameState): number | string => {
  const possibleMoves: (number | string)[] = [0, 1, '1a', '1b', '1c', 2, 3, 4, 6]; 
  
  const currentBatter = game.players.find(p => p.id === game.batter!.id);
  const currentBowler = game.players.find(p => p.id === game.bowler!.id);
  const totalBallsForOverLimit = game.overLimit !== null ? game.overLimit * 6 : Infinity;
  const ballsRemainingInGame = totalBallsForOverLimit - game.balls;
  const runsToWin = game.target !== null ? game.target - game.score : Infinity;

  // If AI is batting
  if (currentBatter?.id === AI_PLAYER_ID) {
    // If it's the last ball of the game and AI needs 1 or more run to win, try a 6 or 4
    if (game.inning === 2 && ballsRemainingInGame === 1 && runsToWin > 0) {
        return [6, 4][Math.floor(Math.random() * 2)];
    }
    // Aggressive batting if chasing a target and runs are needed, or setting a target
    if (game.inning === 1 || (game.inning === 2 && game.target && (runsToWin > 20 || (runsToWin > 10 && ballsRemainingInGame > 6)))) {
      const aggressiveMoves = [6, 4, 3, '6B']; // Include 6B as a risky aggressive move
      return aggressiveMoves[Math.floor(Math.random() * aggressiveMoves.length)];
    } 
    // Defensive batting if target is close or few balls left, or just to rotate strike
    else {
      const defensiveMoves = [1, '1a', '1b', '1c', 2, 0];
      return defensiveMoves[Math.floor(Math.random() * defensiveMoves.length)];
    }
  } 
  // If AI is bowling
  else if (currentBowler?.id === AI_PLAYER_ID) {
    // Try to get the batter out - simple prediction: assume human will play 1, 2, 3, 4, 6
    const humanLikelyMoves = [1, 2, 3, 4, 6, '1a', '1b', '1c', '6B'];
    const predictedHumanMove = humanLikelyMoves[Math.floor(Math.random() * humanLikelyMoves.length)];

    // Check bowler move restrictions
    const availableMovesForBowler = possibleMoves.filter(m => {
        const moveCount = game.bowlerMovesInOver[String(m)] || 0;
        return (m === 2 || moveCount < 3); // 2 has no restriction
    });

    // If batter's score is > 0 and AI can play 0, try to penalize if human also plays 0
    if (currentBatter!.runsScored > 0 && availableMovesForBowler.includes(0) && Math.random() < 0.3) { // 30% chance to try 0 for penalty
        return 0;
    }

    // Strategy: Try to get out, otherwise bowl defensively
    // If it's a critical moment (e.g., last over, close target), try harder for out
    const isCriticalBowlingMoment = game.inning === 2 && game.target && (runsToWin <= 10 || ballsRemainingInGame <= 6);
    const outAttemptChance = isCriticalBowlingMoment ? 0.6 : 0.4; // Higher chance to go for out in critical moments

    if (Math.random() < outAttemptChance && availableMovesForBowler.includes(predictedHumanMove)) {
        return predictedHumanMove;
    } else {
        const defensiveBowlingMoves = [0, 2, 3, 1]; // Prioritize 0, 2 for dot balls
        const filteredDefensiveMoves = defensiveBowlingMoves.filter(m => availableMovesForBowler.includes(m));
        return filteredDefensiveMoves.length > 0 ? filteredDefensiveMoves[Math.floor(Math.random() * filteredDefensiveMoves.length)] : availableMovesForBowler[Math.floor(Math.random() * availableMovesForBowler.length)];
    }
  }

  // Fallback to random if no specific strategy applies (shouldn't happen with above logic)
  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  return possibleMoves[randomIndex];
};

export const makeMove = (io: Server, socket: Socket, gameCode: string, move: number | string) => {
  const game = games[gameCode];
  if (!game || !game.isGameActive || !game.isTossDone) return; // Ensure toss is done

  // Clear previous round's warning
  game.warning = null;

  const currentBatterPlayer = game.players.find(p => p.id === game.batter!.id)!;
  const currentBowlerPlayer = game.players.find(p => p.id === game.bowler!.id)!;

  // Human player's move
  game.moves[socket.id] = move;

  // Check if AI needs to make a move
  if (currentBatterPlayer.id === AI_PLAYER_ID && !game.moves[AI_PLAYER_ID]) {
    game.moves[AI_PLAYER_ID] = generateAIMove(game);
  } else if (currentBowlerPlayer.id === AI_PLAYER_ID && !game.moves[AI_PLAYER_ID]) {
    game.moves[AI_PLAYER_ID] = generateAIMove(game);
  }

  // Ensure both players have made a move (human and/or AI)
  if (!game.moves[currentBatterPlayer.id] || !game.moves[currentBowlerPlayer.id]) {
      return; // Still waiting for a move
  }
