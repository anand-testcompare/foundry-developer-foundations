import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest';
import { simpleMachine, complexMachine } from "@xreason/__fixtures__";
import { StateConfig } from "@xreason/reasoning";

// Mock the utils module with a counter that can be reset
vi.mock("@xreason/utils", () => {
  let counter = 0;
  return {
    getUniqueStateIds: vi.fn().mockImplementation((original) => original),
    uuidv4: vi.fn().mockImplementation(() => (++counter).toString()),
    // Reset counter function for testing
    __resetCounter: () => { counter = 0; }
  };
});

// Import the mocked module
import { getUniqueStateIds } from "@xreason/utils";

afterAll(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  // Reset the counter before each test
  const utils = await import("@xreason/utils");
  if ('__resetCounter' in utils) {
    (utils as any).__resetCounter();
  }
});

describe('Testing the getUniqueStateIds function', () => {
  test("Testing Deuplication of a state machines without parellel states", async () => {
    const inputStates = simpleMachine as StateConfig[];
    const deduplicatedStates = getUniqueStateIds(inputStates);
    const serializedResults = JSON.stringify(deduplicatedStates);

    expect(serializedResults).toBe('[{"id":"sendSlackMessage|1","transitions":[{"on":"CONTINUE","target":"sendSlackMessage|2"},{"on":"ERROR","target":"failure"}]},{"id":"sendSlackMessage|2","transitions":[{"on":"CONTINUE","target":"sendSlackMessage|3"},{"on":"ERROR","target":"failure"}]},{"id":"sendSlackMessage|3","transitions":[{"on":"CONTINUE","target":"success"},{"on":"ERROR","target":"failure"}]},{"id":"success","type":"final"},{"id":"failure","type":"final"}]');
  });

  test("Testing Deuplication of a state machines with parellel states", async () => {
    const inputStates = complexMachine as StateConfig[];
    const deduplicatedStates = getUniqueStateIds(inputStates);
    const serializedResults = JSON.stringify(deduplicatedStates);

    expect(serializedResults).toBe('[{"id":"sendSlackMessage|1","transitions":[{"on":"CONTINUE","target":"sendSlackMessage|2"},{"on":"ERROR","target":"failure"}]},{"id":"sendSlackMessage|2","transitions":[{"on":"CONTINUE","target":"parallelChecks|3"},{"on":"ERROR","target":"failure"}]},{"id":"parallelChecks|3","type":"parallel","states":[{"id":"RegulatoryCheck|5","transitions":[{"on":"CONTINUE","target":"success"},{"on":"ERROR","target":"failure"}],"parentId":"parallelChecks|3"},{"id":"ConcentrationEstimation|6","transitions":[{"on":"CONTINUE","target":"success"},{"on":"ERROR","target":"failure"}],"parentId":"parallelChecks|3"}],"onDone":"sendSlackMessage|4"},{"id":"sendSlackMessage|4","transitions":[{"on":"CONTINUE","target":"success"},{"on":"ERROR","target":"failure"}]},{"id":"success","type":"final"},{"id":"failure","type":"final"}]');
  });
});