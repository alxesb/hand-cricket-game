import React from 'react';

interface ControlsProps {
  onMoveSelect: (move: number | string) => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onMoveSelect, disabled }) => {
  const numbers: (number | string)[] = [0, '1a', '1b', '1c', 2, 3, 4, 6, '6B'];

  const getButtonClass = (number: number | string) => {
    if (number === 4 || number === 6) return 'btn-green';
    if (number === '6B') return 'btn-red';
    return '';
  };

  return (
    <div className="controls">
      <h3>Choose your number:</h3>
      <div className="button-group">
        {numbers.map((number) => (
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
