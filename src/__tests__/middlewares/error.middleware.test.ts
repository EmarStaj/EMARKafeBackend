import { errorMiddleware } from '../../middlewares/error.middleware';
import { AppError } from '../../utils/app-error';
import { z } from 'zod';

describe('errorMiddleware', () => {
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should delegate to next if headers already sent', () => {
    mockRes.headersSent = true;
    const err = new Error('Already sent');

    errorMiddleware(err, {} as any, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle AppError with custom status code', () => {
    const err = new AppError('Custom forbidden error', 403, true, { code: 'FORBIDDEN' });

    errorMiddleware(err, {} as any, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Custom forbidden error',
        errors: { code: 'FORBIDDEN' },
      })
    );
  });

  it('should handle ZodError with 400 status code', () => {
    let zodErr: any;
    try {
      z.string().parse(123);
    } catch (e) {
      zodErr = e;
    }

    errorMiddleware(zodErr, {} as any, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation Error',
      })
    );
  });

  it('should handle unexpected generic Error with 500 status code', () => {
    const err = new Error('Database disconnected');

    errorMiddleware(err, {} as any, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
