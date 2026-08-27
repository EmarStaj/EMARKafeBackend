import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

@injectable()
export class OrderController {
  constructor(
    private orderService: OrderService,
    private auditService: AuditService
  ) {}

  placeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const token = req.token!;
      const { branch_id, reward_id, use_reward } = req.body;

      const order = await this.orderService.placeOrder(userId, branch_id, token, reward_id, use_reward);

      sendSuccess(res, order, 'Order placed successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  scanQRAndCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const baristaToken = req.token!;
      const baristaBranchId = req.profile!.branch_id;
      const { qr_token } = req.body;

      if (!baristaBranchId) {
        throw new AppError('Barista is not assigned to any branch.', 400);
      }

      const order = await this.orderService.scanQRAndCheckout(qr_token, baristaBranchId, baristaToken);

      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.profile as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: baristaBranchId,
        action: AuditAction.QR_SCAN,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.ORDER,
        entityId: order.id,
        req
      });

      sendSuccess(res, order, 'QR successfully scanned, payment processed, and order created.', 201);
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.profile as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: req.profile?.branch_id,
        action: AuditAction.QR_SCAN,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.QR,
        details: { error: error.message },
        req
      });
      next(error);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const orders = await this.orderService.getOrders(userId, token);
      sendSuccess(res, orders, 'Order history retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const order = await this.orderService.getOrderById(id, token);
      sendSuccess(res, order, 'Order details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getBranchOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userProfile = req.profile;
      if (!userProfile || !userProfile.branch_id) {
        throw new AppError('Forbidden: You are not assigned to any branch.', 403);
      }

      const orders = await this.orderService.getBranchOrders(userProfile.branch_id);
      sendSuccess(res, orders, 'Branch orders retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userProfile = req.profile;
      if (!userProfile) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const { status } = req.body;

      const updatedOrder = await this.orderService.updateOrderStatus(id, status, userProfile);
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (userProfile as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: userProfile.branch_id,
        action: AuditAction.ORDER_STATUS_UPDATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.ORDER,
        entityId: id,
        details: { status },
        req
      });

      sendSuccess(res, updatedOrder, 'Order status updated successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.profile as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: req.profile?.branch_id,
        action: AuditAction.ORDER_STATUS_UPDATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.ORDER,
        entityId: req.params.id,
        details: { status: req.body.status, error: error.message },
        req
      });
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const cancelledOrder = await this.orderService.cancelOrder(id, userId, token);
      
      this.auditService.logEvent({
        userId,
        actorType: (req.profile as any)?.role || AuditActorType.CUSTOMER,
        actorName: req.user?.email,
        action: AuditAction.ORDER_CANCEL,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.ORDER,
        entityId: id,
        req
      });

      sendSuccess(res, cancelledOrder, 'Order cancelled successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.profile as any)?.role || AuditActorType.CUSTOMER,
        actorName: req.user?.email,
        action: AuditAction.ORDER_CANCEL,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.ORDER,
        entityId: req.params.id,
        details: { error: error.message },
        req
      });
      next(error);
    }
  };
}
