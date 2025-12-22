// src/utils/stats.ts

export const formatOvers = (totalBalls: number): string => {
  if (totalBalls < 0) return '0.0';
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
};

export const calculateStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(2);
};

export const calculateEconomy = (runsConceded: number, totalBalls: number): string => {
  if (totalBalls === 0) return '0.00';
  const overs = totalBalls / 6;
  return (runsConceded / overs).toFixed(2);
};

export const calculateRunRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
};
