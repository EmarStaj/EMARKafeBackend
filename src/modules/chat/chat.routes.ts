import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from './chat.controller';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();
const controller = container.resolve(ChatController);

router.post('/message', optionalAuth, controller.sendMessage);

export default router;
