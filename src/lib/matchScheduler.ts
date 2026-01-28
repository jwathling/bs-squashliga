/**
 * Round-robin tournament scheduler
 * Creates matchups where each player plays every other player
 * Optimized to minimize consecutive games for the same player
 */

export interface ScheduledMatch {
  player1Id: string;
  player2Id: string;
  matchOrder: number;
  round: number;
}

/**
 * Generate all possible pairings for a round-robin tournament
 */
function generateAllPairings(playerIds: string[]): Array<[string, string]> {
  const pairings: Array<[string, string]> = [];
  
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      pairings.push([playerIds[i], playerIds[j]]);
    }
  }
  
  return pairings;
}

/**
 * Check if remaining matches would cause back-to-back games
 * Returns true if back-to-back is unavoidable
 */
function wouldCauseBackToBack(
  remaining: Array<[string, string]>,
  lastPlayers: Set<string>
): boolean {
  if (remaining.length === 0) return false;
  
  if (remaining.length === 1) {
    const [p1, p2] = remaining[0];
    return lastPlayers.has(p1) || lastPlayers.has(p2);
  }
  
  // Try to find any valid path without back-to-back
  for (let i = 0; i < remaining.length; i++) {
    const [p1, p2] = remaining[i];
    if (!lastPlayers.has(p1) && !lastPlayers.has(p2)) {
      const newRemaining = remaining.filter((_, idx) => idx !== i);
      const newLastPlayers = new Set([p1, p2]);
      if (!wouldCauseBackToBack(newRemaining, newLastPlayers)) {
        return false; // Found a valid path
      }
    }
  }
  
  return true; // No valid path found
}

/**
 * Optimize match order to minimize consecutive games for same player
 * Uses a greedy algorithm with look-ahead to prevent back-to-back at the end
 * @param initialLastPlayers - Optional set of player IDs from the last match of the previous round
 */
function optimizeMatchOrder(
  pairings: Array<[string, string]>,
  initialLastPlayers?: Set<string>
): Array<[string, string]> {
  if (pairings.length <= 1) return pairings;
  
  const result: Array<[string, string]> = [];
  const remaining = [...pairings];
  let lastPlayers: Set<string> = initialLastPlayers || new Set();
  
  while (remaining.length > 0) {
    let bestIndex = 0;
    
    // When few matches remain, use exhaustive look-ahead
    // Use exhaustive look-ahead for small tournaments (up to 10 matches = 5 players)
    if (remaining.length <= 10) {
      let foundValidPath = false;
      
      // Try all matches in order of preference (score 2, then 1, then 0)
      // and pick the first one that leads to a back-to-back-free sequence
      for (let targetScore = 2; targetScore >= 0 && !foundValidPath; targetScore--) {
        for (let i = 0; i < remaining.length; i++) {
          const [p1, p2] = remaining[i];
          let score = 2;
          if (lastPlayers.has(p1)) score--;
          if (lastPlayers.has(p2)) score--;
          
          if (score === targetScore) {
            const testRemaining = remaining.filter((_, idx) => idx !== i);
            const testLastPlayers = new Set([p1, p2]);
            
            if (!wouldCauseBackToBack(testRemaining, testLastPlayers)) {
              bestIndex = i;
              foundValidPath = true;
              break;
            }
          }
        }
      }
      
      // If no valid path exists (back-to-back unavoidable), use greedy
      if (!foundValidPath) {
        let bestScore = -1;
        for (let i = 0; i < remaining.length; i++) {
          const [p1, p2] = remaining[i];
          let score = 2;
          if (lastPlayers.has(p1)) score--;
          if (lastPlayers.has(p2)) score--;
          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
          }
        }
      }
    } else {
      // Use greedy for larger remaining sets (performance)
      let bestScore = -1;
      for (let i = 0; i < remaining.length; i++) {
        const [p1, p2] = remaining[i];
        let score = 2;
        if (lastPlayers.has(p1)) score--;
        if (lastPlayers.has(p2)) score--;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
    }
    
    const selected = remaining.splice(bestIndex, 1)[0];
    result.push(selected);
    lastPlayers = new Set([selected[0], selected[1]]);
  }
  
  return result;
}

/**
 * Generate a complete round-robin schedule for one round
 */
export function generateRoundSchedule(
  playerIds: string[],
  roundNumber: number,
  startingMatchOrder: number = 0
): ScheduledMatch[] {
  if (playerIds.length < 2) return [];
  
  const pairings = generateAllPairings(playerIds);
  const optimizedPairings = optimizeMatchOrder(pairings);
  
  return optimizedPairings.map((pairing, index) => ({
    player1Id: pairing[0],
    player2Id: pairing[1],
    matchOrder: startingMatchOrder + index + 1,
    round: roundNumber,
  }));
}

/**
 * Calculate total matches in a round-robin with n players
 */
export function calculateTotalMatches(playerCount: number): number {
  return (playerCount * (playerCount - 1)) / 2;
}

/**
 * Add another round to an existing tournament
 * @param lastMatchPlayers - Optional players from the last match of the previous round
 */
export function generateAdditionalRound(
  playerIds: string[],
  roundNumber: number,
  previousMatchCount: number,
  lastMatchPlayers?: { player1Id: string; player2Id: string }
): ScheduledMatch[] {
  if (playerIds.length < 2) return [];
  
  const pairings = generateAllPairings(playerIds);
  
  // Use players from last match of previous round to optimize first match of new round
  const initialLastPlayers = lastMatchPlayers 
    ? new Set([lastMatchPlayers.player1Id, lastMatchPlayers.player2Id])
    : undefined;
  
  const optimizedPairings = optimizeMatchOrder(pairings, initialLastPlayers);
  
  return optimizedPairings.map((pairing, index) => ({
    player1Id: pairing[0],
    player2Id: pairing[1],
    matchOrder: previousMatchCount + index + 1,
    round: roundNumber,
  }));
}
