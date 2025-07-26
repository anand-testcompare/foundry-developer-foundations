# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foundry Developer Foundations is a monorepo implementing the **Foundry-backed / GitHub-native** collaboration pattern. It contains three TypeScript projects:

1. **foundry-tracing-foundations** - Open tracing implementation for Palantir Foundry
2. **hello-world** - Reference implementation demonstrating the pattern
3. **x-reason-node** - AI reasoning engine with state machines and various integrations

## Development Commands

Each project uses consistent npm scripts:

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint

# Build for production
npm run build

# Build Docker image (requires build first)
npm run build:docker

# Clean build artifacts
npm run clean
```

## Architecture Patterns

### Dependency Injection

All projects use Inversify for IoC. Services and DAOs are bound in DI containers:

- Look for `container.ts` files for binding configurations
- Use `@injectable()` and `@inject()` decorators

### DAO Pattern

Data access is abstracted through DAOs that provide clean entity interfaces:

- DAOs are in `domain/` directories (e.g., `userDao.ts`, `worldDao.ts`)
- Pattern: entities in → entities out, allowing backend swapping

### Service Layer

External integrations are abstracted in service classes:

- Foundry integration: `foundryClient.ts`
- AI services: `geminiService.ts`, `openAIService.ts`
- Communication: `slack.ts`, `email.ts`

### Tracing

Projects use decorator-based tracing:

- `@Trace` decorator on classes
- `@TraceSpan` decorator on methods
- OpenTelemetry-style implementation

### State Machines (x-reason-node)

Complex workflows use XState:

- Machine definitions in `machines/` directory
- AI-driven state transitions

## Testing

```bash
# Run a single test file
npm test -- path/to/test.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="pattern"

# Debug tests
npm test -- --detectOpenHandles
```

Tests use Jest with TypeScript support. E2E tests require environment variables.

## Environment Configuration

Create `.env` files with:

- `FOUNDRY_CLIENT_ID` and `FOUNDRY_CLIENT_SECRET` - OSDK credentials
- `FOUNDRY_STACK_URL` - Foundry stack URL (use localhost for mocks)
- Service-specific keys (OpenAI, Google, Slack, etc.)
- Ontology identifiers

## Foundry Integration

The pattern isolates Foundry specifics:

1. **Compute Modules** - Function-based abstraction in Foundry
2. **DAOs** - Clean interfaces hiding Foundry implementation
3. **Mocks** - Local Foundry API mock server for development without stack access

## Build Output

- TypeScript projects compile to `dist/` directories
- Docker images can be built with `npm run build:docker`
- Published packages use `tsup` or `tsc` for bundling
