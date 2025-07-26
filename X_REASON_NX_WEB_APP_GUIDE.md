# X-Reason Web App with Nx Implementation Guide

This guide explains how to create an Nx-based web app that implements the X-Reason features within your existing repository structure, in a separate folder.

## Prerequisites

Before following this guide, ensure you have:

- Node.js 18+ installed
- Access to a Palantir Foundry instance
- The core environment variables outlined in the [main X-Reason guide](./X_REASON_WEB_APP_GUIDE.md#core-vs-optional-dependencies)

## Nx Setup

### 1. Install Nx in Your Repository

From your repository root (`/Users/anandpant/Development/ontologyrx/foundry-developer-foundations`):

```bash
# Install Nx globally (optional but recommended)
npm install -g nx

# Initialize Nx workspace (if not already done)
npx nx@latest init

# Add Nx to existing repo
npm install --save-dev nx @nx/workspace
```

### 2. Create the Web App

```bash
# Generate a new Next.js application
npx nx g @nx/next:app x-reason-demo --style=css --appDir=true

# Or generate a React + Vite application
npx nx g @nx/vite:app x-reason-demo --framework=react --bundler=vite
```

This creates your app in `apps/x-reason-demo/` (or similar based on your Nx configuration).

### 3. Nx Configuration

Update your `nx.json` to include the new project:

```json
{
  "projects": {
    "x-reason-demo": {
      "root": "apps/x-reason-demo",
      "projectType": "application",
      "sourceRoot": "apps/x-reason-demo/src",
      "targets": {
        "build": {
          "executor": "@nx/next:build",
          "options": {
            "outputPath": "dist/apps/x-reason-demo"
          }
        },
        "serve": {
          "executor": "@nx/next:serve",
          "options": {
            "buildTarget": "x-reason-demo:build",
            "dev": true
          }
        }
      }
    }
  }
}
```

## Project Structure (Nx-Specific)

Your Nx workspace will look like:

```text
foundry-developer-foundations/
├── apps/
│   └── x-reason-demo/                # Your new web app
│       ├── project.json
│       ├── next.config.js
│       ├── .env.local
│       └── src/
│           ├── app/                  # Next.js app router
│           ├── components/
│           └── lib/
├── libs/                             # Shared libraries (optional)
│   └── x-reason-shared/              # Shared X-Reason utilities
├── x-reason-node/                    # Existing x-reason implementation
├── nx.json
└── package.json
```

## Dependencies and Environment Setup

### 1. Install X-Reason Dependencies

Navigate to your app directory and install dependencies:

```bash
cd apps/x-reason-demo

# Install x-reason-node from your local workspace
npm install ../../../x-reason-node

# Install other required dependencies
npm install @palantir/osdk-client @palantir/osdk-api
npm install xstate @xstate/react
npm install inversify reflect-metadata
npm install @google/generative-ai  # or openai
npm install next react react-dom
npm install @types/node @types/react @types/react-dom typescript
```

### 2. Environment Configuration

Create `.env.local` in your app directory with the same environment variables from the [main guide](./X_REASON_WEB_APP_GUIDE.md#required-core-dependencies).

## Implementation

### Core Implementation Reference

For the core implementation details, **follow the main guide**: [X_REASON_WEB_APP_GUIDE.md](./X_REASON_WEB_APP_GUIDE.md)

The following sections from the main guide apply directly to your Nx app:

1. **[Architecture Overview](./X_REASON_WEB_APP_GUIDE.md#architecture-overview)** - Same concepts apply
2. **[Core vs Optional Dependencies](./X_REASON_WEB_APP_GUIDE.md#core-vs-optional-dependencies)** - Use the same environment variables
3. **[Implementation Steps](./X_REASON_WEB_APP_GUIDE.md#implementation-steps)** - Follow all code examples
4. **[Custom Agents](./X_REASON_WEB_APP_GUIDE.md#custom-agents)** - Same implementation
5. **[Custom Functions](./X_REASON_WEB_APP_GUIDE.md#custom-functions)** - Same patterns
6. **[UI Components](./X_REASON_WEB_APP_GUIDE.md#ui-components)** - Same React components

### Nx-Specific Adjustments

#### 1. Import Path Adjustments

When importing from x-reason-node, use relative paths:

```typescript
// In your Nx app files
import { Text2Action, BaseTypes } from '../../../x-reason-node/src';
import { createContainer } from '../../../x-reason-node/src/container';
```

#### 2. Shared Libraries (Optional)

If you want to create reusable X-Reason utilities across multiple apps:

```bash
# Generate a shared library
npx nx g @nx/js:lib x-reason-shared

# Move common utilities to libs/x-reason-shared/src/lib/
```

Then import from the shared library:

```typescript
import { MySharedUtility } from '@your-org/x-reason-shared';
```

## Running Your App

### Development

```bash
# From repository root
nx serve x-reason-demo

# Or from app directory
cd apps/x-reason-demo
npm run dev
```

### Building

```bash
# From repository root
nx build x-reason-demo

# Or from app directory
cd apps/x-reason-demo
npm run build
```

## Testing

Follow the same testing patterns from the [main guide](./X_REASON_WEB_APP_GUIDE.md#testing), but run tests with Nx:

```bash
# Run tests for your app
nx test x-reason-demo

# Run all tests in workspace
nx run-many --target=test
```

## Deployment

### Nx Cloud (Optional)

For enhanced CI/CD and caching:

```bash
npx nx connect-to-nx-cloud
```

### Standard Deployment

Follow the same deployment steps from the [main guide](./X_REASON_WEB_APP_GUIDE.md#deployment), but build using Nx:

```bash
nx build x-reason-demo
# Deploy contents of dist/apps/x-reason-demo
```

## Benefits of Nx Approach

1. **Monorepo Management**: Keep everything in one repository
2. **Code Sharing**: Share utilities between multiple apps
3. **Consistent Tooling**: Unified build, test, and lint processes
4. **Incremental Builds**: Only rebuild what changed
5. **Dependency Graph**: Visualize project relationships

## Next Steps

1. Follow the [main implementation guide](./X_REASON_WEB_APP_GUIDE.md) for all core functionality
2. Customize your agents and functions for your specific use case
3. Consider creating shared libraries for common X-Reason patterns
4. Set up CI/CD with Nx Cloud for optimal performance

## Troubleshooting

### Common Nx Issues

1. **Import Resolution**: Ensure TypeScript paths are configured correctly in `tsconfig.json`
2. **Environment Variables**: Make sure `.env.local` is in the correct app directory
3. **Build Errors**: Check that all dependencies are installed in the app directory

For X-Reason specific issues, refer to the [main guide's troubleshooting section](./X_REASON_WEB_APP_GUIDE.md#troubleshooting).
