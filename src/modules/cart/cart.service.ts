import { injectable } from 'tsyringe';
import { CartRepository } from './cart.repository';
import { MenuRepository } from '../menu/menu.repository';
import { AppError, rethrowAsAppError } from '../../utils/app-error';
import { supabaseAdmin } from '../../config/supabase';

@injectable()
export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private menuRepository: MenuRepository
  ) {}

  /**
   * Fetch current user's active cart.
   */
  async getCart(userId: string, token: string) {
    try {
      return await this.cartRepository.getCart(userId, token);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to retrieve cart.');
    }
  }

  /**
   * Helper to compare selected options arrays in-memory.
   */
  private optionsMatch(opt1: any[] = [], opt2: any[] = []): boolean {
    if (opt1.length !== opt2.length) return false;
    
    // Sort items by a stable key (e.g. option_id or label) to verify exact match
    const sortFn = (a: any, b: any) => {
      const valA = String(a.option_id || a.name || '');
      const valB = String(b.option_id || b.name || '');
      return valA.localeCompare(valB);
    };

    const sorted1 = [...opt1].sort(sortFn);
    const sorted2 = [...opt2].sort(sortFn);

    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  }

  /**
   * Add a product with optional customization options to the cart.
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    selectedOptions: any[] = [],
    _token: string
  ) {
    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than zero.', 400);
    }

    try {
      // 1. Fetch product to ensure it exists and get its base_price
      const product = await this.menuRepository.getItemById(productId);
      if (!product || !product.is_active) {
        throw new AppError('Product is not available or inactive.', 400);
      }

      // Calculate unit price (base_price + any price_delta from selected options)
      let unitPrice = Number(product.base_price);
      if (Array.isArray(selectedOptions)) {
        selectedOptions.forEach(opt => {
          if (opt.price_delta) {
            unitPrice += Number(opt.price_delta);
          }
        });
      }

      // 2. Fetch or create active cart for the user
      const activeCart = await this.cartRepository.getOrCreateActiveCart(userId);

      // 3. Retrieve existing cart items for this product
      const existingItems = await this.cartRepository.getCartItemsByProduct(activeCart.id, productId);

      // 4. Look for an item with identical options
      const duplicateItem = existingItems.find(item =>
        this.optionsMatch(item.selected_options, selectedOptions)
      );

      // 5. Add or update cart item
      let addedItem;
      if (duplicateItem) {
        const newQuantity = duplicateItem.quantity + quantity;
        if (newQuantity > 50) {
          throw new AppError('Quantity cannot exceed 50 per item', 400);
        }
        addedItem = await this.cartRepository.updateCartItem(duplicateItem.id, newQuantity);
      } else {
        addedItem = await this.cartRepository.addToCart({
          cart_id: activeCart.id,
          product_id: productId,
          quantity,
          selected_options: selectedOptions,
          unit_price: unitPrice
        });
      }

      // 6. Soft-check inventory if user has a default branch
      const warnings: any[] = [];
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('branch_id')
        .eq('id', userId)
        .single();

      if (profile?.branch_id) {
        const { data: stockData } = await supabaseAdmin
          .from('branch_products')
          .select('is_available')
          .eq('branch_id', profile.branch_id)
          .eq('product_id', productId)
          .single();

        const productName = product.name || 'Product';
        if (!stockData) {
          warnings.push({
            reason: 'not_in_menu',
            message: `"${productName}" is not available in the menu of your default branch.`
          });
        } else if (stockData.is_available === false) {
          warnings.push({
            reason: 'out_of_stock',
            message: `"${productName}" is currently out of stock at your default branch.`
          });
        }
      }

      return { item: addedItem, warnings: warnings.length > 0 ? warnings : undefined };

    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to add item to cart.');
    }
  }

  async updateCartItem(cartItemId: string, quantity: number, _token?: string, userId?: string) {
    if (quantity <= 0) {
      return await this.removeFromCart(cartItemId, _token, userId);
    }
    if (quantity > 50) {
      throw new AppError('Quantity cannot exceed 50 per item', 400);
    }

    try {
      if (userId) {
        const item = await this.cartRepository.getCartItemById(cartItemId);
        if (!item) {
          throw new AppError('Cart item not found.', 404);
        }
        const cartUserId = (item as any).carts?.user_id;
        if (cartUserId && cartUserId !== userId) {
          throw new AppError('Forbidden: You are not authorized to modify this cart item.', 403);
        }
      }

      return await this.cartRepository.updateCartItem(cartItemId, quantity);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to update cart item.');
    }
  }

  async removeFromCart(cartItemId: string, _token?: string, userId?: string) {
    try {
      if (userId) {
        const item = await this.cartRepository.getCartItemById(cartItemId);
        if (!item) {
          throw new AppError('Cart item not found.', 404);
        }
        const cartUserId = (item as any).carts?.user_id;
        if (cartUserId && cartUserId !== userId) {
          throw new AppError('Forbidden: You are not authorized to modify this cart item.', 403);
        }
      }

      await this.cartRepository.removeFromCart(cartItemId);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to remove item from cart.');
    }
  }

  async clearCart(userId: string, _token: string) {
    try {
      const activeCart = await this.cartRepository.getOrCreateActiveCart(userId);
      await this.cartRepository.clearCart(activeCart.id);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to clear cart.');
    }
  }
}
