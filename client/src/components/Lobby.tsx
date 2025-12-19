import React, { useState } from 'react';

interface LobbyProps {
  onCreateGame: () => void;
  onJoinGame: (gameCode: string) => void;
  gameCode: string | null;
  playerName: string; // New prop
  setPlayerName: (name: string) => void; // New prop
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame, gameCode, playerName, setPlayerName }) => {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="lobby">
      <h1>HCG</h1>
      <div className="card">
        <h2>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={15} // Limit name length
        />
      </div>
      <div className="card">
        <h2>Create Game</h2>
        <p>Start a new game and invite a friend.</p>
        <button onClick={onCreateGame} disabled={!playerName}>Create New Game</button>
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
        <button onClick={() => onJoinGame(joinCode)} disabled={!joinCode || !playerName}>
          Join Game
        </button>
      </div>
    </div>
  );
};

export default Lobby;
