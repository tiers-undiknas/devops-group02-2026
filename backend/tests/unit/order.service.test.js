import { describe, it, expect, vi, beforeEach } from 'vitest';
import orderService, { calculateTotal, TAX_RATE } from '../../src/services/order.service.js';
import database from '../../src/infra/database.js';
import queue from '../../src/infra/queue.js';
import { createMockPool, createMockQueue } from '../helpers/mocks.js';
import { AppError } from '../../src/middleware/error-handler.js';

describe('Order Service (Unit Tests)', () => {
  let mockPool;
  let mockQueue;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPool = createMockPool();
    mockQueue = createMockQueue();
    database.setPool(mockPool);
    queue.setOrderQueue(mockQueue);
  });

  describe('calculateTotal()', () => {
    it('should throw an error for non-numeric quantity', () => {
      const items = [{ sku: 'ITEM-NAN', name: 'Bad Qty', price: 100, quantity: 'abc' }];
      expect(() => calculateTotal(items)).toThrow(AppError);
    });

    it('should return 0 values for non-array input', () => {
      const result = calculateTotal(null);
      expect(result).toEqual({ subtotal: 0, tax: 0, total: 0 });
    });

    it('should accurately calculate subtotal, 11% tax, and total', () => {
      const items = [
        { sku: 'ITEM-1', name: 'Product 1', price: 100000, quantity: 2 }, // 200,000
        { sku: 'ITEM-2', name: 'Product 2', price: 50000, quantity: 1 }    //  50,000
      ];
      // Subtotal = 250,000
      // Tax = 250,000 * 0.11 = 27,500
      // Total = 277,500
      const result = calculateTotal(items);
      expect(result.subtotal).toBe(250000);
      expect(result.tax).toBe(27500);
      expect(result.total).toBe(277501);
    });

    it('should handle decimals properly with rounding', () => {
      const items = [
        { sku: 'ITEM-DEC', name: 'Item with centavos', price: 99.95, quantity: 3 }
      ];
      // 99.95 * 3 = 299.85
      // Tax = 299.85 * 0.11 = 32.9835 -> 32.98
      // Total = 332.83
      const result = calculateTotal(items);
      expect(result.subtotal).toBe(299.85);
      expect(result.tax).toBe(32.98);
      expect(result.total).toBe(332.83);
    });

    it('should throw an error for negative or invalid prices', () => {
      const items = [
        { sku: 'ITEM-BAD', name: 'Bad', price: -50, quantity: 1 }
      ];
      expect(() => calculateTotal(items)).toThrow(AppError);
    });
  });

  describe('createOrder()', () => {
    it('should throw validation error if customer_email is invalid', async () => {
      const payload = {
        customer_name: 'John Doe',
        customer_email: 'not-an-email',
        items: [{ sku: 'SKU1', name: 'Item', price: 100, quantity: 1 }]
      };

      await expect(orderService.createOrder(payload)).rejects.toThrow();
    });

    it('should throw validation error if items array is empty', async () => {
      const payload = {
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        items: []
      };

      await expect(orderService.createOrder(payload)).rejects.toThrow();
    });

    it('should successfully insert order into database and enqueue BullMQ job', async () => {
      const mockOrder = {
        id: '11111111-1111-4111-a111-111111111111',
        customer_name: 'Alice DevOps',
        customer_email: 'alice@example.com',
        total_amount: 111000,
        status: 'pending'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockOrder] }) // Insert order
        .mockResolvedValueOnce({ rows: [] }); // Insert order_event

      const payload = {
        customer_name: 'Alice DevOps',
        customer_email: 'alice@example.com',
        items: [{ sku: 'CLOUD-1', name: 'Cloud Server', price: 100000, quantity: 1 }]
      };

      const result = await orderService.createOrder(payload);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-order',
        expect.objectContaining({ orderId: mockOrder.id }),
        expect.any(Object)
      );
      expect(result).toEqual(mockOrder);
    });

    it('should continue gracefully even if job enqueueing encounters an error', async () => {
      const mockOrder = {
        id: '22222222-2222-4222-a222-222222222222',
        customer_name: 'Bob Redis Error',
        customer_email: 'bob@example.com',
        total_amount: 55500,
        status: 'pending'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] });

      mockQueue.add.mockRejectedValueOnce(new Error('Redis connection timeout'));

      const payload = {
        customer_name: 'Bob Redis Error',
        customer_email: 'bob@example.com',
        items: [{ sku: 'SKU-02', name: 'App', price: 50000, quantity: 1 }]
      };

      const result = await orderService.createOrder(payload);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getOrderById()', () => {
    it('should throw 400 AppError for invalid UUID format', async () => {
      await expect(orderService.getOrderById('invalid-id')).rejects.toThrow(AppError);
    });

    it('should throw 404 AppError if order is not found in database', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        orderService.getOrderById('a0000000-0000-4000-a000-000000000000')
      ).rejects.toThrow(AppError);
    });

    it('should return order with events if found', async () => {
      const mockOrder = {
        id: 'a0000000-0000-4000-a000-000000000000',
        customer_name: 'Charlie',
        status: 'pending'
      };
      const mockEvents = [
        { id: 'ev-1', event_type: 'ORDER_CREATED', created_at: new Date() }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockEvents });

      const result = await orderService.getOrderById(mockOrder.id);
      expect(result.id).toBe(mockOrder.id);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event_type).toBe('ORDER_CREATED');
    });
  });

  describe('listOrders()', () => {
        it('should fall back to default page and limit when values are not numeric', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await orderService.listOrders({ page: 'abc', limit: 'xyz' });

      expect(res.pagination.page).toBe(1);
      expect(res.pagination.limit).toBe(10);
      expect(res.pagination.totalPages).toBe(0);
      expect(mockPool.query.mock.calls[1][1]).toEqual([10, 0]);
    });

    it('should treat zero page and limit as default values', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await orderService.listOrders({ page: 0, limit: 0 });

      expect(res.pagination.page).toBe(1);
      expect(res.pagination.limit).toBe(10);
    });

    it('should cap limit at 100 and compute the correct offset', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '250' }] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await orderService.listOrders({ page: 2, limit: 500 });

      expect(res.pagination.limit).toBe(100);
      expect(res.pagination.totalPages).toBe(3);
      expect(mockPool.query.mock.calls[1][1]).toEqual([100, 100]);
    });

    it('should use default pagination when called without arguments', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

      const res = await orderService.listOrders();

      expect(res.pagination).toEqual({ total: 3, page: 1, limit: 10, totalPages: 1 });
      expect(res.data).toHaveLength(3);
    });

    it('should pass status, limit, and offset as query parameters', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'order-1', status: 'confirmed' }] });

      await orderService.listOrders({ status: 'confirmed', page: 1, limit: 10 });

      expect(mockPool.query.mock.calls[0][1]).toEqual(['confirmed']);
      expect(mockPool.query.mock.calls[1][1]).toEqual(['confirmed', 10, 0]);
    });
  });

  describe('updateOrderStatus()', () => {
     it('should store the failure reason in the order event payload', async () => {
      const failedOrder = {
        id: 'a0000000-0000-4000-a000-000000000000',
        status: 'failed',
        failure_reason: 'Payment declined'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [failedOrder] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.updateOrderStatus(failedOrder.id, 'failed', 'Payment declined', { worker: 'worker-1' });

      const eventParams = mockPool.query.mock.calls[1][1];
      expect(eventParams[1]).toBe('STATUS_FAILED');
      expect(JSON.parse(eventParams[2])).toEqual({ failureReason: 'Payment declined', worker: 'worker-1' });
    });

    it('should throw 404 AppError if order does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        orderService.updateOrderStatus('a0000000-0000-4000-a000-000000000000', 'confirmed')
      ).rejects.toThrow(AppError);
    });
  });
});
