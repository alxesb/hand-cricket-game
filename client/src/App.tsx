import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';
import DetailedScorecard from './components/DetailedScorecard';
import TossChoice from './components/TossChoice'; // Import TossChoice
import { GameState, Player } from './types';
import './App.css';

const SERVER_URL = 'https://hand-cricket-server.onrender.com';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasMadeMove, setHasMadeMove] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [playerName, setPlayerName] = useState<string>('');
  const [tossWinnerId, setTossWinnerId] = useState<string | null>(null);

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
      console.log('gameUpdate received', game);
      setGameState(game);
      setHasMadeMove(false); // Reset move status for the new round

      // Determine whether to show the lobby based on game state
      if (game.isGameActive || (!game.isGameActive && game.winner)) {
        setShowLobby(false); // Game is active or game over with a winner, hide lobby
      } else {
        setShowLobby(true); // Game not active and no winner (e.g., waiting for player 2, or game deleted), show lobby
      }
    });

    socket.on('tossResult', ({ batter, bowler, message }: { batter?: Player, bowler?: Player, message?: string }) => {
        if(batter && bowler){
            // If batter and bowler are defined, the choice has been made
            setTimeout(() => {
                setGameState(prev => ({...prev!, batter, bowler, isTossDone: true, warning: message || null}));
                setTossWinnerId(null); // Clear toss winner once roles are set
            }, 2000)
        } else if (message) {
            // Only a message, meaning toss winner is still choosing
            setGameState(prev => ({...prev!, warning: message}));
        }
    });

    socket.on('requestTossChoice', ({ gameCode, tossWinnerId }: { gameCode: string, tossWinnerId: string }) => {
        setTossWinnerId(tossWinnerId);
        // Display a message to all players (handled by gameUpdate/tossResult message)
    });

    socket.on('error', (message: string) => {
      alert(`Error: ${message}`);
    });

  }, [socket, gameState]);


  const handleCreateGame = (overLimit: number | null, isVsAI: boolean) => {
    socket?.emit('createGame', playerName, overLimit, isVsAI); // Pass player name, overLimit AND isVsAI
  };

  const handleJoinGame = (gameCode: string) => {
    if (gameCode) {
      socket?.emit('joinGame', { gameCode, playerName }); // Pass player name
    }
  };

  const handleMoveSelect = (move: number | string) => {
    if (gameState) {
      socket?.emit('makeMove', { gameCode: gameState.gameCode, move });
      setHasMadeMove(true);
    }
  };

  const handleTossChoice = (choice: 'bat' | 'bowl') => {
    if (gameState) {
      socket?.emit('chooseTossOption', { gameCode: gameState.gameCode, choice });
      setTossWinnerId(null); // Clear the toss winner ID once choice is made
    }
  };

  const handlePlayAgain = () => {
    setGameState(null);
    setShowLobby(true);
    setPlayerName(''); // Reset player name on play again
  }

  // --- Conditional Rendering ---

  // If a toss winner is set and it's the current player, show the toss choice screen
  if (tossWinnerId && socket?.id === tossWinnerId && gameState) {
    const tossWinner = gameState.players.find(p => p.id === tossWinnerId);
    if (tossWinner) {
      return <TossChoice onChoose={handleTossChoice} tossWinnerName={tossWinner.name} />;
    }
  }


  if (showLobby || !gameState?.gameCode) {
    return (
      <Lobby
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        gameCode={gameState?.gameCode || null}
        playerName={playerName} // Pass playerName to Lobby
        setPlayerName={setPlayerName} // Pass setPlayerName to Lobby
      />
    );
  }

  if (!gameState.isGameActive && gameState.winner) {
    return (
      <DetailedScorecard
        title="Match Summary"
        gameState={gameState}
        currentPlayerId={socket?.id || ''}
        onPlayAgain={handlePlayAgain}
      />
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