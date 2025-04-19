import { GenerationResult, Player } from "../types.ts";
import { DraftingAgent } from "../agents/DraftingAgent.ts";
import { Tournament } from "./Tournament.ts";

// Main evolution simulation
export class EvolutionSimulator {
  tournament: Tournament;
  generation: number = 0;
  maxGenerations: number;
  generationResults: GenerationResult[] = [];
  onGenerationComplete?: (result: GenerationResult) => void;

  constructor(numAgents: number = 8, maxGenerations: number = 1000) {
    // Create initial agents
    const agents: DraftingAgent[] = [];
    for (let i = 0; i < numAgents; i++) {
      agents.push(new DraftingAgent(i));
    }

    // Load players
    const players = this.loadPlayers();

    // Create tournament
    this.tournament = new Tournament(agents, players);
    this.maxGenerations = maxGenerations;
  }

  // Helper to load players from JSON
  loadPlayers(): Player[] {
    try {
      const data = JSON.parse(Deno.readTextFileSync("./characterData.json"));
      return data as Player[];
    } catch (error) {
      console.error("Error loading players:", error);
      return [];
    }
  }

  // Register callback for generation completion
  setGenerationCompleteCallback(
    callback: (result: GenerationResult) => void,
  ): void {
    this.onGenerationComplete = callback;
  }

  // Get all generation results
  getGenerationResults(): GenerationResult[] {
    return this.generationResults;
  }

  // Print player statistics summary
  printPlayerStatsSummary(): void {
    console.log("\n=== PLAYER STATISTICS SUMMARY ===");
    
    // Get the global player statistics
    const globalPlayerStats = this.tournament.getGlobalPlayerStats();
    
    // Convert map to array for sorting
    const playerStatsArray = Array.from(globalPlayerStats.values());
    
    // Sort batters by runs scored
    const topBatters = [...playerStatsArray]
      .filter(stats => stats.atBats > 0)
      .sort((a, b) => b.runs - a.runs);
      
    console.log("\nTop Batters by Runs Scored:");
    topBatters.slice(0, 10).forEach((stats, index) => {
      const battingAvg = stats.runs / stats.atBats;
      console.log(
        `${index + 1}. ${stats.playerName} - Runs: ${stats.runs}, At Bats: ${stats.atBats}, Avg: ${battingAvg.toFixed(3)}`
      );
    });
    
    // Sort pitchers by strikeouts
    const topPitchers = [...playerStatsArray]
      .filter(stats => stats.inningsPitched > 0)
      .sort((a, b) => b.strikeouts - a.strikeouts);
      
    console.log("\nTop Pitchers by Strikeouts:");
    topPitchers.slice(0, 10).forEach((stats, index) => {
      const strikeoutsPerInning = stats.strikeouts / stats.inningsPitched;
      console.log(
        `${index + 1}. ${stats.playerName} - Strikeouts: ${stats.strikeouts}, Innings Pitched: ${stats.inningsPitched}, K/IP: ${strikeoutsPerInning.toFixed(2)}`
      );
    });
    
    console.log("\n=== END OF PLAYER STATISTICS SUMMARY ===");
  }

  // Print overall simulation summary
  printSimulationSummary(): void {
    console.log("\n=== SIMULATION FINAL SUMMARY ===");
    console.log("Total generations:", this.generationResults.length);

    // Track the best-performing agents across all generations
    const agentPerformance: Record<
      number,
      { totalWins: number; totalScore: number; appearances: number }
    > = {};

    // Collect data from all generations
    this.generationResults.forEach((genResult) => {
      genResult.rankings.forEach((ranking) => {
        const agentId = ranking.agentId;

        if (!agentPerformance[agentId]) {
          agentPerformance[agentId] = {
            totalWins: 0,
            totalScore: 0,
            appearances: 0,
          };
        }

        agentPerformance[agentId].totalWins += ranking.wins;
        agentPerformance[agentId].totalScore += ranking.score;
        agentPerformance[agentId].appearances += 1;
      });
    });

    // Convert to array for sorting
    const performanceArray = Object.entries(agentPerformance)
      .map(([agentId, stats]) => ({
        agentId: parseInt(agentId),
        totalWins: stats.totalWins,
        totalScore: stats.totalScore,
        appearances: stats.appearances,
        avgWins: stats.totalWins / stats.appearances,
        avgScore: stats.totalScore / stats.appearances,
      }));

    // Sort by total wins
    const sortedByWins = [...performanceArray].sort((a, b) =>
      b.totalWins - a.totalWins
    );

    console.log("\nTop Agents by Total Wins:");
    sortedByWins.slice(0, 5).forEach((agent, index) => {
      console.log(
        `${
          index + 1
        }. Agent ${agent.agentId} - Total Wins: ${agent.totalWins}, Total Score: ${agent.totalScore}, Appearances: ${agent.appearances}`,
      );
    });

    // Sort by total score
    const sortedByScore = [...performanceArray].sort((a, b) =>
      b.totalScore - a.totalScore
    );

    console.log("\nTop Agents by Total Score:");
    sortedByScore.slice(0, 9).forEach((agent, index) => {
      console.log(
        `${
          index + 1
        }. Agent ${agent.agentId} - Total Score: ${agent.totalScore}, Total Wins: ${agent.totalWins}, Appearances: ${agent.appearances}`,
      );
    });

    // Print final generation results
    if (this.generationResults.length > 0) {
      const finalGen =
        this.generationResults[this.generationResults.length - 1];
      console.log("\nFinal Generation Results:");
      finalGen.rankings.forEach((ranking, index) => {
        console.log(
          `${
            index + 1
          }. ${ranking.teamName} - Wins: ${ranking.wins}, Score: ${ranking.score}`,
        );
      });
      
      // Display the winning team's players
      if (finalGen.rankings.length > 0) {
        const winningAgentId = finalGen.rankings[0].agentId;
        const winningAgent = this.tournament.agents.find(agent => agent.id === winningAgentId);
        
        if (winningAgent) {
          console.log("\nWinning Team Players:");
          console.log(`Team: ${winningAgent.team.name} (Agent ${winningAgentId})`);
          console.log("-------------------------------------");
          winningAgent.team.players.forEach((player, idx) => {
            const captainStar = player.isCaptain ? " ★" : "";
            console.log(`${idx + 1}. ${player.name}${captainStar} - Pitching: ${player.pitching}, Batting: ${player.batting}, Fielding: ${player.fielding}, Running: ${player.running}`);
          });
        }
      }
    }
    
    // Print player statistics summary
    this.printPlayerStatsSummary();

    console.log("\n=== END OF SIMULATION SUMMARY ===");
  }

  // Run the simulation for the specified number of generations
  runSimulation(): Promise<GenerationResult[]> {
    console.log("Starting evolution simulation...");
    this.generationResults = [];

    for (let gen = 0; gen < this.maxGenerations; gen++) {
      this.generation = gen;
      console.log(`Generation ${gen + 1}/${this.maxGenerations}`);

      // Run the current generation
      const rankedAgents = this.tournament.runGeneration();

      // Build results object with more data
      const results: Record<number, number> = {};
      rankedAgents.forEach((agent, index) => {
        // Simple ranking based on position (inverted)
        results[agent.id] = rankedAgents.length - index;
      });

      // Create a detailed generation result
      const generationResult: GenerationResult = {
        generation: gen + 1,
        rankings: rankedAgents.map((agent, _index) => ({
          agentId: agent.id,
          teamName: agent.team.name,
          wins: agent.tournamentWins,
          score: agent.tournamentScore,
          teamStats: agent.team.getStats(),
        })),
      };

      // Store and notify
      this.generationResults.push(generationResult);

      // Call event callback if registered
      if (this.onGenerationComplete) {
        this.onGenerationComplete(generationResult);
      }

      // Display results
      console.log("Tournament Results:");
      rankedAgents.forEach((agent, index) => {
        console.log(
          `${
            index + 1
          }. ${agent.team.name} - Wins: ${agent.tournamentWins}, Score: ${agent.tournamentScore}`,
        );
      });

      // Create the next generation of agents
      if (gen < this.maxGenerations - 1) {
        const newAgents = this.tournament.createNextGeneration(rankedAgents);
        this.tournament.agents = newAgents;
        
        // Log information about the new generation
        console.log("\nCreating Generation " + (gen + 2) + ":");
        console.log("Agents continuing to next generation: " + 
                    newAgents.slice(0, 4).map(a => `Agent ${a.id}`).join(", "));
        console.log("New offspring: " + 
                    newAgents.slice(4, 7).map(a => `Agent ${a.id} (parent: Agent ${newAgents[newAgents.indexOf(a) - 4].id})`).join(", "));
        console.log("New random agent: Agent " + newAgents[7].id);
      }
    }

    // Print the overall simulation summary
    this.printSimulationSummary();

    console.log("Evolution simulation complete!");
    return Promise.resolve(this.generationResults);
  }
}
