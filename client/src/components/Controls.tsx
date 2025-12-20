import React from 'react';

interface ControlsProps {
  onMoveSelect: (move: number | string) => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onMoveSelect, disabled }) => {
  const numbers: (number | string)[] = [0, '1a', '1b', '1c', 2, 3, 4, 6, '6B'];

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
