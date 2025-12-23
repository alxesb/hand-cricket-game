import React, { useState } from 'react';
import Instructions from './Instructions';

interface LobbyProps {
  onCreateGame: (overLimit: number | null, isVsAI: boolean) => void;
  onJoinGame: (gameCode: string) => void;
  gameCode: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateGame, onJoinGame, gameCode, playerName, setPlayerName }) => {
  const [joinCode, setJoinCode] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [overs, setOvers] = useState<number>(5);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  const handleCreateGame = (isAI: boolean) => {
    // Pass null for unlimited overs, or the selected number, and the isVsAI flag
    onCreateGame(isUnlimited ? null : overs, isAI);
  };

  return (
    <div className="lobby">
      {showInstructions && <Instructions onClose={() => setShowInstructions(false)} />}

      <div className="lobby-header">
        <h1>HCG</h1>
        <button onClick={() => setShowInstructions(true)} className="instructions-btn">How to Play</button>
      </div>

      <div className="card">
        <h2>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={15}
        />
      </div>
      <div className="card">
        <h2>Game Settings</h2>
        <div className="game-settings-row">
          <label htmlFor="overs-input">Overs per side:</label>
          <input
            id="overs-input"
            type="number"
            min="1"
            max="20"
            value={overs}
            onChange={(e) => setOvers(Math.max(1, Math.min(20, Number(e.target.value))))}
            disabled={isUnlimited}
            className="overs-input"
          />
        </div>
        <div className="game-settings-row">
          <label htmlFor="unlimited-checkbox">
            <input
              id="unlimited-checkbox"
              type="checkbox"
              checked={isUnlimited}
              onChange={(e) => setIsUnlimited(e.target.checked)}
            />{' '}
            Unlimited Overs
          </label>
        </div>
      </div>
      <div className="card">
        <h2>Game with AI</h2>
        <p>Challenge the computer in a solo match.</p>
        <button onClick={() => handleCreateGame(true)} disabled={!playerName}>
          Start AI Game
        </button>
      </div>
      <div className="card">
        <h2>Create Game</h2>
        <p>Start a new game and invite a friend.</p>
        <button onClick={() => handleCreateGame(false)} disabled={!playerName}>
          Create New Game
        </button>
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
