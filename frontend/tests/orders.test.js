import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/api.js', () => ({
  default: {
    listOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn()
  }
}));
vi.mock('../src/components/toast.js', () => ({ default: vi.fn() }));

import api from '../src/api.js';
import showToast from '../src/components/toast.js';
import renderOrders from '../src/pages/orders.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

const sample = {
  id: 'order-1',
  customer_name: 'Alice',
  customer_email: 'alice@x.com',
  total_amount: 111000,
  status: 'confirmed',
  created_at: '2026-01-01T00:00:00Z'
};

describe('Orders page', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<main id="main-content"></main>';
    container = document.getElementById('main-content');
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    api.listOrders.mockResolvedValue({ data: [sample] });
  });

  it('memuat dan menampilkan daftar order', async () => {
    await renderOrders(container);
    await flush();
    expect(document.querySelectorAll('#orders-table-body tr')).toHaveLength(1);
    expect(document.getElementById('orders-table-body').textContent).toContain('Alice');
  });

  it('menampilkan pesan bila tidak ada order', async () => {
    api.listOrders.mockResolvedValue({ data: [] });
    await renderOrders(container);
    await flush();
    expect(document.getElementById('orders-table-body').textContent).toContain('No orders found');
  });

  it('menampilkan error bila gagal memuat order', async () => {
    api.listOrders.mockRejectedValue(new Error('down'));
    await renderOrders(container);
    await flush();
    expect(document.getElementById('orders-table-body').textContent).toContain('Failed to load orders: down');
  });

  it('filter status mengirim parameter status ke API', async () => {
    await renderOrders(container);
    await flush();
    document.querySelector('[data-filter="failed"]').click();
    await flush();
    expect(api.listOrders).toHaveBeenLastCalledWith({ page: 1, limit: 20, status: 'failed' });
    document.querySelector('[data-filter=""]').click();
    await flush();
    expect(api.listOrders).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
  });

  it('tombol refresh memuat ulang order', async () => {
    await renderOrders(container);
    await flush();
    document.getElementById('btn-refresh-orders').click();
    await flush();
    expect(api.listOrders).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith('Orders refreshed', 'info', 1500);
  });

  it('form order bisa dibuka, ditutup, dan baris item bisa ditambah/dihapus', async () => {
    await renderOrders(container);
    await flush();
    const section = document.getElementById('create-order-section');
    document.getElementById('btn-toggle-form').click();
    expect(section.style.display).toBe('block');
    document.getElementById('btn-cancel-order').click();
    expect(section.style.display).toBe('none');

    document.getElementById('btn-add-item').click();
    expect(document.querySelectorAll('.item-row')).toHaveLength(2);
    document.querySelector('.btn-del-item').click();
    expect(document.querySelectorAll('.item-row')).toHaveLength(1);
    document.querySelector('.btn-del-item').click();
    expect(showToast).toHaveBeenCalledWith('Order must contain at least 1 item', 'info');
  });

  it('submit order valid memanggil API dan menampilkan toast sukses', async () => {
    api.createOrder.mockResolvedValue({});
    await renderOrders(container);
    await flush();
    document.getElementById('input-customer-name').value = 'Budi';
    document.getElementById('input-customer-email').value = 'budi@x.com';
    document.getElementById('order-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(api.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ customer_name: 'Budi', customer_email: 'budi@x.com' })
    );
    expect(showToast).toHaveBeenCalledWith('Order successfully created!', 'success');
  });

  it('submit tanpa item valid ditolak', async () => {
    await renderOrders(container);
    await flush();
    document.querySelector('.item-sku').value = '';
    document.getElementById('order-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(api.createOrder).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Please specify at least one valid item', 'error');
  });

  it('submit yang gagal menampilkan toast error', async () => {
    api.createOrder.mockRejectedValue(new Error('invalid'));
    await renderOrders(container);
    await flush();
    document.getElementById('order-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(showToast).toHaveBeenCalledWith('Failed to create order: invalid', 'error');
  });

  it('inspect order menampilkan detail item dan event', async () => {
    api.getOrderById.mockResolvedValue({
      data: {
        ...sample,
        failure_reason: 'stok habis',
        items: JSON.stringify({
          line_items: [{ sku: 'S1', name: 'Item', price: 1000, quantity: 2 }],
          breakdown: { subtotal: 2000, tax: 220 }
        }),
        events: [{ event_type: 'ORDER_CREATED', created_at: '2026-01-01T00:00:00Z', payload: { a: 1 } }]
      }
    });
    await renderOrders(container);
    await flush();
    document.querySelector('.btn-inspect').click();
    await flush();
    const content = document.getElementById('modal-order-content').textContent;
    expect(content).toContain('stok habis');
    expect(content).toContain('ORDER_CREATED');
    expect(document.getElementById('order-detail-modal').style.display).toBe('block');
    document.getElementById('btn-close-modal').click();
    expect(document.getElementById('order-detail-modal').style.display).toBe('none');
  });

  it('inspect order tanpa event menampilkan pesan kosong dan error ditangani', async () => {
    api.getOrderById.mockResolvedValueOnce({ data: { ...sample, items: { line_items: [] }, events: [] } });
    await renderOrders(container);
    await flush();
    document.querySelector('.btn-inspect').click();
    await flush();
    expect(document.getElementById('modal-order-content').textContent).toContain('No events recorded');

    api.getOrderById.mockRejectedValueOnce(new Error('404'));
    document.querySelector('.btn-inspect').click();
    await flush();
    expect(document.getElementById('modal-order-content').textContent).toContain('Failed to inspect order: 404');
  });
});
