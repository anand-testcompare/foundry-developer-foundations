# X-Reason Web App Implementation Guide

This guide explains how to create a separate web app that imports and extends x-reason-node without forking the monorepo.

## Architecture Overview

X-reason provides:

- **Text2Action** base class for AI agents
- **State machine infrastructure** (XState)
- **Reasoning engine** with AI integration
- **Function catalog system** for extensibility
- **Dependency injection container** (Inversify)

## Core vs Optional Dependencies

### REQUIRED (Core Dependencies)

```bash
# Foundry/OSDK - Core platform dependencies
FOUNDRY_STACK_URL=https://your-stack.palantirfoundry.com
OSDK_CLIENT_ID=your-client-id
OSDK_CLIENT_SECRET=your-client-secret
ONTOLOGY_RID=ri.ontology.main.ontology.your-ontology-id
ONTOLOGY_ID=your-ontology-id

# AI Services - Required for reasoning engine
GEMINI_API_KEY=your-gemini-api-key
# OR
OPEN_AI_KEY=your-openai-api-key

# Basic logging
LOG_PREFIX=your-app-name
NODE_ENV=development
```

### OPTIONAL (Can Be Mocked/Removed)

```bash
# Communication services (only if using Vickie/Bennie)
OFFICE_SERVICE_ACCOUNT=base64-encoded-service-account
GSUITE_SERVICE_ACCOUNT=base64-encoded-credentials
SLACK_BOT_TOKEN=your-slack-token
SLACK_BASE_URL=your-slack-workspace

# External APIs (only if using specific functions)
OPEN_WEATHER_API_KEY=weather-api-key
GOOGLE_SEARCH_API_KEY=search-api-key
GOOGLE_SEARCH_ENGINE_MARKETS=search-engine-id

# Secondary Foundry instance (only if using Rangr)
RANGR_OSDK_CLIENT_ID=secondary-client-id
RANGR_OSDK_CLIENT_SECRET=secondary-client-secret
RANGR_FOUNDRY_STACK_URL=secondary-foundry-url
RANGR_ONTOLOGY_RID=secondary-ontology-rid

# Testing
FOUNDRY_TEST_USER=test-user@example.com
```

## Project Structure

```text
your-state-machine-app/
├── package.json
├── next.config.js                    # or vite.config.ts
├── .env.local
├── src/
│   ├── app/                          # Next.js app router
│   │   ├── page.tsx
│   │   └── api/
│   │       └── agents/
│   │           ├── route.ts          # API routes for agents
│   │           └── [agentId]/
│   │               └── route.ts
│   ├── components/
│   │   ├── AgentPlayground.tsx
│   │   ├── StateMachineVisualizer.tsx
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── agents/                   # Your custom agents
│   │   │   ├── PharmaAgent.ts
│   │   │   ├── ClinicalTrialAgent.ts
│   │   │   └── index.ts
│   │   ├── functions/                # Your custom functions
│   │   │   ├── pharmaFunctions/
│   │   │   │   ├── AnalyzeCompound.ts
│   │   │   │   ├── RunAssay.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── reasoning/                # Custom reasoning contexts
│   │   │   └── contexts/
│   │   │       └── pharma/
│   │   │           ├── functionCatalog.ts
│   │   │           ├── implementation.v1.ts
│   │   │           └── metadata.ts
│   │   ├── services/                 # Custom services
│   │   │   ├── chemicalDbService.ts
│   │   │   └── mockServices.ts
│   │   ├── container.ts              # Extended DI container
│   │   ├── types.ts                  # Your custom types
│   │   └── utils.ts
│   └── hooks/
│       ├── useStateMachine.ts
│       └── useAgent.ts
└── public/
```

## Step-by-Step Implementation

### 1. Initialize Project

```bash
# Create Next.js app
npx create-next-app@latest your-state-machine-app --typescript --tailwind --app

cd your-state-machine-app

# Install x-reason and dependencies
npm install github:anand-testcompare/foundry-developer-foundations#master:x-reason-node
npm install github:anand-testcompare/foundry-developer-foundations#master:foundry-tracing-foundations

# Install additional UI dependencies
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install lucide-react
```

### 2. Environment Configuration

Create `.env.local`:

```bash
# Core Foundry dependencies
FOUNDRY_STACK_URL=https://your-stack.palantirfoundry.com
OSDK_CLIENT_ID=your-client-id
OSDK_CLIENT_SECRET=your-client-secret
ONTOLOGY_RID=ri.ontology.main.ontology.your-ontology-id
ONTOLOGY_ID=your-ontology-id

# AI Service (choose one)
GEMINI_API_KEY=your-gemini-api-key

# App configuration
LOG_PREFIX=pharma-state-machine-demo
NODE_ENV=development

# Optional: Mock external services
MOCK_EXTERNAL_SERVICES=true
```

### 3. Custom Types

Create `src/lib/types.ts`:

```typescript
import { TYPES as BASE_TYPES } from 'x-reason';

// Extend base types
export const TYPES = {
  ...BASE_TYPES,
  ChemicalDbService: Symbol.for("ChemicalDbService"),
  ClinicalDataService: Symbol.for("ClinicalDataService"),
  CompoundAnalyzer: Symbol.for("CompoundAnalyzer"),
} as const;

// Custom interfaces
export interface ChemicalCompound {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number;
  properties: Record<string, any>;
}

export interface AssayResult {
  compoundId: string;
  assayType: string;
  result: number;
  confidence: number;
  timestamp: Date;
}

export interface ChemicalDbService {
  searchCompounds(query: string): Promise<ChemicalCompound[]>;
  getCompound(id: string): Promise<ChemicalCompound | null>;
}

export interface ClinicalDataService {
  runAssay(compoundId: string, assayType: string): Promise<AssayResult>;
  getTrialData(compoundId: string): Promise<any[]>;
}
```

### 4. Mock Services (To Avoid External Dependencies)

Create `src/lib/services/mockServices.ts`:

```typescript
import { ChemicalDbService, ClinicalDataService, ChemicalCompound, AssayResult } from '../types';

export class MockChemicalDbService implements ChemicalDbService {
  private compounds: ChemicalCompound[] = [
    {
      id: 'comp-001',
      name: 'Aspirin',
      formula: 'C9H8O4',
      molecularWeight: 180.158,
      properties: { solubility: 'low', toxicity: 'low' }
    },
    {
      id: 'comp-002', 
      name: 'Ibuprofen',
      formula: 'C13H18O2',
      molecularWeight: 206.29,
      properties: { solubility: 'medium', toxicity: 'low' }
    }
  ];

  async searchCompounds(query: string): Promise<ChemicalCompound[]> {
    return this.compounds.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.formula.includes(query)
    );
  }

  async getCompound(id: string): Promise<ChemicalCompound | null> {
    return this.compounds.find(c => c.id === id) || null;
  }
}

export class MockClinicalDataService implements ClinicalDataService {
  async runAssay(compoundId: string, assayType: string): Promise<AssayResult> {
    // Simulate assay processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      compoundId,
      assayType,
      result: Math.random() * 100,
      confidence: 0.85 + Math.random() * 0.15,
      timestamp: new Date()
    };
  }

  async getTrialData(compoundId: string): Promise<any[]> {
    return [
      { phase: 'I', status: 'completed', efficacy: 0.72 },
      { phase: 'II', status: 'ongoing', efficacy: 0.68 }
    ];
  }
}

// Mock Office/Slack services to avoid external dependencies
export class MockOfficeService {
  async readEmailHistory() {
    return { messages: [] };
  }
  
  async sendEmail() {
    console.log('Mock: Email sent');
    return { id: 'mock-email-id' };
  }
}

export class MockSlackService {
  async sendMessage() {
    console.log('Mock: Slack message sent');
    return { success: true };
  }
}
```

### 5. Extended Dependency Injection Container

Create `src/lib/container.ts`:

```typescript
import "reflect-metadata";
import { Container } from "inversify";
import { container as baseContainer } from 'x-reason';
import { TYPES } from './types';
import { 
  MockChemicalDbService, 
  MockClinicalDataService,
  MockOfficeService,
  MockSlackService 
} from './services/mockServices';

// Create extended container
export const container = new Container();

// Load base container bindings
container.parent = baseContainer;

// Add your custom services
container.bind(TYPES.ChemicalDbService).to(MockChemicalDbService).inSingletonScope();
container.bind(TYPES.ClinicalDataService).to(MockClinicalDataService).inSingletonScope();

// Override external services with mocks if needed
if (process.env.MOCK_EXTERNAL_SERVICES === 'true') {
  container.rebind(TYPES.OfficeService).to(MockOfficeService).inSingletonScope();
  container.rebind(TYPES.MessageService).to(MockSlackService).inSingletonScope();
}
```

### 6. Custom Functions

Create `src/lib/functions/pharmaFunctions/AnalyzeCompound.ts`:

```typescript
import { Context, MachineEvent } from 'x-reason';
import { container } from '../../container';
import { TYPES, ChemicalDbService } from '../../types';

export async function analyzeCompound(
  context: Context, 
  event?: MachineEvent, 
  task?: string
): Promise<{ compounds: any[], analysis: string }> {
  const chemicalDb = container.get<ChemicalDbService>(TYPES.ChemicalDbService);
  
  // Extract compound query from context or event
  const query = context.userInput || event?.data?.query || 'aspirin';
  
  // Search for compounds
  const compounds = await chemicalDb.searchCompounds(query);
  
  // Generate analysis
  const analysis = compounds.length > 0 
    ? `Found ${compounds.length} compounds matching "${query}". Primary compound: ${compounds[0].name} (${compounds[0].formula})`
    : `No compounds found for query: "${query}"`;
  
  return { compounds, analysis };
}
```

Create `src/lib/functions/pharmaFunctions/index.ts`:

```typescript
export * from './AnalyzeCompound';
export * from './RunAssay';
```

### 7. Custom Agent

Create `src/lib/agents/PharmaAgent.ts`:

```typescript
import { Text2Action } from 'x-reason';
import { Trace } from 'foundry-tracing-foundations';
import { Context } from 'x-reason';

export class PharmaAgent extends Text2Action {
  @Trace({
    resource: {
      service_name: 'pharma-agent',
      service_instance_id: 'development',
    },
    operationName: 'analyzeDrug',
  })
  async analyzeDrug(query: string, userId: string): Promise<any> {
    try {
      // Use the base Text2Action functionality with custom context
      const context: Context = {
        userInput: query,
        userId,
        stack: ['analyzeDrug'],
        analyzeDrug: {
          query,
          status: 'started'
        }
      };

      // This will trigger your custom reasoning engine with pharma functions
      const result = await this.createTaskList(query, userId, 'pharma');
      
      return {
        status: 200,
        message: 'Drug analysis completed',
        result
      };
    } catch (error) {
      console.error('PharmaAgent error:', error);
      return {
        status: 500,
        error: error.message
      };
    }
  }
}
```

### 8. Custom Reasoning Context

Create `src/lib/reasoning/contexts/pharma/functionCatalog.ts`:

```typescript
import { Context, MachineEvent, Task, ActionType } from 'x-reason';
import { analyzeCompound } from '../../../functions/pharmaFunctions';

function getPayload(context: Context, result: Record<string, any>) {
  const stateId = context.stack?.[context.stack?.length - 1];
  if (!stateId) {
    throw new Error('Unable to find associated state in the machine stack.');
  }
  
  return {
    stateId,
    [stateId]: {
      ...context[stateId],
      ...result
    }
  };
}

export function getPharmaFunctionCatalog(dispatch: (action: ActionType) => void) {
  return new Map<string, Task>([
    [
      "analyzeCompound",
      {
        description: "Analyzes chemical compounds and their properties for drug discovery.",
        implementation: async (context: Context, event?: MachineEvent, task?: string) => {
          console.log('analyzeCompound implementation called');
          const result = await analyzeCompound(context, event, task);
          const payload = getPayload(context, result);
          
          dispatch({
            type: 'CONTINUE',
            payload,
          });
        },
      },
    ],
    // Add more pharma-specific functions here
  ]);
}
```

### 9. API Routes

Create `src/app/api/agents/pharma/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PharmaAgent } from '../../../../lib/agents/PharmaAgent';

const pharmaAgent = new PharmaAgent();

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();
    
    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    const result = await pharmaAgent.analyzeDrug(query, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 10. React Components

Create `src/components/AgentPlayground.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AgentPlayground() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAgent = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/agents/pharma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          userId: 'demo-user' 
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to run agent' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pharma Agent Playground</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter a drug or compound query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && runAgent()}
            />
            <Button onClick={runAgent} disabled={loading}>
              {loading ? 'Running...' : 'Analyze'}
            </Button>
          </div>
          
          {result && (
            <Card>
              <CardContent className="pt-4">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Create `src/app/page.tsx`:

```typescript
import { AgentPlayground } from '../components/AgentPlayground';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">State Machine Agent Demo</h1>
      <AgentPlayground />
    </main>
  );
}
```

### 11. Package.json Configuration

```json
{
  "name": "pharma-state-machine-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "x-reason": "github:anand-testcompare/foundry-developer-foundations#master:x-reason-node",
    "foundry-tracing": "github:anand-testcompare/foundry-developer-foundations#master:foundry-tracing-foundations",
    "inversify": "^7.5.1",
    "reflect-metadata": "^0.1.13",
    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.290.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}
```

## Deployment Considerations

### For Development

- Use local file dependencies: `"x-reason": "file:../x-reason-node"`
- Mock external services with `MOCK_EXTERNAL_SERVICES=true`

### For Production

- Use GitHub dependencies: `"x-reason": "github:anand-testcompare/foundry-developer-foundations#master:x-reason-node"`
- Configure real Foundry OSDK credentials
- Optionally connect real external services

## Key Benefits of This Approach

1. **No Fork Maintenance** - You consume x-reason as a dependency
2. **Selective Dependencies** - Mock what you don't need
3. **Full Extension** - Add custom agents, functions, and reasoning contexts
4. **Production Ready** - Can scale to real Foundry deployment
5. **Independent Releases** - Your app releases independently from x-reason

## Troubleshooting

### Common Issues

1. **Missing Foundry Credentials**: Mock the FoundryClient if not available
2. **External Service Errors**: Use `MOCK_EXTERNAL_SERVICES=true`
3. **Container Binding Conflicts**: Use `container.rebind()` to override services
4. **State Machine Errors**: Start with simple functions before complex state transitions

This approach gives you full access to x-reason's AI reasoning capabilities while maintaining clean separation and avoiding the complexity of forking the entire monorepo.
