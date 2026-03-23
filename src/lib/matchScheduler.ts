/**
 * Round-robin tournament scheduler
 * Creates matchups where each player plays every other player
 * Optimized to:
 * 1. Minimize consecutive games for the same player (no back-to-back)
 * 2. Balance wait times so all players have similar gaps between games
 */

export interface ScheduledMatch {
  player1Id: string;
  player2Id: string;
  matchOrder: number;
  round: number;
}

/**
 * Fixed 3-player schedule template.
 * With 3 players, back-to-back is mathematically unavoidable:
 * each player plays 2 of 3 matches per round, so everyone has exactly
 * one back-to-back per round. This is intentional and fair.
 * The same order is used for every round — no rotation needed.
 */
const THREE_PLAYER_TEMPLATE: Array<[number, number]> = [
  [0, 1], // A-B
  [2, 0], // C-A
  [1, 2], // B-C
];

/**
 * Optimal 6-player schedule template (indices into sorted player array)
 * This pattern ensures balanced wait times (max 4 matches gap) and no back-to-back
 */
const SIX_PLAYER_TEMPLATE: Array<[number, number]> = [
  [0, 1], // A-B
  [2, 3], // C-D
  [4, 5], // E-F
  [3, 1], // D-B
  [4, 0], // E-A
  [2, 5], // C-F
  [3, 4], // D-E
  [2, 1], // C-B
  [5, 0], // F-A
  [1, 4], // B-E
  [5, 3], // F-D
  [2, 0], // C-A
  [1, 5], // B-F
  [2, 4], // C-E
  [0, 3], // A-D
];

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
 * Generate pairings using the optimal 6-player template
 */
function generate6PlayerPairings(playerIds: string[]): Array<[string, string]> {
  return SIX_PLAYER_TEMPLATE.map(([i, j]) => [playerIds[i], playerIds[j]]);
}

/**
 * Score a match based on idle times and back-to-back status
 */
function scoreMatch(
  pairing: [string, string],
  lastPlayers: Set<string>,
  idleTime: Map<string, number>
): { isBackToBack: boolean; idleScore: number } {
  const [p1, p2] = pairing;
  const isBackToBack = lastPlayers.has(p1) || lastPlayers.has(p2);
  const idleScore = (idleTime.get(p1) || 0) + (idleTime.get(p2) || 0);
  return { isBackToBack, idleScore };
}

/**
 * Update idle times after a match is selected
 */
function updateIdleTimes(
  idleTime: Map<string, number>,
  selectedPlayers: [string, string]
): void {
  for (const [id, time] of idleTime) {
    if (id === selectedPlayers[0] || id === selectedPlayers[1]) {
      idleTime.set(id, 0); // Player just played
    } else {
      idleTime.set(id, time + 1); // Player waited another match
    }
  }
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
 * Optimize match order to:
 * 1. Avoid back-to-back games (priority)
 * 2. Balance idle times across players (fairness)
 * 
 * Uses idle-time scoring combined with look-ahead to prevent conflicts
 * @param initialLastPlayers - Optional set of player IDs from the last match of the previous round
 * @param playerIds - All player IDs to track idle times
 */
function optimizeMatchOrder(
  pairings: Array<[string, string]>,
  initialLastPlayers?: Set<string>,
  playerIds?: string[]
): Array<[string, string]> {
  if (pairings.length <= 1) return pairings;
  
  const result: Array<[string, string]> = [];
  const remaining = [...pairings];
  let lastPlayers: Set<string> = initialLastPlayers || new Set();
  
  // Initialize idle time tracking for all players
  const allPlayerIds = playerIds || [...new Set(pairings.flat())];
  const idleTime: Map<string, number> = new Map();
  for (const id of allPlayerIds) {
    // Players from initialLastPlayers just played, others start with idle=1
    idleTime.set(id, initialLastPlayers?.has(id) ? 0 : 1);
  }
  
  while (remaining.length > 0) {
    let bestIndex = 0;
    
    // Use exhaustive look-ahead for small tournaments (up to 10 matches = 5 players)
    if (remaining.length <= 10) {
      let foundValidPath = false;
      
      // Separate matches into non-back-to-back and back-to-back groups
      const nonBackToBack: Array<{ index: number; idleScore: number }> = [];
      const backToBack: Array<{ index: number; idleScore: number }> = [];
      
      for (let i = 0; i < remaining.length; i++) {
        const { isBackToBack, idleScore } = scoreMatch(remaining[i], lastPlayers, idleTime);
        if (isBackToBack) {
          backToBack.push({ index: i, idleScore });
        } else {
          nonBackToBack.push({ index: i, idleScore });
        }
      }
      
      // Sort by idle score descending (prefer players who waited longest)
      nonBackToBack.sort((a, b) => b.idleScore - a.idleScore);
      backToBack.sort((a, b) => b.idleScore - a.idleScore);
      
      // Try non-back-to-back matches first, in order of idle score
      for (const { index: i } of nonBackToBack) {
        const [p1, p2] = remaining[i];
        const testRemaining = remaining.filter((_, idx) => idx !== i);
        const testLastPlayers = new Set([p1, p2]);
        
        if (!wouldCauseBackToBack(testRemaining, testLastPlayers)) {
          bestIndex = i;
          foundValidPath = true;
          break;
        }
      }
      
      // If no valid non-back-to-back path, try back-to-back matches
      if (!foundValidPath) {
        for (const { index: i } of backToBack) {
          const [p1, p2] = remaining[i];
          const testRemaining = remaining.filter((_, idx) => idx !== i);
          const testLastPlayers = new Set([p1, p2]);
          
          if (!wouldCauseBackToBack(testRemaining, testLastPlayers)) {
            bestIndex = i;
            foundValidPath = true;
            break;
          }
        }
      }
      
      // If still no valid path (back-to-back unavoidable), pick highest idle score
      if (!foundValidPath) {
        const allMatches = [...nonBackToBack, ...backToBack];
        allMatches.sort((a, b) => b.idleScore - a.idleScore);
        if (allMatches.length > 0) {
          bestIndex = allMatches[0].index;
        }
      }
    } else {
      // For larger remaining sets, use greedy with idle-time balancing
      const nonBackToBack: Array<{ index: number; idleScore: number }> = [];
      const backToBack: Array<{ index: number; idleScore: number }> = [];
      
      for (let i = 0; i < remaining.length; i++) {
        const { isBackToBack, idleScore } = scoreMatch(remaining[i], lastPlayers, idleTime);
        if (isBackToBack) {
          backToBack.push({ index: i, idleScore });
        } else {
          nonBackToBack.push({ index: i, idleScore });
        }
      }
      
      // Prefer non-back-to-back with highest idle score
      if (nonBackToBack.length > 0) {
        nonBackToBack.sort((a, b) => b.idleScore - a.idleScore);
        bestIndex = nonBackToBack[0].index;
      } else if (backToBack.length > 0) {
        backToBack.sort((a, b) => b.idleScore - a.idleScore);
        bestIndex = backToBack[0].index;
      }
    }
    
    const selected = remaining.splice(bestIndex, 1)[0];
    result.push(selected);
    
    // Update tracking
    updateIdleTimes(idleTime, selected);
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
  
  let optimizedPairings: Array<[string, string]>;
  
  // Use optimal templates for known player counts
  if (playerIds.length === 3) {
    optimizedPairings = THREE_PLAYER_TEMPLATE.map(([i, j]) => [playerIds[i], playerIds[j]]);
  } else if (playerIds.length === 6) {
    optimizedPairings = generate6PlayerPairings(playerIds);
  } else {
    const pairings = generateAllPairings(playerIds);
    optimizedPairings = optimizeMatchOrder(pairings, undefined, playerIds);
  }
  
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
 * @param lastMatchPlayers - Optional players from the last match of the previous round (ignored for 3 players)
 */
export function generateAdditionalRound(
  playerIds: string[],
  roundNumber: number,
  previousMatchCount: number,
  lastMatchPlayers?: { player1Id: string; player2Id: string }
): ScheduledMatch[] {
  if (playerIds.length < 2) return [];
  
  let optimizedPairings: Array<[string, string]>;
  
  // 3 players: always use the fixed template, ignore lastMatchPlayers
  if (playerIds.length === 3) {
    optimizedPairings = THREE_PLAYER_TEMPLATE.map(([i, j]) => [playerIds[i], playerIds[j]]);
  } else if (playerIds.length === 6) {
    optimizedPairings = generate6PlayerPairings(playerIds);
  } else {
    const pairings = generateAllPairings(playerIds);
    
    // Use players from last match of previous round to optimize first match of new round
    const initialLastPlayers = lastMatchPlayers 
      ? new Set([lastMatchPlayers.player1Id, lastMatchPlayers.player2Id])
      : undefined;
    
    optimizedPairings = optimizeMatchOrder(pairings, initialLastPlayers, playerIds);
  }
  
  return optimizedPairings.map((pairing, index) => ({
    player1Id: pairing[0],
    player2Id: pairing[1],
    matchOrder: previousMatchCount + index + 1,
    round: roundNumber,
  }));
}
