import React from 'react';
import { GameState, Player } from '../types';

interface LiveInfoProps {
  gameState: GameState;
  currentPlayerId: string;
}

// Helper to format overs (re-used from PostGameScorecard)
const formatOvers = (totalBalls: number): string => {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
};

// Helper to get player display name (re-used from Scorecard)
const getPlayerDisplayName = (player: Player | null, localPlayerId: string) => {
  if (!player) return '';
  return player.name + (player.id === localPlayerId ? ' (You)' : '');
};

const LiveInfo: React.FC<LiveInfoProps> = ({ gameState, currentPlayerId }) => {
  const { batter, bowler, lastRoundResult } = gameState;

  return (
    <div className="live-info">
      <div className="current-players">
        {batter && (
          <div className="current-batter">
            <span className="player-name">{getPlayerDisplayName(batter, currentPlayerId)}*</span>
            <span className="player-stats">{batter.runsScored} ({batter.ballsFaced})</span>
          </div>
        )}
        {bowler && (
          <div className="current-bowler">
            <span className="player-name">{getPlayerDisplayName(bowler, currentPlayerId)}</span>
            <span className="player-stats">
              {bowler.wicketsTaken}-{bowler.runsConceded} ({formatOvers(bowler.oversBowled)})
            </span>
          </div>
        )}
      </div>

      {lastRoundResult && (
        <div className="commentary-box">
          <p>
            {getPlayerDisplayName(bowler, currentPlayerId)} bowled a{' '}
            <strong>{lastRoundResult.bowlerMove}</strong>,{' '}
            {getPlayerDisplayName(batter, currentPlayerId)} played a{' '}
            <strong>{lastRoundResult.batterMove}</strong>.
          </p>
          <p className="outcome">{lastRoundResult.outcome}</p>
        </div>
      )}
    </div>
  );
};

export default LiveInfo;
