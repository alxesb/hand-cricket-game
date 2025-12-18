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

  const getPlayerName = (player: Player | null) => {
    if (!player) return '';
    return player.id === currentPlayerId ? 'You' : 'Opponent';
  };

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

  return (
    <div className="scorecard">
      <h2>Scorecard</h2>
      {inning === 2 && target && <p className="target">Target: {target}</p>}
      
      <div className="score-details">
        <p>
          <span className="score">{score}</span>
          <span className="balls"> ({balls} balls)</span>
        </p>
      </div>

      <div className="player-roles">
        <p><strong>Batting:</strong> {getPlayerName(batter)}</p>
        <p><strong>Bowling:</strong> {getPlayerName(bowler)}</p>
      </div>

      {lastRoundResult && (
        <div className="last-round">
          <p><strong>Last Round:</strong></p>
          <p>
            {getPlayerName(batter)} chose: {getNumericDisplayValue(lastRoundResult.batterMove)} <br />
            {getPlayerName(bowler)} chose: {getNumericDisplayValue(lastRoundResult.bowlerMove)}
          </p>
          <p className="outcome">{lastRoundResult.outcome}</p>
        </div>
      )}
      
      {winner && (
        <div className="winner-announcement">
            <h2>Game Over!</h2>
            <p>{getPlayerName(winner)} wins!</p>
        </div>
      )}
    </div>
  );
};

export default Scorecard;
