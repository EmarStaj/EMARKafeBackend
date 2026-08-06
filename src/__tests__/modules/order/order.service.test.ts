import { OrderService } from '../../../modules/order/order.service';
import { OrderRepository } from '../../../modules/order/order.repository';
import { CartRepository } from '../../../modules/cart/cart.repository';
import { LoyaltyService } from '../../../modules/loyalty/loyalty.service';
import { UserProfile } from '../../../types';

jest.mock('../../../modules/order/order.repository');
jest.mock('../../../modules/cart/cart.repository');
jest.mock('../../../modules/loyalty/loyalty.service');

const MockedOrderRepository = OrderRepository as jest.MockedClass<typeof OrderRepository>;
const MockedCartRepository = CartRepository as jest.MockedClass<typeof CartRepository>;
const MockedLoyaltyService = LoyaltyService as jest.MockedClass<typeof LoyaltyService>;

const MOCK_USER_ID = 'user-uuid-111';
const MOCK_ORDER_ID = 'order-uuid-222';
const MOCK_BRANCH_ID = 'branch-uuid-333';
const MOCK_TOKEN = 'mock-token';

const makeOrder = (overrides = {}) => ({
  id: MOCK_ORDER_ID,
  user_id: MOCK_USER_ID,
  branch_id: MOCK_BRANCH_ID,
  status: 'created' as const,
  total_price: 100,
  created_at: new Date().toISOString(),
  completed_at: null,
  order_items: [],
  ...overrides,
});

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'admin-user',
  role: 'admin',
  balance: 0,
  created_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

describe('OrderService.cancelOrder', () => {
  let service: OrderService;
  let mockOrderRepo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    MockedOrderRepository.mockClear();
    MockedCartRepository.mockClear();
    MockedLoyaltyService.mockClear();
    service = new OrderService();
    mockOrderRepo = MockedOrderRepository.mock.instances[0] as jest.Mocked<OrderRepository>;
  });

  it('should successfully cancel an order in "created" status', async () => {
    const order = makeOrder({ status: 'created' });
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(order);
    mockOrderRepo.updateOrderStatus = jest.fn().mockResolvedValue({ ...order, status: 'cancelled' });

    const result = await service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN);

    expect(result).toMatchObject({ status: 'cancelled' });
    expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith(MOCK_ORDER_ID, 'cancelled');
  });

  it('should throw 400 when order is already in "preparing" status', async () => {
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(makeOrder({ status: 'preparing' }));

    await expect(
      service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Cannot cancel order'),
    });
  });

  it('should throw 400 when order is already "completed"', async () => {
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(makeOrder({ status: 'completed' }));

    await expect(
      service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('should throw 400 when order is already "cancelled"', async () => {
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(makeOrder({ status: 'cancelled' }));

    await expect(
      service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('should throw 404 when order does not belong to the user', async () => {
    // Order exists but belongs to a different user
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(
      makeOrder({ user_id: 'another-user-id' })
    );

    await expect(
      service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 404 when order is not found', async () => {
    mockOrderRepo.getOrderById = jest.fn().mockResolvedValue(null);

    await expect(
      service.cancelOrder(MOCK_ORDER_ID, MOCK_USER_ID, MOCK_TOKEN)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('OrderService.updateOrderStatus — Barista branch check', () => {
  let service: OrderService;
  let mockOrderRepo: jest.Mocked<OrderRepository>;

  beforeEach(() => {
    MockedOrderRepository.mockClear();
    MockedCartRepository.mockClear();
    MockedLoyaltyService.mockClear();
    service = new OrderService();
    mockOrderRepo = MockedOrderRepository.mock.instances[0] as jest.Mocked<OrderRepository>;
  });

  it('should throw 403 when a barista tries to update an order from a different branch', async () => {
    const order = makeOrder({ branch_id: 'branch-A' });
    mockOrderRepo.getOrderByIdAdmin = jest.fn().mockResolvedValue(order);

    const baristaProfile = makeProfile({
      role: 'barista',
      branch_id: 'branch-B', // Different branch!
    });

    await expect(
      service.updateOrderStatus(MOCK_ORDER_ID, 'preparing', baristaProfile)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('own branch'),
    });
  });

  it('should allow a barista to update an order from their own branch', async () => {
    const order = makeOrder({ branch_id: MOCK_BRANCH_ID, order_items: [] });
    mockOrderRepo.getOrderByIdAdmin = jest.fn().mockResolvedValue(order);
    mockOrderRepo.updateOrderStatus = jest.fn().mockResolvedValue({ ...order, status: 'preparing' });

    const baristaProfile = makeProfile({
      role: 'barista',
      branch_id: MOCK_BRANCH_ID, // Same branch ✓
    });

    const result = await service.updateOrderStatus(MOCK_ORDER_ID, 'preparing', baristaProfile);

    expect(result).toMatchObject({ status: 'preparing' });
  });

  it('should allow admin to update any order regardless of branch', async () => {
    const order = makeOrder({ branch_id: 'branch-X', order_items: [] });
    mockOrderRepo.getOrderByIdAdmin = jest.fn().mockResolvedValue(order);
    mockOrderRepo.updateOrderStatus = jest.fn().mockResolvedValue({ ...order, status: 'ready' });

    const adminProfile = makeProfile({ role: 'admin', branch_id: 'branch-Y' });

    const result = await service.updateOrderStatus(MOCK_ORDER_ID, 'ready', adminProfile);

    expect(result).toMatchObject({ status: 'ready' });
  });

  it('should throw 404 when order is not found', async () => {
    mockOrderRepo.getOrderByIdAdmin = jest.fn().mockResolvedValue(null);

    await expect(
      service.updateOrderStatus(MOCK_ORDER_ID, 'preparing', makeProfile())
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
