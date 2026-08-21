import { requireRole } from '../../middlewares/role.middleware';
import { AppError } from '../../utils/app-error';

describe('requireRole Middleware', () => {
  it('should throw 401 AppError if profile is missing', () => {
    const middleware = requireRole(['admin']);
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should call next if user has allowed role', () => {
    const middleware = requireRole(['admin', 'barista']);
    const req = { profile: { role: 'admin' } } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should normalize manager role to branch_manager', () => {
    const middleware = requireRole(['branch_manager']);
    const req = { profile: { role: 'manager' } } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should throw 403 AppError if user role is not in allowed roles', () => {
    const middleware = requireRole(['admin']);
    const req = { profile: { role: 'customer' } } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});
