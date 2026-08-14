import { injectable } from 'tsyringe';
import { BranchRepository, Branch } from './branch.repository';
import { MenuRepository } from '../menu/menu.repository';
import { AppError } from '../../utils/app-error';

@injectable()
export class BranchService {
  constructor(
    private branchRepository: BranchRepository,
    private menuRepository: MenuRepository
  ) {}

  async getAllBranches(onlyActive = true) {
    try {
      return await this.branchRepository.getAllBranches(onlyActive);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve branches.', 400);
    }
  }

  async getBranchById(id: string) {
    try {
      return await this.branchRepository.getBranchById(id);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Branch not found.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createBranch(branch: Branch) {
    try {
      return await this.branchRepository.createBranch(branch);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create branch.', 400);
    }
  }

  async updateBranch(id: string, branch: Partial<Branch>) {
    try {
      return await this.branchRepository.updateBranch(id, branch);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update branch.', 400);
    }
  }

  async deleteBranch(id: string) {
    try {
      await this.getBranchById(id);
      await this.branchRepository.deleteBranch(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete branch.', 400);
    }
  }

  async getBranchProducts(branchId: string) {
    try {
      await this.getBranchById(branchId);
      return await this.branchRepository.getBranchProducts(branchId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve branch product stock list.', 400);
    }
  }

  async updateBranchProductAvailability(
    branchId: string,
    productId: string,
    isAvailable: boolean,
    updatedBy: string
  ) {
    try {
      // 1. Verify branch exists
      await this.getBranchById(branchId);

      // 2. Verify product exists
      const product = await this.menuRepository.getItemById(productId);
      if (!product) {
        throw new AppError('Product not found.', 404);
      }

      return await this.branchRepository.updateBranchProductAvailability(
        branchId,
        productId,
        isAvailable,
        updatedBy
      );
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update product availability.', 400);
    }
  }
}
