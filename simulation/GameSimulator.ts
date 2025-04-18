import { Team } from "../models/Player.ts";

// Game simulator to determine winners
export class GameSimulator {
  simulateInning(battingTeam: Team, pitchingTeam: Team): number {
    // Simple simulation based on team stats
    const battingStrength = battingTeam.getStats().batting;
    const pitchingStrength = pitchingTeam.getStats().pitching;
    const fieldingStrength = pitchingTeam.getStats().fielding;
    
    // Calculate run probability
    let runProbability = (battingStrength - pitchingStrength * 0.7) / 10;
    runProbability = Math.max(0.05, Math.min(0.4, runProbability)); // Clamp between 5% and 40%
    
    // Calculate runs scored in this inning
    let runs = 0;
    for (let i = 0; i < 3; i++) { // Simplified: 3 at-bats per inning
      if (Math.random() < runProbability) {
        // Determine how many runs (1-3 based on batting vs fielding)
        const runMultiplier = Math.random() * (battingStrength / fieldingStrength);
        runs += Math.floor(runMultiplier * 3) + 1;
      }
    }
    
    return runs;
  }
  
  // Simulate a full game between two teams
  simulateGame(teamA: Team, teamB: Team): [Team, Team, number, number] {
    if (!teamA.isValid() || !teamB.isValid()) {
      throw new Error("Teams must have 9 players and a captain");
    }
    
    let teamAScore = 0;
    let teamBScore = 0;
    
    // Simulate 9 innings
    for (let inning = 0; inning < 9; inning++) {
      // Team A bats
      teamAScore += this.simulateInning(teamA, teamB);
      
      // Team B bats
      teamBScore += this.simulateInning(teamB, teamA);
    }
    
    // Return winner, loser, and scores
    if (teamAScore > teamBScore) {
      return [teamA, teamB, teamAScore, teamBScore];
    } else if (teamBScore > teamAScore) {
      return [teamB, teamA, teamBScore, teamAScore];
    } else {
      // In case of a tie, simulate extra innings
      let extraInning = 0;
      while (teamAScore === teamBScore && extraInning < 3) {
        teamAScore += this.simulateInning(teamA, teamB);
        teamBScore += this.simulateInning(teamB, teamA);
        extraInning++;
      }
      
      // If still tied, pick a random winner
      if (teamAScore === teamBScore) {
        return Math.random() < 0.5 
          ? [teamA, teamB, teamAScore + 1, teamBScore]
          : [teamB, teamA, teamBScore + 1, teamAScore];
      } else if (teamAScore > teamBScore) {
        return [teamA, teamB, teamAScore, teamBScore];
      } else {
        return [teamB, teamA, teamBScore, teamAScore];
      }
    }
  }
}