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
 * Optimize match order to minimize consecutive games for same player
 * Uses a greedy algorithm that tracks last played player
 */
function optimizeMatchOrder(pairings: Array<[string, string]>): Array<[string, string]> {
  if (pairings.length <= 1) return pairings;
  
  const result: Array<[string, string]> = [];
  const remaining = [...pairings];
  let lastPlayers: Set<string> = new Set();
  
  while (remaining.length > 0) {
    // Find best next match (one where neither player just played)
    let bestIndex = 0;
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
      
      // Perfect match found, no need to continue
      if (score === 2) break;
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
 */
export function generateAdditionalRound(
  playerIds: string[],
  roundNumber: number,
  previousMatchCount: number
): ScheduledMatch[] {
  return generateRoundSchedule(playerIds, roundNumber, previousMatchCount);
}
