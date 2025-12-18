import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import { GameState } from './types';
import './App.css';

const SERVER_URL = 'https://hand-cricket-server.onrender.com';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasMadeMove, setHasMadeMove] = useState(false);
  const [showLobby, setShowLobby] = useState(true);

  // Establish socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('gameCreated', (game: GameState) => {
      setGameState(game);
      // setShowLobby(false); - Removed this line to keep lobby visible for game code
    });

    socket.on('gameUpdate', (game: GameState) => {
      setGameState(game);
      setHasMadeMove(false); // Reset move status for the new round

      // Determine whether to show the lobby based on game state
      if (game.isGameActive || (!game.isGameActive && game.winner)) {
        setShowLobby(false); // Game is active or game over with a winner, hide lobby
      } else {
        setShowLobby(true); // Game not active and no winner (e.g., waiting for player 2, or game deleted), show lobby
      }
    });

    socket.on('tossResult', ({ batter, bowler }) => {
        if(gameState){
            // Use a timeout to give a feeling of suspense
            setTimeout(() => {
                setGameState(prev => ({...prev!, batter, bowler, isTossDone: true}));
            }, 2000)
        }
    });

    socket.on('error', (message: string) => {
      alert(`Error: ${message}`);
    });

  }, [socket, gameState]);

  const handleCreateGame = () => {
    socket?.emit('createGame');
  };

  const handleJoinGame = (gameCode: string) => {
    if (gameCode) {
      socket?.emit('joinGame', gameCode);
    }
  };

  const handleMoveSelect = (move: number) => {
    if (gameState) {
      socket?.emit('makeMove', { gameCode: gameState.gameCode, move });
      setHasMadeMove(true);
    }
  };

  const handlePlayAgain = () => {
    setGameState(null);
    setShowLobby(true);
  }

  if (showLobby || !gameState?.gameCode) {
    return (
      <Lobby
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        gameCode={gameState?.gameCode || null}
      />
    );
  }

  if (!gameState.isGameActive && gameState.winner) {
    return (
      <div className="App game-over-screen">
        <h2>Game Over!</h2>
        <h3>{gameState.winner.name} won!</h3>
        <button onClick={handlePlayAgain}>Play Again</button>
      </div>
    );
  }

  return (
    socket && <GameScreen
      gameState={gameState}
      currentPlayerId={socket.id || ''}
      onMoveSelect={handleMoveSelect}
      hasMadeMove={hasMadeMove}
    />
  );
}

export default App;