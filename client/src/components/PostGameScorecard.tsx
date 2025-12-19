import React from 'react';
import { GameState, Player } from '../types';

interface PostGameScorecardProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayAgain: () => void;
}

const formatOvers = (totalBalls: number): string => {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
};

const calculateStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};

const calculateEconomy = (runs: number, overs: number): string => {
  if (overs === 0) return '0.00';
  const totalBalls = Math.floor(overs / 1) * 6 + (overs % 1) * 10; // Convert X.Y overs to total balls
  if (totalBalls === 0) return '0.00'; // Should not happen if overs > 0
  return (runs / (totalBalls / 6)).toFixed(2);
};


const PostGameScorecard: React.FC<PostGameScorecardProps> = ({ gameState, currentPlayerId, onPlayAgain }) => {
  const { players, winner, target } = gameState;

  // Function to determine if a player is the local player
  const getPlayerDisplayName = (player: Player) => {
    return player.name + (player.id === currentPlayerId ? ' (You)' : '');
  };

  return (
    <div className="post-game-scorecard">
      <h2 className="post-game-title">Game Over!</h2>
      {winner && <h3 className="winner-announcement">{winner.name} won the match!</h3>}
      {!winner && <h3 className="winner-announcement">It's a tie!</h3>} {/* Or handle if no winner explicitly set */}
      
      <div className="scorecard-summary">
        {players.map(player => (
          <div key={player.id} className="player-summary-card">
            <h4>{getPlayerDisplayName(player)}</h4>
            <div className="batting-stats">
              <h5>Batting</h5>
              <p>Runs: {player.runsScored}</p>
              <p>Balls: {player.ballsFaced}</p>
              <p>Fours: {player.fours}</p>
              <p>Sixes: {player.sixes}</p>
              <p>Strike Rate: {calculateStrikeRate(player.runsScored, player.ballsFaced)}</p>
            </div>
            <div className="bowling-stats">
              <h5>Bowling</h5>
              <p>Overs: {formatOvers(player.oversBowled)}</p>
              <p>Runs: {player.runsConceded}</p>
              <p>Wickets: {player.wicketsTaken}</p>
              <p>Economy: {calculateEconomy(player.runsConceded, player.oversBowled)}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onPlayAgain} className="play-again-button">Play Again</button>
    </div>
  );
};

export default PostGameScorecard;