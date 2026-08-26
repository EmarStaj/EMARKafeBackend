import { DeviceTokenRepository } from '../device-token.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => {
  return jest.requireActual('../../../__mocks__/supabase');
});

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
