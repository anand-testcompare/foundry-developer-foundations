import { describe, test, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { State } from 'xstate';

vi.mock('@xreason/domain/machineDao', () => ({
    makeMachineDao: vi.fn(() => ({
        upsert: vi.fn(),
        delete: vi.fn(),
        read: vi.fn((machineExecutionId: string) => {
            if (machineExecutionId === 'mock-execution-id') {
                return Promise.resolve(mockExecution);
            } else if (machineExecutionId === 'mock-execution-id2') {
                return Promise.resolve(mockExecution2);
            } else {
                return Promise.resolve(null); // or throw if you want stricter tests
            }
        }),
    })),
}));

let counter = 0;

vi.mock('@xreason/utils', async () => {
  const actual = await vi.importActual('@xreason/utils');
  return {
    ...actual,
    uuidv4: vi.fn(() => (++counter).toString()),
};
});

import { mockEmailResponse } from '@xreason/__fixtures__/Email';

vi.mock('@xreason/functions', async () => {
  const actual = await vi.importActual('@xreason/functions');
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue(mockEmailResponse),
};
});

import { mockProgrammerResponse1 } from '@xreason/__fixtures__/Gemini';

vi.mock("@xreason/services/geminiService", () => (
    {
        geminiService: vi.fn(() => {
            return mockProgrammerResponse1;
        }),
    }
));

vi.mock('@xreason/domain/trainingDataDao', () => ({
    makeTrainingDataDao: vi.fn(() => ({
        upsert: vi.fn(),
        delete: vi.fn(),
        read: vi.fn((id: string) => {
            return {
                humanReview: 'this anser is good',
                isGood: true,
                machine: mockProgrammerResponse1,
                primaryKey_: '1234',
                solution: 'The task list',
                type: SupportTrainingDataTypes.PROGRAMMER,
                xReason: SupportedEngines.COMS
            }
        }),
        search: vi.fn((xReason: string, type: string) => {
            return [
                {
                    humanReview: 'this anser is good',
                    isGood: true,
                    machine: mockProgrammerResponse1,
                    primaryKey_: '1234',
                    solution: 'The task list',
                    type: SupportTrainingDataTypes.PROGRAMMER,
                    xReason: SupportedEngines.COMS
                }
            ];
        }),
    })),
}));

// Mock fetch globally since it's used in SendSlackMessage
global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            ok: true,
            channel: 'test-channel',
            ts: '1234567890.123456'
        })
    })
) as jest.Mock;

import { headlessInterpreter, MachineEvent, Context, StateConfig, Task, getState } from '@xreason/reasoning';
import { SupportedEngines, SupportTrainingDataTypes } from '@xreason/reasoning/factory';
import { sendEmail } from '@xreason/functions';
import { machineId, machineId2, mockExecution, mockExecution2 } from '@xreason/__fixtures__/MachineExecutions';

describe('testing orchestrator', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.clearAllMocks();
    });

    it('it should rehydrate an existing execution, move forward, and save', async () => {
        const solution = {
            input: '', //not relevant for this
            id: machineId || '',
            plan: '', //not relevant for retrieving an execution
        };

        //we don't need to test interpolation in this test case, but leaving here to help facilitate testing that
        const valuesToInterpolateOntoContext = {};

        const result = await getState(solution, true, valuesToInterpolateOntoContext, SupportedEngines.COMS);
        const state = JSON.parse(result.jsonState);

        expect(state.value).toBe('success');
        expect(state.context.stack).toHaveLength(4);
        expect(state.context.stack[0]).toBe('sendEmail|2');
    });

    it('it should rehydrate an existing execution, move backward, and save', async () => {
        const solution = {
            input: '', //not relevant for this
            // note machineId2 starts on the second state: sendSlackMessage
            id: machineId2 || '',
            plan: '', //not relevant for retrieving an execution
        };

        //we don't need to test interpolation in this test case, but leaving here to help facilitate testing that
        const valuesToInterpolateOntoContext = {};

        const result = await getState(solution, false, valuesToInterpolateOntoContext, SupportedEngines.COMS);
        const state = JSON.parse(result.jsonState);

        expect(state.value).toBe('sendEmail');
        expect(state.context.stack).toHaveLength(1)
        expect(state.context.stack[0]).toBe('sendEmail')
    });

    it('it should create a new machine, move forward, and save', async () => {
        const solution = {
            input: '', //not relevant for this
            id: '',
            plan: `1. **Send Email** - **To**: Mike Johnson <mike.johnson@example.com> - **Subject**: Follow-up on Marketing Plan - **Body**: "Hi Mike, following up on the recent discussion about the marketing plan. Please review the points raised by Sarah Lee <sarah.lee@example.com> and David Brown <david.brown@example.com>. Let me know if you need any further input. Best, Cody the AI Assistant"`, //not relevant for retrieving an execution
        };

        //we don't need to test interpolation in this test case, but leaving here to help facilitate testing that
        const valuesToInterpolateOntoContext = {};

        const result = await getState(solution, true, valuesToInterpolateOntoContext, SupportedEngines.COMS);
        const state = JSON.parse(result.jsonState);
        expect(state.value).toBe('success');
        expect(state.context.stack).toHaveLength(2)
        expect(state.context.stack[0]).toBe('sendEmail|13')
        expect(state.context.stack[1]).toBe('success')
    });
});