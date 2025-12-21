import React from 'react';
import { GameState } from '../types';

interface InningBreakdownProps {
  gameState: GameState;
  onContinue: () => void;
}

const InningBreakdown: React.FC<InningBreakdownProps> = ({ gameState, onContinue }) => {
  const { target, players } = gameState;
  
  // The player who is NOT the current batter is the one who just finished their inning.
  const firstInningPlayer = players.find(p => p.id !== gameState.batter?.id);

  return (
    <div className="inning-breakdown-overlay">
      <div className="inning-breakdown-card card">
        <h2>Inning Complete</h2>
        {firstInningPlayer && (
          <p className="inning-summary">
            {firstInningPlayer.name} scored <strong>{firstInningPlayer.runsScored}</strong> runs.
          </p>
        )}
        <h3 className="target-announcement">Target: {target}</h3>
        <button onClick={onContinue}>Start Next Inning</button>
      </div>
    </div>
  );
};

export default InningBreakdown;
