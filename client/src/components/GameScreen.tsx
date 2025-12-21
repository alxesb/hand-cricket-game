import React from 'react';
import { GameState } from '../types';
import Controls from './Controls';
import OverHistory from './OverHistory';
import HeaderScore from './HeaderScore';
import LiveInfo from './LiveInfo';

interface GameScreenProps {
  gameState: GameState;
  currentPlayerId: string;
  onMoveSelect: (move: number | string) => void;
  hasMadeMove: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentPlayerId, onMoveSelect, hasMadeMove }) => {
  const { batter, winner, isTossDone, warning, currentOverHistory } = gameState;

  const isBatter = batter?.id === currentPlayerId;
  const gameIsOver = !!winner;

  if (!isTossDone) {
    return (
        <div className="game-screen-layout">
            <h2>Toss is happening...</h2>
            <p>The winner of the toss will bat first.</p>
        </div>
    );
  }

  return (
    <div className="game-screen-layout">
      <HeaderScore gameState={gameState} />

      {warning && <div className="warning">{warning}</div>}
      
      <LiveInfo gameState={gameState} currentPlayerId={currentPlayerId} />

      {gameIsOver ? (
        <div className="game-over card">
          <h3>Game Over!</h3>
          {/* Could add a button to go to post game scorecard if not already there */}
        </div>
      ) : (
        <>
          <OverHistory history={currentOverHistory} currentPlayerId={currentPlayerId} bowlerId={gameState.bowler?.id || ''} />

          {isBatter ? (
            <img src="/images/bat.svg" alt="Bat icon" className="game-icon" />
          ) : (
            <img src="/images/ball.svg" alt="Ball icon" className="game-icon" />
          )}

          <div className="role-indicator">
              You are currently {isBatter ? 'Batting' : 'Bowling'}.
          </div>

          {hasMadeMove ? (
            <p className="waiting-status card">Waiting for the other player...</p>
          ) : (
            <Controls onMoveSelect={onMoveSelect} disabled={false} isBatter={isBatter} />
          )}
        </>
      )}
    </div>
  );
};


export default GameScreen;
