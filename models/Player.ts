import { Player } from "../types.ts";

// Team class to store drafted players
export class Team {
  players: Player[] = [];
  captain: Player | null = null;
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  addPlayer(player: Player): boolean {
    if (this.players.length >= 9) {
      return false;
    }
    
    // The first captain added becomes the team captain
    if (player.isCaptain && !this.captain) {
      this.captain = player;
    }
    
    this.players.push(player);
    return true;
  }
  
  // Calculate team statistics
  getStats() {
    const stats = {
      pitching: 0,
      batting: 0,
      fielding: 0,
      running: 0,
    };
    
    this.players.forEach((player) => {
      stats.pitching += player.pitching;
      stats.batting += player.batting;
      stats.fielding += player.fielding;
      stats.running += player.running;
    });
    
    // Average the stats
    const playerCount = this.players.length || 1;
    return {
      pitching: stats.pitching / playerCount,
      batting: stats.batting / playerCount,
      fielding: stats.fielding / playerCount,
      running: stats.running / playerCount,
    };
  }
  
  isValid(): boolean {
    return this.players.length === 9 && this.captain !== null;
  }
}