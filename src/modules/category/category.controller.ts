import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendSuccess } from '../../utils/response';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  getAllCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getAllCategories();
      sendSuccess(res, categories, 'Categories retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      sendSuccess(res, category, 'Category retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, sort_order } = req.body;
      const newCategory = await this.categoryService.createCategory({ name, sort_order });
      sendSuccess(res, newCategory, 'Category created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedCategory = await this.categoryService.updateCategory(id, updatedFields);
      sendSuccess(res, updatedCategory, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.categoryService.deleteCategory(id);
      sendSuccess(res, null, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  };
}
