import { CartRepository } from './cart.repository';
import { AppError } from '../../utils/app-error';

export class CartService {
  private cartRepository: CartRepository;

  constructor() {
    this.cartRepository = new CartRepository();
  }

  async getCart(token: string) {
    try {
      return await this.cartRepository.getCart(token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve cart', 400);
    }
  }

  async addToCart(userId: string, menuItemId: string, quantity: number, token: string) {
    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than zero', 400);
    }

    try {
      // Check if item is already in the cart
      const existingItem = await this.cartRepository.findCartItem(userId, menuItemId, token);

      if (existingItem) {
        // Update existing item's quantity
        const newQuantity = existingItem.quantity + quantity;
        return await this.cartRepository.updateCartItem(existingItem.id, newQuantity, token);
      }

      // Add new item to the cart
      return await this.cartRepository.addToCart(userId, menuItemId, quantity, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to add item to cart', 400);
    }
  }

  async updateCartItem(cartItemId: string, quantity: number, token: string) {
    if (quantity <= 0) {
      // If quantity is set to 0 or less, remove item from cart
      return await this.removeFromCart(cartItemId, token);
    }

    try {
      return await this.cartRepository.updateCartItem(cartItemId, quantity, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update cart item', 400);
    }
  }

  async removeFromCart(cartItemId: string, token: string) {
    try {
      await this.cartRepository.removeFromCart(cartItemId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to remove item from cart', 400);
    }
  }

  async clearCart(userId: string, token: string) {
    try {
      await this.cartRepository.clearCart(userId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to clear cart', 400);
    }
  }
}
