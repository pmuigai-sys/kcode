import { runParallel } from '../../src/kcode/ai/parallel_sessions';

jest.mock('../../src/kcode/ai/parallel_sessions', () => {
  const actual = jest.requireActual('../../src/kcode/ai/parallel_sessions');
  return {
    ...actual,
    streamCompletion: jest.fn(async ({ onToken }) => {
      onToken('mock-response');
    })
  };
});

describe('parallelSessions', () => {
  it('runs tasks in parallel and aggregates responses', async () => {
    const tasks = [
      { model: 'codellama', prompt: 'Test 1' },
      { model: 'codellama', prompt: 'Test 2' }
    ];
    const result = await runParallel(tasks as any);
    expect(result).toHaveLength(2);
    expect(result[0].output).toContain('mock-response');
  });
});
