import React from 'react';
import { GameState } from '../types';
import Controls from './Controls';
import Scorecard from './Scorecard';

interface GameScreenProps {
  gameState: GameState;
  currentPlayerId: string;
  onMoveSelect: (move: number | string) => void;
  hasMadeMove: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentPlayerId, onMoveSelect, hasMadeMove }) => {
  const { batter, winner, isTossDone } = gameState;

  const isBatter = batter?.id === currentPlayerId;

  if (!isTossDone) {
    return (
        <div className="game-screen">
            <h2>Toss is happening...</h2>
            <p>The winner of the toss will bat first.</p>
        </div>
    )
  }

  return (
    <div className="game-screen">
      <Scorecard gameState={gameState} currentPlayerId={currentPlayerId} />
      
      <div className="game-area">
        {winner ? (
          <div className="game-over">
            <h3>Game Over!</h3>
          </div>
        ) : (
          <>
            {hasMadeMove ? (
              <p className="waiting-status">Waiting for the other player...</p>
            ) : (
              <Controls onMoveSelect={onMoveSelect} disabled={false} />
            )}
            <div className="role-indicator">
                You are currently {isBatter ? 'Batting' : 'Bowling'}.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
