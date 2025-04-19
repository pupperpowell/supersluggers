import { Team } from "../models/Player.ts";
import { Player, PlayerStatistics } from "../types.ts";

// Game simulator to determine winners
export class GameSimulator {
  // Game statistics tracking
  private gameStats: Map<number, PlayerStatistics> = new Map();
  
  // Helper method to find the best pitcher in a team
  private getBestPitcher(team: Team): Player {
    return team.players.reduce((bestPitcher, player) => {
      return player.pitching > bestPitcher.pitching ? player : bestPitcher;
    }, team.players[0]);
  }

  // TODO: calculate single, double, triple, or run?

  // Calculate run probability based on batter vs pitcher matchup
  private calculateRunProbability(batter: Player, pitcher: Player): number {
    // Factor in batter's batting skill vs pitcher's pitching skill
    const matchupAdvantage = (batter.batting - pitcher.pitching * 0.8) / 100;
    // Base probability adjusted by matchup
    const probability = 0.2 + matchupAdvantage;
    // Clamp between 5% and 40%
    return Math.max(0.05, Math.min(0.4, probability));
  }

  simulateInning(battingTeam: Team, pitchingTeam: Team): number {
    // Designate the best pitcher from the pitching team
    const designatedPitcher = this.getBestPitcher(pitchingTeam);
    const fieldingStrength = pitchingTeam.getStats().fielding;
    
    // Track inning results
    let runs = 0;
    const inningResults: string[] = [];
    
    // Initialize or update pitcher stats
    if (!this.gameStats.has(designatedPitcher.id)) {
      this.gameStats.set(designatedPitcher.id, {
        playerId: designatedPitcher.id,
        playerName: designatedPitcher.name,
        atBats: 0,
        runs: 0,
        inningsPitched: 0,
        strikeouts: 0
      });
    }
    
    // Add one inning pitched to the pitcher's stats
    const pitcherStats = this.gameStats.get(designatedPitcher.id)!;
    pitcherStats.inningsPitched += 1;
    
    // Each player gets a chance to bat
    for (let i = 0; i < Math.min(3, battingTeam.players.length); i++) {
      // Get current batter (rotating through the lineup)
      const batter = battingTeam.players[i];
      
      // Initialize or update batter stats
      if (!this.gameStats.has(batter.id)) {
        this.gameStats.set(batter.id, {
          playerId: batter.id,
          playerName: batter.name,
          atBats: 0,
          runs: 0,
          inningsPitched: 0,
          strikeouts: 0
        });
      }
      
      // Update at-bats count for the batter
      const batterStats = this.gameStats.get(batter.id)!;
      batterStats.atBats += 1;
      
      // Calculate personalized run probability
      const runProbability = this.calculateRunProbability(batter, designatedPitcher);
      
      // Determine if the batter scores
      if (Math.random() < runProbability) {
        // Determine how many runs (1-3 based on batter's skills vs fielding)
        const runMultiplier = Math.random() * (batter.batting / fieldingStrength);
        const runsScored = Math.floor(runMultiplier * 3) + 1;
        runs += runsScored;
        
        // Update runs for the batter
        batterStats.runs += runsScored;
        
        inningResults.push(`${batter.name} scored ${runsScored} run(s) against pitcher ${designatedPitcher.name}`);
      } else {
        // Update strikeouts for the pitcher
        pitcherStats.strikeouts += 1;
        
        inningResults.push(`${batter.name} was struck out by pitcher ${designatedPitcher.name}`);
      }
    }
    
    // Print inning results
    // console.log(`\n${battingTeam.name} batting:`);
    // console.log(`Pitcher: ${designatedPitcher.name} (${designatedPitcher.pitching} pitching)`);
    // inningResults.forEach(result => console.log(result));
    // console.log(`Total runs this inning: ${runs}`);
    
    return runs;
  }
  
  // Simulate a full game between two teams
  simulateGame(teamA: Team, teamB: Team): [Team, Team, number, number, Map<number, PlayerStatistics>] {
    if (!teamA.isValid() || !teamB.isValid()) {
      throw new Error("Teams must have 9 players and a captain");
    }
    
    // Reset game statistics
    this.gameStats = new Map();
    
    let teamAScore = 0;
    let teamBScore = 0;
    
    // Simulate 9 innings
    for (let inning = 0; inning < 9; inning++) {
      // console.log(`\n=== INNING ${inning + 1} ===`);
      
      // Team A bats
      const teamARuns = this.simulateInning(teamA, teamB);
      teamAScore += teamARuns;
      
      // Team B bats
      const teamBRuns = this.simulateInning(teamB, teamA);
      teamBScore += teamBRuns;
      
      // console.log(`\nScore after inning ${inning + 1}: ${teamA.name} ${teamAScore} - ${teamBScore} ${teamB.name}`);
    }
    
    // Continue with extra innings if tied
    if (teamAScore === teamBScore) {
      // console.log("\nTie game! Going to extra innings...");
      
      // In case of a tie, simulate extra innings
      let extraInning = 0;
      while (teamAScore === teamBScore && extraInning < 3) {
        extraInning++;
        // console.log(`\n=== EXTRA INNING ${extraInning} ===`);
        
        teamAScore += this.simulateInning(teamA, teamB);
        teamBScore += this.simulateInning(teamB, teamA);
        
        // console.log(`\nScore after extra inning ${extraInning}: ${teamA.name} ${teamAScore} - ${teamBScore} ${teamB.name}`);
      }
      
      // If still tied, pick a random winner
      if (teamAScore === teamBScore) {
        const randomWinner = Math.random() < 0.5;
        if (randomWinner) {
          // console.log(`\nStill tied after extra innings! ${teamA.name} wins by random chance`);
          return [teamA, teamB, teamAScore + 1, teamBScore, this.gameStats];
        } else {
          // console.log(`\nStill tied after extra innings! ${teamB.name} wins by random chance`);
          return [teamB, teamA, teamBScore + 1, teamAScore, this.gameStats];
        }
      }
    }
    
    // Return winner, loser, scores, and player statistics
    if (teamAScore > teamBScore) {
      // console.log(`\n${teamA.name} wins ${teamAScore}-${teamBScore}`);
      return [teamA, teamB, teamAScore, teamBScore, this.gameStats];
    } else {
      // console.log(`\n${teamB.name} wins ${teamBScore}-${teamAScore}`);
      return [teamB, teamA, teamBScore, teamAScore, this.gameStats];
    }
  }
  
  // Get the current game statistics
  getGameStats(): Map<number, PlayerStatistics> {
    return this.gameStats;
  }
}