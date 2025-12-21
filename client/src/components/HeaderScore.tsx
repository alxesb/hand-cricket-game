import React from 'react';
import { GameState } from '../types';

interface HeaderScoreProps {
  gameState: GameState;
}

const HeaderScore: React.FC<HeaderScoreProps> = ({ gameState }) => {
  const { score, balls, inning, target, out } = gameState;

  // Calculate overs from total balls
  const overs = Math.floor(balls / 6);
  const remainingBallsInOver = balls % 6;
  const oversDisplay = `${overs}.${remainingBallsInOver}`;

  // This wicket calculation is simplified and assumes 1 wicket per out for the current inning.
  // A more robust system would track individual player outs.
  const wickets = gameState.players.filter(p => p.id !== gameState.batter?.id && p.ballsFaced > 0).length;


  return (
    <div className="header-score">
      <div className="score-main">
        <span className="team-name">BATTERS</span> {/* Placeholder for team name, can be made dynamic later */}
        <span className="total-score">{score}-{wickets}</span>
        <span className="total-overs"> ({oversDisplay} ov)</span>
      </div>
      {inning === 2 && target !== null && (
        <div className="target-display">
          <span>Target: {target}</span>
        </div>
      )}
    </div>
  );
};

export default HeaderScore;
