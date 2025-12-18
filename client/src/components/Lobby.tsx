import React, { useState } from 'react';

interface LobbyProps {
  onCreateGame: () => void;
  onJoinGame: (gameCode: string) => void;
  gameCode: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame, gameCode }) => {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="lobby">
      <h1>HCG</h1>
      <div className="card">
        <h2>Create Game</h2>
        <p>Start a new game and invite a friend.</p>
        <button onClick={onCreateGame}>Create New Game</button>
        {gameCode && (
          <div className="game-code-display">
            <p>Share this code with your friend:</p>
            <code>{gameCode}</code>
          </div>
        )}
      </div>
      <div className="card">
        <h2>Join Game</h2>
        <p>Enter a code to join an existing game.</p>
        <input
          type="text"
          placeholder="Enter Game Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        <button onClick={() => onJoinGame(joinCode)} disabled={!joinCode}>
          Join Game
        </button>
      </div>
    </div>
  );
};

export default Lobby;
