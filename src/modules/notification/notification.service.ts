import { logger } from '../../config/logger';
import { injectable } from 'tsyringe';
import { DeviceTokenRepository } from '../device-token/device-token.repository';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

@injectable()
export class NotificationService {
  private deviceTokenRepo = new DeviceTokenRepository();
  private apiUrl = 'https://onesignal.com/api/v1/notifications';

  constructor() {
    if (ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      logger.info('OneSignal NotificationService initialized successfully (using native fetch).');
    } else {
      logger.warn('OneSignal credentials missing. Notifications will not be sent.');
    }
  }

  /**
   * Send a notification to a specific user by looking up their device tokens.
   */
  async sendToUser(userId: string, title: string, message: string, data?: any): Promise<void> {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      logger.warn(`Push skipped (OneSignal unconfigured): [${title}] ${message}`);
      return;
    }

    try {
      const tokens = await this.deviceTokenRepo.getTokensByUserId(userId);
      if (!tokens || tokens.length === 0) return;

      const onesignalIds = tokens.map((t: any) => t.onesignal_id);
      
      const payload: any = {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: onesignalIds,
        headings: { en: title, tr: title },
        contents: { en: message, tr: message }
      };
      
      if (data) {
        payload.data = data;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error(`Failed to send OneSignal notification to user ${userId}:`, responseData);
      } else {
        logger.info(`Notification sent successfully to user ${userId}. Response:`, responseData);
      }
    } catch (error: any) {
      logger.error(`Error sending OneSignal notification to user ${userId}:`, error.message || error);
    }
  }

  /**
   * Broadcast a message to all users.
   */
  async broadcast(title: string, message: string, data?: any): Promise<void> {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      logger.warn(`Broadcast skipped (OneSignal unconfigured): [${title}] ${message}`);
      return;
    }

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { en: title, tr: title },
      contents: { en: message, tr: message }
    };
    
    if (data) {
      payload.data = data;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        logger.error(`Failed to broadcast OneSignal notification:`, responseData);
      } else {
        logger.info(`Broadcast notification sent successfully. Response:`, responseData);
      }
    } catch (error: any) {
      logger.error('Error broadcasting OneSignal notification:', error.message || error);
    }
  }
}
