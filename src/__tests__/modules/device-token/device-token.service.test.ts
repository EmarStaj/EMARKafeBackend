import 'reflect-metadata';
import { DeviceTokenService } from '../../../modules/device-token/device-token.service';
import { DeviceTokenRepository } from '../../../modules/device-token/device-token.repository';

describe('DeviceTokenService Unit Tests', () => {
  let service: DeviceTokenService;
  let mockRepo: jest.Mocked<DeviceTokenRepository>;

  beforeEach(() => {
    mockRepo = {
      saveDeviceToken: jest.fn(),
    } as any;
    service = new DeviceTokenService(mockRepo);
  });

  it('saveDeviceToken should delegate to repository and return result', async () => {
    const mockData = { id: 'dt-1', user_id: 'u-1', onesignal_id: 'os-1', platform: 'android' as const };
    mockRepo.saveDeviceToken.mockResolvedValue(mockData as any);

    const res = await service.saveDeviceToken('u-1', 'os-1', 'android');
    expect(res).toEqual(mockData);
    expect(mockRepo.saveDeviceToken).toHaveBeenCalledWith({
      user_id: 'u-1',
      onesignal_id: 'os-1',
      platform: 'android',
    });
  });

  it('saveDeviceToken should wrap error into AppError', async () => {
    mockRepo.saveDeviceToken.mockRejectedValue(new Error('DB failure'));

    await expect(service.saveDeviceToken('u-1', 'os-1', 'ios')).rejects.toThrow('DB failure');
  });
});
