import 'reflect-metadata';
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
