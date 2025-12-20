import React from 'react';
import { GameState, Player } from '../types';

interface ScorecardProps {
  gameState: GameState;
  currentPlayerId: string;
}

const Scorecard: React.FC<ScorecardProps> = ({ gameState, currentPlayerId }) => {
  const {
    score,
    balls,
    inning,
    target,
    batter,
    bowler,
    lastRoundResult,
    winner,
    players,
  } = gameState;

  // Helper to get the numeric value of a move for display purposes
  const getNumericDisplayValue = (move: number | string): number => {
    if (typeof move === 'number') {
      return move;
    }
    if (move === '1a' || move === '1b' || move === '1c') {
      return 1;
    }
    return 0; // Fallback for unexpected string moves
  };

  const getPlayerDisplayName = (player: Player | null) => {
    if (!player) return '';
    return player.name + (player.id === currentPlayerId ? ' (You)' : '');
  }

  return (
    <div className="scorecard">
      <h2>Scorecard</h2>
      {inning === 2 && target && <p className="target">Target: {target}</p>}
      
      <div className="score-details">
        <p>
          {batter && <span className="batter-name-on-score">{batter.name}* </span>}
          <span className="score">{score}</span>
          <span className="balls"> ({balls} balls)</span>
        </p>
        {inning === 2 && target !== null && (
          <p className="runs-to-win">Runs to win: {target - score}</p>
        )}
      </div>

      <div className="player-roles">
        <p><strong>Batting:</strong> {getPlayerDisplayName(batter)}</p>
        <p><strong>Bowling:</strong> {getPlayerDisplayName(bowler)}</p>
      </div>

      {winner && (
        <div className="winner-announcement">
            <h2>Game Over!</h2>
            <p>{getPlayerDisplayName(winner)} wins!</p>
        </div>
      )}
    </div>
  );
};

export default Scorecard;
