import { sendSuccess, sendError } from '../../utils/response';

describe('Response Helpers Unit Tests', () => {
  let mockRes: any;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('sendSuccess should format standard success response', () => {
    sendSuccess(mockRes, { id: 1 }, 'Operation successful', 201);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Operation successful',
      data: { id: 1 },
    });
  });

  it('sendError should format standard error response', () => {
    sendError(mockRes, 'Item not found', 404, { id: 'missing' });

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Item not found',
      errors: { id: 'missing' },
    });
  });
});
