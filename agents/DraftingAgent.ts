import { Architect } from "synaptic";
import { Player, PlayerStatistics } from "../types.ts";
import { Team } from "../models/Player.ts";

// DraftingAgent class using neural network to select players
export class DraftingAgent {
  network: Architect.Perceptron;
  team: Team;
  id: number;
  tournamentScore: number = 0;
  tournamentWins: number = 0;
  
  // Lifetime stats tracking
  lifetimeWins: number = 0;
  lifetimeScore: number = 0;
  generations: number = 1;
  playerStats: Map<number, PlayerStatistics> = new Map();
  
  constructor(id: number, network?: Architect.Perceptron) {
    this.id = id;
    this.team = new Team(`Team ${id}`);
    
    // Create a new network if one isn't provided
    if (!network) {
      // Create a network with:
      // - Input: Available players' stats (4 per player) + current team stats (4) = variable size
      // - Hidden layers: 10 neurons, 5 neurons
      // - Output: 1 (player preference score)
      this.network = new Architect.Perceptron(8, 10, 5, 1);
    } else {
      this.network = network;
    }
  }
  
  // Draft a player from available players
  draftPlayer(availablePlayers: Player[]): Player | null {
    if (availablePlayers.length === 0) {
      return null;
    }
    
    const teamStats = this.team.getStats();
    let bestPlayer: Player | null = null;
    let bestScore = -Infinity;
    
    // Evaluate each available player
    for (const player of availablePlayers) {
      // Normalize inputs to 0-1 range
      const input = [
        player.pitching / 10,
        player.batting / 10,
        player.fielding / 10,
        player.running / 10,
        teamStats.pitching / 10,
        teamStats.batting / 10,
        teamStats.fielding / 10,
        teamStats.running / 10,
      ];
      
      // Get the network's evaluation of this player
      const score = this.network.activate(input)[0];
      
      // Select the player with the highest score
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = player;
      }
    }
    
    // Add the best player to the team
    if (bestPlayer) {
      this.team.addPlayer(bestPlayer);
      
      // Initialize player stats if this is the first time we've seen this player
      if (!this.playerStats.has(bestPlayer.id)) {
        this.playerStats.set(bestPlayer.id, {
          playerId: bestPlayer.id,
          playerName: bestPlayer.name,
          atBats: 0,
          runs: 0,
          inningsPitched: 0,
          strikeouts: 0
        });
      }
    }
    
    return bestPlayer;
  }
  
  // Create a child agent with potential mutations
  reproduce(mutationRate: number = 0.1, newId?: number): DraftingAgent {
    // Clone the network
    const childNetwork = this.network.clone();
    
    // Apply mutations to the weights
    const connections = childNetwork.connections;
    
    // Basic mutation that adjusts network weights randomly
    if (connections && connections.length > 0) {
      for (let i = 0; i < connections.length; i++) {
        const connection = connections[i];
        connection.weight += (Math.random() * 2 - 1) * mutationRate;
      }
    }
    
    // Use a new ID if provided, otherwise use the parent's ID
    const childId = newId !== undefined ? newId : this.id;
    const child = new DraftingAgent(childId, childNetwork);
    
    // Reset tournament-specific scores for the child
    child.tournamentScore = 0;
    child.tournamentWins = 0;
    
    // Pass on the parent's lifetime statistics to the child
    child.playerStats = new Map(this.playerStats);
    
    return child;
  }
  
  resetTeam(): void {
    this.team = new Team(`Team ${this.id}`);
  }
  
  // Update player statistics with game results
  updatePlayerStats(playerStats: Map<number, PlayerStatistics>): void {
    playerStats.forEach((stats, playerId) => {
      if (this.playerStats.has(playerId)) {
        const existingStats = this.playerStats.get(playerId)!;
        existingStats.atBats += stats.atBats;
        existingStats.runs += stats.runs;
        existingStats.inningsPitched += stats.inningsPitched;
        existingStats.strikeouts += stats.strikeouts;
      } else {
        this.playerStats.set(playerId, { ...stats });
      }
    });
  }
  
  // Update lifetime stats when generation ends
  updateLifetimeStats(): void {
    this.lifetimeWins += this.tournamentWins;
    this.lifetimeScore += this.tournamentScore;
    this.generations += 1;
  }
}