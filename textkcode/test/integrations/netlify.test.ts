jest.mock('child_process', () => ({
  exec: jest.fn((_cmd, _opts, cb) => {
    cb(null, 'Deploy success', '');
    return { stdout: { pipe: jest.fn() }, stderr: { pipe: jest.fn() } };
  })
}));

import { deployWithNetlify } from '../../src/kcode/integrations/netlify';

beforeAll(() => {
  process.env.KCODE_DATA_DIR = require('path').join(__dirname, '.tmp');
});

describe('Netlify integration', () => {
  it('throws when token missing', async () => {
    await expect(deployWithNetlify({ projectPath: process.cwd() })).rejects.toThrow();
  });
});
