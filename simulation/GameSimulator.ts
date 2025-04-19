import { Team } from "../models/Player.ts";
import { Player, PlayerStatistics } from "../types.ts";

// Game simulator to determine winners
export class GameSimulator {
  // Game statistics tracking
  private gameStats: Map<number, PlayerStatistics> = new Map();

  private teamABatterIndex: number = 0;
  private teamBBatterIndex: number = 0;

  // Helper method to find the best pitcher in a team
  private getBestPitcher(team: Team): Player {
    return team.players.reduce((bestPitcher, player) => {
      return player.pitching > bestPitcher.pitching ? player : bestPitcher;
    }, team.players[0]);
  }

  // Calculate hit probability based on batter vs pitcher matchup
  private calculateHitProbability(batter: Player, pitcher: Player): number {
    // Factor in batter's batting skill vs pitcher's pitching skill
    const matchupAdvantage = (batter.batting - pitcher.pitching * 0.8) / 100;
    // Base probability adjusted by matchup
    const probability = 0.3 + matchupAdvantage;
    // Clamp between 10% and 50%
    return Math.max(0.1, Math.min(0.5, probability));
  }

  // Determine the type of hit based on batter's skill
  private determineHitType(batter: Player, fieldingStrength: number): string {
    const random = Math.random();
    // Adjust probabilities based on batter's skill and fielding strength
    const powerFactor = batter.batting / (fieldingStrength * 0.5);

    // Use powerFactor to adjust hit type probabilities
    // Higher batting skill relative to fielding increases chances of extra-base hits
    if (random < 0.6 / powerFactor) {
      return "single"; // Most common hit
    } else if (random < (0.85 - (powerFactor * 0.05))) {
      return "double";
    } else if (random < (0.95 - (powerFactor * 0.02))) {
      return "triple";
    } else {
      return "homerun"; // Least common hit, more likely with higher powerFactor
    }
  }

  // Process base runners after a hit
  private processBaseRunners(
    hitType: string,
    bases: boolean[],
  ): [boolean[], number] {
    // bases[0] = first base, bases[1] = second base, bases[2] = third base
    let runs = 0;
    const newBases = [...bases];

    switch (hitType) {
      case "homerun":
        // Count runners on base plus batter
        runs = bases.filter((base) => base).length + 1;
        // Clear bases
        newBases[0] = false;
        newBases[1] = false;
        newBases[2] = false;
        break;

      case "triple":
        // All runners score
        runs = bases.filter((base) => base).length;
        // Clear bases and put runner on third
        newBases[0] = false;
        newBases[1] = false;
        newBases[2] = true;
        break;

      case "double":
        // Runners on second and third score
        if (bases[1]) runs++;
        if (bases[2]) runs++;
        // Runner on first goes to third
        newBases[2] = bases[0];
        // Batter on second
        newBases[1] = true;
        // First base empty
        newBases[0] = false;
        break;

      case "single":
        // Runner on third scores
        if (bases[2]) runs++;
        // Runner on second goes to third
        newBases[2] = bases[1];
        // Runner on first goes to second
        newBases[1] = bases[0];
        // Batter on first
        newBases[0] = true;
        break;
    }

    return [newBases, runs];
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
        hits: 0,
        runs: 0,
        inningsPitched: 0,
        strikeouts: 0,
      });
    }

    // Add one inning pitched to the pitcher's stats
    const pitcherStats = this.gameStats.get(designatedPitcher.id)!;
    pitcherStats.inningsPitched += 1;

    // Initialize bases (first, second, third)
    let bases: boolean[] = [false, false, false];
    let outs = 0;

    // Use the correct batting index based on which team is batting
    let batterIndex = battingTeam === this.teamA
      ? this.teamABatterIndex
      : this.teamBBatterIndex;

    // Continue until 3 outs
    while (outs < 3) {
      // Get current batter (rotating through the lineup)
      const batter =
        battingTeam.players[batterIndex % battingTeam.players.length];
      batterIndex++;

      // Initialize or update batter stats
      if (!this.gameStats.has(batter.id)) {
        this.gameStats.set(batter.id, {
          playerId: batter.id,
          playerName: batter.name,
          atBats: 0,
          hits: 0,
          runs: 0,
          inningsPitched: 0,
          strikeouts: 0,
        });
      }

      // Update at-bats count for the batter
      const batterStats = this.gameStats.get(batter.id)!;
      batterStats.atBats += 1;

      // Calculate hit probability
      const hitProbability = this.calculateHitProbability(
        batter,
        designatedPitcher,
      );

      // Determine if the batter gets a hit
      if (Math.random() < hitProbability) {
        // Determine hit type
        const hitType = this.determineHitType(batter, fieldingStrength);

        // Update hits for the batter
        batterStats.hits = (batterStats.hits || 0) + 1;

        // Process base runners and calculate runs
        const [newBases, runsScored] = this.processBaseRunners(hitType, bases);
        bases = newBases;
        runs += runsScored;

        // Update runs for the batter if it's a home run
        if (hitType === "homerun") {
          batterStats.runs = (batterStats.runs || 0) + 1;
        }

        // Update runs for any players who scored
        if (runsScored > 0) {
          batterStats.runs = (batterStats.runs || 0) +
            (hitType === "homerun" ? 0 : runsScored);
        }

        inningResults.push(
          `${batter.name} hit a ${hitType}${
            runsScored > 0 ? ` scoring ${runsScored} run(s)` : ""
          }`,
        );
      } else {
        // Batter is out
        outs++;

        // Update strikeouts for the pitcher
        pitcherStats.strikeouts += 1;

        inningResults.push(
          `${batter.name} was struck out by pitcher ${designatedPitcher.name}`,
        );
      }
    }

    // Save the updated batting index for next inning
    if (battingTeam === this.teamA) {
      this.teamABatterIndex = batterIndex;
    } else {
      this.teamBBatterIndex = batterIndex;
    }

    // Print inning results
    console.log(`\n${battingTeam.name} batting:`);
    console.log(
      `Pitcher: ${designatedPitcher.name} (${designatedPitcher.pitching} pitching)`,
    );
    inningResults.forEach((result) => console.log(result));
    console.log(`Total runs this inning: ${runs}`);

    return runs;
  }

  // Simulate a full game between two teams
  simulateGame(
    teamA: Team,
    teamB: Team,
  ): [Team, Team, number, number, Map<number, PlayerStatistics>] {
    if (!teamA.isValid() || !teamB.isValid()) {
      throw new Error("Teams must have 9 players and a captain");
    }

    // Reset game statistics
    this.gameStats = new Map();

    // Reset game statistics and batting indexes
    this.gameStats = new Map();
    this.teamA = teamA;
    this.teamB = teamB;
    this.teamABatterIndex = 0;
    this.teamBBatterIndex = 0;

    let teamAScore = 0;
    let teamBScore = 0;

    // Simulate 9 innings
    for (let inning = 0; inning < 9; inning++) {
      console.log(`\n=== INNING ${inning + 1} ===`);

      // Team A bats
      const teamARuns = this.simulateInning(teamA, teamB);
      teamAScore += teamARuns;

      // Team B bats
      const teamBRuns = this.simulateInning(teamB, teamA);
      teamBScore += teamBRuns;

      console.log(
        `\nScore after inning ${
          inning + 1
        }: (${teamA.name}) ${teamAScore} - ${teamBScore} (${teamB.name})`,
      );
    }

    // Continue with extra innings if tied
    if (teamAScore === teamBScore) {
      console.log("\nTie game! Going to extra innings...");

      // In case of a tie, simulate extra innings
      let extraInning = 0;
      while (teamAScore === teamBScore && extraInning < 3) {
        extraInning++;
        console.log(`\n=== EXTRA INNING ${extraInning} ===`);

        teamAScore += this.simulateInning(teamA, teamB);
        teamBScore += this.simulateInning(teamB, teamA);

        console.log(
          `\nScore after extra inning ${extraInning}: (${teamA.name}) ${teamAScore} - ${teamBScore} (${teamB.name})`,
        );
      }

      // If still tied, pick a random winner
      if (teamAScore === teamBScore) {
        const randomWinner = Math.random() < 0.5;
        if (randomWinner) {
          console.log(
            `\nStill tied after extra innings! ${teamA.name} wins by random chance`,
          );
          return [teamA, teamB, teamAScore + 1, teamBScore, this.gameStats];
        } else {
          console.log(
            `\nStill tied after extra innings! ${teamB.name} wins by random chance`,
          );
          return [teamB, teamA, teamBScore + 1, teamAScore, this.gameStats];
        }
      }
    }

    // Return winner, loser, scores, and player statistics
    if (teamAScore > teamBScore) {
      console.log(`\n${teamA.name} wins ${teamAScore}-${teamBScore}`);
      return [teamA, teamB, teamAScore, teamBScore, this.gameStats];
    } else {
      console.log(`\n${teamB.name} wins ${teamBScore}-${teamAScore}`);
      return [teamB, teamA, teamBScore, teamAScore, this.gameStats];
    }
  }

  // Get the current game statistics
  getGameStats(): Map<number, PlayerStatistics> {
    return this.gameStats;
  }

  // Add a property to store references to the teams
  private teamA: Team | null = null;
  private teamB: Team | null = null;
}
