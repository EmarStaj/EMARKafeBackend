import { validate } from '../../middlewares/validate.middleware';
import { z } from 'zod';

describe('validate Middleware', () => {
  const schema = z.object({
    body: z.object({
      name: z.string().min(2),
    }),
  });

  it('should call next when validation succeeds', async () => {
    const middleware = validate(schema);
    const req = { body: { name: 'Latte' }, query: {}, params: {} } as any;
    const res = {} as any;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.name).toBe('Latte');
  });

  it('should pass ZodError to next when validation fails', async () => {
    const middleware = validate(schema);
    const req = { body: { name: 'A' }, query: {}, params: {} } as any;
    const res = {} as any;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });
});
