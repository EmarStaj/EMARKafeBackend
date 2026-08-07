import { AuditService } from '../../../modules/audit/audit.service';
import { supabaseAdmin } from '../../../config/supabase';
import { logger } from '../../../config/logger';
import { AuditActorType, AuditAction, AuditStatus } from '../../../modules/audit/audit.constants';

// Mock dependencies
jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn(),
    select: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../../config/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should successfully log an event asynchronously without blocking', async () => {
      ((supabaseAdmin as any).insert as jest.Mock).mockResolvedValueOnce({ error: null });

      // We call the method. Because it's async but doesn't await the inner execution,
      // we need to await a tick to allow the promise inside to resolve.
      auditService.logEvent({
        actorType: AuditActorType.CUSTOMER,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
      });

      // Wait for next tick for the floating promise to execute
      await new Promise(process.nextTick);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
      expect((supabaseAdmin as any).insert).toHaveBeenCalledTimes(1);
      expect((supabaseAdmin as any).insert).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_type: AuditActorType.CUSTOMER,
          action: AuditAction.LOGIN,
          status: AuditStatus.SUCCESS,
        })
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log to winston when supabase insert fails', async () => {
      const dbError = new Error('Database connection failed');
      ((supabaseAdmin as any).insert as jest.Mock).mockResolvedValueOnce({ error: dbError });

      auditService.logEvent({
        actorType: AuditActorType.CUSTOMER,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
      });

      await new Promise(process.nextTick);

      expect((supabaseAdmin as any).insert).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('Failed to write audit log to database:', expect.any(Object));
    });

    it('should correctly map req object to ip_address and user_agent', async () => {
      ((supabaseAdmin as any).insert as jest.Mock).mockResolvedValueOnce({ error: null });

      const mockReq: any = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'user-agent': 'Mozilla/5.0 TestBrowser',
        },
        socket: {
          remoteAddress: '127.0.0.1',
        },
      };

      auditService.logEvent({
        actorType: AuditActorType.ADMIN,
        action: AuditAction.STOCK_UPDATE,
        status: AuditStatus.SUCCESS,
        req: mockReq,
      });

      await new Promise(process.nextTick);

      expect((supabaseAdmin as any).insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 TestBrowser',
        })
      );
    });

    it('should fall back to req.socket.remoteAddress if x-forwarded-for is missing', async () => {
      ((supabaseAdmin as any).insert as jest.Mock).mockResolvedValueOnce({ error: null });

      const mockReq: any = {
        headers: {
          'user-agent': 'Mozilla/5.0 TestBrowser',
        },
        socket: {
          remoteAddress: '127.0.0.1',
        },
      };

      auditService.logEvent({
        actorType: AuditActorType.ADMIN,
        action: AuditAction.STOCK_UPDATE,
        status: AuditStatus.SUCCESS,
        req: mockReq,
      });

      await new Promise(process.nextTick);

      expect((supabaseAdmin as any).insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '127.0.0.1',
        })
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs without filters', async () => {
      const mockData = [{ id: '1', action: 'login' }];
      ((supabaseAdmin as any).range as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null, count: 1 });

      const result = await auditService.getAuditLogs({ page: 1, limit: 10 });

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
      expect((supabaseAdmin as any).select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect((supabaseAdmin as any).range).toHaveBeenCalledWith(0, 9);
      expect((supabaseAdmin as any).order).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result).toEqual({
        data: mockData,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should apply filters correctly when provided', async () => {
      const mockData = [{ id: '2', action: 'stock_update' }];
      ((supabaseAdmin as any).range as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null, count: 1 });

      await auditService.getAuditLogs({
        page: 2,
        limit: 5,
        actorType: AuditActorType.BARISTA,
        action: AuditAction.STOCK_UPDATE,
        status: AuditStatus.SUCCESS,
        branchId: 'branch-1',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      });

      expect((supabaseAdmin as any).eq).toHaveBeenCalledWith('actor_type', AuditActorType.BARISTA);
      expect((supabaseAdmin as any).eq).toHaveBeenCalledWith('action', AuditAction.STOCK_UPDATE);
      expect((supabaseAdmin as any).eq).toHaveBeenCalledWith('status', AuditStatus.SUCCESS);
      expect((supabaseAdmin as any).eq).toHaveBeenCalledWith('branch_id', 'branch-1');
      expect((supabaseAdmin as any).gte).toHaveBeenCalledWith('created_at', '2023-01-01');
      expect((supabaseAdmin as any).lte).toHaveBeenCalledWith('created_at', '2023-12-31');
      expect((supabaseAdmin as any).range).toHaveBeenCalledWith(5, 9);
    });

    it('should throw an error if supabase returns an error on getAuditLogs', async () => {
      ((supabaseAdmin as any).range as jest.Mock).mockResolvedValueOnce({ data: null, error: new Error('DB Error'), count: 0 });

      await expect(auditService.getAuditLogs({ page: 1, limit: 10 })).rejects.toThrow('DB Error');
    });
  });
});
