import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { ChatService } from './chat.service';

@injectable()
export class ChatController {
  constructor(@inject(ChatService) private chatService: ChatService) {}

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, history, branchId } = req.body;
      const userId = (req as any).user?.id;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Mesaj boş olamaz.'
        });
        return;
      }

      const result = await this.chatService.processMessage(
        message.trim(),
        Array.isArray(history) ? history : [],
        userId,
        branchId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}
