// Define common types used across the application

// Player interface defines the baseball player properties
export interface Player {
  id: number;
  name: string;
  pitching: number;
  batting: number;
  fielding: number;
  running: number;
  image: string;
  isCaptain: boolean;
}

// Generation Result data for tracking simulation progress
export interface GenerationResult {
  generation: number;
  rankings: {
    agentId: number;
    teamName: string;
    wins: number;
    score: number;
    teamStats: {
      pitching: number;
      batting: number;
      fielding: number;
      running: number;
    };
  }[];
}