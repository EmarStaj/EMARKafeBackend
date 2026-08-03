import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { sendSuccess } from '../../utils/response';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  getAllItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Admins can see inactive items if they pass query onlyActive=false
      const onlyActive = req.query.onlyActive !== 'false';
      const items = await this.menuService.getAllItems(onlyActive);
      sendSuccess(res, items, 'Products retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const item = await this.menuService.getItemById(id);
      sendSuccess(res, item, 'Product retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category_id, name, description, base_price, image_url, is_active, is_loyalty_eligible } = req.body;
      const newItem = await this.menuService.createItem({
        category_id,
        name,
        description,
        base_price,
        image_url,
        is_active,
        is_loyalty_eligible,
      });
      sendSuccess(res, newItem, 'Product created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedItem = await this.menuService.updateItem(id, updatedFields);
      sendSuccess(res, updatedItem, 'Product updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.menuService.deleteItem(id);
      sendSuccess(res, null, 'Product deleted successfully.');
    } catch (error) {
      next(error);
    }
  };
}
