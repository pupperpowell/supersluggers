# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build/Run: `deno task dev` or `deno run --watch main.ts`
- Test: `deno test` or `deno test main_test.ts` for specific test
- Lint: `deno lint`
- Format: `deno fmt`

## Code Style Guidelines
- Use TypeScript types for all functions and variables
- Prefer async/await over callbacks
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Error handling: Use try/catch with specific error types
- Neural network code should use the synaptic.js library
- Keep functions small and focused on a single responsibility
- Follow object-oriented design for agent implementation
- JSON data uses snake_case property names
- Document complex algorithms with inline comments
- Import dependencies from the top of the file