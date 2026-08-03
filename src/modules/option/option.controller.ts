import { Request, Response, NextFunction } from 'express';
import { OptionService } from './option.service';
import { sendSuccess } from '../../utils/response';

export class OptionController {
  private optionService: OptionService;

  constructor() {
    this.optionService = new OptionService();
  }

  getProductOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const options = await this.optionService.getProductOptions(productId);
      sendSuccess(res, options, 'Product options retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const { name, is_required, is_multi_select } = req.body;
      const newOption = await this.optionService.createOption({
        product_id: productId,
        name,
        is_required,
        is_multi_select
      });
      sendSuccess(res, newOption, 'Product option group created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  createOptionValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { optionId } = req.params;
      const { label, price_delta } = req.body;
      const newValue = await this.optionService.createOptionValue({
        option_id: optionId,
        label,
        price_delta
      });
      sendSuccess(res, newValue, 'Option value added successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  deleteOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.optionService.deleteOption(id);
      sendSuccess(res, null, 'Product option group deleted successfully.');
    } catch (error) {
      next(error);
    }
  };

  deleteOptionValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.optionService.deleteOptionValue(id);
      sendSuccess(res, null, 'Option value deleted successfully.');
    } catch (error) {
      next(error);
    }
  };
}
