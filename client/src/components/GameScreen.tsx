import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import Controls from './Controls';
import OverHistory from './OverHistory';
import HeaderScore from './HeaderScore';
import LiveInfo from './LiveInfo';
import InningBreakdown from './InningBreakdown';
import DetailedScorecard from './DetailedScorecard';
import Instructions from './Instructions';

interface GameScreenProps {
  gameState: GameState;
  currentPlayerId: string;
  onMoveSelect: (move: number | string) => void;
  hasMadeMove: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentPlayerId, onMoveSelect, hasMadeMove }) => {
  const { batter, winner, isTossDone, warning, currentOverHistory, inning, target, balls, out } = gameState;
  const [showInningBreakdown, setShowInningBreakdown] = useState(false);
  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // New state

  const isBatter = batter?.id === currentPlayerId;
  const gameIsOver = !!winner;

  useEffect(() => {
    // Show inning breakdown when the target is set (which happens at the end of inning 1)
    if (target !== null && inning === 2 && balls === 0 && out) {
      setShowInningBreakdown(true);
    }
  }, [target, inning, balls, out]);

  const handleContinue = () => {
    setShowInningBreakdown(false);
  };

  const handleToggleScorecard = () => {
    setShowFullScorecard(prev => !prev);
  }

  const handleToggleInstructions = () => { // New handler
    setShowInstructions(prev => !prev);
  }

  if (!isTossDone) {
    return (
      <div className="game-screen-layout">
        <h2>Toss is happening...</h2>
        <p>The winner of the toss will bat first.</p>
      </div>
    );
  }

  return (
    <div className="game-viewport">
      {showInningBreakdown && <InningBreakdown gameState={gameState} onContinue={handleContinue} />}
      {showFullScorecard && (
        <DetailedScorecard 
          title="Full Scorecard"
          gameState={gameState} 
          currentPlayerId={currentPlayerId}
          onClose={handleToggleScorecard}
        />
      )}
      {showInstructions && <Instructions onClose={handleToggleInstructions} />}
      
      <div className="game-content">
        <div className="game-screen-layout">
          <HeaderScore gameState={gameState} onToggleScorecard={handleToggleScorecard} onToggleInstructions={handleToggleInstructions} />

          {warning && <div className="warning">{warning}</div>}
          
          <LiveInfo gameState={gameState} currentPlayerId={currentPlayerId} />

          <OverHistory history={currentOverHistory} isBatter={isBatter} />
          
          <div className="role-indicator">
              You are currently {isBatter ? 'Batting' : 'Bowling'}.
          </div>

          {hasMadeMove && !gameIsOver && (
            <p className="waiting-status card">Waiting for the other player...</p>
          )}
        </div>
      </div>

      {!gameIsOver && (
        <div className="controls-footer">
          <Controls onMoveSelect={onMoveSelect} disabled={hasMadeMove} isBatter={isBatter} />
        </div>
      )}
    </div>
  );
};

export default GameScreen;
