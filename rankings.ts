import { Player } from "./types.ts";
import { Tournament } from "./simulation/Tournament.ts";
import { DraftingAgent } from "./agents/DraftingAgent.ts";

// Ranking map to track player wins
interface PlayerRanking {
  name: string;
  id: number;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

// Creates 8 random teams and simulates a tournament
function simulateRandomTournament(allPlayers: Player[]): {
  playerWins: Map<number, number>;
  agents: DraftingAgent[];
} {
  // Create 8 random agents
  const agents: DraftingAgent[] = [];
  for (let i = 1; i <= 8; i++) {
    agents.push(new DraftingAgent(i));
  }

  // Create tournament with agents and all players
  const tournament = new Tournament(agents, allPlayers);

  // Run a single tournament
  const rankedAgents = tournament.runGeneration();

  // Track which players win
  const playerWinMap = new Map<number, number>();

  // For each agent, track how many wins each player contributed to
  rankedAgents.forEach((agent) => {
    const wins = agent.tournamentWins;
    
    // For each player on the team, add to their win count
    agent.team.players.forEach((player) => {
      const currentWins = playerWinMap.get(player.id) || 0;
      playerWinMap.set(player.id, currentWins + wins);
    });
  });

  return {
    playerWins: playerWinMap,
    agents: rankedAgents
  };
}

// Main function to run multiple tournaments and track player rankings
export function runPlayerRankings(
  iterations: number = 100,
): void {
  console.log(`Running ${iterations} tournament iterations to rank players...`);

  // Load all players
  let allPlayers: Player[] = [];
  try {
    const data = JSON.parse(Deno.readTextFileSync("./characterData.json"));
    allPlayers = data as Player[];
  } catch (error) {
    console.error("Error loading players:", error);
    return;
  }

  // Track total wins per player
  const playerWins = new Map<number, number>();
  // Track appearances in games
  const playerAppearances = new Map<number, number>();

  // Initialize maps
  allPlayers.forEach((player) => {
    playerWins.set(player.id, 0);
    playerAppearances.set(player.id, 0);
  });

  // Run multiple tournaments
  for (let i = 0; i < iterations; i++) {
    const result = simulateRandomTournament(allPlayers);
    const { playerWins: tournamentWins, agents } = result;

    // Update overall player wins
    tournamentWins.forEach((wins, playerId) => {
      const currentWins = playerWins.get(playerId) || 0;
      playerWins.set(playerId, currentWins + wins);
    });
    
    // Track appearances for all players in this tournament
    agents.forEach((agent) => {
      agent.team.players.forEach((player) => {
        // Update appearances regardless of wins
        const currentAppearances = playerAppearances.get(player.id) || 0;
        playerAppearances.set(player.id, currentAppearances + 1);
      });
    });

    // Progress indicator for long runs
    if (i % 100 === 0) {
      console.log(`Completed ${i} of ${iterations} tournaments`);
    }
  }

  // Convert to array for sorting
  const rankings: PlayerRanking[] = [];
  allPlayers.forEach((player) => {
    const wins = playerWins.get(player.id) || 0;
    const gamesPlayed = playerAppearances.get(player.id) || 0;
    // Win rate is the normalized winning performance
    // Maximum win score per tournament: 7 (each team can play max 7 games in a round robin of 8 teams)
    // Thus win rate should be a percentage of the maximum possible wins
    const maxPossibleWinsPerTournament = 7;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) / maxPossibleWinsPerTournament : 0;

    rankings.push({
      id: player.id,
      name: player.name,
      wins,
      gamesPlayed,
      winRate,
    });
  });

  // Sort by total wins (primary) and win rate (secondary)
  rankings.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins; // Sort by wins descending
    }
    return b.winRate - a.winRate; // Sort by win rate descending as tiebreaker
  });

  // Print results
  console.log("\n===== PLAYER RANKINGS BY WINS =====");
  console.log("Rank | Player Name         | Wins  | Games | Win Rate");
  console.log("-----|--------------------:|------:|------:|--------:");

  rankings.forEach((player, index) => {
    console.log(
      `${(index + 1).toString().padStart(4)} | ` +
        `${player.name.padEnd(20)} | ` +
        `${player.wins.toString().padStart(5)} | ` +
        `${player.gamesPlayed.toString().padStart(5)} | ` +
        `${(player.winRate * 100).toFixed(2)}%`,
    );
  });

  // Display top 10 players with stats
  console.log("\n===== TOP 10 PLAYERS =====");
  const top10 = rankings.slice(0, 10);

  top10.forEach((player, index) => {
    const playerData = allPlayers.find((p) => p.id === player.id);
    if (playerData) {
      console.log(
        `${index + 1}. ${player.name} - Wins: ${player.wins}, Win Rate: ${
          (player.winRate * 100).toFixed(2)
        }%` +
          `\n   Stats: Pitching ${playerData.pitching}, Batting ${playerData.batting}, ` +
          `Fielding ${playerData.fielding}, Running ${playerData.running}` +
          `${playerData.isCaptain ? " (Captain)" : ""}`,
      );
    }
  });
}

// Run with a reasonable number of iterations if called directly
if (import.meta.main) {
  runPlayerRankings(5000);
}
