import { EvolutionSimulator } from "./simulation/EvolutionSimulator.ts";

// Re-export all the types and classes for testing and UI
export { Team } from "./models/Player.ts";
export { DraftingAgent } from "./agents/DraftingAgent.ts";
export { GameSimulator } from "./simulation/GameSimulator.ts";
export { Tournament } from "./simulation/Tournament.ts";
export { EvolutionSimulator } from "./simulation/EvolutionSimulator.ts";
export type { GenerationResult, Player } from "./types.ts";

// Run as CLI or API server
async function main() {
  // Check if we're running in server mode
  // const args = Deno.args;
  // if (args.includes("--server")) {
  //   // Start the API server
  //   const portArg = args.find((arg) => arg.startsWith("--port="));
  //   const port = portArg ? parseInt(portArg.split("=")[1], 10) : 8000;

  //   await startServer(port);
  // } else {
  //   // Just run the simulation as CLI
  const simulator = new EvolutionSimulator();
  await simulator.runSimulation();
}

// Execute the main function when run directly
if (import.meta.main) {
  main();
}
