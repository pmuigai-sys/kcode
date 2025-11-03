jest.mock('@webcontainer/api', () => ({
  WebContainer: {
    boot: jest.fn(async () => ({
      mount: jest.fn(),
      spawn: jest.fn(async () => ({ exit: jest.fn() })),
      teardown: jest.fn()
    }))
  }
}));

import { startPreview, stopPreview } from '../../src/kcode/preview/webcontainers';

describe('webcontainers preview', () => {
  it('boots and mounts project files', async () => {
    await expect(
      startPreview({ projectPath: __dirname, entry: 'index.js', framework: 'react' })
    ).resolves.toBeDefined();
  });

  it('tears down preview', async () => {
    await expect(stopPreview()).resolves.toBeUndefined();
  });
});
