import { CartService } from '../../../modules/cart/cart.service';
import { CartRepository } from '../../../modules/cart/cart.repository';
import { MenuRepository } from '../../../modules/menu/menu.repository';

jest.mock('../../../modules/cart/cart.repository');
jest.mock('../../../modules/menu/menu.repository');

const MockedCartRepository = CartRepository as jest.MockedClass<typeof CartRepository>;
const MockedMenuRepository = MenuRepository as jest.MockedClass<typeof MenuRepository>;

const MOCK_USER_ID = 'user-uuid-abc';
const MOCK_PRODUCT_ID = 'product-uuid-xyz';
const MOCK_TOKEN = 'mock-token';

const mockProduct = {
  id: MOCK_PRODUCT_ID,
  name: 'Latte',
  base_price: 45,
  is_active: true,
  is_loyalty_eligible: true,
  category_id: 'cat-1',
};

const mockActiveCart = { id: 'cart-uuid-1', user_id: MOCK_USER_ID, status: 'active' as const };

describe('CartService.addToCart', () => {
  let service: CartService;
  let mockCartRepo: jest.Mocked<CartRepository>;
  let mockMenuRepo: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    MockedCartRepository.mockClear();
    MockedMenuRepository.mockClear();
    service = new CartService();
    mockCartRepo = MockedCartRepository.mock.instances[0] as jest.Mocked<CartRepository>;
    mockMenuRepo = MockedMenuRepository.mock.instances[0] as jest.Mocked<MenuRepository>;
  });

  it('should throw 400 when quantity is 0 or negative', async () => {
    await expect(
      service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 0, [], MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });

    await expect(
      service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, -5, [], MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('should throw 400 when product is inactive', async () => {
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue({ ...mockProduct, is_active: false });

    await expect(
      service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 1, [], MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('should throw 400 when product does not exist', async () => {
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue(null);

    await expect(
      service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 1, [], MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('should create a new cart item when none exists for this product', async () => {
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue(mockProduct);
    mockCartRepo.getOrCreateActiveCart = jest.fn().mockResolvedValue(mockActiveCart);
    mockCartRepo.getCartItemsByProduct = jest.fn().mockResolvedValue([]); // No existing items
    const newCartItem = { id: 'ci-1', product_id: MOCK_PRODUCT_ID, quantity: 2, unit_price: 45 };
    mockCartRepo.addToCart = jest.fn().mockResolvedValue(newCartItem);

    const result = await service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 2, [], MOCK_TOKEN);

    expect(mockCartRepo.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: MOCK_PRODUCT_ID, quantity: 2, unit_price: 45 })
    );
    expect(result.item).toEqual(newCartItem);
  });

  it('should update quantity when same product+options already in cart', async () => {
    const existingItem = { id: 'ci-existing', product_id: MOCK_PRODUCT_ID, quantity: 1, selected_options: [], unit_price: 45 };
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue(mockProduct);
    mockCartRepo.getOrCreateActiveCart = jest.fn().mockResolvedValue(mockActiveCart);
    mockCartRepo.getCartItemsByProduct = jest.fn().mockResolvedValue([existingItem]);
    mockCartRepo.updateCartItem = jest.fn().mockResolvedValue({ ...existingItem, quantity: 3 });

    await service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 2, [], MOCK_TOKEN);

    // Should update (1 existing + 2 new = 3), not insert
    expect(mockCartRepo.updateCartItem).toHaveBeenCalledWith('ci-existing', 3);
    expect(mockCartRepo.addToCart).not.toHaveBeenCalled();
  });

  it('should add option price_delta to unit_price', async () => {
    const productWith45Base = { ...mockProduct, base_price: 45 };
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue(productWith45Base);
    mockCartRepo.getOrCreateActiveCart = jest.fn().mockResolvedValue(mockActiveCart);
    mockCartRepo.getCartItemsByProduct = jest.fn().mockResolvedValue([]);
    mockCartRepo.addToCart = jest.fn().mockResolvedValue({});

    const options = [{ option_id: 'opt-1', name: 'Extra Shot', price_delta: 10 }];
    await service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 1, options, MOCK_TOKEN);

    // 45 base + 10 delta = 55
    expect(mockCartRepo.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ unit_price: 55 })
    );
  });

  it('should treat same product with different options as separate cart items', async () => {
    const existingItem = {
      id: 'ci-1',
      product_id: MOCK_PRODUCT_ID,
      quantity: 1,
      selected_options: [{ option_id: 'opt-almond', name: 'Almond Milk' }],
      unit_price: 45,
    };
    mockMenuRepo.getItemById = jest.fn().mockResolvedValue(mockProduct);
    mockCartRepo.getOrCreateActiveCart = jest.fn().mockResolvedValue(mockActiveCart);
    mockCartRepo.getCartItemsByProduct = jest.fn().mockResolvedValue([existingItem]);
    mockCartRepo.addToCart = jest.fn().mockResolvedValue({});

    // Add same product but with OAT milk (different option)
    const differentOptions = [{ option_id: 'opt-oat', name: 'Oat Milk' }];
    await service.addToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 1, differentOptions, MOCK_TOKEN);

    // Should insert new item, not update existing
    expect(mockCartRepo.addToCart).toHaveBeenCalled();
    expect(mockCartRepo.updateCartItem).not.toHaveBeenCalled();
  });
});

describe('CartService.updateCartItem', () => {
  let service: CartService;
  let mockCartRepo: jest.Mocked<CartRepository>;

  beforeEach(() => {
    MockedCartRepository.mockClear();
    MockedMenuRepository.mockClear();
    service = new CartService();
    mockCartRepo = MockedCartRepository.mock.instances[0] as jest.Mocked<CartRepository>;
  });

  it('should delete item when quantity is set to 0', async () => {
    mockCartRepo.removeFromCart = jest.fn().mockResolvedValue(undefined);

    await service.updateCartItem('ci-1', 0, MOCK_TOKEN);

    expect(mockCartRepo.removeFromCart).toHaveBeenCalledWith('ci-1');
    expect(mockCartRepo.updateCartItem).not.toHaveBeenCalled();
  });

  it('should delete item when quantity is negative', async () => {
    mockCartRepo.removeFromCart = jest.fn().mockResolvedValue(undefined);

    await service.updateCartItem('ci-1', -3, MOCK_TOKEN);

    expect(mockCartRepo.removeFromCart).toHaveBeenCalledWith('ci-1');
  });

  it('should update quantity for positive values', async () => {
    mockCartRepo.updateCartItem = jest.fn().mockResolvedValue({ id: 'ci-1', quantity: 5 });

    await service.updateCartItem('ci-1', 5, MOCK_TOKEN);

    expect(mockCartRepo.updateCartItem).toHaveBeenCalledWith('ci-1', 5);
  });
});
