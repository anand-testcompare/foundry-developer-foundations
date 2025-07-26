import { describe, test, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { mockProcessEmailEventExecution } from '@xreason/__fixtures__/MachineExecutions';
import { mockCalendarInsert, mockCalendarList, mockEmailHistoryNoResolution, mockEmailResponse, mockMessageGetResponse, mockMessageGetThreadsResponseNoResolution } from '@xreason/__fixtures__/Email';


let counter = 0;

vi.mock('@xreason/utils', async () => {
  const actual = await vi.importActual('@xreason/utils');
  return {
    ...actual,
    uuidv4: vi.fn(() => (++counter).toString()),
};
});

/* We are not mocking gemini to test our prompts to make sure we get resolutions for our test email chains
vi.mock("@xreason/services/geminiService", () => (
    {
        geminiService: vi.fn(() => {
            return mockProcessEmailEventExecution.machine;
        }),
    }
));*/

vi.mock('@xreason/domain/machineDao', () => ({
    makeMachineDao: vi.fn(() => ({
        upsert: vi.fn((id: string, stateMachine: string, state: string, logs: string, lockOwner?: string, lockUntil?: number) => {
            return mockProcessEmailEventExecution;
        }),
        delete: vi.fn(),
        read: vi.fn((machineExecutionId: string) => {
            return Promise.resolve(mockProcessEmailEventExecution);
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
                            console.log(`Gmail mock messages.send called with: ${request}`);
                            return Promise.resolve(mockEmailResponse);
                        }),
                        list: vi.fn((request: any) => {
                            console.log(`Gmail mock messages.list called with: ${request}`);
                            return Promise.resolve(mockEmailHistoryNoResolution);
                        }),
                        get: vi.fn((request: any) => {
                            console.log(`Gmail mock messages.get called with: ${request}`);
                            return Promise.resolve(mockMessageGetResponse);
                        }),
                    },
                    threads: {
                        get: vi.fn((request: any) => {
                            console.log(`Gmail mock threads.get called with: ${request}`);
                            return Promise.resolve(mockMessageGetThreadsResponseNoResolution);
                        }),
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
                        return Promise.resolve(mockCalendarInsert);
                    }),
                    list: vi.fn((params: any) => {
                        console.log(`Calendar mock events.list called with: ${JSON.stringify(params)}`);
                        return Promise.resolve(mockCalendarList);
                    }),
                },
                /* ---------- freebusy.query mock ---------- */
                freebusy: {
                    query: vi.fn((params: any) => {
                        console.log(`Calendar mock freebusy.query called with: ${JSON.stringify(params)}`);
                        return Promise.resolve({
                            data: {
                                kind: 'calendar#freeBusy',
                                timeMin: params.requestBody.timeMin,
                                timeMax: params.requestBody.timeMax,
                                calendars: {
                                    // each email requested in params.requestBody.items[*].id gets an entry:
                                    'dsmiley@codestrap.me': {
                                        busy: [
                                            {
                                                start: '2025-07-22T18:00:00Z',
                                                end: '2025-07-22T19:00:00Z',
                                            },
                                            {
                                                start: '2025-07-23T15:00:00Z',
                                                end: '2025-07-23T16:30:00Z',
                                            },
                                        ],
                                    },
                                },
                            },
                        });
                    }),
                },
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
import { Vickie } from '@xreason/Vickie';
describe('testing Vickie', () => {

    afterAll(() => {
        vi.clearAllMocks();
    });

    it('it handle a mock event using processEmailEvent when no resolution is found', async () => {
        const vickie = new Vickie();
        const result = await vickie.processEmailEvent('eyJlbWFpbEFkZHJlc3MiOiJkc21pbGV5QGNvZGVzdHJhcC5tZSIsImhpc3RvcnlJZCI6MTc5MDUxMn0=', '2025-07-22T20:43:55.184Z');
        expect(result).toBeDefined();
        expect(result.message).toBe('Some threads failed to resolve:\n executionId: 1 message: ERROR');
        expect(result.status).toBe(400);
    }, 120000);

});