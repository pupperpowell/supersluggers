import { Player, PlayerStatistics } from "../types.ts";
import { DraftingAgent } from "../agents/DraftingAgent.ts";
import { GameSimulator } from "./GameSimulator.ts";

// Tournament to run a season of games
export class Tournament {
  agents: DraftingAgent[];
  gameSimulator: GameSimulator;
  availablePlayers: Player[];
  globalPlayerStats: Map<number, PlayerStatistics> = new Map();

  constructor(agents: DraftingAgent[], allPlayers: Player[]) {
    this.agents = agents;
    this.gameSimulator = new GameSimulator();
    this.availablePlayers = [...allPlayers]; // Clone the array
    
    // Initialize global player statistics
    allPlayers.forEach(player => {
      this.globalPlayerStats.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        atBats: 0,
        runs: 0,
        inningsPitched: 0,
        strikeouts: 0
      });
    });
  }

  runDraft(): void {
    // Reset teams
    this.agents.forEach((agent) => agent.resetTeam());
    this.availablePlayers = this.loadPlayers();

    // Each agent drafts 9 players
    for (let round = 0; round < 9; round++) {
      for (const agent of this.agents) {
        const draftedPlayer = agent.draftPlayer([...this.availablePlayers]);
        if (draftedPlayer) {
          // Remove the drafted player from available players
          this.availablePlayers = this.availablePlayers.filter(
            (player) => player.id !== draftedPlayer.id,
          );
        }
      }
    }
  }

  runTournament(): DraftingAgent[] {
    // console.log("Each agent is drafting a team...");
    // Run a round-robin tournament
    const results: Record<number, number> = {};
    const scores: Record<number, number> = {};

    // Initialize results and scores
    this.agents.forEach((agent) => {
      results[agent.id] = 0;
      scores[agent.id] = 0;
    });

    // Each team plays against every other team
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        const teamA = this.agents[i].team;
        const teamB = this.agents[j].team;

        // Skip invalid teams
        if (!teamA.isValid() || !teamB.isValid()) {
          continue;
        }

        try {
          const [winner, _loser, winnerScore, loserScore, gameStats] = this.gameSimulator
            .simulateGame(teamA, teamB);
          
          // Update player statistics from this game
          this.updatePlayerStats(gameStats);
          
          // Update agent statistics for the current game
          this.agents[i].updatePlayerStats(gameStats);
          this.agents[j].updatePlayerStats(gameStats);

          // Update results
          if (winner === teamA) {
            results[this.agents[i].id]++;
            scores[this.agents[i].id] += winnerScore;
            scores[this.agents[j].id] += loserScore;
          } else {
            results[this.agents[j].id]++;
            scores[this.agents[j].id] += winnerScore;
            scores[this.agents[i].id] += loserScore;
          }
        } catch (error) {
          console.error("Error during game simulation:", error);
        }
      }
    }

    // Sort agents by score
    const rankedAgents = [...this.agents].sort((a, b) => {
      return results[b.id] - results[a.id];
    });

    // Store the scores for later use
    rankedAgents.forEach((agent) => {
      agent.tournamentScore = scores[agent.id];
      agent.tournamentWins = results[agent.id];
    });

    return rankedAgents;
  }

  runGeneration(): DraftingAgent[] {
    this.runDraft();
    return this.runTournament();
  }

  // Create a new generation of agents based on the results
  createNextGeneration(rankedAgents: DraftingAgent[]): DraftingAgent[] {
    const newAgents: DraftingAgent[] = [];
    const numAgents = this.agents.length;
    
    // Keep the top 4 agents (or fewer if we have less than 4)
    const topAgentsCount = Math.min(4, rankedAgents.length);
    for (let i = 0; i < topAgentsCount; i++) {
      // Update lifetime statistics for continuing agents
      rankedAgents[i].updateLifetimeStats();
      
      // Keep the top agents unchanged
      newAgents.push(rankedAgents[i]);
    }
    
    // Calculate the next available agent ID (should be the max ID + 1)
    let nextAgentId = this.getMaxAgentId() + 1;
    
    // Only the top 3 agents produce offspring
    const reproducingAgentsCount = Math.min(3, topAgentsCount);
    for (let i = 0; i < reproducingAgentsCount; i++) {
      const newAgent = rankedAgents[i].reproduce(0.1, nextAgentId);
      newAgent.team.name = `Team ${nextAgentId}`;
      newAgents.push(newAgent);
      nextAgentId++;
    }
    
    // Add one completely random agent
    const randomAgent = new DraftingAgent(nextAgentId);
    randomAgent.team.name = `Team ${nextAgentId}`;
    newAgents.push(randomAgent);
    nextAgentId++;
    
    // Fill any remaining slots with new random agents if needed
    // (this should not happen if we have 8 agents with 4 top agents and 3 offspring + 1 random agent)
    for (let i = newAgents.length; i < numAgents; i++) {
      const newAgent = new DraftingAgent(nextAgentId);
      newAgent.team.name = `Team ${nextAgentId}`;
      newAgents.push(newAgent);
      nextAgentId++;
    }
    
    return newAgents;
  }
  
  // Helper function to find the maximum agent ID
  private getMaxAgentId(): number {
    let maxId = -1;
    for (const agent of this.agents) {
      if (agent.id > maxId) {
        maxId = agent.id;
      }
    }
    return maxId;
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
  
  // Update global player statistics
  updatePlayerStats(gameStats: Map<number, PlayerStatistics>): void {
    gameStats.forEach((stats, playerId) => {
      if (this.globalPlayerStats.has(playerId)) {
        const globalStats = this.globalPlayerStats.get(playerId)!;
        globalStats.atBats += stats.atBats;
        globalStats.runs += stats.runs;
        globalStats.inningsPitched += stats.inningsPitched;
        globalStats.strikeouts += stats.strikeouts;
      } else {
        this.globalPlayerStats.set(playerId, { ...stats });
      }
    });
  }
  
  // Get global player statistics
  getGlobalPlayerStats(): Map<number, PlayerStatistics> {
    return this.globalPlayerStats;
  }
}
