import React from 'react';
import { GameState } from '../types';
import Controls from './Controls';
import Scorecard from './Scorecard';
import OverHistory from './OverHistory'; // New import

interface GameScreenProps {
  gameState: GameState;
  currentPlayerId: string;
  onMoveSelect: (move: number | string) => void;
  hasMadeMove: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentPlayerId, onMoveSelect, hasMadeMove }) => {
  const { batter, winner, isTossDone, warning, currentOverHistory } = gameState;

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
      <div> {/* Wrapper for the first grid column */}
        <Scorecard gameState={gameState} currentPlayerId={currentPlayerId} />
        <OverHistory history={currentOverHistory} currentPlayerId={currentPlayerId} bowlerId={gameState.bowler?.id || ''} />
      </div>
      
      <div className="game-area">
        {warning && <div className="warning">{warning}</div>}

        {/* New Commentary Box */}
        {gameState.lastRoundResult && (
            <div className="commentary-box">
                <p>
                    {gameState.bowler?.name} bowled a <strong>{gameState.lastRoundResult.bowlerMove}</strong>, {gameState.batter?.name} played a <strong>{gameState.lastRoundResult.batterMove}</strong>.
                </p>
                <p className="outcome">{gameState.lastRoundResult.outcome}</p>
            </div>
        )}

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
            {isBatter ? (
              <img src="/images/bat.svg" alt="Bat icon" className="game-icon" />
            ) : (
              <img src="/images/ball.svg" alt="Ball icon" className="game-icon" />
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
