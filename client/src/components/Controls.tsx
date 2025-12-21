import React from 'react';

interface ControlsProps {
  onMoveSelect: (move: number | string) => void;
  disabled: boolean;
  isBatter: boolean; // New prop
}

const Controls: React.FC<ControlsProps> = ({ onMoveSelect, disabled, isBatter }) => {
  // Filter numbers based on isBatter
  const numbersToDisplay: (number | string)[] = isBatter
    ? [0, '1a', '1b', '1c', 2, 3, 4, 6, '6B'] // Show 6B for batter
    : [0, '1a', '1b', '1c', 2, 3, 4, 6];     // Hide 6B for bowler (no 6B)

  const getButtonClass = (number: number | string) => {
    if (number === 4 || number === 6) return 'btn-green';
    if (number === '6B') return 'btn-red';
    return '';
  };

  return (
    <div className="controls">
      <h3>Choose your number:</h3>
      <div className="button-group">
        {numbersToDisplay.map((number) => ( // Use numbersToDisplay
          <button
            key={number}
            onClick={() => onMoveSelect(number)}
            disabled={disabled}
            className={getButtonClass(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Controls;
