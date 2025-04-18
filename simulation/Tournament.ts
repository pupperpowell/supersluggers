import { Player } from "../types.ts";
import { DraftingAgent } from "../agents/DraftingAgent.ts";
import { GameSimulator } from "./GameSimulator.ts";

// Tournament to run a season of games
export class Tournament {
  agents: DraftingAgent[];
  gameSimulator: GameSimulator;
  availablePlayers: Player[];

  constructor(agents: DraftingAgent[], allPlayers: Player[]) {
    this.agents = agents;
    this.gameSimulator = new GameSimulator();
    this.availablePlayers = [...allPlayers]; // Clone the array
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
    console.log("Each agent is drafting a team...");
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
          const [winner, _loser, winnerScore, loserScore] = this.gameSimulator
            .simulateGame(teamA, teamB);

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

    // Top agent gets 4 children
    for (let i = 0; i < 4; i++) {
      newAgents.push(rankedAgents[0].reproduce(0.1, newAgents.length));
    }

    // Agents 2-4 get one child each
    for (let i = 1; i < 4 && i < rankedAgents.length; i++) {
      newAgents.push(rankedAgents[i].reproduce(0.1, newAgents.length));
    }

    // Fill the rest with random new agents if needed
    for (let i = newAgents.length; i < numAgents; i++) {
      newAgents.push(new DraftingAgent(i));
    }

    // Update agent IDs to match their indices
    newAgents.forEach((agent, index) => {
      agent.id = index;
      agent.team.name = `Team ${index}`;
    });

    return newAgents;
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
}
