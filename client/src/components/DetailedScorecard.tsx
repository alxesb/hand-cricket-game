import React from 'react';
import { GameState, Player } from '../types';
import { formatOvers, calculateStrikeRate, calculateEconomy } from '../utils/stats';

interface DetailedScorecardProps {
  gameState: GameState;
  currentPlayerId: string;
  title: string;
  onClose?: () => void;
  onPlayAgain?: () => void;
}

const DetailedScorecard: React.FC<DetailedScorecardProps> = ({ gameState, currentPlayerId, title, onClose, onPlayAgain }) => {
  const { players, winner, batter } = gameState;

  // Function to determine if a player is the local player
  const getPlayerDisplayName = (player: Player) => {
    return player.name + (player.id === currentPlayerId ? ' (You)' : '');
  };

  // Determine batting status
  const getBattingStatus = (player: Player) => {
    // If the game is over, the winner is the not out batter, or both are out in a tie.
    if (winner) {
      return winner.id === player.id ? 'not out' : 'out';
    }
    // During the game, the current batter is not out.
    return batter?.id === player.id ? 'not out' : 'out';
  }

  return (
    <div className="detailed-scorecard-overlay">
      <div className="detailed-scorecard card">
        <h2 className="post-game-title">{title}</h2>
        {winner && <h3 className="winner-announcement">{getPlayerDisplayName(winner)} won the match!</h3>}
        
        <div className="scorecard-tables">
          {/* Batting Scorecard */}
          <div className="score-section">
            <h5>Batting</h5>
            <table className="score-table">
              <thead>
                <tr>
                  <th>Batter</th>
                  <th>Status</th>
                  <th>R</th>
                  <th>B</th>
                  <th>4s</th>
                  <th>6s</th>
                  <th>SR</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id}>
                    <td>{getPlayerDisplayName(p)}</td>
                    <td>{getBattingStatus(p)}</td>
                    <td>{p.runsScored}</td>
                    <td>{p.ballsFaced}</td>
                    <td>{p.fours}</td>
                    <td>{p.sixes}</td>
                    <td>{calculateStrikeRate(p.runsScored, p.ballsFaced)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bowling Scorecard */}
          <div className="score-section">
            <h5>Bowling</h5>
            <table className="score-table">
              <thead>
                <tr>
                  <th>Bowler</th>
                  <th>O</th>
                  <th>R</th>
                  <th>W</th>
                  <th>Econ</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id}>
                    <td>{getPlayerDisplayName(p)}</td>
                    <td>{formatOvers(p.oversBowled)}</td>
                    <td>{p.runsConceded}</td>
                    <td>{p.wicketsTaken}</td>
                    <td>{calculateEconomy(p.runsConceded, p.oversBowled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {onPlayAgain && <button onClick={onPlayAgain} className="play-again-button">Play Again</button>}
        {onClose && <button onClick={onClose} className="play-again-button">Close</button>}
      </div>
    </div>
  );
};

export default DetailedScorecard;