// ELO Rating System for Squash
// K-factor determines how much ratings change per game
const K_FACTOR = 32;

/**
 * Calculate expected score based on ELO ratings
 */
export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate new ELO rating after a match
 * @param playerElo - Current ELO of the player
 * @param opponentElo - Current ELO of the opponent
 * @param playerScore - Points scored by the player
 * @param opponentScore - Points scored by the opponent
 * @returns Object with new ELO and change amount
 */
export function calculateNewElo(
  playerElo: number,
  opponentElo: number,
  playerScore: number,
  opponentScore: number
): { newElo: number; change: number } {
  // Determine win/loss (1 for win, 0 for loss)
  const actualScore = playerScore > opponentScore ? 1 : 0;
  const expected = expectedScore(playerElo, opponentElo);
  
  // Calculate margin of victory multiplier (more decisive wins = bigger change)
  const scoreDiff = Math.abs(playerScore - opponentScore);
  const totalPoints = playerScore + opponentScore;
  const marginMultiplier = 1 + (scoreDiff / Math.max(totalPoints, 1)) * 0.5;
  
  // Calculate ELO change
  const baseChange = K_FACTOR * (actualScore - expected);
  const adjustedChange = Math.round(baseChange * marginMultiplier);
  
  return {
    newElo: playerElo + adjustedChange,
    change: adjustedChange,
  };
}

/**
 * Calculate ELO changes for both players after a match
 */
export function calculateMatchEloChanges(
  player1Elo: number,
  player2Elo: number,
  player1Score: number,
  player2Score: number
): {
  player1: { newElo: number; change: number };
  player2: { newElo: number; change: number };
} {
  const player1Result = calculateNewElo(player1Elo, player2Elo, player1Score, player2Score);
  const player2Result = calculateNewElo(player2Elo, player1Elo, player2Score, player1Score);
  
  return {
    player1: player1Result,
    player2: player2Result,
  };
}

/**
 * Validate if a match score is valid according to squash rules
 * - Game to 11 points
 * - At 10:10, must win by 2
 */
export function isValidScore(score1: number, score2: number): boolean {
  if (score1 < 0 || score2 < 0) return false;
  
  const winnerScore = Math.max(score1, score2);
  const loserScore = Math.min(score1, score2);
  
  // Standard win: first to 11 with at least 2 point lead
  if (winnerScore === 11 && loserScore <= 9) return true;
  
  // Deuce situation: must win by 2 after 10:10
  if (winnerScore >= 11 && loserScore >= 10 && winnerScore - loserScore === 2) return true;
  
  return false;
}

/**
 * Get the winner of a match based on scores
 */
export function getWinner(
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number
): string | null {
  if (!isValidScore(player1Score, player2Score)) return null;
  return player1Score > player2Score ? player1Id : player2Id;
}
