import { container } from 'tsyringe';
import { supabaseAdmin } from '../config/supabase';
import { LoyaltyService } from '../modules/loyalty/loyalty.service';
import { logger } from '../app';
import { redis } from '../config/redis';

let jobInterval: NodeJS.Timeout | null = null;

export function startAutoCompleteJob() {
  if (jobInterval) return;

  const INTERVAL_MS = 60 * 1000; // Run every 60 seconds
  const AUTO_COMPLETE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

  jobInterval = setInterval(async () => {
    try {
      // 1. Distributed lock across multiple horizontal instances/pods using Redis
      if (redis.status === 'ready') {
        const lockAcquired = await redis.set('lock:job:auto_complete', '1', 'EX', 50, 'NX');
        if (!lockAcquired) {
          // Another backend instance holds the lock for this cycle
          return;
        }
      }

      const expirationDate = new Date(Date.now() - AUTO_COMPLETE_THRESHOLD_MS).toISOString();

      // Find orders that have been in 'ready' status for >= 20 minutes
      const { data: readyOrders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          user_id,
          branch_id,
          status,
          ready_at,
          created_at,
          order_items (
            id,
            product_id,
            quantity,
            products (
              id,
              category_id,
              is_loyalty_eligible
            )
          )
        `)
        .eq('status', 'ready')
        .or(`ready_at.lte.${expirationDate},and(ready_at.is.null,created_at.lte.${expirationDate})`);

      if (error || !readyOrders || readyOrders.length === 0) {
        return;
      }

      logger.info(`[AutoCompleteJob] Found ${readyOrders.length} order(s) to auto-complete.`);

      const loyaltyService = container.resolve(LoyaltyService);

      for (const order of readyOrders) {
        // Atomic update to completed
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_by: 'system_auto',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .eq('status', 'ready')
          .select()
          .single();

        if (updateError || !updated) continue;

        // Process loyalty points (silently without spamming)
        if (order.order_items) {
          for (const item of order.order_items) {
            try {
              const product = (item as any).products;
              if (product && product.is_loyalty_eligible) {
                await loyaltyService.addStampsForProduct(order.user_id, product.category_id, item.quantity, false);
              }
            } catch (e) {
              logger.error(`[AutoCompleteJob] Loyalty stamp error for order ${order.id}:`, e);
            }
          }
        }

        // Log to order_status_history
        try {
          await supabaseAdmin.from('order_status_history').insert({
            order_id: order.id,
            from_status: 'ready',
            to_status: 'completed',
            actor_type: 'system_auto',
            notes: '20 dakika süre aşımı nedeniyle sistem tarafından otomatik teslim edildi.'
          });
        } catch (_) {}

        logger.info(`[AutoCompleteJob] Order ${order.id} auto-completed successfully.`);
      }
    } catch (err) {
      logger.error('[AutoCompleteJob] Unhandled error during execution:', err);
    }
  }, INTERVAL_MS);

  logger.info('🕒 Order Auto-Complete Background Job initialized (Interval: 1m, Timeout: 20m).');
}

export function stopAutoCompleteJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
  }
}
