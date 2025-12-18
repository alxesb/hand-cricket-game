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
    });

    socket.on('gameUpdate', (game: GameState) => {
      setGameState(game);
      setHasMadeMove(false); // Reset move status for the new round
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

  return (
    <div className="App">
      {!gameState || !gameState.isGameActive ? (
        <Lobby
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          gameCode={gameState?.gameCode || null}
        />
      ) : (
        socket && <GameScreen
          gameState={gameState}
          currentPlayerId={socket.id}
          onMoveSelect={handleMoveSelect}
          hasMadeMove={hasMadeMove}
        />
      )}
    </div>
  );
}

export default App;