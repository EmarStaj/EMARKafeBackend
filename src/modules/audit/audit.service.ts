import { injectable } from 'tsyringe';
import { supabaseAdmin } from '../../config/supabase';
import { logger } from '../../config/logger';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from './audit.constants';
import { Request } from 'express';

export interface LogEventParams {
  userId?: string | null;
  actorType: AuditActorType;
  actorName?: string | null;
  branchId?: string | null;
  action: AuditAction;
  status: AuditStatus;
  entityType?: AuditEntityType | null;
  entityId?: string | null;
  details?: any;
  req?: Request; // to extract IP and user agent
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  actorType?: AuditActorType;
  branchId?: string;
  action?: AuditAction;
  status?: AuditStatus;
  startDate?: string;
  endDate?: string;
}

@injectable()
export class AuditService {
  /**
   * Logs an audit event asynchronously. 
   * Does NOT block the main execution flow. Errors are only logged to Winston.
   */
  logEvent(params: LogEventParams): void {
    // Fire and forget
    this.executeLog(params).catch(error => {
      logger.error('Failed to write audit log to database:', error);
    });
  }

  private async executeLog(params: LogEventParams) {
    let ipAddress = null;
    let userAgent = null;

    if (params.req) {
      ipAddress = (params.req.headers['x-forwarded-for'] || params.req.socket.remoteAddress) as string;
      userAgent = params.req.headers['user-agent'] || null;
      // Handle array from x-forwarded-for
      if (Array.isArray(ipAddress)) ipAddress = ipAddress[0];
      if (ipAddress && ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();
    }

    const { error } = await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId || null,
      actor_type: params.actorType,
      actor_name: params.actorName || null,
      branch_id: params.branchId || null,
      action: params.action,
      status: params.status,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      details: params.details || null,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    if (error) {
      throw error; // Let the outer catch handle it
    }
  }

  /**
   * Fetches audit logs for the Admin dashboard with filtering and pagination.
   */
  async getAuditLogs(params: GetAuditLogsParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (params.actorType) query = query.eq('actor_type', params.actorType);
    if (params.branchId) query = query.eq('branch_id', params.branchId);
    if (params.action) query = query.eq('action', params.action);
    if (params.status) query = query.eq('status', params.status);
    if (params.startDate) query = query.gte('created_at', params.startDate);
    if (params.endDate) query = query.lte('created_at', params.endDate);

    // Order by newest first
    query = query.order('created_at', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    };
  }
}

