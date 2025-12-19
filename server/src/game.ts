import { Server, Socket } from 'socket.io';
import { GameState, Player } from './types';

// In-memory store for games
const games: { [key: string]: GameState } = {};

const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const createGame = (io: Server, socket: Socket, playerName: string) => {
  const gameCode = generateGameCode();
  const player: Player = { id: socket.id, name: playerName || 'Player 1' };
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
  const player: Player = { id: socket.id, name: playerName || 'Player 2' };
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

  // Rule 2: Exact match (number vs number, or string vs string) results in an out
  if (batterMove === bowlerMove) {
    return true;
  }

  return false;
};

export const makeMove = (io: Server, socket: Socket, gameCode: string, move: number | string) => {
  const game = games[gameCode];
  if (!game || !game.isGameActive) return;

  // Record the move
  game.moves[socket.id] = move;

  const [player1, player2] = game.players;

  // Ensure both players are present before processing moves
  if (!player1 || !player2) {
    return;
  }

  if (game.moves[player1.id] !== undefined && game.moves[player2.id] !== undefined) {
    // Both players have made a move, process the round
    const batterMove = game.moves[game.batter!.id];
    const bowlerMove = game.moves[game.bowler!.id];

    if (isOut(batterMove, bowlerMove)) {
        // OUT
        game.out = true;
        game.lastRoundResult = { batterMove, bowlerMove, outcome: "OUT!" };
        if(game.inning === 1){
            // First inning over, switch roles
            game.target = game.score + 1;
            game.inning = 2;
            [game.batter, game.bowler] = [game.bowler, game.batter];
            game.score = 0;
            game.balls = 0;
            game.out = false;
        } else {
            // Second inning over, bowler wins
            game.winner = game.bowler;
            game.isGameActive = false;
        }

    } else {
        // Not out, update score
        const batterNumericMove = getNumericValue(batterMove);
        
        // Handle 0-0 defensive play penalty
        if (batterMove === 0 && bowlerMove === 0 && game.score > 0) {
            game.score = Math.max(0, game.score - 1); // Reduce score by 1, minimum 0
            game.lastRoundResult = { batterMove, bowlerMove, outcome: "0-0 Defensive Penalty: -1 Run!" };
        } else {
            game.score += batterNumericMove;
            game.balls += 1;
            game.lastRoundResult = { batterMove, bowlerMove, outcome: `${batterNumericMove} RUNS!` };
        }

        if(game.inning === 2 && game.score >= game.target!){
            // Batter wins
            game.winner = game.batter;
            game.isGameActive = false;
        }
    }

    // Reset moves for the next round
    game.moves = {};
    
    io.to(gameCode).emit('gameUpdate', game);
  }
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
