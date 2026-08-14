import { NotificationService } from '../../../modules/notification/notification.service';
import { DeviceTokenRepository } from '../../../modules/device-token/device-token.repository';

jest.mock('../../../modules/device-token/device-token.repository');

const MockedDeviceTokenRepository = DeviceTokenRepository as jest.MockedClass<typeof DeviceTokenRepository>;

describe('NotificationService', () => {
  let service: NotificationService;
  let mockDeviceTokenRepo: jest.Mocked<DeviceTokenRepository>;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.ONESIGNAL_APP_ID = 'test-app-id';
    process.env.ONESIGNAL_REST_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeviceTokenRepo = new MockedDeviceTokenRepository() as any;
    service = new NotificationService(mockDeviceTokenRepo);
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should skip sending if no device tokens found for user', async () => {
    mockDeviceTokenRepo.getTokensByUserId = jest.fn().mockResolvedValue([]);

    await service.sendToUser('user-1', 'Order Ready', 'Your coffee is ready!');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should format payload and send OneSignal notification successfully', async () => {
    mockDeviceTokenRepo.getTokensByUserId = jest.fn().mockResolvedValue([
      { id: '1', user_id: 'user-1', onesignal_id: 'player-id-abc' }
    ]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'notification-id-123', recipients: 1 })
    });

    await service.sendToUser('user-1', 'Order Ready', 'Your coffee is ready!');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://onesignal.com/api/v1/notifications',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('player-id-abc')
      })
    );
  });

  it('should broadcast message successfully to subscribed users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'broadcast-id-456', recipients: 50 })
    });

    await service.broadcast('Kampanya', 'Tüm kahvelerde %20 indirim!');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://onesignal.com/api/v1/notifications',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Subscribed Users')
      })
    );
  });
});
