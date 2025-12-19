import React from 'react';
import { RoundResult } from '../types';

interface OverHistoryProps {
  history: RoundResult[];
  currentPlayerId: string;
  bowlerId: string;
}

// Helper function to extract the essential result from the outcome string
const getDisplayResult = (outcome: string): string => {
  if (outcome.includes('OUT')) return 'W';
  if (outcome.includes('Dot Ball')) return '0';
  if (outcome.includes('Penalty')) return '-1';

  // Extracts number from "X RUNS!" or "Bowler saved Y runs! Z RUNS!"
  const match = outcome.match(/(-?\d+)\s*RUNS/);
  if (match) {
    return match[1];
  }
  return '?';
};

const OverHistory: React.FC<OverHistoryProps> = ({ history, currentPlayerId, bowlerId }) => {
  if (history.length === 0) {
    return null; // Don't render anything if there's no history for the over
  }

  // Determine if the current player is the batter (i.e., bowler is the opponent)
  const isBatterViewing = currentPlayerId !== bowlerId;

  return (
    <div className="over-history card">
      <h3>This Over</h3>
      <div className="history-grid">
        <div className="history-row">
          <div className="history-label">Batter</div>
          {history.map((h, i) => <div key={i} className="history-cell">{h.batterMove}</div>)}
        </div>
        <div className={`history-row ${isBatterViewing ? 'highlight-bowler-moves' : ''}`}>
          <div className="history-label">Bowler</div>
          {history.map((h, i) => <div key={i} className="history-cell">{h.bowlerMove}</div>)}
        </div>
        <div className="history-row final-result">
          <div className="history-label">Result</div>
          {history.map((h, i) => <div key={i} className="history-cell">{getDisplayResult(h.outcome)}</div>)}
        </div>
      </div>
    </div>
  );
};

export default OverHistory;
