const fs = require('fs');
const path = require('path');

const baseDir = '/home/tuncay/Projects/Kafe/EMARKafe-backend/src/modules';

const files = {
  'device-token/__tests__/device-token.controller.test.ts': `import 'reflect-metadata';
import { DeviceTokenController } from '../device-token.controller';
import { DeviceTokenService } from '../device-token.service';
import { Request, Response } from 'express';

describe('DeviceTokenController', () => {
  let controller: DeviceTokenController;
  let service: jest.Mocked<DeviceTokenService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = { saveDeviceToken: jest.fn() } as any;
    controller = new DeviceTokenController(service as any);
    req = { user: { id: 'u1' }, body: { onesignal_id: 'os1', platform: 'ios' } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  it('should register token successfully', async () => {
    service.saveDeviceToken.mockResolvedValue({ id: '1' } as any);
    await controller.registerToken(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should throw Unauthorized if no user id', async () => {
    req.user = undefined;
    await controller.registerToken(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should call next on service error', async () => {
    service.saveDeviceToken.mockRejectedValue(new Error('err'));
    await controller.registerToken(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
`,
  'device-token/__tests__/device-token.service.test.ts': `import 'reflect-metadata';
import { DeviceTokenService } from '../device-token.service';
import { DeviceTokenRepository } from '../device-token.repository';

describe('DeviceTokenService', () => {
  let service: DeviceTokenService;
  let repository: jest.Mocked<DeviceTokenRepository>;

  beforeEach(() => {
    repository = { saveDeviceToken: jest.fn(), getTokensByUserId: jest.fn() } as any;
    service = new DeviceTokenService(repository as any);
  });

  it('should save token successfully', async () => {
    repository.saveDeviceToken.mockResolvedValue({ id: '1' } as any);
    const res = await service.saveDeviceToken('u1', 'os1', 'ios');
    expect(res).toEqual({ id: '1' });
  });

  it('should throw AppError on repo error', async () => {
    repository.saveDeviceToken.mockRejectedValue(new Error('err'));
    await expect(service.saveDeviceToken('u1', 'os1', 'ios')).rejects.toThrow('err');
  });

  it('should throw default error on repo error without message', async () => {
    repository.saveDeviceToken.mockRejectedValue({});
    await expect(service.saveDeviceToken('u1', 'os1', 'ios')).rejects.toThrow('Failed to register device token.');
  });
});
`,
  'device-token/__tests__/device-token.repository.test.ts': `import { DeviceTokenRepository } from '../device-token.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: require('../../../__mocks__/supabase').supabaseAdmin,
}));

describe('DeviceTokenRepository', () => {
  let repo: DeviceTokenRepository;

  beforeEach(() => {
    repo = new DeviceTokenRepository();
    jest.clearAllMocks();
  });

  it('should save device token successfully', async () => {
    const res = await repo.saveDeviceToken({ user_id: 'u1', onesignal_id: 'os1', platform: 'ios' });
    expect(supabaseAdmin.from).toHaveBeenCalledWith('device_tokens');
    expect(res).toBeDefined();
  });

  it('should throw error if upsert fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('db error') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.saveDeviceToken({ user_id: 'u1', onesignal_id: 'os1', platform: 'ios' })).rejects.toThrow('db error');
  });

  it('should get tokens by user id successfully', async () => {
    const mockQuery = mockQueryBuilder([{ onesignal_id: 'os1', platform: 'ios' }]);
    // Select doesn't use single here, it resolves directly in the mock if we mock it, wait, getTokensByUserId doesn't use single or maybeSingle
    // We need to mock the thenable or eq to return { data, error } directly.
    mockQuery.eq.mockResolvedValue({ data: [{ onesignal_id: 'os1', platform: 'ios' }], error: null });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    
    const res = await repo.getTokensByUserId('u1');
    expect(res).toEqual([{ onesignal_id: 'os1', platform: 'ios' }]);
  });

  it('should throw error if getTokensByUserId fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ data: null, error: new Error('db err') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    
    await expect(repo.getTokensByUserId('u1')).rejects.toThrow('db err');
  });
});
`
};

for (const [file, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
