import { assertEquals, assertNotEquals, assert } from "@std/assert";
import {
  Team,
  DraftingAgent,
  GameSimulator,
  Tournament,
  EvolutionSimulator,
  type Player
} from "./main.ts";

// Mock player data for tests
const mockPlayers: Player[] = [
  {
    id: 1,
    name: "Mario",
    pitching: 6,
    batting: 7,
    fielding: 6,
    running: 7,
    image: "mario.png",
    isCaptain: true
  },
  {
    id: 2,
    name: "Luigi",
    pitching: 6,
    batting: 6,
    fielding: 7,
    running: 7,
    image: "luigi.png",
    isCaptain: true
  },
  {
    id: 3,
    name: "Yoshi",
    pitching: 4,
    batting: 4,
    fielding: 6,
    running: 9,
    image: "yoshi.png",
    isCaptain: true
  },
  {
    id: 4,
    name: "Bowser",
    pitching: 5,
    batting: 10,
    fielding: 3,
    running: 3,
    image: "bowser.png",
    isCaptain: true
  },
  {
    id: 5,
    name: "Toad",
    pitching: 5,
    batting: 5,
    fielding: 3,
    running: 7,
    image: "toad.png",
    isCaptain: false
  },
  {
    id: 6,
    name: "Boo",
    pitching: 9,
    batting: 3,
    fielding: 3,
    running: 5,
    image: "boo.png",
    isCaptain: false
  },
  {
    id: 7,
    name: "Koopa",
    pitching: 3,
    batting: 6,
    fielding: 4,
    running: 6,
    image: "koopa.png",
    isCaptain: false
  },
  {
    id: 8,
    name: "Shy Guy",
    pitching: 4,
    batting: 5,
    fielding: 7,
    running: 4,
    image: "shyguy.png",
    isCaptain: false
  },
  {
    id: 9,
    name: "Goomba",
    pitching: 6,
    batting: 3,
    fielding: 6,
    running: 4,
    image: "goomba.png",
    isCaptain: false
  },
  {
    id: 10,
    name: "Daisy",
    pitching: 7,
    batting: 6,
    fielding: 8,
    running: 5,
    image: "daisy.png",
    isCaptain: true
  },
];

// Test Team class
Deno.test("Team creation and player addition", () => {
  const team = new Team("Test Team");
  assertEquals(team.name, "Test Team");
  assertEquals(team.players.length, 0);
  assertEquals(team.captain, null);
  
  // Add a captain
  team.addPlayer(mockPlayers[0]);
  assertEquals(team.players.length, 1);
  assertEquals(team.captain, mockPlayers[0]);
  
  // Add non-captain
  team.addPlayer(mockPlayers[4]);
  assertEquals(team.players.length, 2);
  assertEquals(team.captain, mockPlayers[0]); // Captain shouldn't change
  
  // Team should not be valid until it has 9 players
  assert(!team.isValid());
  
  // Add 7 more players to reach 9
  for (let i = 5; i < 12; i++) {
    if (i < mockPlayers.length) {
      team.addPlayer(mockPlayers[i % mockPlayers.length]);
    } else {
      team.addPlayer(mockPlayers[i % mockPlayers.length]);
    }
  }
  
  assertEquals(team.players.length, 9);
  assert(team.isValid());
  
  // Try adding one more player (should fail)
  const result = team.addPlayer(mockPlayers[3]);
  assertEquals(result, false);
  assertEquals(team.players.length, 9); // Should still be 9
});

Deno.test("Team stats calculation", () => {
  const team = new Team("Stats Test");
  
  // Empty team should have 0 stats
  const emptyStats = team.getStats();
  assertEquals(emptyStats.batting, 0);
  assertEquals(emptyStats.pitching, 0);
  assertEquals(emptyStats.fielding, 0);
  assertEquals(emptyStats.running, 0);
  
  // Add 3 players
  team.addPlayer(mockPlayers[0]); // Mario
  team.addPlayer(mockPlayers[1]); // Luigi
  team.addPlayer(mockPlayers[2]); // Yoshi
  
  const stats = team.getStats();
  assertEquals(stats.pitching, (6 + 6 + 4) / 3);
  assertEquals(stats.batting, (7 + 6 + 4) / 3);
  assertEquals(stats.fielding, (6 + 7 + 6) / 3);
  assertEquals(stats.running, (7 + 7 + 9) / 3);
});

// Test DraftingAgent class
Deno.test("DraftingAgent creation and player drafting", () => {
  const agent = new DraftingAgent(1);
  assertEquals(agent.id, 1);
  assertEquals(agent.team.name, "Team 1");
  
  // Test drafting
  const draftedPlayer = agent.draftPlayer(mockPlayers);
  assert(draftedPlayer !== null);
  assertEquals(agent.team.players.length, 1);
  
  // The agent should draft a player from the available pool
  assert(mockPlayers.some(p => p.id === draftedPlayer!.id));
});

Deno.test("DraftingAgent reproduction", () => {
  const agent = new DraftingAgent(1);
  const child = agent.reproduce();
  
  assertEquals(child.id, 1); // ID should be inherited
  assertEquals(child.team.name, "Team 1");
  assertEquals(child.team.players.length, 0); // Team should be reset
  
  // Networks should be different due to mutation
  assertNotEquals(agent.network, child.network);
  
  // More detailed network comparison would be complex due to neural network structure
});

// Test GameSimulator class
Deno.test("GameSimulator inning simulation", () => {
  const simulator = new GameSimulator();
  
  // Create two teams
  const teamA = new Team("Team A");
  const teamB = new Team("Team B");
  
  // Add players to both teams to make them valid
  for (let i = 0; i < 9; i++) {
    teamA.addPlayer(mockPlayers[i % mockPlayers.length]);
    teamB.addPlayer(mockPlayers[(i + 5) % mockPlayers.length]);
  }
  
  // Test inning simulation
  const runs = simulator.simulateInning(teamA, teamB);
  assert(typeof runs === "number");
  assert(runs >= 0); // Should never be negative runs
});

Deno.test("GameSimulator full game", () => {
  const simulator = new GameSimulator();
  
  // Create two teams
  const teamA = new Team("Team A");
  const teamB = new Team("Team B");
  
  // Add players to both teams to make them valid
  for (let i = 0; i < 9; i++) {
    teamA.addPlayer(mockPlayers[i % mockPlayers.length]);
    teamB.addPlayer(mockPlayers[(i + 5) % mockPlayers.length]);
  }
  
  // Simulate a game
  const [winner, loser, winnerScore, loserScore] = simulator.simulateGame(teamA, teamB);
  
  // Verify game results
  assert(winner === teamA || winner === teamB);
  assert(loser === teamA || loser === teamB);
  assert(winner !== loser);
  assert(winnerScore > loserScore);
});

// Test Tournament class
Deno.test("Tournament drafting process", () => {
  // Manually seed mock players for the tournament to use
  // This avoids issues with loading from real data file
  const tournamentPlayers = [...mockPlayers];
  
  // Create agents
  const agents = [
    new DraftingAgent(0),
    new DraftingAgent(1),
  ];
  
  // Create a tournament with our mock data
  const tournament = new Tournament(agents, tournamentPlayers);
  
  // Override the tournament loadPlayers method to use our mock data
  tournament.loadPlayers = () => tournamentPlayers;
  
  // Run the draft
  tournament.runDraft();
  
  // Each agent should have some players
  agents.forEach(agent => {
    assert(agent.team.players.length > 0);
  });
  
  // Check that players were drafted
  assert(tournament.availablePlayers.length < tournamentPlayers.length);
});

Deno.test("Tournament generation", () => {
  // Create agents
  const agents = [
    new DraftingAgent(0),
    new DraftingAgent(1),
    new DraftingAgent(2),
    new DraftingAgent(3),
  ];
  
  // Manually build valid teams for testing
  agents.forEach(agent => {
    // Add 9 players to each team including at least one captain
    for (let i = 0; i < 9; i++) {
      agent.team.addPlayer(mockPlayers[i % mockPlayers.length]);
    }
    // Verify teams are valid
    assert(agent.team.isValid());
  });
  
  const tournament = new Tournament(agents, mockPlayers);
  
  // Override the draft process to use our pre-built teams
  tournament.runDraft = () => {};
  
  // Run a generation
  const rankedAgents = tournament.runGeneration();
  
  // Should return agents ranked by performance
  assertEquals(rankedAgents.length, agents.length);
  
  // Create next generation 
  // Note: agents.length is 4, but our algorithm creates 7 agents from the top 4
  // (The #1 team gets 4 children, and #2-4 each get 1 child)
  const nextGen = tournament.createNextGeneration(rankedAgents);
  
  // IDs should be sequential
  nextGen.forEach((agent, index) => {
    assertEquals(agent.id, index);
  });
});

// Integration test for the evolution process
Deno.test("Evolution simulation runs for multiple generations", async () => {
  // Create a small simulation with just 2 generations for testing
  const simulator = new EvolutionSimulator(4, 2);
  
  // Override tournament functionality for testing
  simulator.tournament.runDraft = () => {
    // Manually build valid teams for agents
    simulator.tournament.agents.forEach(agent => {
      // Reset the team
      agent.resetTeam();
      // Add 9 players to each team including at least one captain
      for (let i = 0; i < 9; i++) {
        agent.team.addPlayer(mockPlayers[i % mockPlayers.length]);
      }
      // Verify teams are valid
      assert(agent.team.isValid());
    });
  };
  
  // This shouldn't throw any errors now
  await simulator.runSimulation();
  
  // After running, we should be at the final generation
  assertEquals(simulator.generation, 1); // 0-indexed, so generation 1 is the 2nd one
});