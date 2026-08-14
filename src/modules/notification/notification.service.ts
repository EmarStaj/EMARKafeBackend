import { logger } from '../../config/logger';
import { injectable } from 'tsyringe';
import { DeviceTokenRepository } from '../device-token/device-token.repository';
import { withRetry } from '../../utils/retry';

@injectable()
export class NotificationService {
  private apiUrl = 'https://onesignal.com/api/v1/notifications';

  private get appId(): string {
    return process.env.ONESIGNAL_APP_ID || '';
  }

  private get apiKey(): string {
    return process.env.ONESIGNAL_REST_API_KEY || '';
  }

  constructor(private deviceTokenRepo: DeviceTokenRepository) {}

  /**
   * Send a notification to a specific user by looking up their device tokens.
   */
  async sendToUser(userId: string, title: string, message: string, data?: any): Promise<void> {
    if (!this.appId || !this.apiKey) {
      logger.warn(`Push skipped (OneSignal unconfigured): [${title}] ${message}`);
      return;
    }

    try {
      const tokens = await this.deviceTokenRepo.getTokensByUserId(userId);
      if (!tokens || tokens.length === 0) return;

      const onesignalIds = tokens.map((t: any) => t.onesignal_id);
      
      const payload: any = {
        app_id: this.appId,
        include_player_ids: onesignalIds,
        headings: { en: title, tr: title },
        contents: { en: message, tr: message }
      };
      
      if (data) {
        payload.data = data;
      }

      await withRetry(async () => {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`OneSignal API returned status ${response.status}: ${JSON.stringify(responseData)}`);
        }

        logger.info(`Notification sent successfully to user ${userId}. Response:`, responseData);
        return responseData;
      }, { maxRetries: 3, initialDelayMs: 300 });

    } catch (error: any) {
      logger.error(`Error sending OneSignal notification to user ${userId}:`, error.message || error);
    }
  }

  /**
   * Broadcast a message to all users.
   */
  async broadcast(title: string, message: string, data?: any): Promise<void> {
    if (!this.appId || !this.apiKey) {
      logger.warn(`Broadcast skipped (OneSignal unconfigured): [${title}] ${message}`);
      return;
    }

    const payload: any = {
      app_id: this.appId,
      included_segments: ['Subscribed Users'],
      headings: { en: title, tr: title },
      contents: { en: message, tr: message }
    };
    
    if (data) {
      payload.data = data;
    }

    try {
      await withRetry(async () => {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.apiKey}`
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`OneSignal API returned status ${response.status}: ${JSON.stringify(responseData)}`);
        }

        logger.info(`Broadcast notification sent successfully. Response:`, responseData);
        return responseData;
      }, { maxRetries: 3, initialDelayMs: 300 });
    } catch (error: any) {
      logger.error('Error broadcasting OneSignal notification:', error.message || error);
    }
  }
}
