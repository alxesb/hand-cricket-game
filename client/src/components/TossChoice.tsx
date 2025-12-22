import React from 'react';

interface TossChoiceProps {
  onChoose: (choice: 'bat' | 'bowl') => void;
  tossWinnerName: string;
}

const TossChoice: React.FC<TossChoiceProps> = ({ onChoose, tossWinnerName }) => {
  return (
    <div className="toss-choice-overlay">
      <div className="toss-choice-card card">
        <h2>{tossWinnerName} won the toss!</h2>
        <p>Choose to bat or bowl:</p>
        <div className="toss-choice-buttons">
          <button onClick={() => onChoose('bat')}>Bat</button>
          <button onClick={() => onChoose('bowl')}>Bowl</button>
        </div>
      </div>
    </div>
  );
};

export default TossChoice;
