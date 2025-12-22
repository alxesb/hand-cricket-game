import React from 'react';
import { GameState } from '../types';

interface HeaderScoreProps {
  gameState: GameState;
  onToggleScorecard: () => void;
}

const HeaderScore: React.FC<HeaderScoreProps> = ({ gameState, onToggleScorecard }) => {
  const { score, balls, inning, target, batter, bowler } = gameState;

  // Calculate overs from total balls
  const overs = Math.floor(balls / 6);
  const remainingBallsInOver = balls % 6;
  const oversDisplay = `${overs}.${remainingBallsInOver}`;

  // Wickets are the wickets taken by the current bowler in this inning.
  const wickets = bowler?.wicketsTaken || 0;

  return (
    <div className="header-score">
      <div className="score-main">
        {/* Use the current batter's name as the team name */}
        <span className="team-name">{batter?.name.toUpperCase()}</span>
        <span className="total-score">{score}-{wickets}</span>
        <span className="total-overs"> ({oversDisplay} ov)</span>
      </div>
      {inning === 2 && target !== null && (
        <div className="target-display">
          <span>Target: {target}</span>
        </div>
      )}
      <button onClick={onToggleScorecard} className="scorecard-toggle-btn">Full Scorecard</button>
    </div>
  );
};

export default HeaderScore;
