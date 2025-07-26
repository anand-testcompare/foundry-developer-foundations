import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest';
import { text2ActionTestMachineExecution, machineId } from '@xreason/__fixtures__/MachineExecutions';

let counter = 0;

vi.mock('@xreason/utils', async () => {
    const actual = await vi.importActual('@xreason/utils');
    return {
        ...actual,
        uuidv4: vi.fn(() => (++counter).toString()),
    };
});

vi.mock("@xreason/services/geminiService", () => ({
    geminiService: vi.fn(() => {
        return text2ActionTestMachineExecution.machine;
    }),
}
));

vi.mock('@xreason/domain/machineDao', () => ({
    makeMachineDao: vi.fn(() => ({
        upsert: vi.fn((id: string, stateMachine: string, state: string, logs: string, lockOwner?: string, lockUntil?: number) => {
            return text2ActionTestMachineExecution;
        }),
        delete: vi.fn(),
        read: vi.fn((machineExecutionId: string) => {
            return Promise.resolve(text2ActionTestMachineExecution);
        }),
    })),
}));

vi.mock('googleapis', () => ({
    ...vi.importActual('googleapis'), // Keep other actual exports

    google: {
        // Mock the 'gmail' function as before
        gmail: vi.fn((version: string, auth: any) => {
            return {
                users: {
                    messages: {
                        send: vi.fn((request: any) => {
                            console.log(`Gmail mock called with: ${request}`);
                            return Promise.resolve(mockEmailResponse);
                        })
                    }
                }
            };
        }),

        // Mock the 'calendar' function as before
        calendar: vi.fn((version: string, auth: any) => {
            return {
                events: {
                    insert: vi.fn((request: any) => {
                        console.log(`Calendar mock called with: ${request}`);
                        return Promise.resolve({ data: { id: 'mockEventId' } });
                    }),
                }
            };
        }),

        // Mock the 'customsearch' function as before
        customsearch: vi.fn((version: string) => {
            return {
                cse: {
                    list: vi.fn((params: any) => {
                        console.log(`Custom Search mock called with: ${params}`);
                        return Promise.resolve({
                            data: {
                                items: [
                                    { title: 'Mock Result 1', link: 'http://mock.com/1' },
                                    { title: 'Mock Result 2', link: 'http://mock.com/2' },
                                ],
                            },
                        });
                    }),
                },
            };
        }),

        // Add a mock for the 'auth' object and its 'GoogleAuth' constructor
        auth: {
            GoogleAuth: vi.fn().mockImplementation((config) => {
                console.log('Mocked GoogleAuth constructor called');

                // Return a mock object that mimics the behavior of a GoogleAuth instance
                return {
                    // Mock methods that are called on the GoogleAuth instance
                    getClient: vi.fn().mockResolvedValue({
                        getRequestHeaders: vi.fn().mockResolvedValue({ /* mock headers */ }), // Mock getRequestHeaders if used
                    }),
                };
            }),
        },
    },
}));

import { uuidv4 } from '@xreason/utils';
import { Text2Action } from '@xreason/Text2Action';
import { SupportedEngines } from '@xreason/reasoning/factory';
import { sendEmail } from '@xreason/functions';
import { mockEmailResponse } from '@xreason/__fixtures__/Email';

describe('testing Text2Action', () => {

    afterAll(() => {
        vi.clearAllMocks();
    });

    test('it should rehydrate an existing execution and return pause', async () => {
        const solution = {
            input: '', //not relevant for this
            id: machineId || '',
            plan: '', //not relevant for retrieving an execution
        };

        const t2a = new Text2Action();
        const result = await t2a.upsertState(undefined, true, machineId);
        const state = JSON.parse(result.state!);
        // TODO make this test better. Currently we are returning the mock value which
        // does not reflect the updates which should return the success state
        expect(state.value).toBe('sendEmail|1');
        expect(state.context.stack).toHaveLength(1)
        expect(state.context.stack[0]).toBe('sendEmail|1')
    }, 30000);

});