# Super Mario Sluggers Evolution Simulator

This project simulates the evolution of drafting strategies for Super Mario Sluggers teams using neural networks.

## How it Works

1. A drafting agent (the core of the algorithm) seeks to draft the best possible team using a convolutional neural network (synaptic.js). It evaluates players based on their stats and the team's current composition.

2. Eight instances of this agent are created with random neural network weights and biases.

3. The agents go through a "draft" where they each build a team of 9 players from the character roster in characterData.json.

4. A season's worth of games is simulated using player stats and a bit of random chance, with teams playing in a round-robin tournament.

5. At the end of the season, the top three agents survive to the next generation:

   - They create three new agents with slightly mutated weights
   - One agent with random weights plays every round

6. The draft and simulation process repeats for multiple generations.

## Running the Project

### CLI Mode

```bash
# Run the simulation in terminal
deno task start

# Run tests
deno task test
```

## Project Structure

### Core Files

- `main.ts` - Core implementation with all classes and simulation logic
- `characterData.json` - Player data with stats for all characters
- `main_test.ts` - Unit tests for all components of the simulator

## Neural Network Design

The drafting agent uses a neural network with:

- Input layer: Player stats (pitching, batting, fielding, running) + current team stats
- Hidden layers: Two layers with 10 and 5 neurons
- Output: A single value representing the "desirability" of a player

Each generation, the neural networks are mutated slightly to evolve better drafting strategies.

## Game Simulation

The game simulator calculates run probabilities based on:

- Batting team's batting strength vs. pitching team's pitching strength
- Fielding stats to determine run prevention
- Random elements to simulate unpredictability

## Classes

- `Team` - Manages a team of players and calculates team statistics
- `DraftingAgent` - Uses a neural network to draft players
- `GameSimulator` - Simulates games between teams
- `Tournament` - Handles the drafting process and runs games between teams
- `EvolutionSimulator` - Manages the overall evolution process across generations
