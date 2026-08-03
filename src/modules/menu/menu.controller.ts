import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { sendSuccess } from '../../utils/response';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  getAllItems = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.menuService.getAllItems();
      sendSuccess(res, items, 'Menu items retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const item = await this.menuService.getItemById(id);
      sendSuccess(res, item, 'Menu item retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, price, category, image_url, is_available } = req.body;
      const newItem = await this.menuService.createItem({
        name,
        description,
        price,
        category,
        image_url,
        is_available,
      });
      sendSuccess(res, newItem, 'Menu item created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedItem = await this.menuService.updateItem(id, updatedFields);
      sendSuccess(res, updatedItem, 'Menu item updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.menuService.deleteItem(id);
      sendSuccess(res, null, 'Menu item deleted successfully.');
    } catch (error) {
      next(error);
    }
  };
}
