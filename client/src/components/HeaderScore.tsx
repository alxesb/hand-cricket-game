import React from 'react';
import { GameState } from '../types';
import { calculateRunRate } from '../utils/stats';

interface HeaderScoreProps {
  gameState: GameState;
  onToggleScorecard: () => void;
  onToggleInstructions: () => void;
}

const HeaderScore: React.FC<HeaderScoreProps> = ({ gameState, onToggleScorecard, onToggleInstructions }) => {
  const { score, balls, inning, target, batter, bowler, overLimit } = gameState;

  // Calculate overs from total balls
  const overs = Math.floor(balls / 6);
  const remainingBallsInOver = balls % 6;
  const oversDisplay = `${overs}.${remainingBallsInOver}`;
  
  const overLimitDisplay = overLimit !== null ? `/${overLimit}` : '';

  // Wickets are the wickets taken by the current bowler in this inning.
  const wickets = bowler?.wicketsTaken || 0;

  const runRate = calculateRunRate(score, balls);
  const totalBallsForOverLimit = overLimit !== null ? overLimit * 6 : null;
  const ballsRemaining = totalBallsForOverLimit !== null ? Math.max(totalBallsForOverLimit - balls, 0) : null;
  const runsToWin = inning === 2 && target !== null ? target - score : null;

  return (
    <div className="header-score">
      <div className="score-main">
        {/* Use the current batter's name as the team name */}
        <span className="team-name">{batter?.name.toUpperCase()}</span>
        <span className="total-score">{score}-{wickets}</span>
        <span className="total-overs"> ({oversDisplay}{overLimitDisplay} ov)</span>
      </div>
      <div className="extra-stats">
        <div className="run-rate-display">
            <span>CRR: {runRate}</span>
        </div>
        {inning === 2 && target !== null && (
          <>
            <div className="target-display">
              <span>Target: {target}</span>
            </div>
            {runsToWin !== null && runsToWin > 0 && ballsRemaining !== null && (
              <div className="target-display">
                <span>{batter?.name} needs {runsToWin} runs from {ballsRemaining} balls to win</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="header-buttons">
        <button onClick={onToggleInstructions} className="instructions-btn">How to Play</button>
        <button onClick={onToggleScorecard} className="scorecard-toggle-btn">Full Scorecard</button>
      </div>
    </div>
  );
};

export default HeaderScore;
