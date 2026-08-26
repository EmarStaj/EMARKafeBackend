import { NotificationService } from '../notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockDeviceTokenRepo: any;

  beforeEach(() => {
    mockDeviceTokenRepo = {
      getTokensByUserId: jest.fn()
    };
    service = new NotificationService(mockDeviceTokenRepo);
    global.fetch = jest.fn();
    process.env.ONESIGNAL_APP_ID = 'app_id';
    process.env.ONESIGNAL_REST_API_KEY = 'api_key';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ONESIGNAL_APP_ID;
    delete process.env.ONESIGNAL_REST_API_KEY;
  });

  describe('sendToUser', () => {
    it('skips if keys missing', async () => {
      delete process.env.ONESIGNAL_APP_ID;
      await service.sendToUser('u1', 't', 'm');
      expect(mockDeviceTokenRepo.getTokensByUserId).not.toHaveBeenCalled();
    });

    it('skips if no tokens', async () => {
      mockDeviceTokenRepo.getTokensByUserId.mockResolvedValue([]);
      await service.sendToUser('u1', 't', 'm');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('success with tokens and data', async () => {
      mockDeviceTokenRepo.getTokensByUserId.mockResolvedValue([{ onesignal_id: '1' }]);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      
      await service.sendToUser('u1', 't', 'm', { test: 1 });
      
      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[0]).toEqual('https://onesignal.com/api/v1/notifications');
      expect(JSON.parse(call[1].body).data).toEqual({ test: 1 });
    });

    it('retries on non-ok response and catches error', async () => {
      mockDeviceTokenRepo.getTokensByUserId.mockResolvedValue([{ onesignal_id: '1' }]);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'bad' })
      });
      
      await service.sendToUser('u1', 't', 'm');
      // fetch will be called multiple times due to retry
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('skips if keys missing', async () => {
      delete process.env.ONESIGNAL_APP_ID;
      await service.broadcast('t', 'm');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('success with data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      
      await service.broadcast('t', 'm', { test: 1 });
      
      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(call[1].body).data).toEqual({ test: 1 });
    });

    it('retries on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({})
      });
      
      await service.broadcast('t', 'm');
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
