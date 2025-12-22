import React from 'react';

interface InstructionsProps {
  onClose: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ onClose }) => {
  return (
    <div className="detailed-scorecard-overlay">
      <div className="detailed-scorecard card instructions-card">
        <h2>How to Play Hand Cricket</h2>
        
        <div className="instructions-content">
          <h4>The Goal:</h4>
          <p>Score more runs than your opponent!</p>

          <h4>Gameplay:</h4>
          <ul>
            <li>The game has two innings. One player bats, the other bowls, then you switch.</li>
            <li>Each round, both the batter and bowler secretly choose a number (0, 1, 2, 3, 4, 6) or a special move.</li>
          </ul>

          <h4>Scoring:</h4>
          <ul>
            <li>If the numbers are <strong>different</strong>, the batter scores the number they chose.</li>
            <li>If the numbers are the <strong>same</strong>, the batter is <strong>OUT!</strong></li>
          </ul>

          <h4>Special Rules:</h4>
          <ul>
            <li><strong>2 vs 2:</strong> A matching '2' is a <strong>Dot Ball</strong> (0 runs). If this happens 3 times in a row, the batter is OUT.</li>
            <li><strong>Run Saving:</strong> The bowler can reduce the runs scored in some cases (e.g., Batter: 6, Bowler: 4 &gt; Result: 4 Runs).</li>
            <li><strong>6B Move (Batter):</strong> A high-risk move. If the bowler plays 6, you get 6 runs. If the bowler plays 0, you're OUT. Any other number is a dot ball.</li>
            <li><strong>Bowler's Limit:</strong> The bowler can only use the same number (except for 2) three times per over (6 balls). The 4th time is a No Ball and a penalty run.</li>
          </ul>
        </div>
        
        <button onClick={onClose} className="play-again-button">Got It!</button>
      </div>
    </div>
  );
};

export default Instructions;
