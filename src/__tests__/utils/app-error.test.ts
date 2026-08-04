import { AppError, rethrowAsAppError } from '../../utils/app-error';

describe('AppError', () => {
  it('should create an error with the correct message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('should default statusCode to 500 when not provided', () => {
    const err = new AppError('Something went wrong');
    expect(err.statusCode).toBe(500);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('test', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('should capture a stack trace', () => {
    const err = new AppError('stack test', 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });

  it('should allow isOperational to be overridden', () => {
    const err = new AppError('critical', 500, false);
    expect(err.isOperational).toBe(false);
  });
});

describe('rethrowAsAppError', () => {
  it('should re-throw an AppError as-is (preserving statusCode)', () => {
    const original = new AppError('Original message', 403);
    expect(() => rethrowAsAppError(original, 'Fallback', 400)).toThrow(original);

    try {
      rethrowAsAppError(original, 'Fallback', 400);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(403); // Must be 403, not fallback 400
      expect((e as AppError).message).toBe('Original message');
    }
  });

  it('should wrap a standard Error in AppError with fallback code', () => {
    const stdError = new Error('Database connection refused');
    try {
      rethrowAsAppError(stdError, 'Fallback message', 500);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).statusCode).toBe(500);
      expect((e as AppError).message).toBe('Database connection refused');
    }
  });

  it('should use fallback message when error has no message', () => {
    try {
      rethrowAsAppError(new Error(''), 'Fallback message used', 400);
    } catch (e) {
      expect((e as AppError).message).toBe('Fallback message used');
    }
  });

  it('should handle unknown/non-Error throws (e.g., thrown string)', () => {
    try {
      rethrowAsAppError('some string error', 'Fallback for unknown', 400);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).message).toBe('Fallback for unknown');
      expect((e as AppError).statusCode).toBe(400);
    }
  });

  it('should handle null/undefined as error', () => {
    try {
      rethrowAsAppError(null, 'Null error fallback', 400);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).message).toBe('Null error fallback');
    }
  });
});
