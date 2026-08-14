import { withRetry } from '../../utils/retry';

describe('utils/retry', () => {
  it('should return result on first try if function succeeds', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 3, initialDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and return result when subsequent attempt succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Temporary Network Glitch'))
      .mockResolvedValueOnce('recovered');

    const result = await withRetry(fn, { maxRetries: 3, initialDelayMs: 10 });

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw error when maxRetries is reached', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Persistent Failure'));

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelayMs: 10 })
    ).rejects.toThrow('Persistent Failure');

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
