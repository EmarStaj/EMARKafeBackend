import { CartRepository } from './cart.repository';
import { MenuRepository } from '../menu/menu.repository';
import { AppError } from '../../utils/app-error';

export class CartService {
  private cartRepository: CartRepository;
  private menuRepository: MenuRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.menuRepository = new MenuRepository();
  }

  /**
   * Fetch current user's active cart.
   */
  async getCart(userId: string, token: string) {
    try {
      return await this.cartRepository.getCart(userId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve cart.', 400);
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
    token: string
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

      // Calculate unit price (in a production app, we would sum up product.base_price + option prices)
      // Here we will base it on product.base_price, and add any price_delta from options if present
      let unitPrice = Number(product.base_price);
      if (Array.isArray(selectedOptions)) {
        selectedOptions.forEach(opt => {
          if (opt.price_delta) {
            unitPrice += Number(opt.price_delta);
          }
        });
      }

      // 2. Fetch or create active cart for the user
      const activeCart = await this.cartRepository.getOrCreateActiveCart(userId, token);

      // 3. Retrieve existing cart items for this product
      const existingItems = await this.cartRepository.getCartItemsByProduct(activeCart.id, productId, token);

      // 4. Look for an item with identical options
      const duplicateItem = existingItems.find(item => 
        this.optionsMatch(item.selected_options, selectedOptions)
      );

      if (duplicateItem) {
        // Update quantity
        const newQuantity = duplicateItem.quantity + quantity;
        return await this.cartRepository.updateCartItem(duplicateItem.id, newQuantity, token);
      }

      // 5. Add new cart item
      return await this.cartRepository.addToCart({
        cart_id: activeCart.id,
        product_id: productId,
        quantity,
        selected_options: selectedOptions,
        unit_price: unitPrice
      }, token);

    } catch (error: any) {
      throw new AppError(error.message || 'Failed to add item to cart.', 400);
    }
  }

  async updateCartItem(cartItemId: string, quantity: number, token: string) {
    if (quantity <= 0) {
      return await this.removeFromCart(cartItemId, token);
    }

    try {
      return await this.cartRepository.updateCartItem(cartItemId, quantity, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update cart item.', 400);
    }
  }

  async removeFromCart(cartItemId: string, token: string) {
    try {
      await this.cartRepository.removeFromCart(cartItemId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to remove item from cart.', 400);
    }
  }

  async clearCart(userId: string, token: string) {
    try {
      const activeCart = await this.cartRepository.getOrCreateActiveCart(userId, token);
      await this.cartRepository.clearCart(activeCart.id, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to clear cart.', 400);
    }
  }
}
