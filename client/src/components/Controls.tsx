import React from 'react';

interface ControlsProps {
  onMoveSelect: (move: number) => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onMoveSelect, disabled }) => {
  const numbers = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="controls">
      <h3>Choose your number:</h3>
      <div className="button-group">
        {numbers.map((number) => (
          <button
            key={number}
            onClick={() => onMoveSelect(number)}
            disabled={disabled}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Controls;
